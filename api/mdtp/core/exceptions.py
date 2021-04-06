from __future__ import annotations

from typing import Dict
from typing import Optional

class KibaException(Exception):

    def __init__(self, message: Optional[str], statusCode: Optional[int] = None, exceptionType: Optional[str] = None) -> None:
        super().__init__(message)
        self.message = message
        self.statusCode = statusCode or 500
        self.exceptionType = exceptionType if exceptionType else self.__class__.__name__

    @staticmethod
    def from_exception(exception: Exception, statusCode: int = 500) -> KibaException:
        if isinstance(exception, KibaException):
            return exception
        return KibaException(message=str(exception), statusCode=statusCode, exceptionType=exception.__class__.__name__)

    def to_dict(self) -> Dict:
        return {
            'exceptionType': self.exceptionType,
            'message': self.message,
            'fields': {},
            'statusCode': self.statusCode,
        }

    def __repr__(self) -> str:
        return f'{self.__class__.__name__}(statusCode={self.statusCode!r}, exceptionType={self.exceptionType!r}, message={self.message!r})'

    def __str__(self) -> str:
        return self.__repr__()

    def __eq__(self, other: object) -> bool:
        return isinstance(other, KibaException) and self.statusCode == other.statusCode and self.exceptionType == other.exceptionType

    def __hash__(self) -> int:
        return hash((self.statusCode, self.exceptionType))


class ClientException(KibaException):
    pass


class BadRequestException(ClientException):

    def __init__(self, message: Optional[str] = None) -> None:
        message = message if message else 'Bad Request'
        super().__init__(message=message, statusCode=400)


class UnauthorizedException(ClientException):

    def __init__(self, message: Optional[str] = None) -> None:
        message = message if message else 'Unauthorized'
        super().__init__(message=message, statusCode=401)


class ForbiddenException(ClientException):

    def __init__(self, message: Optional[str] = None) -> None:
        message = message if message else 'Forbidden'
        super().__init__(message=message, statusCode=403)


class NotFoundException(ClientException):

    def __init__(self, message: Optional[str] = None) -> None:
        message = message if message else 'Not Found'
        super().__init__(message=message, statusCode=404)


class ServerException(KibaException):
    pass


class InternalServerErrorException(ServerException):

    def __init__(self, message: Optional[str] = None) -> None:
        message = message if message else 'Internal Server Error'
        super().__init__(message=message, statusCode=500)

class DuplicateValueException(BadRequestException):
    pass
