import datetime
from typing import TYPE_CHECKING
from typing import Any
from typing import Dict
from typing import Optional

from core.store.database import DatabaseConnection
from core.store.saver import Saver as CoreSaver
from core.util import date_util

from mdtp.model import BaseImage
from mdtp.model import GridItem
from mdtp.model import GridItemGroupImage
from mdtp.model import NetworkUpdate
from mdtp.model import OffchainContent
from mdtp.store.schema import BaseImagesTable
from mdtp.store.schema import GridItemGroupImagesTable
from mdtp.store.schema import GridItemsTable
from mdtp.store.schema import NetworkUpdatesTable
from mdtp.store.schema import OffchainContentsTable
from mdtp.store.schema import OffchainPendingContentsTable

if TYPE_CHECKING:
    from sqlalchemy.sql._typing import _DMLColumnArgument
else:
    _DMLColumnArgument = Any
CreateRecordDict = Dict[_DMLColumnArgument, Any]  # type: ignore[misc]
UpdateRecordDict = Dict[_DMLColumnArgument, Any]  # type: ignore[misc]


_EMPTY_STRING = '_EMPTY_STRING'


class Saver(CoreSaver):

    async def create_grid_item(self, tokenId: int, network: str, contentUrl: Optional[str], title: str, description: Optional[str], imageUrl: str, resizableImageUrl: Optional[str], url: Optional[str], groupId: Optional[str], ownerId: str, blockNumber: int, source: str, connection: Optional[DatabaseConnection] = None) -> GridItem:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        values: CreateRecordDict = {
            GridItemsTable.c.createdDate.key: createdDate,
            GridItemsTable.c.updatedDate.key: updatedDate,
            GridItemsTable.c.network.key: network,
            GridItemsTable.c.tokenId.key: tokenId,
            GridItemsTable.c.contentUrl.key: contentUrl,
            GridItemsTable.c.title.key: title,
            GridItemsTable.c.description.key: description,
            GridItemsTable.c.imageUrl.key: imageUrl,
            GridItemsTable.c.resizableImageUrl.key: resizableImageUrl,
            GridItemsTable.c.ownerId.key: ownerId,
            GridItemsTable.c.url.key: url,
            GridItemsTable.c.groupId.key: groupId,
            GridItemsTable.c.blockNumber.key: blockNumber,
            GridItemsTable.c.source.key: source,
        }
        query = GridItemsTable.insert().values(values).returning(GridItemsTable.c.gridItemId)
        result = await self._execute(query=query, connection=connection)
        gridItemId = int(result.scalar_one())
        return GridItem(gridItemId=gridItemId, createdDate=createdDate, updatedDate=updatedDate, network=network, tokenId=tokenId, contentUrl=contentUrl, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, url=url, groupId=groupId, ownerId=ownerId, blockNumber=blockNumber, source=source)

    # NOTE(krishan711): some fields is optional so _EMPTY_STRING allows it to be passed in as None. Maybe there is a nicer way to do this.
    async def update_grid_item(self, gridItemId: int, contentUrl: Optional[str] = _EMPTY_STRING, title: Optional[str] = None, description: Optional[str] = _EMPTY_STRING, imageUrl: Optional[str] = None, resizableImageUrl: Optional[str] = _EMPTY_STRING, url: Optional[str] = _EMPTY_STRING, groupId: Optional[str] = _EMPTY_STRING, ownerId: Optional[str] = None, blockNumber: Optional[int] = None, source: Optional[str] = None, connection: Optional[DatabaseConnection] = None) -> None:
        values: UpdateRecordDict = {}
        if contentUrl != _EMPTY_STRING:
            values[GridItemsTable.c.contentUrl.key] = contentUrl
        if title is not None:
            values[GridItemsTable.c.title.key] = title
        if description != _EMPTY_STRING:
            values[GridItemsTable.c.description.key] = description
        if imageUrl is not None:
            values[GridItemsTable.c.imageUrl.key] = imageUrl
        if resizableImageUrl != _EMPTY_STRING:
            values[GridItemsTable.c.resizableImageUrl.key] = resizableImageUrl
        if url != _EMPTY_STRING:
            values[GridItemsTable.c.url.key] = url
        if groupId != _EMPTY_STRING:
            values[GridItemsTable.c.groupId.key] = groupId
        if ownerId is not None:
            values[GridItemsTable.c.ownerId.key] = ownerId
        if blockNumber is not None:
            values[GridItemsTable.c.blockNumber.key] = blockNumber
        if source is not None:
            values[GridItemsTable.c.source.key] = source
        if len(values) > 0:
            values[GridItemsTable.c.updatedDate.key] = date_util.datetime_from_now()
        query = GridItemsTable.update().where(GridItemsTable.c.gridItemId == gridItemId).values(values).returning(GridItemsTable.c.gridItemId)
        await self._execute(query=query, connection=connection)

    async def create_base_image(self, network: str, url: str, generatedDate: datetime.datetime, connection: Optional[DatabaseConnection] = None) -> BaseImage:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        values: CreateRecordDict = {
            BaseImagesTable.c.createdDate.key: createdDate,
            BaseImagesTable.c.updatedDate.key: updatedDate,
            BaseImagesTable.c.network.key: network,
            BaseImagesTable.c.url.key: url,
            BaseImagesTable.c.generatedDate.key: generatedDate,
        }
        query = BaseImagesTable.insert().values(values).returning(BaseImagesTable.c.baseImageId)
        result = await self._execute(query=query, connection=connection)
        baseImageId = int(result.scalar_one())
        return BaseImage(baseImageId=baseImageId, createdDate=createdDate, updatedDate=updatedDate, network=network, url=url, generatedDate=generatedDate)

    async def create_network_update(self, network: str, latestBlockNumber: int, connection: Optional[DatabaseConnection] = None) -> NetworkUpdate:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        values: CreateRecordDict = {
            NetworkUpdatesTable.c.createdDate.key: createdDate,
            NetworkUpdatesTable.c.updatedDate.key: updatedDate,
            NetworkUpdatesTable.c.network.key: network,
            NetworkUpdatesTable.c.latestBlockNumber.key: latestBlockNumber,
        }
        query = NetworkUpdatesTable.insert().values(values).returning(NetworkUpdatesTable.c.networkUpdateId)
        result = await self._execute(query=query, connection=connection)
        networkUpdateId = int(result.scalar_one())
        return NetworkUpdate(networkUpdateId=networkUpdateId, createdDate=createdDate, updatedDate=updatedDate, network=network, latestBlockNumber=latestBlockNumber)

    async def update_network_update(self, networkUpdateId: int, latestBlockNumber: Optional[int] = None, connection: Optional[DatabaseConnection] = None) -> None:
        values: UpdateRecordDict = {}
        if latestBlockNumber is not None:
            values[NetworkUpdatesTable.c.latestBlockNumber.key] = latestBlockNumber
        if len(values) > 0:
            values[NetworkUpdatesTable.c.updatedDate.key] = date_util.datetime_from_now()
        query = NetworkUpdatesTable.update().where(NetworkUpdatesTable.c.networkUpdateId == networkUpdateId).values(values).returning(NetworkUpdatesTable.c.networkUpdateId)
        await self._execute(query=query, connection=connection)

    async def create_offchain_content(self, tokenId: int, network: str, contentUrl: str, blockNumber: int, ownerId: str, signature: str, signedMessage: str, connection: Optional[DatabaseConnection] = None) -> OffchainContent:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        values: CreateRecordDict = {
            OffchainContentsTable.c.createdDate.key: createdDate,
            OffchainContentsTable.c.updatedDate.key: updatedDate,
            OffchainContentsTable.c.network.key: network,
            OffchainContentsTable.c.tokenId.key: tokenId,
            OffchainContentsTable.c.contentUrl.key: contentUrl,
            OffchainContentsTable.c.blockNumber.key: blockNumber,
            OffchainContentsTable.c.ownerId.key: ownerId,
            OffchainContentsTable.c.signature.key: signature,
            OffchainContentsTable.c.signedMessage.key: signedMessage,
        }
        query = OffchainContentsTable.insert().values(values).returning(OffchainContentsTable.c.offchainContentId)
        result = await self._execute(query=query, connection=connection)
        offchainContentId = int(result.scalar_one())
        return OffchainContent(offchainContentId=offchainContentId, createdDate=createdDate, updatedDate=updatedDate, network=network, tokenId=tokenId, contentUrl=contentUrl, blockNumber=blockNumber, ownerId=ownerId, signature=signature, signedMessage=signedMessage)

    async def create_offchain_pending_content(self, tokenId: int, network: str, contentUrl: str, blockNumber: int, ownerId: str, signature: str, signedMessage: str, connection: Optional[DatabaseConnection] = None) -> OffchainContent:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        values: CreateRecordDict = {
            OffchainPendingContentsTable.c.createdDate.key: createdDate,
            OffchainPendingContentsTable.c.updatedDate.key: updatedDate,
            OffchainPendingContentsTable.c.network.key: network,
            OffchainPendingContentsTable.c.tokenId.key: tokenId,
            OffchainPendingContentsTable.c.contentUrl.key: contentUrl,
            OffchainPendingContentsTable.c.blockNumber.key: blockNumber,
            OffchainPendingContentsTable.c.ownerId.key: ownerId,
            OffchainPendingContentsTable.c.signature.key: signature,
            OffchainPendingContentsTable.c.signedMessage.key: signedMessage,
        }
        query = OffchainPendingContentsTable.insert().values(values).returning(OffchainPendingContentsTable.c.offchainPendingContentId)
        result = await self._execute(query=query, connection=connection)
        offchainPendingContentId = int(result.scalar_one())
        return OffchainContent(offchainContentId=offchainPendingContentId, createdDate=createdDate, updatedDate=updatedDate, network=network, tokenId=tokenId, contentUrl=contentUrl, blockNumber=blockNumber, ownerId=ownerId, signature=signature, signedMessage=signedMessage)

    async def update_offchain_pending_content(self, offchainPendingContentId: int, appliedDate: Optional[datetime.datetime] = None, connection: Optional[DatabaseConnection] = None) -> None:
        values: UpdateRecordDict = {}
        if appliedDate is not None:
            values[OffchainPendingContentsTable.c.appliedDate.key] = appliedDate
        if len(values) > 0:
            values[OffchainPendingContentsTable.c.updatedDate.key] = date_util.datetime_from_now()
        query = OffchainPendingContentsTable.update().where(OffchainPendingContentsTable.c.offchainPendingContentId == offchainPendingContentId).values(values).returning(OffchainPendingContentsTable.c.offchainPendingContentId)
        await self._execute(query=query, connection=connection)

    async def create_grid_item_group_image(self, network: str, ownerId: str, groupId: str, imageUrl: str, connection: Optional[DatabaseConnection] = None) -> GridItemGroupImage:
        createdDate = date_util.datetime_from_now()
        updatedDate = createdDate
        values: CreateRecordDict = {
            GridItemGroupImagesTable.c.createdDate.key: createdDate,
            GridItemGroupImagesTable.c.updatedDate.key: updatedDate,
            GridItemGroupImagesTable.c.network.key: network,
            GridItemGroupImagesTable.c.ownerId.key: ownerId,
            GridItemGroupImagesTable.c.groupId.key: groupId,
            GridItemGroupImagesTable.c.imageUrl.key: imageUrl,
        }
        query = GridItemGroupImagesTable.insert().values(values).returning(GridItemGroupImagesTable.c.gridItemGroupImageId)
        result = await self._execute(query=query, connection=connection)
        gridItemGroupImageId = int(result.scalar_one())
        return GridItemGroupImage(gridItemGroupImageId=gridItemGroupImageId, createdDate=createdDate, updatedDate=updatedDate, network=network, ownerId=ownerId, groupId=groupId, imageUrl=imageUrl)

    async def update_grid_item_group_image(self, gridItemGroupImageId: int, imageUrl: Optional[str] = None, connection: Optional[DatabaseConnection] = None) -> None:
        values: UpdateRecordDict = {}
        if imageUrl is not None:
            values[GridItemGroupImagesTable.c.imageUrl.key] = imageUrl
        if len(values) > 0:
            values[GridItemGroupImagesTable.c.updatedDate.key] = date_util.datetime_from_now()
        query = GridItemGroupImagesTable.update().where(GridItemGroupImagesTable.c.gridItemGroupImageId == gridItemGroupImageId).values(values).returning(GridItemGroupImagesTable.c.gridItemGroupImageId)
        await self._execute(query=query, connection=connection)
