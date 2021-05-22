import datetime
from typing import Dict
from typing import Optional
from typing import List

from pydantic import BaseModel
from pydantic import Json

from mdtp.model import GridItem
from mdtp.model import StatItem
from core.s3_manager import S3PresignedUpload

class ApiGridItem(BaseModel):
    gridItemId: int
    tokenId: int
    network: str
    title: str
    description: Optional[str]
    imageUrl: str
    resizableImageUrl: Optional[str]
    ownerId: str

    @classmethod
    def from_model(cls, model: GridItem):
        return cls(
            gridItemId=model.gridItemId,
            tokenId=model.tokenId,
            network=model.network,
            title=model.title,
            description=model.description,
            imageUrl=model.imageUrl,
            resizableImageUrl=model.resizableImageUrl,
            ownerId=model.ownerId,
        )

class ApiStatItem(BaseModel):
    statItemId: int
    title: str
    data: str

    @classmethod
    def from_model(cls, model: StatItem):
        return cls(
            statItemId=model.statItemId,
            title=model.title,
            data=model.data,
        )

class ApiPresignedUpload(BaseModel):
    url: str
    params: Dict[str, str]

    @classmethod
    def from_presigned_upload(cls, presignedUpload: S3PresignedUpload):
        return cls(
            url=presignedUpload.url,
            params={field.name: field.value for field in presignedUpload.fields},
        )

class ListGridItemsRequest(BaseModel):
    pass

class ListGridItemsResponse(BaseModel):
    gridItems: List[ApiGridItem]

class ListStatItemsRequest(BaseModel):
    pass

class ListStatItemsResponse(BaseModel):
    statItems: List[ApiStatItem]

class RetrieveGridItemRequest(BaseModel):
    tokenId: int

class RetrieveGridItemResponse(BaseModel):
    gridItem: ApiGridItem

class UpdateTokensDeferredRequest(BaseModel):
    pass

class UpdateTokensDeferredResponse(BaseModel):
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
    pass

class UpdateTokenDeferredResponse(BaseModel):
    pass

class GetImageRequest(BaseModel):
    pass

class GetImageResponse(BaseModel):
    pass
