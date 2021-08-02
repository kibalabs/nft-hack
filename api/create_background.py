import os
import math
import logging
import asyncio
import uuid

import asyncclick as click
import boto3
from core.s3_manager import S3Manager
from core.util import file_util
from PIL import Image

from crop_image import crop_image

GRID_WIDTH = 100
GRID_HEIGHT = 100
BLOCK_WIDTH = 10
BLOCK_HEIGHT = 10
MAX_ZOOM = 10

@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-a', '--overlay-image-path', 'overlayImagePath', required=True, type=str)
@click.option('-m', '--middle-image-path', 'middleImagePath', required=True, type=str)
async def main(imagePath: str, overlayImagePath: str, middleImagePath: str):
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    # # NOTE(krishan711): this script assumes the overlay image is the correct sizes already
    angle = 45
    scaleX = 1.7
    scaleY = 0.9
    image = Image.open(imagePath)
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
    middleImageWidth = 26
    middleImageHeight = 20
    middleImagePosition = (math.floor(BLOCK_WIDTH * MAX_ZOOM * (GRID_WIDTH - middleImageWidth) / 2), math.floor(BLOCK_HEIGHT * MAX_ZOOM * (GRID_HEIGHT - middleImageHeight) / 2))
    middleImage = Image.open(middleImagePath)
    middleImage = middleImage.resize(size=(middleImageWidth * BLOCK_WIDTH * MAX_ZOOM, middleImageHeight * BLOCK_HEIGHT * MAX_ZOOM))
    image.paste(middleImage, middleImagePosition, middleImage)
    outputFilePath = 'output.png'
    image.save(outputFilePath)

    runId = str(uuid.uuid4())
    uploadPath = f's3://mdtp-images/uploads/{runId}'
    outputDirectory = 'output'
    crop_image(imagePath=outputFilePath, outputDirectory=outputDirectory, height=100, width=100)
    await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=uploadPath, accessControl='public-read', cacheControl='public,max-age=31536000')
    logging.info(f'Uploaded to {uploadPath}')
    await file_util.remove_directory(outputDirectory)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
