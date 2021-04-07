import os
import asyncio
import logging
import json

import asyncclick as click
import boto3
from databases import Database
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mdtp.api.api_v1 import create_api as create_v1_api
from mdtp.api.health import create_api as create_health_api
from mdtp.core.requester import Requester
from mdtp.core.sqs_message_queue import SqsMessageQueue
from mdtp.store.retriever import MdtpRetriever
from mdtp.store.saver import MdtpSaver
from mdtp.manager import MdtpManager
from mdtp.eth_client import RestEthClient

logging.basicConfig(level=logging.INFO)

database = Database(f'postgresql://{os.environ["DB_USERNAME"]}:{os.environ["DB_PASSWORD"]}@{os.environ["DB_HOST"]}:{os.environ["DB_PORT"]}/{os.environ["DB_NAME"]}')
saver = MdtpSaver(database=database)
retriever = MdtpRetriever(database=database)

sqsClient = boto3.client(service_name='sqs', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
workQueue = SqsMessageQueue(sqsClient=sqsClient, queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue')

requester = Requester()
ethClient = RestEthClient(url='https://eth-rinkeby.alchemyapi.io/v2/Sg7ktQ7cAlWZ4Qk0193Gg5ccBJNpEMXA', requester=requester)
with open('./MillionDollarNFT.json') as contractJsonFile:
    contractJson = json.load(contractJsonFile)
manager = MdtpManager(requester=requester, retriever=retriever, saver=saver, ethClient=ethClient, workQueue=workQueue, contractAddress='0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3', contractJson=contractJson)

app = FastAPI()
app.include_router(router=create_health_api())
app.include_router(prefix='/v1', router=create_v1_api(manager=manager))
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_methods=['*'], allow_headers=['*'], expose_headers=[
    'X-Response-Time',
    'X-Server',
    'X-Server-Version',
    'X-Kiba-Token',
], allow_origins=[
    'https://milliondollartokenpage.com',
    'http://localhost:3000',
])

@app.on_event('startup')
async def startup():
    await database.connect()

@app.on_event('shutdown')
async def shutdown():
    await database.disconnect()
    await requester.close_connections()
