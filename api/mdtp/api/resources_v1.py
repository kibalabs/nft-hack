import datetime
from typing import Dict
from typing import Optional

from core.s3_manager import S3PresignedUpload
from pydantic import BaseModel

from mdtp.model import BaseImage
from mdtp.model import GridItem
from mdtp.model import NetworkStatus
from mdtp.model import NetworkSummary
from mdtp.model import TokenMetadata


class ApiTokenMetadata(BaseModel):
    tokenId: str
    tokenIndex: int
    name: str
    description: Optional[str]
    image: str
    url: Optional[str]
    groupId: Optional[str]

    @classmethod
    def from_model(cls, model: TokenMetadata):
        return cls(
            tokenId=model.tokenId,
            tokenIndex=model.tokenIndex,
            name=model.name,
            description=model.description,
            image=model.image,
            url=model.url,
            groupId=model.groupId,
        )

class ApiGridItem(BaseModel):
    gridItemId: int
    updatedDate: datetime.datetime
    network: str
    tokenId: int
    contentUrl: Optional[str]
    title: str
    description: Optional[str]
    imageUrl: str
    resizableImageUrl: Optional[str]
    ownerId: str
    url: Optional[str]
    groupId: Optional[str]
    blockNumber: int
    source: str

    @classmethod
    def from_model(cls, model: GridItem, shouldCompact: bool = False):
        return cls(
            gridItemId=model.gridItemId,
            updatedDate=model.updatedDate,
            network=model.network,
            tokenId=model.tokenId,
            contentUrl=model.contentUrl,
            title=model.title,
            description=model.description if not shouldCompact else None,
            imageUrl=model.imageUrl,
            resizableImageUrl=model.resizableImageUrl,
            ownerId=model.ownerId,
            url=model.url,
            groupId=model.groupId,
            blockNumber=model.blockNumber,
            source=model.source,
        )

class ApiNetworkSummary(BaseModel):
    marketCapitalization: float
    totalSales: int
    averagePrice: float

    @classmethod
    def from_model(cls, model: NetworkSummary):
        return cls(
            marketCapitalization=model.marketCapitalization,
            totalSales=model.totalSales,
            averagePrice=model.averagePrice,
        )


class ApiNetworkStatus(BaseModel):
    mintCount: int
    mintLimit: int
    randomAvailableTokenId: Optional[int]

    @classmethod
    def from_model(cls, model: NetworkStatus):
        return cls(
            mintCount=model.mintCount,
            mintLimit=model.mintLimit,
            randomAvailableTokenId=model.randomAvailableTokenId,
        )


class ApiPresignedUpload(BaseModel):
    url: str
    params: Dict[str, str]

    @classmethod
    def from_model(cls, model: S3PresignedUpload):
        return cls(
            url=model.url,
            params={field.name: field.value for field in model.fields},
        )

class ApiBaseImage(BaseModel):
    baseImageId: int
    network: str
    url: str
    generatedDate: datetime.datetime

    @classmethod
    def from_model(cls, model: BaseImage):
        return cls(
            baseImageId=model.baseImageId,
            network=model.network,
            url=model.url,
            generatedDate=model.generatedDate,
        )
