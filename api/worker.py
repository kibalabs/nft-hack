import asyncio
import os

from core import logging
from core.http.basic_authentication import BasicAuthentication
from core.queues.message_queue_processor import MessageQueueProcessor
from core.queues.sqs_message_queue import SqsMessageQueue
from core.requester import Requester
from core.s3_manager import S3Manager
from core.slack_client import SlackClient
from core.store.database import Database
from core.util.value_holder import RequestIdHolder
from core.web3.eth_client import RestEthClient

from contracts import create_contract_store
from mdtp.image_manager import ImageManager
from mdtp.ipfs_manager import IpfsManager
from mdtp.manager import MdtpManager
from mdtp.mdtp_message_processor import MdtpMessageProcessor
from mdtp.store.retriever import Retriever
from mdtp.store.saver import Saver


async def main():
    requestIdHolder = RequestIdHolder()
    name = os.environ.get('NAME', 'notd-api')
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

    # NOTE(krishan711): The AWS eth instance is much slower with getLogs so fails when calling ContractStore.get_latest_update_block_number
    # awsRequester = AwsRequester(accessKeyId=os.environ['AWS_KEY'], accessKeySecret=os.environ['AWS_SECRET'])
    # ethClient = RestEthClient(url='https://nd-foldvvlb25awde7kbqfvpgvrrm.ethereum.managedblockchain.eu-west-1.amazonaws.com', requester=awsRequester)
    requester = Requester()
    ethClient = RestEthClient(url=os.environ['ALCHEMY_MAINNET_URL'], requester=requester)
    rinkebyEthClient = RestEthClient(url=os.environ['ALCHEMY_URL'], requester=requester)
    mumbaiEthClient = RestEthClient(url='https://matic-mumbai.chainstacklabs.com', requester=requester)
    contractStore = create_contract_store(ethClient=ethClient, rinkebyEthClient=rinkebyEthClient, mumbaiEthClient=mumbaiEthClient)

    infuraIpfsAuth = BasicAuthentication(username=os.environ['INFURA_IPFS_PROJECT_ID'], password=os.environ['INFURA_IPFS_PROJECT_SECRET'])
    infuraIpfsRequester = Requester(headers={'authorization': f'Basic {infuraIpfsAuth.to_string()}'})
    ipfsManager = IpfsManager(requester=infuraIpfsRequester)

    imageManager = ImageManager(requester=requester, s3Manager=s3Manager, ipfsManager=ipfsManager)
    manager = MdtpManager(requester=requester, retriever=retriever, saver=saver, s3Manager=s3Manager, contractStore=contractStore, workQueue=workQueue, imageManager=imageManager, ipfsManager=ipfsManager)

    processor = MdtpMessageProcessor(manager=manager)
    slackClient = SlackClient(webhookUrl=os.environ['SLACK_WEBHOOK_URL'], requester=requester, defaultSender='worker', defaultChannel='mdtp-notifications')
    messageQueueProcessor = MessageQueueProcessor(queue=workQueue, messageProcessor=processor, slackClient=slackClient)

    await database.connect()
    await s3Manager.connect()
    await workQueue.connect()
    await messageQueueProcessor.run()

    await requester.close_connections()
    await workQueue.disconnect()
    await s3Manager.disconnect()
    await database.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
