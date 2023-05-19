import os

from core import logging
from core.api.health import create_api as create_health_api
from core.api.middleware.database_connection_middleware import DatabaseConnectionMiddleware
from core.api.middleware.exception_handling_middleware import ExceptionHandlingMiddleware
from core.api.middleware.logging_middleware import LoggingMiddleware
from core.api.middleware.server_headers_middleware import ServerHeadersMiddleware
from core.http.basic_authentication import BasicAuthentication
from core.queues.sqs import SqsMessageQueue
from core.requester import Requester
from core.s3_manager import S3Manager
from core.store.database import Database
from core.util.value_holder import RequestIdHolder
from core.web3.eth_client import RestEthClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from contracts import create_contract_store
from mdtp.api.api_v1 import create_api as create_v1_api
from mdtp.api.metadata import create_api as create_metadata_api
from mdtp.image_manager import ImageManager
from mdtp.ipfs_manager import IpfsManager
from mdtp.manager import MdtpManager
from mdtp.store.retriever import Retriever
from mdtp.store.saver import Saver

requestIdHolder = RequestIdHolder()
name = os.environ.get('NAME', 'mdtp-api')
version = os.environ.get('VERSION', 'local')
environment = os.environ.get('ENV', 'dev')
isRunningDebugMode = environment == 'dev'

if isRunningDebugMode:
    logging.init_basic_logging()
else:
    logging.init_json_logging(name=name, version=version, environment=environment, requestIdHolder=requestIdHolder)


databaseConnectionString = Database.create_psql_connection_string(username=os.environ["DB_USERNAME"], password=os.environ["DB_PASSWORD"], host=os.environ["DB_HOST"], port=os.environ["DB_PORT"], name=os.environ["DB_NAME"])
database = Database(connectionString=databaseConnectionString)
saver = Saver(database=database)
retriever = Retriever(database=database)

workQueue = SqsMessageQueue(region='eu-west-1', accessKeyId=os.environ['AWS_KEY'], accessKeySecret=os.environ['AWS_SECRET'], queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue')
s3Manager = S3Manager(region='eu-west-1', accessKeyId=os.environ['AWS_KEY'], accessKeySecret=os.environ['AWS_SECRET'])

requester = Requester()
ethClient = RestEthClient(url=os.environ['MAINNET_DEPLOYMENT_URL'], requester=requester)
sepoliaEthClient = RestEthClient(url='https://eth-sepolia-public.unifra.io', requester=requester)
mumbaiEthClient = RestEthClient(url='https://matic-mumbai.chainstacklabs.com', requester=requester)
contractStore = create_contract_store(ethClient=ethClient, sepoliaEthClient=sepoliaEthClient, mumbaiEthClient=mumbaiEthClient)

infuraUsername = os.environ['INFURA_IPFS_PROJECT_ID']
infuraPassword = os.environ['INFURA_IPFS_PROJECT_SECRET']
infuraAuth = BasicAuthentication(username=infuraUsername, password=infuraPassword)
infuraRequester = Requester(headers={'Authorization': f'Basic {infuraAuth.to_string()}'})
ipfsManager = IpfsManager(infuraRequester=infuraRequester)

imageManager = ImageManager(requester=requester, s3Manager=s3Manager, ipfsManager=ipfsManager)
manager = MdtpManager(requester=requester, retriever=retriever, saver=saver, s3Manager=s3Manager, contractStore=contractStore, workQueue=workQueue, imageManager=imageManager, ipfsManager=ipfsManager)

app = FastAPI()
app.include_router(router=create_health_api(name=name, version=version, environment=environment))
app.include_router(prefix='/v1', router=create_v1_api(manager=manager))
app.include_router(prefix='', router=create_metadata_api(manager=manager))
app.add_middleware(ExceptionHandlingMiddleware)
app.add_middleware(ServerHeadersMiddleware, name=name, version=version, environment=environment)
app.add_middleware(LoggingMiddleware, requestIdHolder=requestIdHolder)
app.add_middleware(DatabaseConnectionMiddleware, database=database)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_methods=['*'], allow_headers=['*'], expose_headers=['*'], allow_origins=[
    'https://new.milliondollartokenpage.com',
    'https://milliondollartokenpage.com',
    'http://localhost:3000',
])

@app.on_event('startup')
async def startup():
    await database.connect()
    await s3Manager.connect()
    await workQueue.connect()

@app.on_event('shutdown')
async def shutdown():
    await requester.close_connections()
    await infuraRequester.close_connections()
    await s3Manager.disconnect()
    await workQueue.disconnect()
    await database.disconnect()
