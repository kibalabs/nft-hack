import asyncio
import os
import json
import logging
from typing import Optional
import uuid
import time

import asyncclick as click
import boto3
from core.exceptions import BadRequestException
from core.requester import Requester
from core.s3_manager import S3Manager
from core.web3.eth_client import RestEthClient
from core.util import list_util
from core.util import file_util

from contracts import create_contract_store
from crop_image import crop_image

GWEI = 1000000000

@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
@click.option('-n', '--name', 'name', required=True, type=str)
@click.option('-u', '--url', 'url', required=False, type=str)
@click.option('-t', '--starting-token', 'startTokenId', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
@click.option('-d', '--description', 'description', required=False, type=str)
async def run(imagePath: str, name: str, url: Optional[str], description: Optional[str], startTokenId: int, width: int, height: int):
    accountAddress = os.environ['ACCOUNT_ADDRESS']
    privateKey = os.environ['PRIVATE_KEY']
    requester = Requester()
    rinkebyEthClient = RestEthClient(url=os.environ['ALCHEMY_URL'], requester=requester)
    mumbaiEthClient = RestEthClient(url='https://matic-mumbai.chainstacklabs.com', requester=requester)
    contractStore = create_contract_store(rinkebyEthClient=rinkebyEthClient, mumbaiEthClient=mumbaiEthClient, accountAddress=accountAddress, privateKey=privateKey)
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    network = 'rinkeby3'
    contract = contractStore.get_contract(network=network)
    ethClient = contract.ethClient

    runId = str(uuid.uuid4())
    print(f'Starting run: {runId}')

    print(f'Splitting and uploading image...')
    outputDirectory = 'output'
    crop_image(imagePath=imagePath, outputDirectory=outputDirectory, width=width, height=height)
    await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=f's3://mdtp-images/uploads/{runId}', accessControl='public-read', cacheControl='public,max-age=31536000')
    await file_util.remove_directory(directory=outputDirectory)
    print(f'Finished uploading image: s3://mdtp-images/uploads/{runId}')

    print(f'Uploading metadatas...')
    for chunk in list_util.generate_chunks(list(range(width * height)), 100):
        metadataUploadTasks = []
        for index in chunk:
            tokenId = index + 1
            data = {
                "name" : name.replace('{tokenId}', str(tokenId)),
                "description" : description.replace('{tokenId}', str(tokenId)) if description else None,
                "image" : f"https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{runId}/{index}.png",
                "url": url.replace('{tokenId}', str(tokenId)) if url else None,
                "groupId": runId,
            }
            metadataUploadTasks.append(s3Manager.write_file(content=json.dumps(data).encode(), targetPath=f's3://mdtp-images/uploads/{runId}/{index}.json', accessControl='public-read', cacheControl='public,max-age=31536000'))
        await asyncio.gather(*metadataUploadTasks)
    logging.info(f'Finished uploading metadatas: s3://mdtp-images/uploads/{runId}')

    tokensPerRow = 100
    tokenCount = await contractStore.get_total_supply(network='rinkeby')
    nonce = await ethClient.get_transaction_count(address=accountAddress)
    for row in range(0, height):
        for column in range(0, width):
            index = (row * width) + column
            tokenId = startTokenId + (row * tokensPerRow) + column
            if tokenId <= min(tokenCount, 10000):
                tokenContentUri = f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/{runId}/{index}.json'
                currentTokenContentUri = await contractStore.get_token_content_url(network=network, tokenId=tokenId)
                if currentTokenContentUri == tokenContentUri:
                    continue
                try:
                    currentTokenOwner = await contractStore.get_token_owner(network=network, tokenId=tokenId)
                except BadRequestException as exception:
                    if 'nonexistent token' in exception.message:
                        print('Minting token...')
                        transactionHash = await contractStore.mint_token(network=network, tokenId=tokenId, nonce=nonce, gas=150000, gasPrice=1 * GWEI)
                        nonce += 1
                        currentTokenOwner = accountAddress
                        print('Minted token')
                    else:
                        raise Exception
                if currentTokenOwner != accountAddress:
                    raise Exception(f'We are not the owner of this token, it is owned by: {currentTokenOwner}')
                print(f'Updating token {tokenId}, with index {index}, and nonce {nonce}')
                transactionHash = await contractStore.set_token_content_url(network=network, tokenId=tokenId, tokenContentUri=tokenContentUri, nonce=nonce, gas=200000, gasPrice=1 * GWEI)
                print('transactionHash', transactionHash)
                await requester.post(url=f'https://api.mdtp.co/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={})
                await requester.post_json(url=f'https://api.mdtp.co/v1/networks/{network}/tokens/{tokenId}/update-token-deferred', dataDict={'delay': 120})
                nonce += 1
                time.sleep(0.5)
            else:
                print(f'ERROR: Attempting to set a token that does not exist: {tokenId} (nonce: {nonce})')
                break
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
