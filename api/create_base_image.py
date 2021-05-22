import imghdr
import math
from io import BytesIO
import logging
import os

import asyncclick as click
import boto3
from core.exceptions import KibaException
from core.requester import Requester
from core.s3_manager import S3Manager
from core.store.retriever import StringFieldFilter
from core.util import file_util
from databases.core import Database
from PIL import Image as PILImage
from mdtp.image_manager import ImageManager

from mdtp.model import ImageData, ImageFormat, ImageSize
from mdtp.store.retriever import MdtpRetriever
from mdtp.store.saver import MdtpSaver
from mdtp.store.schema import GridItemsTable

requester = Requester()

def _get_image_type(content: str) -> str:
    imageType = imghdr.what(content)
    if not imageType:
        raise KibaException()
    return f'image/{imageType}'

def _get_image_size(content: str, imageFormat: str):
    if imageFormat in {ImageFormat.JPG, ImageFormat.PNG, ImageFormat.WEBP}:
        contentBuffer = BytesIO(content)
        with PILImage.open(fp=contentBuffer) as pilImage:
            size = ImageSize(width=pilImage.size[0], height=pilImage.size[1])
        return size
    raise KibaException(message=f'Cannot determine image size from image format: {imageFormat}')

async def _load_image(imageUrl: str) -> ImageData:
    response = await requester.get(url=imageUrl)
    return _load_image_from_content(content=response.content)

def _load_image_from_content(content: str) -> ImageData:
    imageFormat = _get_image_type(content=BytesIO(content))
    size = _get_image_size(content=content, imageFormat=imageFormat)
    image = ImageData(content=content, size=size, imageFormat=imageFormat)
    return image

@click.command()
async def run():
    database = Database(f'postgresql://{os.environ["DB_USERNAME"]}:{os.environ["DB_PASSWORD"]}@{os.environ["DB_HOST"]}:{os.environ["DB_PORT"]}/{os.environ["DB_NAME"]}')
    saver = MdtpSaver(database=database)
    retriever = MdtpRetriever(database=database)

    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)
    imageManager = ImageManager(requester=requester, s3Manager=s3Manager)

    await database.connect()

    # NOTE(krishan711): everything is double so that it works well in retina
    width = 2000
    height = 2000
    tokenHeight = 20
    tokenWidth = 20
    outputImage = PILImage.new('RGB', (width, height))

    network = 'rinkeby'
    gridItems = await retriever.list_grid_items(fieldFilters=[StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network)])
    for gridItem in gridItems:
        tokenId = gridItem.tokenId
        imageUrl = f'{gridItem.resizableImageUrl}?w={tokenWidth}&h={tokenHeight}' if gridItem.resizableImageUrl else gridItem.imageUrl
        print(tokenId, imageUrl)
        imageResponse = await requester.get(imageUrl)
        contentBuffer = BytesIO(imageResponse.content)
        with PILImage.open(fp=contentBuffer) as tokenImage:
            tokenIndex = tokenId - 1
            x = (tokenIndex * tokenWidth) % width
            y = tokenHeight * math.floor((tokenIndex * tokenWidth) / width)
            outputImage.paste(tokenImage, (x, y))
    outputFilePath = 'output.png'
    outputImage.save(outputFilePath)
    imageId = await imageManager.upload_image_from_file(filePath=outputFilePath)
    imageUrl = f'https://d2a7i2107hou45.cloudfront.net/v1/images/{imageId}/go'
    await saver.create_base_image(network=network, url=imageUrl)

    await file_util.remove_file(filePath=outputFilePath)
    await database.disconnect()
    await requester.close_connections()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
