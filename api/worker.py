import asyncio
import os
import json
import logging

import boto3
from databases import Database
from web3 import Web3

from mdtp.core.requester import Requester
from mdtp.core.slack_client import SlackClient
from mdtp.core.sqs_message_queue import SqsMessageQueue
from mdtp.core.message_queue_processor import MessageQueueProcessor
from mdtp.core.requester import Requester
from mdtp.store.retriever import MdtpRetriever
from mdtp.store.saver import MdtpSaver
from mdtp.manager import MdtpManager
from mdtp.eth_client import RestEthClient
from mdtp.mdtp_message_processor import MdtpMessageProcessor
from mdtp.image_manager import ImageManager

async def main():
    database = Database(f'postgresql://{os.environ["DB_USERNAME"]}:{os.environ["DB_PASSWORD"]}@{os.environ["DB_HOST"]}:{os.environ["DB_PORT"]}/{os.environ["DB_NAME"]}')
    saver = MdtpSaver(database=database)
    retriever = MdtpRetriever(database=database)

    sqsClient = boto3.client(service_name='sqs', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    workQueue = SqsMessageQueue(sqsClient=sqsClient, queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue')

    requester = Requester()
    ethClient = RestEthClient(url='https://eth-rinkeby.alchemyapi.io/v2/Sg7ktQ7cAlWZ4Qk0193Gg5ccBJNpEMXA', requester=requester)
    with open('./MillionDollarNFT.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)
    imageManager = ImageManager(requester=requester, sirvKey=os.environ['SIRV_KEY'], sirvSecret=os.environ['SIRV_SECRET'])
    manager = MdtpManager(requester=requester, retriever=retriever, saver=saver, ethClient=ethClient, workQueue=workQueue, imageManager=imageManager, contractAddress='0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3', contractJson=contractJson)

    processor = MdtpMessageProcessor(manager=manager)
    slackClient = SlackClient(webhookUrl=os.environ['SLACK_WEBHOOK_URL'], requester=requester, defaultSender='worker', defaultChannel='mdtp-notifications')
    messageQueueProcessor = MessageQueueProcessor(queue=workQueue, messageProcessor=processor, slackClient=slackClient)

    await database.connect()
    await messageQueueProcessor.run()

    await requester.close_connections()
    await database.disconnect()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
