from typing import Optional

from mdtp.model import *
from core.store.saver import Saver
from mdtp.store.schema import GridItemsTable

_EMPTY_STRING = '_EMPTY_STRING'

class MdtpSaver(Saver):

    async def create_grid_item(self, tokenId: int, network: str, title: str, description: Optional[str], imageUrl: str, resizableImageUrl: Optional[str], ownerId: str) -> GridItem:
        gridItemId = await self._execute(query=GridItemsTable.insert(), values={
            GridItemsTable.c.tokenId.key: tokenId,
            GridItemsTable.c.network.key: network,
            GridItemsTable.c.title.key: title,
            GridItemsTable.c.description.key: description,
            GridItemsTable.c.imageUrl.key: imageUrl,
            GridItemsTable.c.resizableImageUrl.key: resizableImageUrl,
            GridItemsTable.c.ownerId.key: ownerId,
        })
        return GridItem(gridItemId=gridItemId, tokenId=tokenId, network=network, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, ownerId=ownerId)

    # NOTE(krishan711): resizableImageUrl is optional so _EMPTY_STRING allows it to be passed in as None. Maybe there is a nicer way to do this.
    async def update_grid_item(self, gridItemId: int, title: Optional[str] = None, description: Optional[str] = _EMPTY_STRING, imageUrl: Optional[str] = None, resizableImageUrl: Optional[str] = _EMPTY_STRING, ownerId: Optional[str] = None) -> None:
        query = GridItemsTable.update(GridItemsTable.c.gridItemId == gridItemId)
        values = {}
        if title is not None:
            values[GridItemsTable.c.title.key] = title
        if description != _EMPTY_STRING:
            values[GridItemsTable.c.description.key] = description
        if imageUrl is not None:
            values[GridItemsTable.c.imageUrl.key] = imageUrl
        if resizableImageUrl != _EMPTY_STRING:
            values[GridItemsTable.c.resizableImageUrl.key] = resizableImageUrl
        if ownerId is not None:
            values[GridItemsTable.c.ownerId.key] = ownerId
        await self.database.execute(query=query, values=values)
