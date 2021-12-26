import datetime
from typing import Optional

from pydantic import dataclasses


@dataclasses.dataclass
class GridItem:
    gridItemId: int
    createdDate: datetime.datetime
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


@dataclasses.dataclass
class NetworkSummary:
    marketCapitalization: float
    totalSales: int
    averagePrice: float


@dataclasses.dataclass
class NetworkStatus:
    mintCount: int
    mintLimit: int
    randomAvailableTokenId: Optional[int]


@dataclasses.dataclass
class ImageSize:
    width: int
    height: int


class ImageFormat:
    JPG = "image/jpeg"
    PNG = "image/png"
    WEBP = "image/webp"

@dataclasses.dataclass
class Image:
    imageId: str
    size: ImageSize
    imageFormat: str

@dataclasses.dataclass
class ImageVariant:
    imageId: str
    variantId: str
    imageFormat: str
    size: ImageSize

@dataclasses.dataclass
class ImageData:
    content: bytes
    size: ImageSize
    imageFormat: str

@dataclasses.dataclass
class BaseImage:
    baseImageId: int
    createdDate: datetime.datetime
    updatedDate: datetime.datetime
    network: str
    url: str
    generatedDate: datetime.datetime

@dataclasses.dataclass
class TokenMetadata:
    tokenId: str
    tokenIndex: int
    name: str
    description: Optional[str]
    image: str
    # MDTP extensions
    url: Optional[str]
    groupId: Optional[str]

@dataclasses.dataclass
class NetworkUpdate:
    networkUpdateId: int
    createdDate: datetime.datetime
    updatedDate: datetime.datetime
    network: str
    latestBlockNumber: int

@dataclasses.dataclass
class OffchainContent:
    offchainContentId: int
    createdDate: datetime.datetime
    updatedDate: datetime.datetime
    network: str
    tokenId: int
    contentUrl: str
    blockNumber: int
    ownerId: str
    signature: str
    signedMessage: str

@dataclasses.dataclass
class OffchainPendingContent:
    offchainPendingContentId: int
    createdDate: datetime.datetime
    updatedDate: datetime.datetime
    appliedDate: Optional[datetime.datetime]
    network: str
    tokenId: int
    contentUrl: str
    blockNumber: int
    ownerId: str
    signature: str
    signedMessage: str

@dataclasses.dataclass
class GridItemGroupImage:
    gridItemGroupImageId: int
    createdDate: datetime.datetime
    updatedDate: datetime.datetime
    network: str
    groupId: str
    ownerId: str
    imageUrl: str
