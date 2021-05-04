from fastapi import Request
from fastapi import Response

from mdtp.api.models_v1 import *
from mdtp.manager import MdtpManager
from mdtp.core.kiba_router import KibaRouter

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/networks/{network}/grid-items', response_model=ListGridItemsResponse)
    async def list_grid_items(network: str, rawRequest: Request, response: Response) -> ListGridItemsResponse: # request: ListGridItemsRequest
        gridItems = await manager.list_grid_items(network=network)
        return ListGridItemsResponse(gridItems=[ApiGridItem.from_model(model=gridItem) for gridItem in gridItems])

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

    return router
