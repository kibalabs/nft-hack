import os
import json
import logging
from typing import Dict, Optional

import asyncclick as click
from core.requester import FileContent, Requester
from core.util import file_util
from core.http.basic_authentication import BasicAuthentication
from PIL import Image, ImageDraw, ImageFont

IMAGE_SIZE = 1000
GRID_COUNT = 20
GRID_SIZE = IMAGE_SIZE / GRID_COUNT
COLOR_GRID = (255, 255, 255, int(0.2 * 255))
COLOR_CUBE = (255, 255, 255, int(0.6 * 255))
grey = (100,100,100)
white = (255,255,255)
font = ImageFont.truetype("./fonts/RobotoSlab-Black.ttf", 96)

def draw_gradient(image: Image, start_color: str, end_color: str) -> Image:
    base = Image.new('RGB', (IMAGE_SIZE, IMAGE_SIZE), start_color)
    image.paste(base, (0, 0))
    top = Image.new('RGB', (IMAGE_SIZE, IMAGE_SIZE), end_color)
    mask = Image.new('L', (IMAGE_SIZE, IMAGE_SIZE))
    mask_data = []
    for y in range(IMAGE_SIZE):
        for x in range(IMAGE_SIZE):
            mask_data.append(int(255 * (y / IMAGE_SIZE)))
    mask.putdata(mask_data)
    image.paste(top, (0, 0), mask)
    return image

def draw_cube(image: Image, x: int, y: int) -> Image:
    width = 2
    smallGap = 2
    largeGap = 4.5
    lowerTopleft = ( (x-largeGap)*10, (y-smallGap)*10 )
    lowerBottomRight = ( (x+smallGap)*10, (y+largeGap)*10 )
    upperTopLeft = ((x-smallGap)*10, (y-largeGap)*10)
    upperBottomRight = ((x+largeGap)*10, (y+smallGap)*10)
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)  # Create a context for drawing things on it.
    draw.rectangle((lowerTopleft[0], lowerTopleft[1], lowerBottomRight[0], lowerBottomRight[1]), outline=COLOR_CUBE, width=width)
    draw.rectangle((upperTopLeft[0], upperTopLeft[1], upperBottomRight[0], upperBottomRight[1]), outline=COLOR_CUBE, width=width)
    draw.line((lowerTopleft[0], lowerTopleft[1], upperTopLeft[0], upperTopLeft[1]), fill=COLOR_CUBE, width=width)
    draw.line((lowerBottomRight[0], lowerBottomRight[1], upperBottomRight[0], upperBottomRight[1]), fill=COLOR_CUBE, width=width)
    draw.line((lowerBottomRight[0], lowerTopleft[1], upperBottomRight[0], upperTopLeft[1]), fill=COLOR_CUBE, width=width)
    draw.line((upperTopLeft[0], upperBottomRight[1], lowerTopleft[0], lowerBottomRight[1]), fill=COLOR_CUBE, width=width)
    newImage = Image.alpha_composite(image, overlay)
    return newImage

def draw_grid(image: Image) -> Image:
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)  # Create a context for drawing things on it.
    for row in range(1, GRID_COUNT):
      draw.line((0, row * GRID_SIZE, IMAGE_SIZE, row * GRID_SIZE), fill=COLOR_GRID, width=2)
    for col in range(1, GRID_COUNT):
      draw.line((col * GRID_SIZE, 0, col * GRID_SIZE, IMAGE_SIZE), fill=COLOR_GRID, width=2)
    newImage = Image.alpha_composite(image, overlay)
    return newImage

