from typing import Optional

from core.store.saver import Saver
from core.util import date_util

from mdtp.model import *
from mdtp.store.schema import BaseImagesTable, GridItemsTable, NetworkUpdatesTable

_EMPTY_STRING = '_EMPTY_STRING'

class MdtpSaver(Saver):

    async def create_grid_item(self, tokenId: int, network: str, title: str, description: Optional[str], imageUrl: str, resizableImageUrl: Optional[str], ownerId: str) -> GridItem:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        gridItemId = await self._execute(query=GridItemsTable.insert(), values={
            GridItemsTable.c.createdDate.key: createdDate,
            GridItemsTable.c.updatedDate.key: updatedDate,
            GridItemsTable.c.network.key: network,
            GridItemsTable.c.tokenId.key: tokenId,
            GridItemsTable.c.title.key: title,
            GridItemsTable.c.description.key: description,
            GridItemsTable.c.imageUrl.key: imageUrl,
            GridItemsTable.c.resizableImageUrl.key: resizableImageUrl,
            GridItemsTable.c.ownerId.key: ownerId,
        })
        return GridItem(gridItemId=gridItemId, createdDate=createdDate, updatedDate=updatedDate, network=network, tokenId=tokenId, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, ownerId=ownerId)

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
        if len(values) > 0:
            values[GridItemsTable.c.updatedDate.key] = date_util.datetime_from_now()
        await self.database.execute(query=query, values=values)

    async def create_base_image(self, network: str, url: str, generatedDate: datetime.datetime) -> GridItem:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        baseImageId = await self._execute(query=BaseImagesTable.insert(), values={
            BaseImagesTable.c.createdDate.key: createdDate,
            BaseImagesTable.c.updatedDate.key: updatedDate,
            BaseImagesTable.c.network.key: network,
            BaseImagesTable.c.url.key: url,
            BaseImagesTable.c.generatedDate.key: generatedDate,
        })
        return BaseImage(baseImageId=baseImageId, createdDate=createdDate, updatedDate=updatedDate, network=network, url=url, generatedDate=generatedDate)

    async def create_network_update(self, network: str, latestBlockNumber: int) -> NetworkUpdate:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        networkUpdateId = await self._execute(query=NetworkUpdatesTable.insert(), values={
            NetworkUpdatesTable.c.createdDate.key: createdDate,
            NetworkUpdatesTable.c.updatedDate.key: updatedDate,
            NetworkUpdatesTable.c.network.key: network,
            NetworkUpdatesTable.c.latestBlockNumber.key: latestBlockNumber,
        })
        return NetworkUpdate(networkUpdateId=networkUpdateId, createdDate=createdDate, updatedDate=updatedDate, network=network, latestBlockNumber=latestBlockNumber)

    async def update_network_update(self, networkUpdateId: int, latestBlockNumber: Optional[int] = None) -> None:
        query = NetworkUpdatesTable.update(NetworkUpdatesTable.c.networkUpdateId == networkUpdateId)
        values = {}
        if latestBlockNumber is not None:
            values[NetworkUpdatesTable.c.latestBlockNumber.key] = latestBlockNumber
        if len(values) > 0:
            values[NetworkUpdatesTable.c.updatedDate.key] = date_util.datetime_from_now()
        await self.database.execute(query=query, values=values)
