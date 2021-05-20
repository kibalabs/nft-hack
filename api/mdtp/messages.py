from mdtp.core.model import MessageContent


class UpdateTokenMessageContent(MessageContent):
    _COMMAND = 'UPDATE_TOKEN'
    network: str
    tokenId: int

class UpdateTokensMessageContent(MessageContent):
    _COMMAND = 'UPDATE_TOKENS'
    network: str

class UploadTokenImageMessageContent(MessageContent):
    _COMMAND = 'UPLOAD_TOKEN_IMAGE'
    network: str
    tokenId: int
