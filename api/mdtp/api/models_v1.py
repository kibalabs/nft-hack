import datetime
from typing import Dict
from typing import Optional
from typing import List

from pydantic import BaseModel
from pydantic import Json

from mdtp.model import GridItem

class ApiGridItem(BaseModel):
    gridItemId: int
    tokenId: int
    network: str
    title: str
    description: str
    imageUrl: str
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
            ownerId=model.ownerId,
        )

class ListGridItemsRequest(BaseModel):
    pass

class ListGridItemsResponse(BaseModel):
    gridItems: List[ApiGridItem]

class RetrieveGridItemRequest(BaseModel):
    tokenId: int
    network: str

class RetrieveGridItemResponse(BaseModel):
    gridItem: ApiGridItem
