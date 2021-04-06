from fastapi import Request
from fastapi import Response

from mdtp.api.models_v1 import *
from mdtp.manager import MdtpManager
from mdtp.core.kiba_router import KibaRouter

def create_api(manager: MdtpManager) -> KibaRouter():
    router = KibaRouter()

    @router.get('/grid-items', response_model=ListGridItemsResponse)
    async def list_grid_items(rawRequest: Request, response: Response) -> ListGridItemsResponse: # request: ListGridItemsRequest
        gridItems = await manager.list_grid_items()
        return ListGridItemsResponse(gridItems=[ApiGridItem.from_model(model=gridItem) for gridItem in gridItems])

    # TODO(krishan711): this can nicely be a GET once we have query params
    @router.post('/retrieve-grid-item', response_model=RetrieveGridItemResponse)
    async def retrieve_grid_item(rawRequest: Request, response: Response, request: RetrieveGridItemRequest) -> RetrieveGridItemResponse:
        gridItem = await manager.retrieve_grid_item(network=request.network, tokenId=request.tokenId)
        return RetrieveGridItemResponse(gridItem=ApiGridItem.from_model(model=gridItem))

    return router
