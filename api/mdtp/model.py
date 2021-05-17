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
class ImageSize:
    width: int
    height: int

class ImageFormat:
    JPG = "JPEG"
    PNG = "PNG"
    WEBP = "WEBP"

@dataclasses.dataclass
class Image:
    imageId: str
    content: str
    size: ImageSize
    imageFormat: str

@dataclasses.dataclass
class ImageVariant:
    imageId: str
    variantId: str
    size: ImageSize
