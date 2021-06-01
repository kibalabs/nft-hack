import os
import json
import logging
import time

import asyncclick as click
from core.exceptions import BadRequestException
from core.requester import Requester
from core.web3.eth_client import RestEthClient

GWEI = 1000000000
GAS_LIMIT = 1000000

@click.command()
@click.option('-t', '--starting-token', 'startTokenId', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
@click.option('-s', '--sendAddress', 'sendAddress', required=True, type=str)
@click.option('-r', '--receiveAddress', 'receiveAddress', required=True, type=str)
async def run(startTokenId: int, width: int, height: int, sendAddress: str, receiveAddress: str):
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
    contractTransferFromMethodAbi = [internalAbi for internalAbi in contractAbi if internalAbi.get('name') == 'transferFrom'][0]
    nonce = await ethClient.get_transaction_count(address=ACCOUNT_ADDRESS)

    tokensPerRow = 100
    tokenCount = (await ethClient.call_function(toAddress=CONTRACT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTotalSupplyMethodAbi))[0]
    for row in range(0, height):
        for column in range(0, width):
            tokenId = startTokenId + (row * tokensPerRow) + column
            if tokenId <= tokenCount:
                print(f'Transferring token {tokenId} with nonce {nonce} from {sendAddress} -> {receiveAddress}')
                data = {
                    'from': sendAddress,
                    'to': receiveAddress,
                    'tokenId': tokenId,
                }
                try:
                    await ethClient.send_transaction(toAddress=CONTRACT_ADDRESS, nonce=nonce, fromAddress=ACCOUNT_ADDRESS, contractAbi=contractAbi, functionAbi=contractTransferFromMethodAbi, arguments=data, gas=GAS_LIMIT, gasPrice=1 * GWEI, privateKey=PRIVATE_KEY)
                except BadRequestException as exception:
                    print(f'Failed to transfer {tokenId}: {str(exception)}')
                nonce += 1
                time.sleep(0.5)
            else:
                print(f'ERROR: Attempting to set a token that does not exist: {tokenId} (nonce: {nonce})')
                break
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
