from core.exceptions import KibaException
from core.queues.message_queue_processor import MessageProcessor
from core.queues.model import SqsMessage

from mdtp.manager import MdtpManager
from mdtp.messages import (BuildBaseImageMessageContent,
                           UpdateTokenMessageContent,
                           UpdateTokensMessageContent,
                           UploadTokenImageMessageContent)


class MdtpMessageProcessor(MessageProcessor):

    def __init__(self, manager: MdtpManager):
        self.manager = manager

    async def process_message(self, message: SqsMessage) -> None:
        if message.command == UpdateTokenMessageContent._COMMAND:
            messageContent = UpdateTokenMessageContent.parse_obj(message.content)
            await self.manager.update_token(network=messageContent.network, tokenId=messageContent.tokenId)
            return
        if message.command == UpdateTokensMessageContent._COMMAND:
            messageContent = UpdateTokensMessageContent.parse_obj(message.content)
            await self.manager.update_tokens(network=messageContent.network)
            return
        if message.command == UploadTokenImageMessageContent._COMMAND:
            messageContent = UploadTokenImageMessageContent.parse_obj(message.content)
            await self.manager.upload_token_image(network=messageContent.network, tokenId=messageContent.tokenId)
            return
        if message.command == BuildBaseImageMessageContent._COMMAND:
            messageContent = BuildBaseImageMessageContent.parse_obj(message.content)
            await self.manager.build_base_image(network=messageContent.network)
            return
        raise KibaException(message='Message was unhandled')
