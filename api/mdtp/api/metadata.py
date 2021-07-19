from typing import Optional
from core.api.kiba_router import KibaRouter
from pydantic import BaseModel

from mdtp.manager import MdtpManager
from mdtp.model import TokenMetadata


class GetTokenMetadataRequest(BaseModel):
    pass

class GetTokenMetadataResponse(BaseModel):
    tokenId: str
    tokenIndex: int
    name: str
    description: Optional[str]
    image: str

    @classmethod
    def from_token_metadata(cls, model: TokenMetadata):
        return cls(
            tokenId=model.tokenId,
            tokenIndex=model.tokenIndex,
            name=model.name,
            description=model.description,
            image=model.image,
        )

class GetTokenDefaultContentRequest(BaseModel):
    pass

class GetTokenDefaultContentResponse(BaseModel):
    tokenId: str
    tokenIndex: int
    name: str
    description: Optional[str]
    image: str
    url: Optional[str]
    blockId: Optional[str]

    @classmethod
    def from_token_metadata(cls, model: TokenMetadata):
        return cls(
            tokenId=model.tokenId,
            tokenIndex=model.tokenIndex,
            name=model.name,
            description=model.description,
            image=model.image,
            url=model.url,
            blockId=model.blockId,
        )

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/token-metadatas/{tokenId}', response_model=GetTokenMetadataResponse)
    async def get_token_metadata(tokenId: str) -> GetTokenMetadataResponse: # request: GetTokenMetadataRequest
        tokenMetadata = await manager.get_token_metadata(tokenId=tokenId)
        return GetTokenMetadataResponse.from_token_metadata(model=tokenMetadata)

    @router.get('/token-default-contents/{tokenId}', response_model=GetTokenDefaultContentResponse)
    async def get_token_default_content(tokenId: str) -> GetTokenDefaultContentResponse: # request: GetTokenDefaultContentRequest
        tokenMetadata = await manager.get_token_default_content(tokenId=tokenId)
        return GetTokenDefaultContentResponse.from_token_metadata(model=tokenMetadata)

    return router
