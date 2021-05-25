import os
import json
import logging
import uuid

import asyncclick as click
import boto3
from core.requester import Requester
from core.s3_manager import S3Manager
from core.web3.eth_client import RestEthClient
from PIL import Image

GWEI = 1000000000

def crop(imagePath: str, outputDirectory: str, width: int, height: int):
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

@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-n', '--name', 'name', required=True, type=str)
@click.option('-s', '--starting-token', 'startTokenId', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
@click.option('-d', '--description', 'description', required=True, type=str)
async def run(imagePath: str, name: str, startTokenId: int, width: int, height: int, description: str):
    network = 'rinkeby'
    if network == 'rinkeby':
        CONTRACT_ADDRESS = os.environ['RINKEBY_CONTRACT_ADDRESS']
        ETH_CLIENT_URL = os.environ['ALCHEMY_URL']
    elif network == 'mumbai':
        CONTRACT_ADDRESS = os.environ['MUMBAI_CONTRACT_ADDRESS']
        ETH_CLIENT_URL = 'https://matic-mumbai.chainstacklabs.com'
    ACCOUNT_ADDRESS = os.environ['ACCOUNT_ADDRESS']
    PRIVATE_KEY = os.environ['PRIVATE_KEY']
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    runId = str(uuid.uuid4())
    outputDirectory = 'output'
    crop(imagePath=imagePath, outputDirectory=outputDirectory, width=width, height=height)
    await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=f's3://mdtp-images/uploads/{runId}', accessControl='public-read', cacheControl='public,max-age=31536000')
    size = width*height
    for index in range(size):
        data = {
            "name" : name,
            "description" : description,
            "image" : f"https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{runId}/{index}.png"
        }
        await s3Manager.write_file(content=json.dumps(data).encode(), targetPath=f's3://mdtp-images/uploads/{runId}/{index}.json', accessControl='public-read', cacheControl='public,max-age=31536000')

    requester = Requester()
    ethClient = RestEthClient(url=ETH_CLIENT_URL, requester=requester)
    with open('./MillionDollarNFT.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)
    contractAbi = contractJson['abi']
    contractTotalSupplyMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'totalSupply'][0]
    contractTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'tokenURI'][0]
    contractSetTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'setTokenURI'][0]
    nonce = await ethClient.get_transaction_count(address=ACCOUNT_ADDRESS)

    tokensPerRow = 100
    tokenCount = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTotalSupplyMethodAbi))[0]
    for row in range(0, height):
        for column in range(0, width):
            index = (row * width) + column
            tokenId = startTokenId + (row * tokensPerRow) + column
            tokenUri = f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{runId}/{index}.json'
            if tokenId <= tokenCount:
                currentTokenUri = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTokenUriMethodAbi, arguments={'tokenId': tokenId}))[0]
                if currentTokenUri != tokenUri:
                    print(f'Updating token {tokenId}, with index {index}, and nonce {nonce}')
                    data = {
                        'tokenId': tokenId,
                        'tokenURI': tokenUri,
                    }
                    await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractSetTokenUriMethodAbi, arguments=data, gas=100000, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)
                    await requester.post(url=f'https://mdtp-api.kibalabs.com/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={})
                    await requester.post_json(url=f'https://mdtp-api.kibalabs.com/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={'delay': 120})
                    nonce += 1
            else:
                print(f'ERROR: Attempting to set a token that does not exist: {tokenId} (nonce: {nonce})')
                break

    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
