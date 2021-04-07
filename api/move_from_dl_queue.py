import os
import logging

import boto3
import asyncclick as click

from mdtp.core.sqs_message_queue import SqsMessageQueue

@click.command()
async def run():
    sqsClient = boto3.client(service_name='sqs', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    workQueue = SqsMessageQueue(sqsClient=sqsClient, queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue')
    workQueueDl = SqsMessageQueue(sqsClient=sqsClient, queueUrl='https://sqs.eu-west-1.amazonaws.com/097520841056/mdtp-work-queue-dl')

    while True:
        logging.info('Retrieving messages...')
        messages = await workQueueDl.get_messages(limit=10, expectedProcessingSeconds=2, longPollSeconds=0)
        if len(messages) == 0:
            return
        for message in messages:
            print('message', message)
            await workQueue.send_message(message=message)
            await workQueueDl.delete_message(message=message)

if __name__ == '__main__':
    run(_anyio_backend='asyncio')
