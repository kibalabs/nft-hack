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

    newImage = Image.new('RGBA', (IMAGE_HEIGHT_AND_WIDTH, IMAGE_HEIGHT_AND_WIDTH), "black")  
    newImageDraw = ImageDraw.Draw(newImage)
        
    totalRowCol = int(IMAGE_HEIGHT_AND_WIDTH/10)
    for row in range(0, totalRowCol):
      newImageDraw.line((0, row*10, IMAGE_HEIGHT_AND_WIDTH, row*10), fill=255)

    for col in range(0, totalRowCol):
      newImageDraw.line((col*10, 0, col*10, IMAGE_HEIGHT_AND_WIDTH), fill=255)
    
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
