import os
import logging
import json

import boto3
from databases import Database
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.api.health import create_api as create_health_api
from core.requester import Requester
from core.queues.sqs_message_queue import SqsMessageQueue
from core.web3.eth_client import RestEthClient
from core.s3_manager import S3Manager
from contracts import create_contract_store

from mdtp.api.api_v1 import create_api as create_v1_api
from mdtp.api.metadata import create_api as create_metadata_api
from mdtp.store.retriever import MdtpRetriever
from mdtp.store.saver import MdtpSaver
from mdtp.manager import MdtpManager
from mdtp.image_manager import ImageManager

logging.basicConfig(level=logging.INFO)

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

contractStore = create_contract_store(rinkebyEthClient=rinkebyEthClient, mumbaiEthClient=mumbaiEthClient)
imageManager = ImageManager(requester=requester, s3Manager=s3Manager)
manager = MdtpManager(requester=requester, retriever=retriever, saver=saver, s3Manager=s3Manager, contractStore=contractStore, workQueue=workQueue, imageManager=imageManager)

app = FastAPI()
app.include_router(router=create_health_api(name=os.environ.get('NAME', 'mdtp-api'), version=os.environ.get('VERSION')))
app.include_router(prefix='/v1', router=create_v1_api(manager=manager))
app.include_router(prefix='', router=create_metadata_api(manager=manager))
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_methods=['*'], allow_headers=['*'], expose_headers=[
    'X-Response-Time',
    'X-Server',
    'X-Server-Version',
    'X-Kiba-Token',
], allow_origins=[
    'https://new.milliondollartokenpage.com',
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
