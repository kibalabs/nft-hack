import asyncio
import os
import json
import logging
from typing import Optional

import asyncclick as click
import boto3
from web3 import Web3
from databases import Database

from core.queues.sqs_message_queue import SqsMessageQueue
from mdtp.messages import UpdateTokensMessageContent


@click.command()
async def run():
    sqsClient = boto3.client(service_name='sqs', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    workQueue = SqsMessageQueue(sqsClient=sqsClient, queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue')
    await workQueue.send_message(message=UpdateTokensMessageContent(network='rinkeby').to_message())

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
