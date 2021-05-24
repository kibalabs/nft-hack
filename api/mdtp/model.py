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
    title: str
    description: Optional[str]
    imageUrl: str
    resizableImageUrl: Optional[str]
    ownerId: str

@dataclasses.dataclass
class NetworkSummary:
    marketCapitalization: float
    totalSales: int
    averagePrice: float

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
