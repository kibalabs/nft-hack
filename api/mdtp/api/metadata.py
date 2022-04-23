from fastapi import APIRouter
from pydantic import BaseModel

from mdtp.api.resources_v1 import ApiTokenMetadata
from mdtp.manager import MdtpManager


class GetTokenMetadataRequest(BaseModel):
    pass

class GetTokenMetadataResponse(ApiTokenMetadata):
    pass

class GetTokenDefaultContentRequest(BaseModel):
    pass

class GetTokenDefaultContentResponse(ApiTokenMetadata):
    pass

def create_api(manager: MdtpManager) -> APIRouter():
    router = APIRouter()

    @router.get('/token-metadatas/{tokenId}', response_model=GetTokenMetadataResponse)
    async def get_token_metadata(tokenId: str) -> GetTokenMetadataResponse: # request: GetTokenMetadataRequest
        tokenMetadata = await manager.get_token_metadata(network='rinkeby5', tokenId=tokenId)
        return GetTokenMetadataResponse.from_model(model=tokenMetadata)

    @router.get('/token-default-contents/{tokenId}', response_model=GetTokenDefaultContentResponse)
    async def get_token_default_content(tokenId: str) -> GetTokenDefaultContentResponse: # request: GetTokenDefaultContentRequest
        tokenMetadata = await manager.get_token_content(network='rinkeby5', tokenId=tokenId)
        return GetTokenDefaultContentResponse.from_model(model=tokenMetadata)

    return router
