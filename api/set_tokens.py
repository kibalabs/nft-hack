import asyncio
import os
import json
import logging
import math
import uuid
import base64
import time
from binascii import Error as BinasciiError

import asyncclick as click
import boto3
from core.exceptions import UnauthorizedException
from core.requester import Requester
from core.s3_manager import S3Manager
from core.web3.eth_client import RestEthClient
from PIL import Image

class BasicAuthentication:

    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    @classmethod
    def from_string(cls, basicAuthenticationString: str):
        try:
            decodedString = base64.b64decode(s=basicAuthenticationString.encode('utf-8'))
        except BinasciiError:
            raise UnauthorizedException(message='Failed to decode BasicAuthentication value.')
        parts = decodedString.split(b':')
        return cls(username=parts[0].decode('latin1'), password=parts[1].decode('latin1'))

    def to_string(self) -> str:
        basicAuthenticationString = b':'.join((self.username.encode('latin1'), self.password.encode('latin1')))
        return base64.b64encode(s=basicAuthenticationString).decode('utf-8')

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
@click.option('-t', '--starting-token', 'startTokenId', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
@click.option('-d', '--description', 'description', required=True, type=str)
async def run(imagePath: str, name: str, startTokenId: int, width: int, height: int, description: str):
    network = 'rinkeby'
    requester = Requester()
    if network == 'rinkeby':
        CONTRACT_ADDRESS = os.environ['RINKEBY_CONTRACT_ADDRESS']
        # ethClient = RestEthClient(url=os.environ['ALCHEMY_URL'], requester=requester)
        infuraAuth = BasicAuthentication(username='', password=os.environ['INFURA_PROJECT_SECRET'])
        infuraRequester = Requester(headers={'authorization': f'Basic {infuraAuth.to_string()}'})
        ethClient = RestEthClient(url=f'https://rinkeby.infura.io/v3/{os.environ["INFURA_PROJECT_ID"]}', requester=infuraRequester)
    elif network == 'mumbai':
        CONTRACT_ADDRESS = os.environ['MUMBAI_CONTRACT_ADDRESS']
        ethClient = RestEthClient(url='https://matic-mumbai.chainstacklabs.com', requester=requester)
    ACCOUNT_ADDRESS = os.environ['ACCOUNT_ADDRESS']
    PRIVATE_KEY = os.environ['PRIVATE_KEY']
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    runId = 'c2cb4bc6-3264-46c0-bf4e-cc25c4b008d2' #str(uuid.uuid4())

    # Split and upload image
    # outputDirectory = 'output'
    # crop(imagePath=imagePath, outputDirectory=outputDirectory, width=width, height=height)
    # await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=f's3://mdtp-images/uploads/{runId}', accessControl='public-read', cacheControl='public,max-age=31536000')

    # Upload metadatas
    # metadataUploadTasks = []
    # for index in range(width * height):
    #     tokenId = index + 1
    #     data = {
    #         "name" : name.replace('{tokenId}', str(tokenId)),
    #         "description" : description.replace('{tokenId}', str(tokenId)),
    #         "image" : f"https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{runId}/{index}.png"
    #     }
    #     metadataUploadTasks.append(s3Manager.write_file(content=json.dumps(data).encode(), targetPath=f's3://mdtp-images/uploads/{runId}/{index}.json', accessControl='public-read', cacheControl='public,max-age=31536000'))
    #     if len(metadataUploadTasks) >= 100:
    #         await asyncio.gather(*metadataUploadTasks)
    #         metadataUploadTasks = []
    #         logging.info(f'Upload state: {index} / {(width * height)}')

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
            if tokenId <= min(tokenCount, 10000):
                tokenUri = f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{runId}/{index}.json'
                currentTokenUri = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTokenUriMethodAbi, arguments={'tokenId': tokenId}))[0]
                if currentTokenUri != tokenUri:
                    print(f'Updating token {tokenId}, with index {index}, and nonce {nonce}')
                    data = {
                        'tokenId': tokenId,
                        'tokenURI': tokenUri,
                    }
                    transactionHash = await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractSetTokenUriMethodAbi, arguments=data, gas=100000, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)
                    print('transactionHash', transactionHash)
                    # await requester.post(url=f'https://mdtp-api.kibalabs.com/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={})
                    await requester.post_json(url=f'https://mdtp-api.kibalabs.com/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={'delay': 120})
                    nonce += 1
                    time.sleep(0.5)
                else:
                    await requester.post(url=f'https://mdtp-api.kibalabs.com/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={})
            else:
                print(f'ERROR: Attempting to set a token that does not exist: {tokenId} (nonce: {nonce})')
                break
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
