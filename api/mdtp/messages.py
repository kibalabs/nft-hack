from typing import List

from mdtp.core.model import MessageContent


class UpdateTokensMessageContent(MessageContent):
    _COMMAND = 'UPDATE_TOKENS'

class UploadTokenImageMessageContent(MessageContent):
    _COMMAND = 'UPLOAD_TOKEN_IMAGE'
    tokenId: int
