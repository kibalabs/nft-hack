import asyncio
import datetime
import json
import logging
import math
import os
import urllib.parse as urlparse
import uuid
from io import BytesIO
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Sequence

from core.exceptions import BadRequestException
from core.exceptions import NotFoundException
from core.queues.sqs_message_queue import SqsMessageQueue
from core.requester import Requester
from core.s3_manager import S3Manager
from core.s3_manager import S3PresignedUpload
from core.store.retriever import DateFieldFilter
from core.store.retriever import Direction
from core.store.retriever import Order
from core.store.retriever import RandomOrder
from core.store.retriever import StringFieldFilter
from core.util import date_util
from core.util import dict_util
from core.util import file_util
from eth_account.messages import defunct_hash_message
from PIL import Image as PILImage
from web3 import Web3
from web3.auto import w3

from mdtp.cache_control_header import CacheControlHeader
from mdtp.chain_util import NON_OWNER_ID
from mdtp.contract_store import ContractStore
from mdtp.image_manager import ImageManager
from mdtp.ipfs_manager import IpfsManager
from mdtp.messages import BuildBaseImageMessageContent
from mdtp.messages import UpdateAllTokensMessageContent
from mdtp.messages import UpdateGroupImageMessageContent
from mdtp.messages import UpdateTokenMessageContent
from mdtp.messages import UpdateTokensMessageContent
from mdtp.messages import UploadTokenImageMessageContent
from mdtp.model import BaseImage
from mdtp.model import GridItem
from mdtp.model import GridItemGroupImage
from mdtp.model import NetworkStatus
from mdtp.model import NetworkSummary
from mdtp.model import TokenMetadata
from mdtp.store.retriever import MdtpRetriever
from mdtp.store.saver import MdtpSaver
from mdtp.store.schema import BaseImagesTable
from mdtp.store.schema import GridItemsTable
from mdtp.store.schema import OffchainContentsTable
from mdtp.store.schema import OffchainPendingContentsTable

_KILOBYTE = 1024
_MEGABYTE = _KILOBYTE * 1024
_CACHE_CONTROL_TEMPORARY_FILE = CacheControlHeader(shouldCachePublically=True, maxAge=1).to_value_string()
_CACHE_CONTROL_FINAL_FILE = CacheControlHeader(shouldCachePublically=True, maxAge=60 * 60 * 24 * 365).to_value_string()

_API_URL = 'https://d2a7i2107hou45.cloudfront.net'

