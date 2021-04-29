import datetime
from typing import Optional
from typing import Sequence
from typing import Optional

from  sqlalchemy.sql.expression import func as sqlalchemyfunc

from mdtp.core.store.retriever import Retriever
from mdtp.core.store.retriever import FieldFilter
from mdtp.core.store.retriever import Order
from mdtp.core.store.retriever import StringFieldFilter
from mdtp.core.exceptions import NotFoundException
from mdtp.model import GridItem
from mdtp.store.schema import GridItemsTable
from mdtp.store.schema_conversions import grid_item_from_row

class MdtpRetriever(Retriever):

    async def list_grid_items(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[GridItem]:
        query = GridItemsTable.select()
        if fieldFilters:
            query = self._apply_field_filters(query=query, table=GridItemsTable, fieldFilters=fieldFilters)
        if orders:
            for order in orders:
                query = self._apply_order(query=query, table=GridItemsTable, order=order)
        if limit:
            query = query.limit(limit)
        rows = await self.database.fetch_all(query=query)
        gridItems = [grid_item_from_row(row) for row in rows]
        return gridItems

    async def get_grid_item(self, gridItemId: int) -> GridItem:
        query = GridItemsTable.select() \
            .where(GridItemsTable.c.gridItemId == gridItemId)
        row = await self.database.fetch_one(query=query)
        if not row:
            raise NotFoundException(message=f'GridItem with gridItemId {gridItemId} not found')
        gridItem = grid_item_from_row(row)
        return gridItem

    async def get_grid_item_by_token_id_network(self, tokenId: str, network: str) -> Optional[GridItem]:
        query = GridItemsTable.select() \
            .where(GridItemsTable.c.tokenId == tokenId) \
            .where(GridItemsTable.c.network == network)
        row = await self.database.fetch_one(query=query)
        if not row:
            raise NotFoundException(message=f'GridItem with tokenId {tokenId}, network {network} not found')
        gridItem = grid_item_from_row(row)
        return gridItem

    async def list_stat_items(self, fieldFilters: Optional[Sequence[FieldFilter]] = None, orders: Optional[Sequence[Order]] = None, limit: Optional[int] = None) -> Sequence[GridItem]:
        print('WIP')
        """
        url = "https://api.opensea.io/api/v1/collections"
        querystring = {"asset_owner":"0xb7f7f6c52f2e2fdb1963eab30438024864c313f6","offset":"0","limit":"300"}
        response = requests.request("GET", url, params=querystring)
        print(response.text)
        """
        return gridItems