from typing import Mapping

from mdtp.model import BaseImage
from mdtp.model import GridItem
from mdtp.model import NetworkUpdate
from mdtp.model import OffchainContent
from mdtp.store.schema import BaseImagesTable
from mdtp.store.schema import GridItemsTable
from mdtp.store.schema import NetworkUpdatesTable
from mdtp.store.schema import OffchainContentsTable


def grid_item_from_row(row: Mapping) -> GridItem:
    # NOTE(krishan711) these should be of the form row.id but https://github.com/encode/databases/issues/101
    return GridItem(
        gridItemId=row[GridItemsTable.c.gridItemId],
        createdDate=row[GridItemsTable.c.createdDate],
        updatedDate=row[GridItemsTable.c.updatedDate],
        network=row[GridItemsTable.c.network],
        tokenId=row[GridItemsTable.c.tokenId],
        contentUrl=row[GridItemsTable.c.contentUrl],
        title=row[GridItemsTable.c.title],
        description=row[GridItemsTable.c.description],
        imageUrl=row[GridItemsTable.c.imageUrl],
        resizableImageUrl=row[GridItemsTable.c.resizableImageUrl],
        ownerId=row[GridItemsTable.c.ownerId],
        url=row[GridItemsTable.c.url],
        groupId=row[GridItemsTable.c.groupId],
        blockNumber=row[GridItemsTable.c.blockNumber],
        source=row[GridItemsTable.c.source],
    )

def base_image_from_row(row: Mapping) -> BaseImage:
    return BaseImage(
        baseImageId=row[BaseImagesTable.c.baseImageId],
        createdDate=row[BaseImagesTable.c.createdDate],
        updatedDate=row[BaseImagesTable.c.updatedDate],
        network=row[BaseImagesTable.c.network],
        url=row[BaseImagesTable.c.url],
        generatedDate=row[BaseImagesTable.c.generatedDate],
    )

def network_update_from_row(row: Mapping) -> NetworkUpdate:
    return NetworkUpdate(
        networkUpdateId=row[NetworkUpdatesTable.c.networkUpdateId],
        createdDate=row[NetworkUpdatesTable.c.createdDate],
        updatedDate=row[NetworkUpdatesTable.c.updatedDate],
        network=row[NetworkUpdatesTable.c.network],
        latestBlockNumber=row[NetworkUpdatesTable.c.latestBlockNumber],
    )

def offchain_content_from_row(row: Mapping) -> OffchainContent:
    return OffchainContent(
        offchainContentId=row[OffchainContentsTable.c.offchainContentId],
        createdDate=row[OffchainContentsTable.c.createdDate],
        updatedDate=row[OffchainContentsTable.c.updatedDate],
        network=row[OffchainContentsTable.c.network],
        tokenId=row[OffchainContentsTable.c.tokenId],
        contentUrl=row[OffchainContentsTable.c.contentUrl],
        blockNumber=row[OffchainContentsTable.c.blockNumber],
        ownerId=row[OffchainContentsTable.c.ownerId],
        signature=row[OffchainContentsTable.c.signature],
        signedMessage=row[OffchainContentsTable.c.signedMessage],
    )
