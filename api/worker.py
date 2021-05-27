import asyncio
import os
import json
import logging

import boto3
from core.requester import Requester
from core.slack_client import SlackClient
from core.queues.sqs_message_queue import SqsMessageQueue
from core.requester import Requester
from core.s3_manager import S3Manager
from core.queues.message_queue_processor import MessageQueueProcessor
from core.web3.eth_client import RestEthClient
from databases import Database

from mdtp.store.retriever import MdtpRetriever
from mdtp.store.saver import MdtpSaver
from mdtp.manager import MdtpManager
from mdtp.mdtp_message_processor import MdtpMessageProcessor
from mdtp.image_manager import ImageManager

async def main():
    database = Database(f'postgresql://{os.environ["DB_USERNAME"]}:{os.environ["DB_PASSWORD"]}@{os.environ["DB_HOST"]}:{os.environ["DB_PORT"]}/{os.environ["DB_NAME"]}')
    saver = MdtpSaver(database=database)
    retriever = MdtpRetriever(database=database)

    sqsClient = boto3.client(service_name='sqs', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    workQueue = SqsMessageQueue(sqsClient=sqsClient, queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue')
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)

    requester = Requester()
    rinkebyEthClient = RestEthClient(url=os.environ['ALCHEMY_URL'], requester=requester)
    mumbaiEthClient = RestEthClient(url='https://matic-mumbai.chainstacklabs.com', requester=requester)
    rinkebyContractAddress = os.environ['RINKEBY_CONTRACT_ADDRESS']
    mumbaiContractAddress = os.environ['MUMBAI_CONTRACT_ADDRESS']
    with open('./MillionDollarNFT.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)
    imageManager = ImageManager(requester=requester, s3Manager=s3Manager)
    manager = MdtpManager(requester=requester, retriever=retriever, saver=saver, s3Manager=s3Manager, rinkebyEthClient=rinkebyEthClient, mumbaiEthClient=mumbaiEthClient, workQueue=workQueue, imageManager=imageManager, rinkebyContractAddress=rinkebyContractAddress, mumbaiContractAddress=mumbaiContractAddress, contractJson=contractJson)

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
