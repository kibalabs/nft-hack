import datetime

from pydantic import dataclasses

@dataclasses.dataclass
class GridItem:
    gridItemId: int
    tokenId: int
    network: str
    title: str
    description: str
    imageUrl: str
    ownerId: str
