from dataclasses import field
import datetime
from io import BytesIO
import json
import logging
import math
from typing import Dict
from typing import Sequence
from typing import Optional
import urllib.parse as urlparse
import uuid

from core.exceptions import NotFoundException, ServerException
from core.requester import Requester
from core.queues.sqs_message_queue import SqsMessageQueue
from core.util import date_util, dict_util, file_util
from core.web3.eth_client import EthClientInterface
from core.s3_manager import S3Manager
from core.s3_manager import S3PresignedUpload
from core.store.retriever import DateFieldFilter, Direction, Order, StringFieldFilter
from PIL import Image as PILImage
from web3 import Web3
from mdtp.contract_store import ContractStore

from mdtp.store.saver import MdtpSaver
from mdtp.store.retriever import MdtpRetriever
from mdtp.model import BaseImage, NetworkSummary, TokenMetadata
from mdtp.model import GridItem
from mdtp.messages import BuildBaseImageMessageContent, UpdateTokenMessageContent
from mdtp.messages import UpdateTokensMessageContent
from mdtp.messages import UploadTokenImageMessageContent
from mdtp.image_manager import ImageManager
from mdtp.store.schema import BaseImagesTable, GridItemsTable

_KILOBYTE = 1024
_MEGABYTE = _KILOBYTE * 1024
_CACHE_CONTROL_TEMPORARY_FILE = 'public,max-age=1'
_CACHE_CONTROL_FINAL_FILE = 'public,max-age=31536000'

