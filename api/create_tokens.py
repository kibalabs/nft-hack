import asyncio
import os
import json
import logging
from typing import Optional

import asyncclick as click
import boto3
from PIL import Image
from web3 import Web3

from mdtp.core.requester import Requester
from mdtp.core.s3_manager import S3Manager
from mdtp.eth_client import RestEthClient

def crop(imagePath: str, outputDirectory: str, height: int, width: int):
    if not os.path.exists(outputDirectory):
        os.makedirs(outputDirectory)
    image = Image.open(imagePath)
    imageWidth, imageHeight = image.size
    index = 0
    for row in range(0, imageHeight, height):
        for column in range(0, imageWidth, width):
            box = (column, row, column + width, row + height)
            croppedImage = image.crop(box)
            croppedImage.save(os.path.join(outputDirectory, f'{index}.png'))
            index += 1


@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-n', '--name', 'name', required=True, type=str)
async def run(imagePath: str, name: str):
    CONTRACT_ADDRESS = os.environ['CONTRACT_ADDRESS']
    ALCHEMY_URL = os.environ['ALCHEMY_URL']
    ACCOUNT_ADDRESS = os.environ['ACCOUNT_ADDRESS']
    PRIVATE_KEY = os.environ['PRIVATE_KEY']
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    # outputDirectory = 'output'
    # crop(imagePath=imagePath, outputDirectory=outputDirectory, height=10, width=10)
    # await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=f's3://mdtp-images/uploads/{name}', accessControl='public-read', cacheControl='public,max-age=31536000')
    # for index in range(10000):
    #     data = {
    #         "name" : "Milliondollartokenpage",
    #         "description" : "Milliondollartokenpage Is a digital advertising space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market. So join us and interact, trade and share, and be a part of making crypto history!",
    #         "image" : f"https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/mdhp/{index}.png"
    #     }
    #     await s3Manager.write_file(content=json.dumps(data).encode(), targetPath=f's3://mdtp-images/uploads/{name}/{index}.json', accessControl='public-read', cacheControl='public,max-age=31536000')
    w3 = Web3()
    requester = Requester()
    ethClient = RestEthClient(url=ALCHEMY_URL, requester=requester)
    with open('./MillionDollarNFT.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)
    contractAbi = contractJson['abi']
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contractAbi)
    # contractMintNFTMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'mintNFT'][0]
    contractTotalSupplyMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'totalSupply'][0]
    contractTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'tokenURI'][0]
    contractSetTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'setTokenURI'][0]
    nonce = await ethClient.get_transaction_count(address=ACCOUNT_ADDRESS)
    nonceIncrement = 0
    currentTokenCount = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTotalSupplyMethodAbi))[0]
    for index in range(10000):
        tokenId = index + 1
        if tokenId == 25:
            continue
        tokenUri = f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{name}/{index}.json'
        if index < currentTokenCount:
            currentTokenUri = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTokenUriMethodAbi, arguments={'tokenId': tokenId}))[0]
            if currentTokenUri != tokenUri:
                print(f'Updating token {tokenId}', nonce + nonceIncrement)
                data = {
                    'tokenId': tokenId,
                    'tokenURI': tokenUri,
                }
                output = await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce + nonceIncrement, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractSetTokenUriMethodAbi, arguments=data, gas=500000, gasPrice=1000000000, privateKey=PRIVATE_KEY)
                nonceIncrement += 1
        else:
            print(f'Creating token {tokenId}', nonce + nonceIncrement)
            # data = {
            #     'recipient': ACCOUNT_ADDRESS,
            #     'tokenURI': tokenUri,
            # }
            # output = await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce + nonceIncrement, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractMintNFTMethodAbi, arguments=data, gas=500000, gasPrice=1000000000, privateKey=PRIVATE_KEY)
            # nonceIncrement += 1
            return
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
