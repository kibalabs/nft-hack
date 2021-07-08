import asyncio
# import os
# import json
import logging
# import math
# import uuid
# import base64
# import time
# from binascii import Error as BinasciiError

import asyncclick as click
# import boto3
# from core.exceptions import UnauthorizedException
# from core.requester import Requester
# from core.s3_manager import S3Manager
# from core.web3.eth_client import RestEthClient
# from PIL import Image

@click.command()
@click.option('-t', '--token-id', 'tokenId', required=True, type=int)
async def run(tokenId: int):
    logging.info(f'TokenID: {tokenId}')    

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
