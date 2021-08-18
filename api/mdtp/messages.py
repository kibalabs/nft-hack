from core.queues.model import MessageContent


class UpdateTokenMessageContent(MessageContent):
    COMMAND = 'UPDATE_TOKEN'
    network: str
    tokenId: int

class UpdateTokensMessageContent(MessageContent):
    COMMAND = 'UPDATE_TOKENS'
    network: str

class UpdateAllTokensMessageContent(MessageContent):
    COMMAND = 'UPDATE_ALL_TOKENS'
    network: str

class UploadTokenImageMessageContent(MessageContent):
    COMMAND = 'UPLOAD_TOKEN_IMAGE'
    network: str
    tokenId: int

class BuildBaseImageMessageContent(MessageContent):
    COMMAND = 'BUILD_BASE_IMAGE'
    network: str
