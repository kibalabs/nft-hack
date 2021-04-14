import logging
from typing import Optional
from typing import Dict

import asyncpg
from databases import Database
from sqlalchemy.sql import ClauseElement

from mdtp.core.exceptions import *

class Saver:

    def __init__(self, database: Database):
        self.database = database

    async def _execute(self, query: ClauseElement, values: Optional[Dict]):
        try:
            return await self.database.execute(query=query, values=values)
        except asyncpg.exceptions.UniqueViolationError as exception:
            raise DuplicateValueException(message=str(exception))
        except Exception as exception:
            logging.error(exception)
            raise InternalServerErrorException(message='Error running save operation')