class MdtpManager:

    def __init__(self, requester: Requester, retriever: MdtpRetriever, saver: MdtpSaver, s3Manager: S3Manager, contractStore: ContractStore, workQueue: SqsMessageQueue, imageManager: ImageManager):
        self.w3 = Web3()
        self.requester = requester
        self.retriever = retriever
        self.saver = saver
        self.s3Manager = s3Manager
        self.contractStore = contractStore
        self.workQueue = workQueue
        self.imageManager = imageManager
        self.ownerAddress = '0xce11d6fb4f1e006e5a348230449dc387fde850cc'

    # NOTE(krishan711): it feels weird that this and the function below don't have network in the request or response. Think this through.
    async def get_token_metadata(self, tokenId: str) -> TokenMetadata:
        try:
            tokenIdValue = int(tokenId)
        except ValueError:
            raise NotFoundException()
        if tokenIdValue <= 0 or tokenIdValue > 10000:
            raise NotFoundException()
        tokenIndex = tokenIdValue - 1
        return TokenMetadata(
            tokenId=tokenId,
            tokenIndex=tokenIndex,
            name=f'MDTP Token {tokenId}',
            description='<description for the token>',
            image='',
        )

    async def get_token_default_content(self, tokenId: str) -> TokenMetadata:
        try:
            tokenIdValue = int(tokenId)
        except ValueError:
            raise NotFoundException()
        if tokenIdValue <= 0 or tokenIdValue > 10000:
            raise NotFoundException()
        tokenIndex = tokenIdValue - 1
        return TokenMetadata(
            tokenId=tokenId,
            tokenIndex=tokenIndex,
            name=f'MDTP Token {tokenId}',
            description='<description for the token>',
            image=f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/f82c6b11-afaf-4724-909b-b41068ab8639/{tokenIndex}.png',
        )

    async def get_token_default_grid_item(self, tokenId: str) -> GridItem:
        metadata = await self.get_token_default_content(tokenId=tokenId)
        return GridItem(
            gridItemId=tokenId-1,
            createdDate=date_util.datetime_from_now(),
            updatedDate=date_util.datetime_from_now(),
            network='',
            tokenId=metadata.tokenId,
            title=metadata.name,
            description=metadata.description,
            imageUrl=metadata.image,
            resizableImageUrl=metadata.image,
            ownerId='',
        )

    async def retrieve_grid_item(self, network: str, tokenId: int) -> GridItem:
        gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        return gridItem

    async def list_grid_items(self, network: str, updatedSinceDate: Optional[datetime.datetime] = None) -> Sequence[GridItem]:
        filters = [StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network)]
        if updatedSinceDate:
            filters.append(DateFieldFilter(fieldName=GridItemsTable.c.updatedDate.key, gte=updatedSinceDate.replace(tzinfo=None)))
        gridItems = await self.retriever.list_grid_items(fieldFilters=filters)
        return gridItems

    async def get_latest_base_image_url(self, network: str) -> BaseImage:
        baseImages = await self.retriever.list_base_images(
            fieldFilters=[StringFieldFilter(fieldName=BaseImagesTable.c.network.key, eq=network)],
            orders=[Order(fieldName=BaseImagesTable.c.updatedDate.key, direction=Direction.DESCENDING)],
            limit=1
        )
        if len(baseImages) == 0:
            raise NotFoundException()
        return baseImages[0]

    async def build_base_image_deferred(self, network: str, delay: Optional[int]) -> Optional[BaseImage]:
        await self.workQueue.send_message(message=BuildBaseImageMessageContent(network=network).to_message(), delaySeconds=delay or 0)

    async def build_base_image(self, network: str) -> Optional[BaseImage]:
        # NOTE(krishan711): everything is double so that it works well in retina
        scale = 2
        width = 1000 * scale
        height = 1000 * scale
        tokenHeight = 10 * scale
        tokenWidth = 10 * scale
        generatedDate = date_util.datetime_from_now()
        outputImage = PILImage.new('RGB', (width, height))
        try:
            latestBaseImage = await self.get_latest_base_image_url(network=network)
        except NotFoundException:
            latestBaseImage = None
        if latestBaseImage:
            gridItems = await self.list_grid_items(network=network, updatedSinceDate=latestBaseImage.generatedDate)
        else:
            gridItems = [await self.get_token_default_grid_item(tokenId=index + 1) for index in range(0, 10000)]
        if len(gridItems) == 0:
            logging.info('Nothing to update')
            return None
        if latestBaseImage:
            baseImageResponse = await self.requester.get(latestBaseImage.url)
            contentBuffer = BytesIO(baseImageResponse.content)
            with PILImage.open(fp=contentBuffer) as baseImage:
                image = baseImage.resize(size=(width, height))
                outputImage.paste(image, (0, 0))
        logging.info(f'Drawing {len(gridItems)} new grid items')
        for gridItem in gridItems:
            logging.info(f'Drawing grid item {gridItem.gridItemId}')
            imageUrl = f'{gridItem.resizableImageUrl}?w={tokenWidth}&h={tokenHeight}' if gridItem.resizableImageUrl else gridItem.imageUrl
            imageResponse = await self.requester.get(imageUrl)
            contentBuffer = BytesIO(imageResponse.content)
            with PILImage.open(fp=contentBuffer) as tokenImage:
                tokenIndex = gridItem.tokenId - 1
                x = (tokenIndex * tokenWidth) % width
                y = tokenHeight * math.floor((tokenIndex * tokenWidth) / width)
                image = tokenImage.resize(size=(tokenWidth, tokenHeight))
                # NOTE(krishan711): this doesnt use transparency as we aren't using the 3rd (mask) param
                outputImage.paste(image, (x, y))
        outputFilePath = 'output.png'
        outputImage.save(outputFilePath)
        imageId = await self.imageManager.upload_image_from_file(filePath=outputFilePath)
        await file_util.remove_file(filePath=outputFilePath)
        imageUrl = f'https://d2a7i2107hou45.cloudfront.net/v1/images/{imageId}/go'
        baseImage = await self.saver.create_base_image(network=network, url=imageUrl, generatedDate=generatedDate)
        return baseImage

    async def get_network_summary(self, network: str) -> NetworkSummary:
        try:
            contract = self.contractStore.get_contract(network=network)
        except NotFoundException:
            return NetworkSummary(marketCapitalization=0, totalSales=0, averagePrice=0)
        # TODO(krishan711): update this to work with the new contract
        if network == 'rinkeby':
            # NOTE(arthur-fox): OpenSea API requires us to look at the owner's assets
            # so we have to loop through their owned assets' contracts to find the correct one
            response = await self.requester.get(url=f'https://rinkeby-api.opensea.io/api/v1/collections?asset_owner={self.ownerAddress}&offset=0&limit=300')
            responseJson = response.json()
            for responseEntry in responseJson:
                if responseEntry['primary_asset_contracts'][0].get('address').lower() == contract.address.lower():
                    stats = responseEntry['stats']
                    return NetworkSummary(
                        marketCapitalization=float(stats['market_cap']),
                        totalSales=float(stats['total_sales']),
                        averagePrice=float(stats['average_price'])
                    )
        return NetworkSummary(marketCapitalization=0, totalSales=0, averagePrice=0)

    async def generate_image_upload_for_token(self, network: str, tokenId: int) -> S3PresignedUpload:
        presignedUpload = await self.s3Manager.generate_presigned_upload(target=f's3://mdtp-images/uploads/n/{network}/t/{tokenId}/a/${{filename}}', timeLimit=60, sizeLimit=_MEGABYTE * 5, accessControl='public-read', cacheControl=_CACHE_CONTROL_TEMPORARY_FILE)
        return presignedUpload

    async def upload_metadata_for_token(self, network: str, tokenId: int, name: str, description: str, imageUrl: str) -> str:
        data = {
            'name': name or '',
            'description': description or '',
            # TODO(krishan711): make a better default
            'imageUrl': imageUrl or '',
        }
        dataId = str(uuid.uuid4()).replace('-', '')
        target = f's3://mdtp-images/uploads/n/{network}/t/{tokenId}/d/{dataId}.json'
        await self.s3Manager.write_file(content=json.dumps(data).encode(), targetPath=target, accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE, contentType='application/json')
        return target.replace('s3://mdtp-images', 'https://mdtp-images.s3.amazonaws.com')

    async def update_tokens_deferred(self, network: str, delay: Optional[int]) -> None:
        await self.workQueue.send_message(message=UpdateTokensMessageContent(network=network).to_message(), delaySeconds=delay or 0)

    async def update_token_deferred(self, network: str, tokenId: str, delay: Optional[int]) -> None:
        await self.workQueue.send_message(message=UpdateTokenMessageContent(network=network, tokenId=tokenId).to_message(), delaySeconds=delay or 0)

    async def update_tokens(self, network: str) -> None:
        gridItems = await self.retriever.list_grid_items(fieldFilters=[StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network)], orders=[Order(fieldName=GridItemsTable.c.lastUpdateBlockNumber.key, direction=Direction.DESCENDING)], limit=1)
        latestProcessedBlockNumber = gridItems[0].lastUpdateBlockNumber if gridItems else -1
        latestBlockNumber = await self.contractStore.get_latest_block_number(network=network)
        batchSize = 2500
        tokenIdsToUpdate = set()
        logging.info(f'Processing blocks from {latestProcessedBlockNumber} to {latestBlockNumber}')
        for startBlockNumber in range(latestProcessedBlockNumber + 1, latestBlockNumber + 1, batchSize):
            endBlockNumber = min(startBlockNumber + batchSize, latestBlockNumber + 1)
            transferredTokenIds = await self.contractStore.get_transferred_token_ids_in_blocks(network=network, startBlockNumber=startBlockNumber, endBlockNumber=endBlockNumber)
            logging.info(f'Found {len(transferredTokenIds)} transferred tokens in blocks {startBlockNumber}-{endBlockNumber}')
            tokenIdsToUpdate.update(transferredTokenIds)
            updatedTokenIds = await self.contractStore.get_updated_token_ids_in_blocks(network=network, startBlockNumber=startBlockNumber, endBlockNumber=endBlockNumber)
            logging.info(f'Found {len(updatedTokenIds)} updated tokens in blocks {startBlockNumber}-{endBlockNumber}')
            tokenIdsToUpdate.update(updatedTokenIds)
        for tokenIndex in list(tokenIdsToUpdate):
            await self.update_token(network=network, tokenId=tokenIndex)

    async def update_all_tokens(self, network: str) -> None:
        tokenCount = await self.contractStore.get_total_supply(network=network)
        for tokenIndex in range(tokenCount):
            await self.update_token(network=network, tokenId=(tokenIndex + 1))

    async def upload_token_image_deferred(self, network: str, tokenId: int) -> None:
        await self.workQueue.send_message(message=UploadTokenImageMessageContent(network=network, tokenId=tokenId).to_message())

    async def upload_token_image(self, network: str, tokenId: int) -> None:
        logging.info(f'Uploading image for token {tokenId}')
        gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        imageId = await self.imageManager.upload_image_from_url(url=gridItem.imageUrl)
        resizableImageUrl = f'https://d2a7i2107hou45.cloudfront.net/v1/images/{imageId}/go'
        await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, resizableImageUrl=resizableImageUrl)

    async def update_token(self, network: str, tokenId: int) -> None:
        logging.info(f'Updating token {network}/{tokenId}')
        try:
            ownerId = await self.contractStore.get_token_owner(network=network, tokenId=tokenId)
        except Exception as e:
            print(e)
            ownerId = self.ownerAddress
        tokenContentUrl = await self.contractStore.get_token_content_url(network=network, tokenId=tokenId)
        print('tokenContentUrl', tokenContentUrl)
        tokenContentResponse = await self.requester.make_request(method='GET', url=tokenContentUrl)
        tokenContentJson = json.loads(tokenContentResponse.text)
        title = tokenContentJson.get('title') or tokenContentJson.get('name') or ''
        # TODO(krishan711): pick a better default image
        imageUrl = tokenContentJson.get('imageUrl') or tokenContentJson.get('image') or ''
        description = tokenContentJson.get('description')
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        except NotFoundException:
            logging.info(f'Creating token {network}/{tokenId}')
            gridItem = await self.saver.create_grid_item(tokenId=tokenId, network=network, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=None, ownerId=ownerId)
        resizableImageUrl = gridItem.resizableImageUrl
        if gridItem.imageUrl != imageUrl:
            resizableImageUrl = None
        if resizableImageUrl is None:
            await self.upload_token_image_deferred(network=network, tokenId=tokenId)
        if gridItem.title != title or gridItem.description != description or gridItem.imageUrl != imageUrl or gridItem.resizableImageUrl != resizableImageUrl or gridItem.ownerId != ownerId:
            logging.info(f'Saving token {network}/{tokenId}')
            await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, ownerId=ownerId)

    async def go_to_image(self, imageId: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        return await self.imageManager.get_image_url(imageId=imageId, width=width, height=height)

    async def go_to_token_image(self, network: str, tokenId: int, width: Optional[int] = None, height: Optional[int] = None) -> str:
        gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        if gridItem.resizableImageUrl:
            if gridItem.resizableImageUrl.startswith('https://mdtp-api.kibalabs.com/v1/images/'):
                imageId = gridItem.resizableImageUrl.replace('https://mdtp-api.kibalabs.com/v1/images/', '').replace('/go', '')
                return await self.go_to_image(imageId=imageId, width=width, height=height)
            params = {}
            if width:
                params['w'] = width
            if height:
                params['h'] = height
            urlParts = urlparse.urlparse(gridItem.resizableImageUrl)
            currentQuery = urlparse.parse_qs(urlParts.query)
            queryString = urlparse.urlencode(dict_util.merge_dicts(currentQuery, params), doseq=True)
            return urlparse.urlunsplit(components=(urlParts.scheme, urlParts.netloc, urlParts.path, queryString, urlParts.fragment))
        return gridItem.imageUrl
