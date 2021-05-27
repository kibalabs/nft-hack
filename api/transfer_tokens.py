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

@click.command()
@click.option('-s', '--starting-token', 'startTokenId', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
async def run(startTokenId: int, width: int, height: int):
    network = 'rinkeby'
    if network == 'rinkeby':
        CONTRACT_ADDRESS = os.environ['RINKEBY_CONTRACT_ADDRESS']
        ETH_CLIENT_URL = os.environ['ALCHEMY_URL']
    elif network == 'mumbai':
        CONTRACT_ADDRESS = os.environ['MUMBAI_CONTRACT_ADDRESS']
        ETH_CLIENT_URL = 'https://matic-mumbai.chainstacklabs.com'
    ACCOUNT_ADDRESS = os.environ['ACCOUNT_ADDRESS']
    PRIVATE_KEY = os.environ['PRIVATE_KEY']

    requester = Requester()
    ethClient = RestEthClient(url=ETH_CLIENT_URL, requester=requester)
    with open('./MillionDollarNFT.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)
    contractAbi = contractJson['abi']
    contractTotalSupplyMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'totalSupply'][0]
    contractTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'tokenURI'][0]
    contractSetTokenUriMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'setTokenURI'][0]
    nonce = await ethClient.get_transaction_count(address=ACCOUNT_ADDRESS)

    sendAddress = '0x123'
    receiveAddress = '0x456'

    tokensPerRow = 100
    tokenCount = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTotalSupplyMethodAbi))[0]
    for row in range(0, height):
        for column in range(0, width):
            index = (row * width) + column
            tokenId = startTokenId + (row * tokensPerRow) + column
            if tokenId <= tokenCount:
                currentTokenUri = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTokenUriMethodAbi, arguments={'tokenId': tokenId}))[0]
                if currentTokenUri != tokenUri:
                    print(f'Transferring token {tokenId}, from {sendAddress}, to {receiveAddress}')
                    data = {
                        'tokenId': tokenId,
                        'tokenURI': tokenUri,
                    }
                    await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractSetTokenUriMethodAbi, arguments=data, gas=100000, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)                    
                    nonce += 1
            else:
                print(f'ERROR: Attempting to set a token that does not exist: {tokenId} (nonce: {nonce})')
                break
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
