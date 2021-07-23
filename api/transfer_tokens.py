import os
import json
import logging
import time

import asyncclick as click
from core.exceptions import BadRequestException
from core.requester import Requester
from core.web3.eth_client import RestEthClient

from contracts import create_contract_store

GWEI = 1000000000
GAS_LIMIT = 1000000

@click.command()
@click.option('-t', '--starting-token', 'startTokenId', required=True, type=int)
@click.option('-w', '--width', 'width', required=True, type=int)
@click.option('-h', '--height', 'height', required=True, type=int)
@click.option('-r', '--receive-address', 'receiveAddress', required=True, type=str)
async def run(startTokenId: int, width: int, height: int, receiveAddress: str):
    accountAddress = os.environ['ACCOUNT_ADDRESS']
    privateKey = os.environ['PRIVATE_KEY']
    requester = Requester()
    rinkebyEthClient = RestEthClient(url=os.environ['ALCHEMY_URL'], requester=requester)
    mumbaiEthClient = RestEthClient(url='https://matic-mumbai.chainstacklabs.com', requester=requester)
    contractStore = create_contract_store(rinkebyEthClient=rinkebyEthClient, mumbaiEthClient=mumbaiEthClient, accountAddress=accountAddress, privateKey=privateKey)

    network = 'rinkeby2'
    contract = contractStore.get_contract(network=network)
    ethClient = contract.ethClient

    tokensPerRow = 100
    tokenCount = await contractStore.get_total_supply(network='rinkeby')
    nonce = await ethClient.get_transaction_count(address=accountAddress)
    for row in range(0, height):
        for column in range(0, width):
            tokenId = startTokenId + (row * tokensPerRow) + column
            if tokenId <= tokenCount:
                print(f'Transferring token {tokenId} with nonce {nonce} to {receiveAddress}')
                try:
                    transactionHash = await contractStore.transfer_token(network=network, tokenId=tokenId, toAddress=receiveAddress, nonce=nonce, gas=150000, gasPrice=1 * GWEI)
                    print('transactionHash', transactionHash)
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
