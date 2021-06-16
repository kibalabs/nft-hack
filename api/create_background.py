import math
import logging
import asyncio

import asyncclick as click
from PIL import Image


@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-a', '--overlay-image-path', 'overlayImagePath', required=True, type=str)
async def main(imagePath: str, overlayImagePath: str):
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

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