def generate_image(tokenId: int) -> Image:
    image = Image.new('RGBA', (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))

    # good example colours: violet -> orange, cyan -> purple, blue -> pink, lime -> orange, yellow -> purple
    # #6CDCDC -> #C513C9 , #CC6CDC -> #C98013 , #97DC6C -> #C95513 , #DADC6C -> #7913C9 , #DC746C -> #C513C9 , #6CDCA6 -> #C91360 , #6C77DC -> #2DC913
    # image = draw_gradient(image=image, start_color="#6CDCDC", end_color="#C513C9")

    tokenIndex = tokenId - 1
    xCoord = tokenIndex % 100
    yCoord = int(tokenIndex / 100)

    # Draw grid
    image = draw_grid(image)

    # Draw Box at Token Number
    imageDraw = ImageDraw.Draw(image)
    imageDraw.rectangle((xCoord * 10, yCoord * 10, xCoord * 10 + 10, yCoord * 10 + 10), fill=white)
    image = draw_cube(image=image, x=xCoord, y=yCoord)

    # Draw Text
    inTopLeftQuadrant = xCoord < 50 and yCoord < 50
    inTopRightQuadrant = xCoord >= 50 and yCoord < 50
    inBottomRightQuadrant = xCoord >= 50 and yCoord >= 50
    inBottomLeftQuadrant = xCoord < 50 and yCoord >= 50
    padding = 110
    title = "MDTP"
    subtitle = f'#{tokenId}'
    titleSize = imageDraw.textsize(text=title, font=font)
    subtitleSize = imageDraw.textsize(text=subtitle, font=font)
    imageDraw = ImageDraw.Draw(image)
    # if inTopLeftQuadrant or inBottomRightQuadrant:
      # imageDraw.multiline_text((550,50), "MILLION\nDOLLAR\nTOKEN\nPAGE", font=font, fill=white, spacing=-10)
      # imageDraw.multiline_text((80,700), f'TOKEN\n{tokenId}', font=font, fill=white, align='center')
    # else:
      # imageDraw.multiline_text((80,50), "MILLION\nDOLLAR\nTOKEN\nPAGE", font=font, fill=white, spacing=-10)
      # imageDraw.multiline_text((640,700), f'TOKEN\n{tokenId}', font=font, fill=white, align='center')
    xLeft = padding
    xRight = IMAGE_SIZE - padding
    yTop = -30 + padding
    yBottom = IMAGE_SIZE - padding
    if inTopLeftQuadrant:
      # draw in bottom right
      imageDraw.multiline_text((xRight - titleSize[0], yBottom - subtitleSize[1] - titleSize[1]), text=title, font=font, fill=white)
      imageDraw.multiline_text((xRight - subtitleSize[0], yBottom - subtitleSize[1]), text=subtitle, font=font, fill=white)
    elif inTopRightQuadrant:
      # draw in bottom left
      imageDraw.multiline_text((xLeft, yBottom - subtitleSize[1] - titleSize[1]), text=title, font=font, fill=white)
      imageDraw.multiline_text((xLeft, yBottom - subtitleSize[1]), text=subtitle, font=font, fill=white)
    elif inBottomLeftQuadrant:
      # draw in top right
      imageDraw.multiline_text((xRight - titleSize[0], yTop), text=title, font=font, fill=white)
      imageDraw.multiline_text((xRight - subtitleSize[0], yTop + titleSize[1]), text=subtitle, font=font, fill=white)
    elif inBottomRightQuadrant:
      # draw in top left
      imageDraw.multiline_text((xLeft, yTop), text=title, font=font, fill=white)
      imageDraw.multiline_text((xLeft, yTop + titleSize[1]), text=subtitle, font=font, fill=white)

    return image


async def upload_file_to_ipfs(requester: Requester, fileContent: FileContent) -> str:
  response = await requester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?pin=true', formDataDict={'file': fileContent}, timeout=60)
  repsonseDict = json.loads(response.text)
  return repsonseDict["Hash"]


async def upload_files_to_ipfs(requester: Requester, fileContentMap: Dict[str, FileContent]) -> str:
  response = await requester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?wrap-with-directory=true&pin=true', formDataDict=fileContentMap, timeout=600)
  repsonseDict = json.loads(response.text.split('\n')[-2])
  if not repsonseDict["Name"] == "":
    raise Exception(f'upload seems to have gone wrong: {response.text}')
  return repsonseDict["Hash"]


@click.command()
@click.option('-t', '--token-id', 'tokenId', required=False, type=int, default=None)
@click.option('-u', '--upload', 'shouldUpload', required=False, is_flag=True, default=False)
async def run(tokenId: Optional[int], shouldUpload: bool):
    tokenIds = [tokenId] if tokenId else list(range(1, 10000 + 1))

    infuraIpfsAuth = BasicAuthentication(username=os.environ['INFURA_IPFS_PROJECT_ID'], password=os.environ['INFURA_IPFS_PROJECT_SECRET'])
    infuraIpfsRequester = Requester(headers={'authorization': f'Basic {infuraIpfsAuth.to_string()}'})
    imagesOutputDirectory = f'output/images'
    await file_util.create_directory(directory=imagesOutputDirectory)
    metadataOutputDirectory = f'output/metadatas'
    await file_util.create_directory(directory=metadataOutputDirectory)
    imageUrls = {}
    for tokenId in tokenIds:
      print(f'Generating image for {tokenId}')
      imagePath = os.path.join(imagesOutputDirectory, f'{tokenId}.png')
      tokenImage = generate_image(tokenId=tokenId)
      tokenImage.save(imagePath)
      if shouldUpload:
        print(f'Uploading image for {tokenId}')
        with open(imagePath, 'rb') as imageFile:
          cid = await upload_file_to_ipfs(requester=infuraIpfsRequester, fileContent=imageFile)
        imageUrls[tokenId] = f'ipfs://{cid}'
      else:
        imageUrls[tokenId] = imagePath
    for tokenId in tokenIds:
      print(f'Generating metadata for {tokenId}')
      metadata = {
        "tokenId": tokenId,
        "tokenIndex": tokenId - 1,
        "name": f'MDTP Token {tokenId}',
        "description": f"This NFT gives you full ownership of block {tokenId} on milliondollartokenpage.com (MDTP).\nMDTP is a digital content-sharing space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display the content you like, and later re-sold.\nSo join us and interact, trade and share, and be a part of making crypto history!",
        "image": imageUrls[tokenId],
        "url": None,
      }
      with open(os.path.join(metadataOutputDirectory, f'{tokenId}.json'), "w") as metadataFile:
        metadataFile.write(json.dumps(metadata))
    if shouldUpload:
      print(f'Uploading metadata')
      fileContentMap = {f'{tokenId}.json': open(os.path.join(metadataOutputDirectory, f'{tokenId}.json'), 'r') for tokenId in tokenIds}
      cid = await upload_files_to_ipfs(requester=infuraIpfsRequester, fileContentMap=fileContentMap)
      for openFile in fileContentMap.values():
        openFile.close()
      print(f'Uploaded metadatas to ipfs://{cid}')
    await infuraIpfsRequester.close_connections()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
