from __future__ import annotations
import abc

from pydantic import BaseModel
from pydantic import Json

class Message(BaseModel):
    command: str
    content: dict

class SqsMessage(Message):
    receiptHandle: str

    @classmethod
    def from_sqs_message(cls, sqsMessage: Dict) -> SqsMessage:
        message = Message.parse_raw(sqsMessage['Body'])
        return cls(
            command=message.command,
            content=message.content,
            receiptHandle=sqsMessage['ReceiptHandle'],
        )

class MessageContent(BaseModel):

    def to_message(self) -> Message:
        return Message(
            command=self._COMMAND,
            content=self.dict(),
        )
