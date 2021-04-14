import os
import json
from typing import Optional
from typing import Type

from pydantic import BaseModel

from everypage.core.requester import Requester

class ServiceClient:

    def __init__(self, requester: Requester, baseUrl: str):
        self.requester = requester
        self.baseUrl = baseUrl

    async def make_request(self, method: str, path: str, responseClass: Optional[Type[BaseModel]] = None, request: Optional[BaseModel] = None) -> BaseModel:
        url = os.path.join(self.baseUrl, path)
        response = await self.requester.make_request(method=method, url=url, dataDict=request.dict() if request else None)
        return responseClass.parse_obj(json.loads(response.content)) if responseClass else None
