import asyncio
import json
import logging
import os
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

    network = 'rinkeby5'
    contract = contractStore.get_contract(network=network)
    ethClient = contract.ethClient

    nonce = await ethClient.get_transaction_count(address=accountAddress)
    transactionHash = None
    for row in range(0, height):
        for column in range(0, width):
            tokenId = startTokenId + (row * 100) + column
            print(f'Transferring token {tokenId} with nonce {nonce} to {receiveAddress}')
            try:
                transactionHash = await contractStore.transfer_token(network=network, tokenId=tokenId, toAddress=receiveAddress, nonce=nonce, gas=150000, gasPrice=int(1.1 * GWEI))
            except BadRequestException as exception:
                print(f'Failed to transfer {tokenId}: {str(exception)}')
            nonce += 1
            time.sleep(0.2)
    print(f'Waiting for last transaction to finish: https://rinkeby.etherscan.io/tx/{transactionHash}')
    await contractStore.wait_for_transaction(network=network, transactionHash=transactionHash)
    await requester.close_connections()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
