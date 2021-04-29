import json
import logging
from typing import Dict
from typing import Sequence

from web3 import Web3

from mdtp.core.exceptions import NotFoundException
from mdtp.core.requester import Requester
from mdtp.core.sqs_message_queue import SqsMessageQueue
from mdtp.eth_client import EthClientInterface
from mdtp.store.saver import MdtpSaver
from mdtp.store.retriever import MdtpRetriever
from mdtp.model import GridItem
from mdtp.messages import UpdateTokensMessageContent
from mdtp.messages import UploadTokenImageMessageContent
from mdtp.image_manager import ImageManager
from mdtp.core.util import date_util
from mdtp.core.s3_manager import S3Manager
from mdtp.core.s3_manager import S3PresignedUpload

_KILOBYTE = 1024
_MEGABYTE = _KILOBYTE * 1024
_CACHE_CONTROL_TEMPORARY_FILE = 'public,max-age=1'
_CACHE_CONTROL_FINAL_FILE = 'public,max-age=31536000'

class MdtpManager:

    def __init__(self, requester: Requester, retriever: MdtpRetriever, saver: MdtpSaver, s3Manager: S3Manager, ethClient: EthClientInterface, workQueue: SqsMessageQueue, imageManager: ImageManager, contractAddress: str, contractJson: Dict):
        self.w3 = Web3()
        self.requester = requester
        self.retriever = retriever
        self.saver = saver
        self.s3Manager = s3Manager
        self.ethClient = ethClient
        self.workQueue = workQueue
        self.imageManager = imageManager
        self.contractAddress = contractAddress
        self.contractAbi = contractJson['abi']
        self.contract = self.w3.eth.contract(address='0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3', abi=self.contractAbi)
        self.contractTotalSupplyEvent = self.contract.events.Transfer()
        self.contractTotalSupplyMethodAbi = [internalAbi for internalAbi in self.contractAbi if internalAbi.get('name') == 'totalSupply'][0]
        self.contractTokenUriAbi = [internalAbi for internalAbi in self.contractAbi if internalAbi.get('name') == 'tokenURI'][0]
        self.contractOwnerOfAbi = [internalAbi for internalAbi in self.contractAbi if internalAbi.get('name') == 'ownerOf'][0]

    async def retrieve_grid_item(self, network: str, tokenId: int) -> GridItem:
        gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        return gridItem

    async def list_grid_items(self) -> Sequence[GridItem]:
        gridItems = await self.retriever.list_grid_items()
        return gridItems
    
    async def list_stat_items(self) -> Sequence[StatItem]:
        statItems = await self.retriever.list_stat_items()
        return statItems

    async def generate_image_upload_for_token(self, tokenId: int) -> S3PresignedUpload:
        presignedUpload = await self.s3Manager.generate_presigned_upload(target=f's3://mdtp-images/networks/rinkeby/tokens/{tokenId}/assets/${{filename}}', timeLimit=60, sizeLimit=_MEGABYTE * 5, accessControl='public-read', cacheControl=_CACHE_CONTROL_TEMPORARY_FILE)
        return presignedUpload

    async def update_tokens_deferred(self) -> None:
        await self.workQueue.send_message(message=UpdateTokensMessageContent().to_message())

    async def update_tokens(self) -> None:
        tokenCountResponse = await self.ethClient.call_function(toAddress=self.contractAddress, contractAbi=self.contractAbi, functionAbi=self.contractTotalSupplyMethodAbi, arguments={})
        tokenCount = tokenCountResponse[0]
        for tokenIndex in range(tokenCount):
            await self.update_token(tokenId=(tokenIndex + 1))

    async def upload_token_image_deferred(self, tokenId: int) -> None:
        await self.workQueue.send_message(message=UploadTokenImageMessageContent(tokenId=tokenId).to_message())

    async def upload_token_image(self, tokenId: int) -> None:
        logging.info(f'Uploading image for token {tokenId}')
        network = 'rinkeby'
        gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        dateString = date_util.datetime_to_string(dt=date_util.datetime_from_now(), dateFormat='%Y-%m-%d-%H-%M-%S-%f')
        resizableImageUrl = await self.imageManager.upload_image_from_url(imageUrl=gridItem.imageUrl, filePath=f'/mdtp/tokens/{network}/{tokenId}/{dateString}')
        await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, resizableImageUrl=resizableImageUrl)

    async def update_token(self, tokenId: int) -> None:
        network = 'rinkeby'
        logging.info(f'Updating token {network}/{tokenId}')
        tokenMetadataUrlResponse = await self.ethClient.call_function(toAddress=self.contractAddress, contractAbi=self.contractAbi, functionAbi=self.contractTokenUriAbi, arguments={'tokenId': int(tokenId)})
        tokenMetadataUrl = tokenMetadataUrlResponse[0].strip()
        tokenMetadataResponse = await self.requester.make_request(method='GET', url=tokenMetadataUrl)
        tokenMetadataJson = json.loads(tokenMetadataResponse.text)
        ownerIdResponse = await self.ethClient.call_function(toAddress=self.contractAddress, contractAbi=self.contractAbi, functionAbi=self.contractOwnerOfAbi, arguments={'tokenId': int(tokenId)})
        ownerId = ownerIdResponse[0].strip()
        title = tokenMetadataJson.get('title') or tokenMetadataJson.get('name') or ''
        # TODO(krishan711): pick a better default image
        imageUrl = tokenMetadataJson.get('imageUrl') or tokenMetadataJson.get('image') or ''
        description = tokenMetadataJson.get('description')
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        except NotFoundException:
            logging.info(f'Creating token {network}/{tokenId}')
            gridItem = await self.saver.create_grid_item(tokenId=tokenId, network=network, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=None, ownerId=ownerId)
            await self.upload_token_image_deferred(tokenId=tokenId)
        resizableImageUrl = gridItem.resizableImageUrl
        if gridItem.imageUrl != imageUrl:
            resizableImageUrl = None
            await self.upload_token_image_deferred(tokenId=tokenId)
        if gridItem.title != title or gridItem.description != description or gridItem.imageUrl != imageUrl or gridItem.resizableImageUrl != resizableImageUrl or gridItem.ownerId != ownerId:
            logging.info(f'Saving token {network}/{tokenId}')
            await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, ownerId=ownerId)
