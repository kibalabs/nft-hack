from typing import Optional
from typing import List

from pydantic import BaseModel

from mdtp.api.resources_v1 import ApiGridItem
from mdtp.api.resources_v1 import ApiBaseImage
from mdtp.api.resources_v1 import ApiPresignedUpload
from mdtp.api.resources_v1 import ApiNetworkSummary


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

class UpdateTokensDeferredRequest(BaseModel):
    delay: Optional[int]

class UpdateTokensDeferredResponse(BaseModel):
    pass

class GoToImageForTokenRequest(BaseModel):
    pass

class GoToImageForTokenResponse(BaseModel):
    pass

class GenerateImageUploadForTokenRequest(BaseModel):
    pass

class GenerateImageUploadForTokenResponse(BaseModel):
    presignedUpload: ApiPresignedUpload

class UploadMetadataForTokenRequest(BaseModel):
    name: str
    description: str
    imageUrl: str

class UploadMetadataForTokenResponse(BaseModel):
    url: str

class UpdateTokenDeferredRequest(BaseModel):
    delay: Optional[int]

class UpdateTokenDeferredResponse(BaseModel):
    pass

class GoToImageRequest(BaseModel):
    pass

class GoToImageResponse(BaseModel):
    pass
