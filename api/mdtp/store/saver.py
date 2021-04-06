from typing import Optional

from mdtp.model import *
from mdtp.core.store.saver import Saver
from mdtp.store.schema import GridItemsTable

class MdtpSaver(Saver):

    async def create_grid_item(self, tokenId: int, network: str, title: str, description: str, imageUrl: str, ownerId: str) -> GridItem:
        gridItemId = await self._execute(query=GridItemsTable.insert(), values={
            GridItemsTable.c.tokenId.key: tokenId,
            GridItemsTable.c.network.key: network,
            GridItemsTable.c.title.key: title,
            GridItemsTable.c.description.key: description,
            GridItemsTable.c.imageUrl.key: imageUrl,
            GridItemsTable.c.ownerId.key: ownerId,
        })
        return GridItem(gridItemId=gridItemId, tokenId=tokenId, network=network, title=title, description=description, imageUrl=imageUrl, ownerId=ownerId)

    async def update_grid_item(self, gridItemId: str, title: Optional[str] = None, description: Optional[str] = None, imageUrl: Optional[str] = None, ownerId: Optional[str] = None) -> None:
        query = GridItemsTable.update(GridItemsTable.c.id == gridItemId)
        values = {}
        if title is not None:
            values[GridItemsTable.c.title.key] = title
        if description is not None:
            values[GridItemsTable.c.description.key] = description
        if imageUrl is not None:
            values[GridItemsTable.c.imageUrl.key] = imageUrl
        if ownerId is not None:
            values[GridItemsTable.c.ownerId.key] = ownerId
        await self.database.execute(query=query, values=values)
