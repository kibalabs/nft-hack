import asyncio
import os
import json
import logging

import asyncclick as click
from PIL import Image, ImageDraw, ImageFont

IMAGE_HEIGHT_AND_WIDTH = 1000
grey = (100,100,100)
white = (255,255,255)
font = ImageFont.truetype("./RobotoSlab-Bold.ttf", 85)

def draw_gradient(colour1: str, colour2: str) -> Image:
    base = Image.new('RGB', (IMAGE_HEIGHT_AND_WIDTH, IMAGE_HEIGHT_AND_WIDTH), colour1)
    top = Image.new('RGB', (IMAGE_HEIGHT_AND_WIDTH, IMAGE_HEIGHT_AND_WIDTH), colour2)
    mask = Image.new('L', (IMAGE_HEIGHT_AND_WIDTH, IMAGE_HEIGHT_AND_WIDTH))
    mask_data = []
    for y in range(IMAGE_HEIGHT_AND_WIDTH):
        for x in range(IMAGE_HEIGHT_AND_WIDTH):
            mask_data.append(int(255 * (y / IMAGE_HEIGHT_AND_WIDTH)))
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_cube(imageDraw: ImageDraw, x: int, y: int) -> ImageDraw:
    width = 2
    smallGap = 2
    largeGap = 4.5
    lowerTopleft = ( (x-largeGap)*10, (y-smallGap)*10 )
    lowerBottomRight = ( (x+smallGap)*10, (y+largeGap)*10 )
    upperTopLeft = ((x-smallGap)*10, (y-largeGap)*10)
    upperBottomRight = ((x+largeGap)*10, (y+smallGap)*10)

    imageDraw.rectangle((lowerTopleft[0], lowerTopleft[1], lowerBottomRight[0], lowerBottomRight[1]), outline=white, width=width)
    imageDraw.rectangle((upperTopLeft[0], upperTopLeft[1], upperBottomRight[0], upperBottomRight[1]), outline=white, width=width)
    imageDraw.line((lowerTopleft[0], lowerTopleft[1], upperTopLeft[0], upperTopLeft[1]), fill=white, width=width)
    imageDraw.line((lowerBottomRight[0], lowerBottomRight[1], upperBottomRight[0], upperBottomRight[1]), fill=white, width=width)
    imageDraw.line((lowerBottomRight[0], lowerTopleft[1], upperBottomRight[0], upperTopLeft[1]), fill=white, width=width)
    imageDraw.line((upperTopLeft[0], upperBottomRight[1], lowerTopleft[0], lowerBottomRight[1]), fill=white, width=width)
    return imageDraw

def gen_image(tokenId: int, outputDirectory: str):
    if not os.path.exists(outputDirectory):
        os.makedirs(outputDirectory)

    # New Image
    # good example colours: violet -> orange, cyan -> purple, blue -> pink, lime -> orange, yellow -> purple
    # #6CDCDC -> #C513C9 , #CC6CDC -> #C98013 , #97DC6C -> #C95513 , #DADC6C -> #7913C9 , #DC746C -> #C513C9 , #6CDCA6 -> #C91360 , #6C77DC -> #2DC913
    newImage = draw_gradient("#6CDCDC", "#C513C9")    
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
      newImageDraw.multiline_text((550,50), "MILLION\nDOLLAR\nTOKEN\nPAGE", font=font, fill=white, spacing=-10)
      newImageDraw.multiline_text((80,700), f'TOKEN\n{tokenId}', font=font, fill=white, align='center')
    else:
      newImageDraw.multiline_text((80,50), "MILLION\nDOLLAR\nTOKEN\nPAGE", font=font, fill=white, spacing=-10)
      newImageDraw.multiline_text((640,700), f'TOKEN\n{tokenId}', font=font, fill=white, align='center')
    
    # Draw the cube around box
    newImageDraw = draw_cube(newImageDraw, xCoord, yCoord)

    newImage.save(os.path.join(outputDirectory, f'image-{tokenId}.png'))
  

@click.command()
@click.option('-t', '--token-id', 'tokenId', required=True, type=int)
async def run(tokenId: int):
    logging.info(f'TokenID: {tokenId}')
    
    outputDirectory = f'output/{tokenId}/'
    gen_image(tokenId=tokenId, outputDirectory=outputDirectory)

    jsonContent = {
      "name" : f'Milliondollartokenpage - Token {tokenId}',
      "description" : f"This NFT gives you full ownership of block {tokenId} on milliondollartokenpage.com (MDTP).\nMDTP is a digital content-sharing space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display the content you like, and later re-sold.\nSo join us and interact, trade and share, and be a part of making crypto history!",
      "image" : f'{outputDirectory}image-{tokenId}.png'
    }
    metadataFile = open(f'{outputDirectory}metadata-{tokenId}.json', "w")     
    json.dump(jsonContent, metadataFile, indent = 2)     
    metadataFile.close() 
    
    logging.info(f'Complete!')

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
