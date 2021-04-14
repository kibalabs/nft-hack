from mdtp.core.message_queue_processor import MessageProcessor
from mdtp.core.model import SqsMessage
from mdtp.core.exceptions import KibaException
from mdtp.messages import UpdateTokensMessageContent
from mdtp.messages import UploadTokenImageMessageContent
from mdtp.manager import MdtpManager

class MdtpMessageProcessor(MessageProcessor):

    def __init__(self, manager: MdtpManager):
        self.manager = manager

    async def process_message(self, message: SqsMessage) -> None:
        if message.command == UpdateTokensMessageContent._COMMAND:
            messageContent = UpdateTokensMessageContent.parse_obj(message.content)
            await self.manager.update_tokens()
            return
        if message.command == UploadTokenImageMessageContent._COMMAND:
            messageContent = UploadTokenImageMessageContent.parse_obj(message.content)
            await self.manager.upload_token_image(tokenId=messageContent.tokenId)
            return
        raise KibaException(message='Message was unhandled')
