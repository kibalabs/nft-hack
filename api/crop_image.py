import os

from PIL import Image


def crop_image(imagePath: str, outputDirectory: str, width: int, height: int):
    if not os.path.exists(outputDirectory):
        os.makedirs(outputDirectory)
    image = Image.open(imagePath)
    imageWidth, imageHeight = image.size
    boxWidth = int(imageWidth / width)
    boxHeight = int(imageHeight / height)
    index = 0
    for row in range(0, height):
        for column in range(0, width):
            box = (column * boxWidth, row * boxHeight, (column + 1) * boxWidth, (row + 1) * boxHeight)
            croppedImage = image.crop(box)
            croppedImage.save(os.path.join(outputDirectory, f'{index}.png'))
            index += 1
