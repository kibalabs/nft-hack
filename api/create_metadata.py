import asyncio
import os
# import json
import logging
# import math
# import uuid
# import base64
# import time
# from binascii import Error as BinasciiError

import asyncclick as click
# import boto3
# from core.exceptions import UnauthorizedException
# from core.requester import Requester
# from core.s3_manager import S3Manager
# from core.web3.eth_client import RestEthClient
from PIL import Image, ImageDraw, ImageFont

IMAGE_HEIGHT_AND_WIDTH = 1000

def genImage(tokenId: int, outputDirectory: str):
    if not os.path.exists(outputDirectory):
        os.makedirs(outputDirectory)

    # Colours and Fonts
    grey = 255
    white = (255,255,255,255)
    font = ImageFont.truetype("/Library/Fonts/Arial.ttf", 80)

    # New Image
    newImage = Image.new('RGBA', (IMAGE_HEIGHT_AND_WIDTH, IMAGE_HEIGHT_AND_WIDTH), "black")  
    newImageDraw = ImageDraw.Draw(newImage)
        
    # Draw rows and columns
    totalRowCol = int(IMAGE_HEIGHT_AND_WIDTH/10)
    for row in range(0, totalRowCol):
      newImageDraw.line((0, row*10, IMAGE_HEIGHT_AND_WIDTH, row*10), fill=grey)

    for col in range(0, totalRowCol):
      newImageDraw.line((col*10, 0, col*10, IMAGE_HEIGHT_AND_WIDTH), fill=grey)

    # Draw Box at Token Number
    xCoord = (tokenId-1) % 100
    yCoord = int( (tokenId-1) / 100)
    logging.info(f'x: {xCoord} ; y: {yCoord}')
    newImageDraw.rectangle((xCoord*10, yCoord*10, xCoord*10 + 10, yCoord*10 + 10), fill=white)

    # Draw Text for MDTP and Token Number        
    inTopLeftQuadrant = xCoord < 50 and yCoord < 50
    inBottomRightQuadrant = xCoord > 50 and yCoord > 50
    flipText = inTopLeftQuadrant or inBottomRightQuadrant

    if flipText:
      newImageDraw.multiline_text((650,80), "Million\nDollar\nToken\nPage", font=font, fill=white)
      newImageDraw.multiline_text((80,800), f'Token\n{tokenId}', font=font, fill=white)
    else:
      newImageDraw.multiline_text((80,80), "Million\nDollar\nToken\nPage", font=font, fill=white)
      newImageDraw.multiline_text((650,800), f'Token\n{tokenId}', font=font, fill=white)
    
    newImage.save(os.path.join(outputDirectory, f'metadata-{tokenId}.png'))
  

@click.command()
@click.option('-t', '--token-id', 'tokenId', required=True, type=int)
async def run(tokenId: int):
    logging.info(f'TokenID: {tokenId}')
    outputDirectory = 'output'
    genImage(tokenId=tokenId, outputDirectory=outputDirectory)
    logging.info(f'Complete!')

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
