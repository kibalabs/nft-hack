from fastapi import Request
from fastapi import Response

from mdtp.api.models_v1 import *
from mdtp.manager import MdtpManager
from mdtp.core.kiba_router import KibaRouter

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/grid-items', response_model=ListGridItemsResponse)
    async def list_grid_items(rawRequest: Request, response: Response) -> ListGridItemsResponse: # request: ListGridItemsRequest
        gridItems = await manager.list_grid_items()
        return ListGridItemsResponse(gridItems=[ApiGridItem.from_model(model=gridItem) for gridItem in gridItems])

    @router.get('/stat-items', response_model=ListStatItemsResponse)
    async def list_stat_items(rawRequest: Request, response: Response) -> ListStatItemsResponse: # request: ListStatItemsRequest
        statItems = await manager.list_stat_items()
        return ListStatItemsResponse(statItems=[ApiStatItem.from_model(model=statItem) for statItem in statItems])

    # TODO(krishan711): this can nicely be a GET once we have query params
    @router.post('/retrieve-grid-item', response_model=RetrieveGridItemResponse)
    async def retrieve_grid_item(rawRequest: Request, response: Response, request: RetrieveGridItemRequest) -> RetrieveGridItemResponse:
        gridItem = await manager.retrieve_grid_item(tokenId=request.tokenId)
        return RetrieveGridItemResponse(gridItem=ApiGridItem.from_model(model=gridItem))

    @router.post('/update-tokens-deferred', response_model=UpdateTokensDeferredResponse)
    async def update_tokens_deferred(rawRequest: Request, response: Response) -> UpdateTokensDeferredResponse: # request: UpdateTokensDeferredRequest
        await manager.update_tokens_deferred()
        return UpdateTokensDeferredResponse()

    @router.post('/tokens/{tokenId}/generate-image-upload', response_model=GenerateImageUploadForTokenResponse)
    async def generate_image_upload_for_token(tokenId: int, rawRequest: Request, response: Response):
        presignedUpload = await manager.generate_image_upload_for_token(tokenId=tokenId)
        return GenerateImageUploadForTokenResponse(presignedUpload=ApiPresignedUpload.from_presigned_upload(presignedUpload=presignedUpload))

    return router
