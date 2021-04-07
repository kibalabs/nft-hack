import abc
from abc import ABC
import logging
import time

from mdtp.core.model import SqsMessage
from mdtp.core.sqs_message_queue import SqsMessageQueue
from mdtp.core.slack_client import SlackClient
from mdtp.core.exceptions import KibaException

class MessageProcessor(ABC):

    @abc.abstractmethod
    async def process_message(self, message: SqsMessage) -> None:
        pass

class MessageQueueProcessor:

    def __init__(self, queue: SqsMessageQueue, messageProcessor: MessageProcessor, slackClient: SlackClient):
        self.queue = queue
        self.messageProcessor = messageProcessor
        self.slackClient = slackClient

    async def run(self):
        while True:
            logging.info('Retrieving messages...')
            message = await self.queue.get_message(expectedProcessingSeconds=300, longPollSeconds=20)
            if not message:
                logging.info('No message received.. sleeping')
                time.sleep(30)
            else:
                logging.info(f'MESSAGE - {message.command} {message.content}')
                startTime = time.time()
                statusCode = 200
                try:
                    await self.messageProcessor.process_message(message=message)
                    await self.queue.delete_message(message=message)
                except Exception as exception:
                    statusCode = exception.statusCode if isinstance(exception, KibaException) else 500
                    logging.error('Caught exception whilst processing message')
                    logging.exception(exception)
                    await self.slackClient.post(text=f'Error processing message: {message.command} {message.content}\n```{exception}```')
                    # TODO(krish): should possibly reset the visibility timeout
                duration = time.time() - startTime
                logging.info(f'MESSAGE - {message.command} {message.content} - {statusCode} - {duration}')
