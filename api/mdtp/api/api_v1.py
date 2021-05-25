import datetime
from typing import Optional

from core.api.kiba_router import KibaRouter
from fastapi import Request
from fastapi import Response

from mdtp.api.endpoints_v1 import *
from mdtp.api.resources_v1 import *
from mdtp.manager import MdtpManager

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/networks/{network}/latest-base-image', response_model=BaseImageUrlResponse)
    async def get_latest_base_image_url(network: str) -> BaseImageUrlResponse: # request: BaseImageUrlRequest
        baseImage = await manager.get_latest_base_image_url(network=network)
        return BaseImageUrlResponse(baseImage=ApiBaseImage.from_model(model=baseImage))

    @router.get('/networks/{network}/grid-items', response_model=ListGridItemsResponse)
    async def list_grid_items(network: str, shouldCompact: bool = False, updatedSinceDate: Optional[datetime.datetime] = None) -> ListGridItemsResponse: # request: ListGridItemsRequest
        gridItems = await manager.list_grid_items(network=network, updatedSinceDate=updatedSinceDate)
        return ListGridItemsResponse(gridItems=[ApiGridItem.from_model(model=gridItem, shouldCompact=shouldCompact) for gridItem in gridItems])

    @router.get('/networks/{network}/summary', response_model=GetNetworkSummaryResponse)
    async def get_network_summary(network: str) -> GetNetworkSummaryResponse: # request: GetNetworkSummaryRequest
        networkSummary = await manager.get_network_summary(network=network)
        return GetNetworkSummaryResponse(networkSummary=ApiNetworkSummary.from_model(model=networkSummary))

    # TODO(krishan711): this can nicely be a GET once we have query params
    @router.post('/networks/{network}/retrieve-grid-item', response_model=RetrieveGridItemResponse)
    async def retrieve_grid_item(network: str, request: RetrieveGridItemRequest) -> RetrieveGridItemResponse:
        gridItem = await manager.retrieve_grid_item(network=network, tokenId=request.tokenId)
        return RetrieveGridItemResponse(gridItem=ApiGridItem.from_model(model=gridItem))

    @router.post('/networks/{network}/update-tokens-deferred', response_model=UpdateTokensDeferredResponse)
    async def update_tokens_deferred(network: str, request: UpdateTokensDeferredRequest) -> UpdateTokensDeferredResponse:
        await manager.update_tokens_deferred(network=network, delay=request.delay)
        return UpdateTokensDeferredResponse()

    @router.get('/networks/{network}/tokens/{tokenId}/go-to-image')
    async def go_to_token_image(network: str, tokenId: int, w: Optional[int] = None, h: Optional[int] = None) -> Response:
        imageUrl = await manager.go_to_token_image(network=network, tokenId=tokenId, width=w, height=h)
        return Response(status_code=302, headers={'location': imageUrl})

    @router.post('/networks/{network}/tokens/{tokenId}/generate-image-upload', response_model=GenerateImageUploadForTokenResponse)
    async def generate_image_upload_for_token(network: str, tokenId: int):
        presignedUpload = await manager.generate_image_upload_for_token(network=network, tokenId=tokenId)
        return GenerateImageUploadForTokenResponse(presignedUpload=ApiPresignedUpload.from_model(presignedUpload=presignedUpload))

    @router.post('/networks/{network}/tokens/{tokenId}/upload-metadata', response_model=UploadMetadataForTokenResponse)
    async def upload_metadata_for_token(network: str, tokenId: int, request: UploadMetadataForTokenRequest):
        url = await manager.upload_metadata_for_token(network=network, tokenId=tokenId, name=request.name, description=request.description, imageUrl=request.imageUrl)
        return UploadMetadataForTokenResponse(url=url)

    @router.post('/networks/{network}/tokens/{tokenId}/update-token-deferred', response_model=UpdateTokenDeferredResponse)
    async def update_token_deferred(network: str, tokenId: str, request: UpdateTokenDeferredRequest) -> UpdateTokenDeferredResponse:
        await manager.update_token_deferred(network=network, tokenId=tokenId, delay=request.delay)
        return UpdateTokenDeferredResponse()

    @router.get('/images/{imageId}/go')
    async def go_to_image(imageId: str, w: Optional[int] = None, h: Optional[int] = None) -> Response:
        imageUrl = await manager.go_to_image(imageId=imageId, width=w, height=h)
        return Response(status_code=301, headers={'location': imageUrl, 'Cache-Control': 'public, max-age=31536000, immutable'})

    return router
