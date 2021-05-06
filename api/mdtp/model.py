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