class MdtpManager:

    def __init__(self, requester: Requester, retriever: MdtpRetriever, saver: MdtpSaver, s3Manager: S3Manager, contractStore: ContractStore, workQueue: SqsMessageQueue, imageManager: ImageManager, ipfsManager: IpfsManager):
        self.w3 = Web3()
        self.requester = requester
        self.retriever = retriever
        self.saver = saver
        self.s3Manager = s3Manager
        self.contractStore = contractStore
        self.workQueue = workQueue
        self.imageManager = imageManager
        self.ipfsManager = ipfsManager
        self.ownerAddress = '0xce11d6fb4f1e006e5a348230449dc387fde850cc'

    @staticmethod
    def _get_resized_image_url(resizableImageUrl: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        urlParts = urlparse.urlparse(resizableImageUrl)
        currentQuery = urlparse.parse_qs(urlParts.query)
        if width:
            currentQuery['w'] = width
        if height:
            currentQuery['h'] = height
        queryString = urlparse.urlencode(currentQuery, doseq=True)
        return urlparse.urlunsplit(components=(urlParts.scheme, urlParts.netloc, urlParts.path, queryString, urlParts.fragment))

    async def _get_json_content(self, url: str) -> Dict[str, Any]:
        if url.startswith('ipfs://'):
            response = await self.ipfsManager.read_file(cid=url.replace('ipfs://', ''))
        else:
            response = await self.requester.make_request(method='GET', url=url)
        return json.loads(response.text)

    async def get_token_metadata(self, network: str, tokenId: str) -> TokenMetadata:
        if network in {'rinkeby', 'mumbai', 'rinkeby2', 'rinkeby3', 'rinkeby4'}:
            try:
                tokenIdValue = int(tokenId)
            except ValueError:
                # pylint: disable=raise-missing-from
                raise NotFoundException()
            if tokenIdValue <= 0 or tokenIdValue > 10000:
                # pylint: disable=raise-missing-from
                raise NotFoundException()
            return TokenMetadata(
                tokenId=tokenId,
                tokenIndex=tokenIdValue - 1,
                name=f'MDTP #{tokenId}',
                description=None,
                image='',
                url=None,
                groupId=None,
            )
        metadataUrl = await self.contractStore.get_token_metadata_url(network=network, tokenId=tokenId)
        metadataJson = await self._get_json_content(url=metadataUrl)
        return TokenMetadata(
            tokenId=metadataJson['tokenId'],
            tokenIndex=metadataJson.get('tokenIndex') or metadataJson['tokenId'] - 1,
            name=metadataJson.get('name') or metadataJson.get('title') or '',
            description=metadataJson.get('description'),
            image=metadataJson.get('image') or metadataJson.get('imageUrl') or '',
            url=metadataJson.get('url'),
            groupId=metadataJson.get('groupId'),
        )

    async def get_token_content(self, network: str, tokenId: str) -> TokenMetadata:
        if network in {'rinkeby', 'mumbai', 'rinkeby2', 'rinkeby3', 'rinkeby4'}:
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
                description=None,
                image=f'https://mdtp-images.s3-eu-west-1.amazonaws.com/uploads/b88762dd-7605-4447-949b-d8ba99e6f44d/{tokenIndex}.png',
                url=None,
                groupId=None,
            )
        contentUrl = await self.contractStore.get_token_content_url(network=network, tokenId=tokenId)
        contentJson = await self._get_json_content(url=contentUrl)
        return TokenMetadata(
            tokenId=contentJson['tokenId'],
            tokenIndex=contentJson.get('tokenIndex') or contentJson['tokenId'] - 1,
            name=contentJson.get('name') or contentJson.get('title') or '',
            description=contentJson.get('description'),
            image=contentJson.get('image') or contentJson.get('imageUrl') or '',
            url=contentJson.get('url'),
            groupId=contentJson.get('groupId'),
        )

    async def get_token_default_grid_item(self, network: str, tokenId: str) -> GridItem:
        contentUrl = await self.contractStore.get_token_content_url(network=network, tokenId=tokenId)
        metadata = await self.get_token_content(network=network, tokenId=tokenId)
        return GridItem(
            gridItemId=tokenId-1,
            createdDate=date_util.datetime_from_now(),
            updatedDate=date_util.datetime_from_now(),
            network=network,
            tokenId=metadata.tokenId,
            contentUrl=contentUrl,
            title=metadata.name,
            description=metadata.description,
            imageUrl=metadata.image,
            resizableImageUrl=metadata.image,
            ownerId='',
            url=metadata.url,
            groupId=metadata.groupId,
        )

    async def retrieve_grid_item(self, network: str, tokenId: int) -> GridItem:
        gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        return gridItem

    async def list_grid_items(self, network: str, ownerId: Optional[str] = None, updatedSinceDate: Optional[datetime.datetime] = None, groupId: Optional[str] = None) -> Sequence[GridItem]:
        filters = [StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network)]
        if updatedSinceDate:
            filters.append(DateFieldFilter(fieldName=GridItemsTable.c.updatedDate.key, gte=updatedSinceDate.replace(tzinfo=None)))
        if groupId:
            filters.append(DateFieldFilter(fieldName=GridItemsTable.c.groupId.key, eq=groupId))
        if ownerId:
            filters.append(DateFieldFilter(fieldName=GridItemsTable.c.ownerId.key, eq=ownerId))
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

    async def build_base_image_deferred(self, network: str, delay: Optional[int] = None) -> Optional[BaseImage]:
        await self.workQueue.send_message(message=BuildBaseImageMessageContent(network=network).to_message(), delaySeconds=delay or 0)

    async def build_base_image(self, network: str) -> Optional[BaseImage]:
        # NOTE(krishan711): everything is double so that it works well in retina
        scale = 2
        canvasSizeX = 100
        canvasSizeY = 100
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
        gridItems = await self.list_grid_items(network=network, updatedSinceDate=latestBaseImage.generatedDate if latestBaseImage else None)
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
        emptyTokenImage = PILImage.new('RGB', (tokenWidth, tokenHeight))
        for gridItem in gridItems:
            logging.info(f'Drawing grid item {gridItem.gridItemId}')
            imageUrl = self._get_resized_image_url(resizableImageUrl=gridItem.resizableImageUrl, width=tokenWidth, height=tokenHeight) if gridItem.resizableImageUrl else gridItem.imageUrl
            if imageUrl.startswith('ipfs://'):
                imageResponse = await self.ipfsManager.read_file(cid=imageUrl.replace('ipfs://', ''))
            else:
                imageResponse = await self.requester.get(url=imageUrl)
            contentBuffer = BytesIO(imageResponse.content)
            with PILImage.open(fp=contentBuffer) as tokenImage:
                image = tokenImage.resize(size=(tokenWidth, tokenHeight))
            tokenIndex = gridItem.tokenId - 1
            xPosition = tokenIndex % canvasSizeX
            yPosition = math.floor(tokenIndex / canvasSizeY)
            outputImage.paste(emptyTokenImage, (xPosition * tokenWidth, yPosition * tokenHeight))
            outputImage.paste(image, (xPosition * tokenWidth, yPosition * tokenHeight), mask=image if image.mode == 'RGBA' else None)
        outputFilePath = 'base_image_output.png'
        outputImage.save(outputFilePath)
        imageId = await self.imageManager.upload_image_from_file(filePath=outputFilePath)
        await file_util.remove_file(filePath=outputFilePath)
        imageUrl = f'{_API_URL}/v1/images/{imageId}/go'
        baseImage = await self.saver.create_base_image(network=network, url=imageUrl, generatedDate=generatedDate)
        return baseImage

    async def get_network_status(self, network: str) -> NetworkStatus:
        mintLimit = await self.contractStore.get_mint_limit(network=network)
        filters = [
            StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network),
            StringFieldFilter(fieldName=GridItemsTable.c.ownerId.key, ne=NON_OWNER_ID),
        ]
        mintCount = await self.retriever.count_grid_items(fieldFilters=filters)
        filters = [
            StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network),
            StringFieldFilter(fieldName=GridItemsTable.c.ownerId.key, eq=NON_OWNER_ID),
        ]
        randomGridItems = await self.retriever.list_grid_items(fieldFilters=filters, orders=[RandomOrder()], limit=1)
        randomAvailableTokenId = randomGridItems[0].tokenId if len(randomGridItems) > 0 else None
        return NetworkStatus(mintLimit=mintLimit, mintCount=mintCount, randomAvailableTokenId=randomAvailableTokenId)

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

    async def create_metadata_for_token(self, network: str, tokenId: int, shouldUseIpfs: bool, name: str, description: Optional[str], imageUrl: str, url: Optional[str]) -> str:
        metadataUrls = await self.create_metadata_for_token_group(network=network, tokenId=tokenId, shouldUseIpfs=shouldUseIpfs, width=1, height=1, name=name, description=description, imageUrl=imageUrl, url=url)
        return metadataUrls[0]

    async def create_metadata_for_token_group(self, network: str, tokenId: int, shouldUseIpfs: bool, width: int, height: int, name: str, description: Optional[str], imageUrl: str, url: Optional[str]) -> List[str]:
        groupId = str(uuid.uuid4())
        imageId = await self.imageManager.upload_image_from_url(url=imageUrl)
        outputDirectory = f'./token-group-images-{str(uuid.uuid4())}'
        imageFileNames = await self.imageManager.crop_image(imageId=imageId, outputDirectory=outputDirectory, width=width, height=height)
        if shouldUseIpfs:
            fileContentMap = {imageFileName: open(os.path.join(outputDirectory, imageFileName), 'rb') for imageFileName in imageFileNames}  # pylint: disable=consider-using-with
            cid = await self.ipfsManager.upload_files_to_ipfs(fileContentMap=fileContentMap)
            for openFile in fileContentMap.values():
                openFile.close()
            imageUrls = [f'ipfs://{cid}/{imageFileName}' for imageFileName in imageFileNames]
        else:
            target = f's3://mdtp-images/uploads/n/{network}/t/{tokenId}/gi/{str(uuid.uuid4())}'
            await self.s3Manager.upload_directory(sourceDirectory=outputDirectory, target=target, accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
            outputUrl = target.replace('s3://mdtp-images', 'https://mdtp-images.s3.amazonaws.com')
            imageUrls = [os.path.join(outputUrl, imageFileName) for imageFileName in imageFileNames]
        await file_util.remove_directory(directory=outputDirectory)
        outputDirectory = f'./token-group-{str(uuid.uuid4())}'
        await file_util.create_directory(directory=outputDirectory)
        metadataFileNames = []
        for row in range(0, height):
            for column in range(0, width):
                index = (row * width) + column
                data = {
                    'name': name,
                    'description': description or None,
                    'image': imageUrls[index],
                    'url': url or None,
                    'groupId': groupId,
                }
                metadataFileName = f'{index}.json'
                with open(os.path.join(outputDirectory, metadataFileName), "w") as metadataFile:
                    metadataFile.write(json.dumps(data))
                metadataFileNames.append(metadataFileName)
        if shouldUseIpfs:
            fileContentMap = {metadataFileName: open(os.path.join(outputDirectory, metadataFileName), 'r') for metadataFileName in metadataFileNames}  # pylint: disable=consider-using-with
            cid = await self.ipfsManager.upload_files_to_ipfs(fileContentMap=fileContentMap)
            for openFile in fileContentMap.values():
                openFile.close()
            tokenMetadataUrls = [f'ipfs://{cid}/{metadataFileName}' for metadataFileName in metadataFileNames]
        else:
            target = f's3://mdtp-images/uploads/n/{network}/t/{tokenId}/gm/{str(uuid.uuid4())}'
            await self.s3Manager.upload_directory(sourceDirectory=outputDirectory, target=target, accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
            outputUrl = target.replace('s3://mdtp-images', 'https://mdtp-images.s3.amazonaws.com')
            tokenMetadataUrls = [os.path.join(outputUrl, metadataFileName) for metadataFileName in metadataFileNames]
        await file_util.remove_directory(directory=outputDirectory)
        return tokenMetadataUrls

    async def update_offchain_contents_for_token_group(self, network: str, tokenId: int, width: int, height: int, blockNumber: int, contentUrls: List[str], signature: str, shouldAllowPendingChange: bool) -> None:
        currentBlockNumber = await self.contractStore.get_latest_block_number(network=network)
        if abs(currentBlockNumber - blockNumber) > 10:
            raise BadRequestException(message='blockNumber too far from current blockNumber')
        signedMessage = json.dumps({
            'network': network,
            'tokenId': tokenId,
            'width': width,
            'height': height,
            'blockNumber': blockNumber,
            'tokenMetadataUrls': contentUrls,
        }, separators=(',', ':'))
        messageHash = defunct_hash_message(text=signedMessage)
        signer = w3.eth.account.recoverHash(message_hash=messageHash, signature=signature)
        isPending = False
        tokenIds = []
        for row in range(0, height):
            for column in range(0, width):
                innerTokenId = tokenId + (row * 100) + column
                tokenIds.append(innerTokenId)
                try:
                    tokenOwnerId = await self.contractStore.get_token_owner(network=network, tokenId=innerTokenId)
                except BadRequestException as exception:
                    if 'owner query for nonexistent token' in exception.message:
                        tokenOwnerId = NON_OWNER_ID
                        isPending = True
                    else:
                        raise exception
                if tokenOwnerId != signer and not (shouldAllowPendingChange and tokenOwnerId == NON_OWNER_ID):
                    raise BadRequestException(message='Owners do not match')
        promises = []
        for index, innerTokenId in enumerate(tokenIds):
            if isPending:
                promises.append(self.saver.create_offchain_pending_content(network=network, tokenId=innerTokenId, contentUrl=contentUrls[index], blockNumber=blockNumber, ownerId=signer, signature=signature, signedMessage=signedMessage))
            else:
                promises.append(self.saver.create_offchain_content(network=network, tokenId=innerTokenId, contentUrl=contentUrls[index], blockNumber=blockNumber, ownerId=signer, signature=signature, signedMessage=signedMessage))
        await asyncio.gather(*promises)
        for innerTokenId in tokenIds:
            if isPending:
                await self.update_token_deferred(network=network, tokenId=innerTokenId, delay=60)
            else:
                await self.update_token(network=network, tokenId=innerTokenId)

    async def update_tokens_deferred(self, network: str, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UpdateTokensMessageContent(network=network).to_message(), delaySeconds=delay or 0)

    async def update_tokens(self, network: str) -> None:
        networkUpdate = await self.retriever.get_network_update_by_network(network=network)
        latestProcessedBlockNumber = networkUpdate.latestBlockNumber
        latestBlockNumber = await self.contractStore.get_latest_block_number(network=network)
        batchSize = 2500
        tokenIdsToUpdate = set()
        logging.info(f'Processing blocks from {latestProcessedBlockNumber} to {latestBlockNumber}')
        for startBlockNumber in range(latestProcessedBlockNumber + 1, latestBlockNumber + 1, batchSize):
            endBlockNumber = min(startBlockNumber + batchSize, latestBlockNumber)
            transferredTokenIds = await self.contractStore.get_transferred_token_ids_in_blocks(network=network, startBlockNumber=startBlockNumber, endBlockNumber=endBlockNumber)
            logging.info(f'Found {len(transferredTokenIds)} transferred tokens in blocks {startBlockNumber}-{endBlockNumber}')
            tokenIdsToUpdate.update(transferredTokenIds)
            updatedTokenIds = await self.contractStore.get_updated_token_ids_in_blocks(network=network, startBlockNumber=startBlockNumber, endBlockNumber=endBlockNumber)
            logging.info(f'Found {len(updatedTokenIds)} updated tokens in blocks {startBlockNumber}-{endBlockNumber}')
            tokenIdsToUpdate.update(updatedTokenIds)
        for tokenId in list(tokenIdsToUpdate):
            await self.update_token_deferred(network=network, tokenId=tokenId)
        await self.saver.update_network_update(networkUpdateId=networkUpdate.networkUpdateId, latestBlockNumber=latestBlockNumber)

    async def update_all_tokens_deferred(self, network: str, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UpdateAllTokensMessageContent(network=network).to_message(), delaySeconds=delay or 0)

    async def update_all_tokens(self, network: str) -> None:
        tokenCount = await self.contractStore.get_total_supply(network=network)
        for tokenIndex in range(tokenCount):
            await self.update_token_deferred(network=network, tokenId=(tokenIndex + 1))

    async def upload_token_image_deferred(self, network: str, tokenId: int, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UploadTokenImageMessageContent(network=network, tokenId=tokenId).to_message(), delaySeconds=delay or 0)

    async def upload_token_image(self, network: str, tokenId: int) -> None:
        logging.info(f'Uploading image for token {tokenId}')
        gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        imageId = await self.imageManager.upload_image_from_url(url=gridItem.imageUrl)
        resizableImageUrl = f'{_API_URL}/v1/images/{imageId}/go'
        await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, resizableImageUrl=resizableImageUrl)
        if gridItem.groupId:
            await self.update_grid_item_group_image_deferred(network=network, ownerId=gridItem.ownerId, groupId=gridItem.groupId)

    async def update_grid_item_group_image_deferred(self, network: str, ownerId: str, groupId: str, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UpdateGroupImageMessageContent(network=network, ownerId=ownerId, groupId=groupId).to_message(), delaySeconds=delay or 0)

    async def update_grid_item_group_image(self, network: str, ownerId: str, groupId: str) -> None:
        logging.info(f'Updating image for network{network} ownerId {ownerId} groupId {groupId}')
        gridItems = await self.list_grid_items(network=network, ownerId=ownerId, groupId=groupId)
        if any(not gridItem.resizableImageUrl for gridItem in gridItems):
            logging.info(f'Skipping updating image for network{network} ownerId {ownerId} groupId {groupId} as not all gridItems have a resizableImageUrl')
            return
        try:
            gridItemGroupImage = await self.retriever.get_grid_item_group_image_by_network_owner_id_group_id(network=network, ownerId=ownerId, groupId=groupId)
        except NotFoundException:
            gridItemGroupImage = None
        canvasTokenWidth = 100
        canvasTokenHeight = 100
        xPositions = [(gridItem.tokenId - 1) % canvasTokenWidth for gridItem in gridItems]
        yPositions = [math.floor((gridItem.tokenId - 1) / canvasTokenHeight) for gridItem in gridItems]
        minX = min(xPositions)
        gridSizeX = max(xPositions) - minX + 1
        minY = min(yPositions)
        gridSizeY = max(yPositions) - minY + 1
        # NOTE(krishan711): everything is double so that it works well in retina
        scale = 2
        gridWidth = 1000 * scale
        tokenWidth = math.ceil(gridWidth / gridSizeX)
        gridHeight = 1000 * scale
        tokenHeight = math.ceil(gridHeight / gridSizeY)
        outputImage = PILImage.new('RGB', (gridWidth, gridHeight))
        for gridItem in gridItems:
            logging.info(f'Drawing grid item {gridItem.gridItemId}')
            imageUrl = self._get_resized_image_url(resizableImageUrl=gridItem.resizableImageUrl, width=tokenWidth, height=tokenHeight) if gridItem.resizableImageUrl else gridItem.imageUrl
            if imageUrl.startswith('ipfs://'):
                imageResponse = await self.ipfsManager.read_file(cid=imageUrl.replace('ipfs://', ''))
            else:
                imageResponse = await self.requester.get(url=imageUrl)
            contentBuffer = BytesIO(imageResponse.content)
            with PILImage.open(fp=contentBuffer) as tokenImage:
                image = tokenImage.resize(size=(tokenWidth, tokenHeight))
            tokenIndex = gridItem.tokenId - 1
            xPosition = (tokenIndex % canvasTokenHeight) - minX
            yPosition = math.floor(tokenIndex / canvasTokenHeight) - minY
            outputImage.paste(image, (xPosition * tokenWidth, yPosition * tokenHeight), image)
        outputFilePath = 'grid_item_group_image_output.png'
        outputImage.save(outputFilePath)
        imageId = await self.imageManager.upload_image_from_file(filePath=outputFilePath)
        await file_util.remove_file(filePath=outputFilePath)
        imageUrl = f'{_API_URL}/v1/images/{imageId}/go'
        if not gridItemGroupImage:
            await self.saver.create_grid_item_group_image(network=network, ownerId=ownerId, groupId=groupId, imageUrl=imageUrl)
        else:
            await self.saver.update_grid_item_group_image(gridItemGroupImageId=gridItemGroupImage.gridItemGroupImageId, imageUrl=imageUrl)

    async def update_token_deferred(self, network: str, tokenId: str, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UpdateTokenMessageContent(network=network, tokenId=tokenId).to_message(), delaySeconds=delay or 0)

    async def update_token(self, network: str, tokenId: int) -> None:
        logging.info(f'Updating token {network}/{tokenId}')
        try:
            ownerId = await self.contractStore.get_token_owner(network=network, tokenId=tokenId)
        except Exception: # pylint: disable=broad-except
            ownerId = NON_OWNER_ID
        contentUrl = await self.contractStore.get_token_content_url(network=network, tokenId=tokenId)
        blockNumber = await self.contractStore.get_latest_update_block_number(network=network, tokenId=tokenId) or 0
        # Resolve pending contents for the current owner only
        offchainPendingContents = await self.retriever.list_offchain_pending_contents(fieldFilters=[
            StringFieldFilter(fieldName=OffchainPendingContentsTable.c.network.key, eq=network),
            StringFieldFilter(fieldName=OffchainPendingContentsTable.c.tokenId.key, eq=tokenId),
            StringFieldFilter(fieldName=OffchainPendingContentsTable.c.ownerId.key, eq=ownerId),
            StringFieldFilter(fieldName=OffchainPendingContentsTable.c.appliedDate.key, eq=None),
        ], orders=[Order(fieldName=OffchainContentsTable.c.blockNumber.key, direction=Direction.ASCENDING)])
        for offchainPendingContent in offchainPendingContents:
            await self.saver.create_offchain_content(network=offchainPendingContent.network, tokenId=offchainPendingContent.tokenId, contentUrl=offchainPendingContent.contentUrl, blockNumber=offchainPendingContent.blockNumber, ownerId=offchainPendingContent.ownerId, signature=offchainPendingContent.signature, signedMessage=offchainPendingContent.signedMessage)
            await self.saver.update_offchain_pending_content(offchainPendingContentId=offchainPendingContent.offchainPendingContentId, appliedDate=date_util.datetime_from_now())
        source = 'onchain'
        latestOffchainContents = await self.retriever.list_offchain_contents(fieldFilters=[
            StringFieldFilter(fieldName=OffchainContentsTable.c.network.key, eq=network),
            StringFieldFilter(fieldName=OffchainContentsTable.c.tokenId.key, eq=tokenId),
        ], orders=[Order(fieldName=OffchainContentsTable.c.blockNumber.key, direction=Direction.DESCENDING)], limit=1)
        if len(latestOffchainContents) > 0 and (latestOffchainContents[0].blockNumber > blockNumber):
            contentUrl = latestOffchainContents[0].contentUrl
            source = 'offchain'
            blockNumber = latestOffchainContents[0].blockNumber
        contentJson = await self._get_json_content(url=contentUrl)
        title = contentJson.get('title') or contentJson.get('name') or None
        imageUrl = contentJson.get('imageUrl') or contentJson.get('image') or None
        description = contentJson.get('description')
        url = contentJson.get('url')
        groupId = contentJson.get('groupId') or contentJson.get('blockId')
        if title is None or imageUrl is None:
            logging.info('Getting metadata because title or image is None')
            metadata = await self.get_token_metadata(network=network, tokenId=tokenId)
            title = title or metadata.title
            imageUrl = imageUrl or metadata.image
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        except NotFoundException:
            logging.info(f'Creating token {network}/{tokenId}')
            gridItem = await self.saver.create_grid_item(tokenId=tokenId, network=network, contentUrl=contentUrl, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=None, url=url, groupId=groupId, ownerId=ownerId, blockNumber=blockNumber, source=source)
        resizableImageUrl = gridItem.resizableImageUrl
        if gridItem.imageUrl != imageUrl:
            resizableImageUrl = None
        if not resizableImageUrl:
            await self.upload_token_image_deferred(network=network, tokenId=tokenId, delay=1)
        if gridItem.contentUrl != contentUrl or gridItem.title != title or gridItem.description != description or gridItem.imageUrl != imageUrl or gridItem.resizableImageUrl != resizableImageUrl or gridItem.url != url or gridItem.groupId != groupId or gridItem.ownerId != ownerId:
            logging.info(f'Saving token {network}/{tokenId}')
            await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, contentUrl=contentUrl, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, url=url, groupId=groupId, ownerId=ownerId, blockNumber=blockNumber, source=source)

    async def go_to_image(self, imageId: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        return await self.imageManager.get_image_url(imageId=imageId, width=width, height=height)

    async def go_to_token_image(self, network: str, tokenId: int, width: Optional[int] = None, height: Optional[int] = None) -> str:
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        except NotFoundException:
            gridItem = await self.get_token_default_grid_item(network=network, tokenId=tokenId)
        if gridItem.resizableImageUrl:
            return self._get_resized_image_url(resizableImageUrl=gridItem.resizableImageUrl, width=width, height=height)
        return gridItem.imageUrl

    async def go_to_token_group_image(self, network: str, tokenId: int, width: Optional[int] = None, height: Optional[int] = None) -> str:
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        except NotFoundException:
            return await self.go_to_token_image(network=network, tokenId=tokenId, width=width, height=height)
        if not gridItem.groupId:
            return await self.go_to_token_image(network=network, tokenId=tokenId, width=width, height=height)
        try:
            gridItemGroupImage = await self.retriever.get_grid_item_group_image_by_network_owner_id_group_id(network=gridItem.network, ownerId=gridItem.ownerId, groupId=gridItem.groupId)
        except NotFoundException:
            return await self.go_to_token_image(network=network, tokenId=tokenId, width=width, height=height)
        return self._get_resized_image_url(resizableImageUrl=gridItemGroupImage.imageUrl, width=width, height=height)
