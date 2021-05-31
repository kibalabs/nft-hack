import os
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
    angleRadians = math.radians(angle)
    scaleX = 1.7
    scaleY = 0.9
    image = Image.open(imagePath)
    imageWidth, imageHeight = image.size
    overlayImage = Image.open(overlayImagePath)
    overlayImage = overlayImage.rotate(angle, expand=True)
    overlayImageWidth, overlayImageHeight = overlayImage.size
    print('overlay', overlayImageWidth, overlayImageHeight)
    scaledWidth = overlayImageWidth * scaleX
    scaledHeight = overlayImageHeight * scaleY
    print('scaled overlay', scaledWidth, scaledHeight)
    transformX = -scaledWidth * scaleY / scaleX #math.cos(angleRadians) # -0.4 * overlayImageWidth
    transformY = 0 * overlayImageHeight
    print(transformX, transformY)
    for x in range(0, math.ceil(3 * imageWidth / scaledWidth)):
        print(f'row {x}')
        for y in range(0, math.ceil(3 * imageHeight / scaledHeight)):
            position = (math.floor(-scaledWidth + (transformX * y) + (x * scaledWidth)), math.floor(-scaledHeight + (transformY * x) + (y * scaledHeight)))
            image.paste(overlayImage, position, overlayImage)
    outputFilePath = 'output.png'
    image.save(outputFilePath)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
