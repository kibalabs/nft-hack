import asyncio
import os
import json
import logging
import math
from typing import Optional

import asyncclick as click
import boto3
from PIL import Image
from web3 import Web3

from mdtp.core.requester import Requester
from mdtp.core.s3_manager import S3Manager
from mdtp.eth_client import RestEthClient

GWEI = 1000000000

def crop(imagePath: str, outputDirectory: str, width: int, height: int):
    if not os.path.exists(outputDirectory):
        os.makedirs(outputDirectory)
    image = Image.open(imagePath)
    imageWidth, imageHeight = image.size
    boxWidth = int(imageWidth/width)
    boxHeight = int(imageHeight/height)
    index = 0
    for row in range(0, imageHeight, boxHeight):
        for column in range(0, imageWidth, boxWidth):            
            box = (column, row, column + boxWidth, row + boxHeight)
            croppedImage = image.crop(box)
            croppedImage.save(os.path.join(outputDirectory, f'{index}.png'))
            index += 1

@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-n', '--name', 'name', required=True, type=str)
@click.option('-s', '--starting-token', 'startingToken', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
@click.option('-d', '--description', 'description', required=True, type=int)
async def run(imagePath: str, name: str, startingToken: int, width: int, height: int, description: str):
    CONTRACT_ADDRESS = os.environ['RINKEBY_CONTRACT_ADDRESS']
    # CONTRACT_ADDRESS = os.environ['MUMBAI_CONTRACT_ADDRESS']
    ETH_CLIENT_URL = os.environ['ALCHEMY_URL']
    # ETH_CLIENT_URL = 'https://matic-mumbai.chainstacklabs.com'
    ACCOUNT_ADDRESS = os.environ['ACCOUNT_ADDRESS']
    PRIVATE_KEY = os.environ['PRIVATE_KEY']
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    outputDirectory = 'output'
    crop(imagePath=imagePath, outputDirectory=outputDirectory, width=width, height=height)
    await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=f's3://mdtp-images/uploads/{name}', accessControl='public-read', cacheControl='public,max-age=31536000')
    size = width*height
    for index in range(size):
        data = {
            "name" : name,
            "description" : description,
            "image" : f"https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{name}/{index}.png"
        }
        await s3Manager.write_file(content=json.dumps(data).encode(), targetPath=f's3://mdtp-images/uploads/{name}/{index}.json', accessControl='public-read', cacheControl='public,max-age=31536000')
    
    w3 = Web3()
    requester = Requester()
    ethClient = RestEthClient(url=ETH_CLIENT_URL, requester=requester)
    with open('./MillionDollarNFT.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)
    contractAbi = contractJson['abi']
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contractAbi)
    contractMintNFTMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'mintNFT'][0]
    contractTotalSupplyMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'totalSupply'][0]
    contractTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'tokenURI'][0]
    contractSetTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'setTokenURI'][0]
    nonce = await ethClient.get_transaction_count(address=ACCOUNT_ADDRESS)
    print('nonce', nonce)
    nonceIncrement = 0

    kTotalBlocksPerRow = 100 
    tokenCount = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTotalSupplyMethodAbi))[0]    
    for row in range(0, height):
        for column in range(0, width):
            index = row*width + column
            tokenId = startingToken + (row*kTotalBlocksPerRow + column)            
            tokenUri = f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{name}/{index}.json'
            if tokenId <= tokenCount:
                currentTokenUri = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTokenUriMethodAbi, arguments={'tokenId': tokenId}))[0]                
                if currentTokenUri != tokenUri:
                    print(f'Updating token {tokenId}', nonce + nonceIncrement)
                    data = {
                        'tokenId': tokenId,
                        'tokenURI': tokenUri,
                    }
                    output = await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce + nonceIncrement, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractSetTokenUriMethodAbi, arguments=data, gas=100000, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)
                    nonceIncrement += 1
            else:
                print(f'ERROR: Attempting to set a token that does not exist: {tokenId}', nonce + nonceIncrement)
                break
    
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')