from core.exceptions import KibaException
from core.queues.message_queue_processor import MessageProcessor
from core.queues.model import SqsMessage

from mdtp.manager import MdtpManager
from mdtp.messages import BuildBaseImageMessageContent
from mdtp.messages import UpdateTokenMessageContent
from mdtp.messages import UpdateTokensMessageContent
from mdtp.messages import UploadTokenImageMessageContent


class MdtpMessageProcessor(MessageProcessor):

    def __init__(self, manager: MdtpManager):
        self.manager = manager

    async def process_message(self, message: SqsMessage) -> None:
        if message.command == UpdateTokenMessageContent.get_command():  # pylint: disable=protected-access
            messageContent = UpdateTokenMessageContent.parse_obj(message.content)
            await self.manager.update_token(network=messageContent.network, tokenId=messageContent.tokenId)
            return
        if message.command == UpdateTokensMessageContent.get_command():  # pylint: disable=protected-access
            messageContent = UpdateTokensMessageContent.parse_obj(message.content)
            await self.manager.update_tokens(network=messageContent.network)
            return
        if message.command == UploadTokenImageMessageContent.get_command():  # pylint: disable=protected-access
            messageContent = UploadTokenImageMessageContent.parse_obj(message.content)
            await self.manager.upload_token_image(network=messageContent.network, tokenId=messageContent.tokenId)
            return
        if message.command == BuildBaseImageMessageContent.get_command():  # pylint: disable=protected-access
            messageContent = BuildBaseImageMessageContent.parse_obj(message.content)
            await self.manager.build_base_image(network=messageContent.network)
            return
        raise KibaException(message='Message was unhandled')
