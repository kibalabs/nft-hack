from typing import Optional
from typing import Sequence

from core.exceptions import NotFoundException
from core.store.retriever import FieldFilter
from core.store.retriever import Order
from core.store.retriever import Retriever
from sqlalchemy.sql import func
from sqlalchemy.sql import select

from mdtp.model import GridItem
from mdtp.model import GridItemGroupImage
from mdtp.model import NetworkUpdate
from mdtp.model import OffchainContent
from mdtp.model import OffchainPendingContent
from mdtp.store.schema import BaseImagesTable
from mdtp.store.schema import GridItemGroupImagesTable
from mdtp.store.schema import GridItemsTable
from mdtp.store.schema import NetworkUpdatesTable
from mdtp.store.schema import OffchainContentsTable
from mdtp.store.schema import OffchainPendingContentsTable
from mdtp.store.schema_conversions import base_image_from_row
from mdtp.store.schema_conversions import grid_item_from_row
from mdtp.store.schema_conversions import grid_item_group_image_from_row
from mdtp.store.schema_conversions import network_update_from_row
from mdtp.store.schema_conversions import offchain_content_from_row
from mdtp.store.schema_conversions import offchain_pending_content_from_row


class MdtpRetriever(Retriever):

    async def list_grid_items(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[GridItem]:
        query = GridItemsTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=GridItemsTable, fieldFilters=fieldFilters)
        if orders:
            query = self._apply_orders(query=query, table=GridItemsTable, orders=orders)
        if limit:
            query = query.limit(limit)
        rows = await self.database.fetch_all(query=query)
        gridItems = [grid_item_from_row(row) for row in rows]
        return gridItems

    async def count_grid_items(self, fieldFilters: Optional[Sequence[FieldFilter]] = None) -> int:
        query = GridItemsTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=GridItemsTable, fieldFilters=fieldFilters)
        query = select([func.count()]).select_from(query.alias('t'))
        value = await self.database.fetch_val(query=query)
        return value

    async def list_base_images(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[GridItem]:
        query = BaseImagesTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=BaseImagesTable, fieldFilters=fieldFilters)
        if orders:
            query = self._apply_orders(query=query, table=BaseImagesTable, orders=orders)
        if limit:
            query = query.limit(limit)
        rows = await self.database.fetch_all(query=query)
        gridItems = [base_image_from_row(row) for row in rows]
        return gridItems

    async def get_grid_item(self, gridItemId: int) -> GridItem:
        query = GridItemsTable.select() \
            .where(GridItemsTable.c.gridItemId == gridItemId)
        row = await self.database.fetch_one(query=query)
        if not row:
            raise NotFoundException(message=f'GridItem with gridItemId {gridItemId} not found')
        gridItem = grid_item_from_row(row)
        return gridItem

    async def get_grid_item_by_token_id_network(self, tokenId: str, network: str) -> GridItem:
        query = GridItemsTable.select() \
            .where(GridItemsTable.c.tokenId == tokenId) \
            .where(GridItemsTable.c.network == network)
        row = await self.database.fetch_one(query=query)
        if not row:
            raise NotFoundException(message=f'GridItem with tokenId {tokenId}, network {network} not found')
        gridItem = grid_item_from_row(row)
        return gridItem

    async def get_network_update_by_network(self, network: str) -> NetworkUpdate:
        query = NetworkUpdatesTable.select() \
            .where(NetworkUpdatesTable.c.network == network)
        row = await self.database.fetch_one(query=query)
        if not row:
            raise NotFoundException(message=f'NetworkUpdate with network {network} not found')
        networkUpdate = network_update_from_row(row)
        return networkUpdate

    async def list_offchain_contents(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[OffchainContent]:
        query = OffchainContentsTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=OffchainContentsTable, fieldFilters=fieldFilters)
        if orders:
            query = self._apply_orders(query=query, table=OffchainContentsTable, orders=orders)
        if limit:
            query = query.limit(limit)
        rows = await self.database.fetch_all(query=query)
        offchainContents = [offchain_content_from_row(row) for row in rows]
        return offchainContents

    async def list_offchain_pending_contents(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[OffchainPendingContent]:
        query = OffchainPendingContentsTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=OffchainPendingContentsTable, fieldFilters=fieldFilters)
        if orders:
            query = self._apply_orders(query=query, table=OffchainPendingContentsTable, orders=orders)
        if limit:
            query = query.limit(limit)
        rows = await self.database.fetch_all(query=query)
        offchainPEndingContents = [offchain_pending_content_from_row(row) for row in rows]
        return offchainPEndingContents

    async def list_grid_item_group_images(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[GridItemGroupImage]:
        query = GridItemGroupImagesTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=GridItemGroupImagesTable, fieldFilters=fieldFilters)
        if orders:
            query = self._apply_orders(query=query, table=GridItemGroupImagesTable, orders=orders)
        if limit:
            query = query.limit(limit)
        rows = await self.database.fetch_all(query=query)
        gridItemGroupImages = [grid_item_group_image_from_row(row) for row in rows]
        return gridItemGroupImages

    async def get_grid_item_group_image_by_network_owner_id_group_id(self, network: str, ownerId: str, groupId: str) -> GridItemGroupImage: # pylint: disable=invalid-name
        query = GridItemGroupImagesTable.select() \
            .where(GridItemGroupImagesTable.c.network == network) \
            .where(GridItemGroupImagesTable.c.ownerId == ownerId) \
            .where(GridItemGroupImagesTable.c.groupId == groupId)
        row = await self.database.fetch_one(query=query)
        if not row:
            raise NotFoundException(message=f'GridItemGroupImage with network {network}, ownerId {ownerId}, groupId {groupId} not found')
        gridItemGroupImage = grid_item_group_image_from_row(row)
        return gridItemGroupImage
