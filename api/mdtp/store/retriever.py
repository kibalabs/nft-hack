from typing import Optional
from typing import Sequence

from core.store.retriever import Retriever
from core.store.retriever import FieldFilter
from core.store.retriever import Order
from core.exceptions import NotFoundException

from mdtp.model import GridItem, NetworkUpdate
from mdtp.store.schema import BaseImagesTable, GridItemsTable, NetworkUpdatesTable
from mdtp.store.schema_conversions import base_image_from_row, grid_item_from_row, network_update_from_row

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
