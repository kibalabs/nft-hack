import datetime
from typing import Optional

from pydantic import dataclasses

@dataclasses.dataclass
class GridItem:
    gridItemId: int
    tokenId: int
    network: str
    title: str
    description: Optional[str]
    imageUrl: str
    resizableImageUrl: Optional[str]
    ownerId: str

@dataclasses.dataclass
class StatItem:
    statItemId: int
    title: str
    data: str

@dataclasses.dataclass
class ImageSize:
    width: int
    height: int

class ImageFormat:
    JPG = "image/jpg"
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
