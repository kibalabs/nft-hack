import datetime
from typing import Optional

from core.api.kiba_router import KibaRouter
from fastapi import Response

from mdtp.api.endpoints_v1 import BaseImageUrlResponse
from mdtp.api.endpoints_v1 import BuildBaseImageRequest
from mdtp.api.endpoints_v1 import BuildBaseImageResponse
from mdtp.api.endpoints_v1 import CreateMetadataForTokenGroupRequest
from mdtp.api.endpoints_v1 import CreateMetadataForTokenGroupResponse
from mdtp.api.endpoints_v1 import CreateMetadataForTokenRequest
from mdtp.api.endpoints_v1 import CreateMetadataForTokenResponse
from mdtp.api.endpoints_v1 import GenerateImageUploadForTokenResponse
from mdtp.api.endpoints_v1 import GetNetworkStatusResponse
from mdtp.api.endpoints_v1 import GetNetworkSummaryResponse
from mdtp.api.endpoints_v1 import ListGridItemsResponse
from mdtp.api.endpoints_v1 import RetrieveGridItemRequest
from mdtp.api.endpoints_v1 import RetrieveGridItemResponse
from mdtp.api.endpoints_v1 import UpdateAllTokensDeferredRequest
from mdtp.api.endpoints_v1 import UpdateAllTokensDeferredResponse
from mdtp.api.endpoints_v1 import UpdateOffchainContentsForTokenGroupRequest
from mdtp.api.endpoints_v1 import UpdateOffchainContentsForTokenGroupResponse
from mdtp.api.endpoints_v1 import UpdateTokenDeferredRequest
from mdtp.api.endpoints_v1 import UpdateTokenDeferredResponse
from mdtp.api.endpoints_v1 import UpdateTokensDeferredRequest
from mdtp.api.endpoints_v1 import UpdateTokensDeferredResponse
from mdtp.api.resources_v1 import ApiBaseImage
from mdtp.api.resources_v1 import ApiGridItem
from mdtp.api.resources_v1 import ApiNetworkStatus
from mdtp.api.resources_v1 import ApiNetworkSummary
from mdtp.api.resources_v1 import ApiPresignedUpload
from mdtp.cache_control_header import CacheControlHeader
from mdtp.manager import MdtpManager


