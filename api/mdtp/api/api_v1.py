from typing import Optional

from fastapi import Request
from fastapi import Response

from mdtp.api.models_v1 import *
from mdtp.manager import MdtpManager
from core.api.kiba_router import KibaRouter

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/networks/{network}/grid-items', response_model=ListGridItemsResponse)
    async def list_grid_items(network: str, rawRequest: Request, response: Response) -> ListGridItemsResponse: # request: ListGridItemsRequest
        gridItems = await manager.list_grid_items(network=network)
        return ListGridItemsResponse(gridItems=[ApiGridItem.from_model(model=gridItem) for gridItem in gridItems])

    @router.get('/networks/{network}/stat-items', response_model=ListStatItemsResponse)
    async def list_stat_items(network: str, rawRequest: Request, response: Response) -> ListStatItemsResponse: # request: ListStatItemsRequest
        statItems = await manager.list_stat_items(network=network)
        return ListStatItemsResponse(statItems=[ApiStatItem.from_model(model=statItem) for statItem in statItems])

    # TODO(krishan711): this can nicely be a GET once we have query params
    @router.post('/networks/{network}/retrieve-grid-item', response_model=RetrieveGridItemResponse)
    async def retrieve_grid_item(network: str, rawRequest: Request, response: Response, request: RetrieveGridItemRequest) -> RetrieveGridItemResponse:
        gridItem = await manager.retrieve_grid_item(network=network, tokenId=request.tokenId)
        return RetrieveGridItemResponse(gridItem=ApiGridItem.from_model(model=gridItem))

    @router.post('/networks/{network}/update-tokens-deferred', response_model=UpdateTokensDeferredResponse)
    async def update_tokens_deferred(network: str, rawRequest: Request, response: Response) -> UpdateTokensDeferredResponse: # request: UpdateTokensDeferredRequest
        await manager.update_tokens_deferred(network=network)
        return UpdateTokensDeferredResponse()

    @router.post('/networks/{network}/tokens/{tokenId}/generate-image-upload', response_model=GenerateImageUploadForTokenResponse)
    async def generate_image_upload_for_token(network: str, tokenId: int, rawRequest: Request, response: Response):
        presignedUpload = await manager.generate_image_upload_for_token(network=network, tokenId=tokenId)
        return GenerateImageUploadForTokenResponse(presignedUpload=ApiPresignedUpload.from_presigned_upload(presignedUpload=presignedUpload))

    @router.post('/networks/{network}/tokens/{tokenId}/upload-metadata', response_model=UploadMetadataForTokenResponse)
    async def upload_metadata_for_token(network: str, tokenId: int, rawRequest: Request, response: Response, request: UploadMetadataForTokenRequest):
        url = await manager.upload_metadata_for_token(network=network, tokenId=tokenId, name=request.name, description=request.description, imageUrl=request.imageUrl)
        return UploadMetadataForTokenResponse(url=url)

    @router.post('/networks/{network}/tokens/{tokenId}/update-token-deferred', response_model=UpdateTokensDeferredResponse)
    async def update_token_deferred(network: str, tokenId: str, rawRequest: Request, response: Response) -> UpdateTokensDeferredResponse: # request: UpdateTokensDeferredRequest
        await manager.update_token_deferred(network=network, tokenId=tokenId)
        return UpdateTokensDeferredResponse()

    @router.get('/images/{imageId}/go', response_model=GenerateImageUploadForTokenResponse)
    async def go_to_image(imageId: str, rawRequest: Request, response: Response, w: Optional[int] = None, h: Optional[int] = None):
        imageUrl = await manager.go_to_image(imageId=imageId, width=w, height=h)
        return Response(status_code=301, headers={'location': imageUrl})

    return router
