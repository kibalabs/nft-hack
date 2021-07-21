import os
import math
import logging
import asyncio
import uuid

import asyncclick as click
import boto3
from core.s3_manager import S3Manager
from PIL import Image

from crop_image import crop_image

@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-a', '--overlay-image-path', 'overlayImagePath', required=True, type=str)
async def main(imagePath: str, overlayImagePath: str):
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    angle = 45
    scaleX = 1.7
    scaleY = 0.9
    image = Image.open(imagePath)
    imageWidth, imageHeight = image.size
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
    outputFilePath = 'output.png'
    image.save(outputFilePath)

    runId = str(uuid.uuid4())
    uploadPath = f's3://mdtp-images/uploads/{runId}'
    outputDirectory = 'output'
    crop_image(imagePath=imagePath, outputDirectory=outputDirectory, height=100, width=100)
    await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=uploadPath, accessControl='public-read', cacheControl='public,max-age=31536000')
    logging.info(f'Uploaded to {uploadPath}')

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