def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/networks/{network}/latest-base-image', response_model=BaseImageUrlResponse)
    async def get_latest_base_image_url(network: str) -> BaseImageUrlResponse: # request: BaseImageUrlRequest
        baseImage = await manager.get_latest_base_image_url(network=network)
        return BaseImageUrlResponse(baseImage=ApiBaseImage.from_model(model=baseImage))

    @router.get('/networks/{network}/grid-items', response_model=ListGridItemsResponse)
    async def list_grid_items(network: str, shouldCompact: bool = False, ownerId: Optional[str] = None, updatedSinceDate: Optional[datetime.datetime] = None, groupId: Optional[str] = None) -> ListGridItemsResponse: # request: ListGridItemsRequest
        gridItems = await manager.list_grid_items(network=network, ownerId=ownerId, updatedSinceDate=updatedSinceDate, groupId=groupId)
        return ListGridItemsResponse(gridItems=[ApiGridItem.from_model(model=gridItem, shouldCompact=shouldCompact) for gridItem in gridItems])

    @router.get('/networks/{network}/summary', response_model=GetNetworkSummaryResponse)
    async def get_network_summary(network: str) -> GetNetworkSummaryResponse: # request: GetNetworkSummaryRequest
        networkSummary = await manager.get_network_summary(network=network)
        return GetNetworkSummaryResponse(networkSummary=ApiNetworkSummary.from_model(model=networkSummary))

    # TODO(krishan711): this can nicely be a GET once we have query params because we want to retrieve by tokenId, not gridItemId
    @router.post('/networks/{network}/retrieve-grid-item', response_model=RetrieveGridItemResponse)
    async def retrieve_grid_item(network: str, request: RetrieveGridItemRequest) -> RetrieveGridItemResponse:
        gridItem = await manager.retrieve_grid_item(network=network, tokenId=request.tokenId)
        return RetrieveGridItemResponse(gridItem=ApiGridItem.from_model(model=gridItem))

    @router.post('/networks/{network}/build-base-image-deferred', response_model=BuildBaseImageResponse)
    async def build_base_image_deferred(network: str, request: BuildBaseImageRequest) -> BuildBaseImageResponse:
        await manager.build_base_image_deferred(network=network, delay=request.delay)
        return BuildBaseImageResponse()

    @router.post('/networks/{network}/update-tokens-deferred', response_model=UpdateTokensDeferredResponse)
    async def update_tokens_deferred(network: str, request: UpdateTokensDeferredRequest) -> UpdateTokensDeferredResponse:
        await manager.update_tokens_deferred(network=network, delay=request.delay)
        return UpdateTokensDeferredResponse()

    @router.post('/networks/{network}/update-all-tokens-deferred', response_model=UpdateAllTokensDeferredResponse)
    async def update_all_tokens_deferred(network: str, request: UpdateAllTokensDeferredRequest) -> UpdateAllTokensDeferredResponse:
        await manager.update_all_tokens_deferred(network=network, delay=request.delay)
        return UpdateAllTokensDeferredResponse()

    @router.get('/networks/{network}/tokens/{tokenId}/go-to-image')
    async def go_to_token_image(network: str, tokenId: int, w: Optional[int] = None, h: Optional[int] = None) -> Response:  # pylint: disable=invalid-name
        imageUrl = await manager.go_to_token_image(network=network, tokenId=tokenId, width=w, height=h)
        return Response(status_code=302, headers={'location': imageUrl})

    @router.get('/networks/{network}/tokens/{tokenId}/go-to-group-image')
    async def go_to_token_group_image(network: str, tokenId: int, w: Optional[int] = None, h: Optional[int] = None) -> Response:  # pylint: disable=invalid-name
        imageUrl = await manager.go_to_token_group_image(network=network, tokenId=tokenId, width=w, height=h)
        return Response(status_code=302, headers={'location': imageUrl})

    @router.post('/networks/{network}/tokens/{tokenId}/generate-image-upload', response_model=GenerateImageUploadForTokenResponse)
    async def generate_image_upload_for_token(network: str, tokenId: int):
        presignedUpload = await manager.generate_image_upload_for_token(network=network, tokenId=tokenId)
        return GenerateImageUploadForTokenResponse(presignedUpload=ApiPresignedUpload.from_model(model=presignedUpload))

    @router.post('/networks/{network}/tokens/{tokenId}/create-metadata', response_model=CreateMetadataForTokenResponse)
    async def create_metadata_for_token(network: str, tokenId: int, request: CreateMetadataForTokenRequest):
        tokenMetadataUrl = await manager.create_metadata_for_token(network=network, tokenId=tokenId, shouldUseIpfs=request.shouldUseIpfs, name=request.name, description=request.description, imageUrl=request.imageUrl, url=request.url)
        return CreateMetadataForTokenResponse(tokenMetadataUrl=tokenMetadataUrl)

    @router.post('/networks/{network}/tokens/{tokenId}/create-group-metadata', response_model=CreateMetadataForTokenGroupResponse)
    async def create_metadata_for_token_group(network: str, tokenId: int, request: CreateMetadataForTokenGroupRequest):
        tokenMetadataUrls = await manager.create_metadata_for_token_group(network=network, tokenId=tokenId, shouldUseIpfs=request.shouldUseIpfs, width=request.width, height=request.height, name=request.name, description=request.description, imageUrl=request.imageUrl, url=request.url)
        return CreateMetadataForTokenGroupResponse(tokenMetadataUrls=tokenMetadataUrls)

    @router.post('/networks/{network}/tokens/{tokenId}/update-offchain-contents', response_model=UpdateOffchainContentsForTokenGroupResponse)
    async def update_offchain_contents_for_token_group(network: str, tokenId: int, request: UpdateOffchainContentsForTokenGroupRequest) -> UpdateOffchainContentsForTokenGroupResponse:
        await manager.update_offchain_contents_for_token_group(network=network, tokenId=tokenId, width=request.width, height=request.height, contentUrls=request.contentUrls, blockNumber=request.blockNumber, signature=request.signature, shouldAllowPendingChange=request.shouldAllowPendingChange)
        return UpdateOffchainContentsForTokenGroupResponse()

    @router.post('/networks/{network}/tokens/{tokenId}/update-token-deferred', response_model=UpdateTokenDeferredResponse)
    async def update_token_deferred(network: str, tokenId: int, request: UpdateTokenDeferredRequest) -> UpdateTokenDeferredResponse:
        await manager.update_token_deferred(network=network, tokenId=tokenId, delay=request.delay)
        return UpdateTokenDeferredResponse()

    @router.get('/images/{imageId}/go')
    async def go_to_image(imageId: str, w: Optional[int] = None, h: Optional[int] = None) -> Response:  # pylint: disable=invalid-name
        imageUrl = await manager.go_to_image(imageId=imageId, width=w, height=h)
        return Response(status_code=301, headers={'location': imageUrl, CacheControlHeader.KEY: CacheControlHeader(shouldCachePublically=True, maxAge=60 * 60 * 24 * 365).to_value_string()})

    @router.get('/networks/{network}/status')
    async def get_network_status(response: Response, network: str) -> GetNetworkStatusResponse:
        response.headers[CacheControlHeader.KEY] = CacheControlHeader(shouldCachePublically=True, maxAge=60 * 60 * 24 * 365).to_value_string()
        networkStatus = await manager.get_network_status(network=network)
        return GetNetworkStatusResponse(networkStatus=ApiNetworkStatus.from_model(model=networkStatus))

    return router
