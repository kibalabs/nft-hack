import os
import json
import logging

import asyncclick as click
import boto3
from core.requester import Requester
from core.s3_manager import S3Manager
from core.web3.eth_client import RestEthClient
from PIL import Image
from web3 import Web3

GWEI = 1000000000

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
    CONTRACT_ADDRESS = os.environ['RINKEBY_CONTRACT_ADDRESS']
    # CONTRACT_ADDRESS = os.environ['MUMBAI_CONTRACT_ADDRESS']
    ETH_CLIENT_URL = os.environ['ALCHEMY_URL']
    # ETH_CLIENT_URL = 'https://matic-mumbai.chainstacklabs.com'
    ACCOUNT_ADDRESS = os.environ['ACCOUNT_ADDRESS']
    PRIVATE_KEY = os.environ['PRIVATE_KEY']
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    # outputDirectory = 'output'
    # crop(imagePath=imagePath, outputDirectory=outputDirectory, height=10, width=10)
    # await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=f's3://mdtp-images/uploads/{name}', accessControl='public-read', cacheControl='public,max-age=31536000')
    # for index in range(10000):
    #     data = {
    #         "name" : f"MillionDollarTokenPage Token {index + 1}",
    #         "description" : "MillionDollarTokenPage (MDTP) is a digital advertising space powered by the Ethereum cryptocurrency network and NFT technology. Each pixel block you see can be purchased as a unique NFT, set to display what you like, and later re-sold on the secondary-market. So join us and interact, trade and share, and be a part of making crypto history!",
    #         "image" : f"https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{name}/{index}.png"
    #     }
    #     await s3Manager.write_file(content=json.dumps(data).encode(), targetPath=f's3://mdtp-images/uploads/{name}/{index}.json', accessControl='public-read', cacheControl='public,max-age=31536000')
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
    tokenCount = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTotalSupplyMethodAbi))[0]
    for index in range(1000, 10000):
        tokenId = index + 1
        tokenUri = f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{name}/{index}.json'
        if tokenId <= tokenCount:
            currentTokenUri = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTokenUriMethodAbi, arguments={'tokenId': tokenId}))[0]
            if currentTokenUri != tokenUri:
                print(f'Updating token {tokenId} from {currentTokenUri} to {tokenUri}', nonce)
                data = {
                    'tokenId': tokenId,
                    'tokenURI': tokenUri,
                }
                output = await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractSetTokenUriMethodAbi, arguments=data, gas=50000, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)
                print('output', output)
                nonce += 1
        else:
            print(f'Creating token {tokenId}', nonce)
            data = {
                'recipient': ACCOUNT_ADDRESS,
                'tokenURI': tokenUri,
            }
            output = await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractMintNFTMethodAbi, arguments=data, gas=300000, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)
            print('output', output)
            nonce += 1
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
