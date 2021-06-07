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
    description: str
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

class GetTokenDefaultGridDataRequest(BaseModel):
    pass

class GetTokenDefaultGridDataResponse(BaseModel):
    tokenId: str
    tokenIndex: int
    name: str
    description: str
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

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/token-metadatas/{tokenId}', response_model=GetTokenMetadataResponse)
    async def get_token_metadata(tokenId: str) -> GetTokenMetadataResponse: # request: GetTokenMetadataRequest
        tokenMetadata = await manager.get_token_metadata(tokenId=tokenId)
        return GetTokenMetadataResponse.from_token_metadata(model=tokenMetadata)

    @router.get('/token-default-grid-datas/{tokenId}', response_model=GetTokenDefaultGridDataResponse)
    async def get_token_default_grid_data(tokenId: str) -> GetTokenDefaultGridDataResponse: # request: GetTokenDefaultGridDataRequest
        tokenMetadata = await manager.get_token_default_grid_data(tokenId=tokenId)
        return GetTokenDefaultGridDataResponse.from_token_metadata(model=tokenMetadata)

    return router
