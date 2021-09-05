import asyncio
import json
import logging
import math
import os

import asyncclick as click
from core.http.basic_authentication import BasicAuthentication
from core.requester import Requester
from core.util import file_util
from PIL import Image

from crop_image import crop_image
from mdtp.ipfs_manager import IpfsManager

GRID_WIDTH = 100
GRID_HEIGHT = 100
BLOCK_WIDTH = 10
BLOCK_HEIGHT = 10
MAX_ZOOM = 10

async def generate_background(baseImagePath: str, overlayImagePath: str, middleImagePath: str) -> Image:
    # NOTE(krishan711): this script assumes the overlay image is the correct sizes already
    angle = 45
    scaleX = 1.7
    scaleY = 0.9
    image = Image.open(baseImagePath)
    imageWidth, imageHeight = image.size
    if imageWidth != GRID_WIDTH * BLOCK_WIDTH * MAX_ZOOM or imageHeight != GRID_HEIGHT * BLOCK_HEIGHT * MAX_ZOOM:
        raise Exception(f'baseImage must have dimensions: width={GRID_WIDTH * BLOCK_WIDTH * MAX_ZOOM} height={GRID_HEIGHT * BLOCK_HEIGHT * MAX_ZOOM}')
    overlayImage = Image.open(overlayImagePath)
    overlayImage = overlayImage.rotate(angle, expand=True)
    overlayImageWidth, overlayImageHeight = overlayImage.size
    scaledWidth = overlayImageWidth * scaleX
    scaledHeight = overlayImageHeight * scaleY
    transformX = -scaledWidth * scaleY / scaleX
    transformY = 0 * overlayImageHeight
    for x in range(0, math.ceil(3 * imageWidth / scaledWidth)):
        for y in range(0, math.ceil(3 * imageHeight / scaledHeight)):
            position = (math.floor(-scaledWidth + (transformX * y) + (x * scaledWidth)), math.floor(-scaledHeight + (transformY * x) + (y * scaledHeight)))
            image.paste(overlayImage, position, overlayImage)
    middleImageWidth = 25
    middleImageHeight = 20
    middleImagePosition = (BLOCK_WIDTH * MAX_ZOOM * math.floor((GRID_WIDTH - middleImageWidth) / 2), BLOCK_HEIGHT * MAX_ZOOM * math.floor((GRID_HEIGHT - middleImageHeight) / 2))
    middleImage = Image.open(middleImagePath)
    middleImage = middleImage.resize(size=(middleImageWidth * BLOCK_WIDTH * MAX_ZOOM, middleImageHeight * BLOCK_HEIGHT * MAX_ZOOM))
    image.paste(middleImage, middleImagePosition, middleImage)
    return image


@click.command()
@click.option('-i', '--image-path', 'baseImagePath', required=True, type=str)
@click.option('-a', '--overlay-image-path', 'overlayImagePath', required=True, type=str)
@click.option('-m', '--middle-image-path', 'middleImagePath', required=True, type=str)
@click.option('-u', '--upload', 'shouldUpload', required=False, is_flag=True, default=False)
async def main(baseImagePath: str, overlayImagePath: str, middleImagePath: str, shouldUpload: bool):
    tokenIds = list(range(1, 10000 + 1))
    infuraIpfsAuth = BasicAuthentication(username=os.environ['INFURA_IPFS_PROJECT_ID'], password=os.environ['INFURA_IPFS_PROJECT_SECRET'])
    infuraIpfsRequester = Requester(headers={'authorization': f'Basic {infuraIpfsAuth.to_string()}'})
    ipfsManager = IpfsManager(requester=infuraIpfsRequester)

    imagesOutputDirectory = 'output/default-content-images'
    await file_util.create_directory(directory=imagesOutputDirectory)
    metadataOutputDirectory = 'output/default-content-metadatas'
    await file_util.create_directory(directory=metadataOutputDirectory)

    outputFilePath = 'output/default-content.png'
    image = await generate_background(baseImagePath=baseImagePath, overlayImagePath=overlayImagePath, middleImagePath=middleImagePath)
    image.save(outputFilePath)
    crop_image(imagePath=outputFilePath, outputDirectory=imagesOutputDirectory, height=100, width=100)

    for tokenId in tokenIds:
        imagePath = os.path.join(imagesOutputDirectory, f'{tokenId - 1}.png')
        imageUrl = imagePath
        if shouldUpload:
            print(f'Uploading image for {tokenId}')
            with open(imagePath, 'rb') as imageFile:
                cid = await ipfsManager.upload_file_to_ipfs(fileContent=imageFile)
            imageUrl = f'ipfs://{cid}'
        print(f'Generating metadata for {tokenId}')
        metadata = {
            "tokenId": tokenId,
            "tokenIndex": tokenId - 1,
            "name": f'MDTP Token {tokenId}',
            "description": f"This NFT gives you full ownership of block {tokenId} on milliondollartokenpage.com (MDTP). It hasn't been claimed yet so click mint now to buy it now!",
            "image": imageUrl,
            "url": None,
        }
        with open(os.path.join(metadataOutputDirectory, f'{tokenId}.json'), "w") as metadataFile:
            metadataFile.write(json.dumps(metadata))
    if shouldUpload:
        print(f'Uploading metadata')
        fileContentMap = {f'{tokenId}.json': open(os.path.join(metadataOutputDirectory, f'{tokenId}.json'), 'r') for tokenId in tokenIds}
        cid = await ipfsManager.upload_files_to_ipfs(fileContentMap=fileContentMap)
        for openFile in fileContentMap.values():
            openFile.close()
        print(f'Uploaded metadata to ipfs://{cid}')

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
