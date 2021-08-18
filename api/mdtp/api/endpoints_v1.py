from typing import List, Optional

from pydantic import BaseModel

from mdtp.api.resources_v1 import (ApiBaseImage, ApiGridItem,
                                   ApiNetworkSummary, ApiPresignedUpload,
                                   ApiTokenMetadata)


class BaseImageUrlRequest(BaseModel):
    pass

class BaseImageUrlResponse(BaseModel):
    baseImage: ApiBaseImage

class ListGridItemsRequest(BaseModel):
    pass

class ListGridItemsResponse(BaseModel):
    gridItems: List[ApiGridItem]

class GetNetworkSummaryRequest(BaseModel):
    pass

class GetNetworkSummaryResponse(BaseModel):
    networkSummary: ApiNetworkSummary

class RetrieveGridItemRequest(BaseModel):
    tokenId: int

class RetrieveGridItemResponse(BaseModel):
    gridItem: ApiGridItem

class BuildBaseImageRequest(BaseModel):
    delay: Optional[int]

class BuildBaseImageResponse(BaseModel):
    pass

class UpdateTokensDeferredRequest(BaseModel):
    delay: Optional[int]

class UpdateTokensDeferredResponse(BaseModel):
    pass

class UpdateAllTokensDeferredRequest(BaseModel):
    delay: Optional[int]

class UpdateAllTokensDeferredResponse(BaseModel):
    pass

class GoToImageForTokenRequest(BaseModel):
    pass

class GoToImageForTokenResponse(BaseModel):
    pass

class GenerateImageUploadForTokenRequest(BaseModel):
    pass

class GenerateImageUploadForTokenResponse(BaseModel):
    presignedUpload: ApiPresignedUpload

class CreateMetadataForTokenRequest(BaseModel):
    shouldUseIpfs: bool = True
    name: str
    description: Optional[str]
    imageUrl: str
    url: Optional[str]
    groupId: Optional[str]

class CreateMetadataForTokenResponse(BaseModel):
    tokenMetadataUrl: str

class CreateMetadataForTokenGroupRequest(BaseModel):
    shouldUseIpfs: bool = True
    width: int
    height: int
    name: str
    description: Optional[str]
    imageUrl: str
    url: Optional[str]
    groupId: Optional[str]

class CreateMetadataForTokenGroupResponse(BaseModel):
    tokenMetadataUrls: List[str]

class UpdateTokenDeferredRequest(BaseModel):
    delay: Optional[int]

class UpdateTokenDeferredResponse(BaseModel):
    pass

class GoToImageRequest(BaseModel):
    pass

class GoToImageResponse(BaseModel):
    pass
