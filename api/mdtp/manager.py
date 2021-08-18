import datetime
from io import BytesIO
import json
import logging
import math
import os
from typing import Any, Dict, List
from typing import Sequence
from typing import Optional
import urllib.parse as urlparse
import uuid

from core.exceptions import KibaException, NotFoundException
from core.requester import Requester
from core.queues.sqs_message_queue import SqsMessageQueue
from core.util import date_util, dict_util, file_util
from core.s3_manager import S3Manager
from core.s3_manager import S3PresignedUpload
from core.store.retriever import DateFieldFilter, Direction, Order, StringFieldFilter
from PIL import Image as PILImage
from web3 import Web3
from mdtp.contract_store import ContractStore
from mdtp.ipfs_manager import IpfsManager

from mdtp.store.saver import MdtpSaver
from mdtp.store.retriever import MdtpRetriever
from mdtp.model import BaseImage, NetworkSummary, TokenMetadata
from mdtp.model import GridItem
from mdtp.messages import BuildBaseImageMessageContent, UpdateAllTokensMessageContent, UpdateTokenMessageContent
from mdtp.messages import UpdateTokensMessageContent
from mdtp.messages import UploadTokenImageMessageContent
from mdtp.image_manager import ImageManager
from mdtp.store.schema import BaseImagesTable, GridItemsTable

_KILOBYTE = 1024
_MEGABYTE = _KILOBYTE * 1024
_CACHE_CONTROL_TEMPORARY_FILE = 'public,max-age=1'
_CACHE_CONTROL_FINAL_FILE = 'public,max-age=31536000'

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
                raise NotFoundException()
            if tokenIdValue <= 0 or tokenIdValue > 10000:
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

    async def get_token_default_grid_item(self, tokenId: str) -> GridItem:
        metadata = await self.get_token_content(tokenId=tokenId)
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
            url=metadata.url,
            groupId=metadata.groupId,
        )

    async def retrieve_grid_item(self, network: str, tokenId: int) -> GridItem:
        gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        return gridItem

    async def list_grid_items(self, network: str, updatedSinceDate: Optional[datetime.datetime] = None, groupId: Optional[str] = None) -> Sequence[GridItem]:
        filters = [StringFieldFilter(fieldName=GridItemsTable.c.network.key, eq=network)]
        if updatedSinceDate:
            filters.append(DateFieldFilter(fieldName=GridItemsTable.c.updatedDate.key, gte=updatedSinceDate.replace(tzinfo=None)))
        if groupId:
            filters.append(DateFieldFilter(fieldName=GridItemsTable.c.groupId.key, eq=groupId))
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
        for gridItem in gridItems:
            logging.info(f'Drawing grid item {gridItem.gridItemId}')
            imageUrl = f'{gridItem.resizableImageUrl}?w={tokenWidth}&h={tokenHeight}' if gridItem.resizableImageUrl else gridItem.imageUrl
            if imageUrl.startswith('ipfs://'):
                imageResponse = await self.ipfsManager.read_file(cid=imageUrl.replace('ipfs://', ''))
            else:
                imageResponse = await self.requester.get(url=imageUrl)
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

    async def create_metadata_for_token(self, network: str, tokenId: int, shouldUseIpfs: bool, name: str, description: Optional[str], imageUrl: str, url: Optional[str]) -> str:
        metadata_urls = await self.create_metadata_for_token_group(network=network, tokenId=tokenId, shouldUseIpfs=shouldUseIpfs, width=1, height=1, name=name, description=description, imageUrl=imageUrl, url=url)
        return metadata_urls[0]

    async def create_metadata_for_token_group(self, network: str, tokenId: int, shouldUseIpfs: bool, width: int, height: int, name: str, description: Optional[str], imageUrl: str, url: Optional[str]) -> List[str]:
        groupId = str(uuid.uuid4())
        imageId = await self.imageManager.upload_image_from_url(url=imageUrl)
        outputDirectory = f'./token-group-images-{str(uuid.uuid4())}'
        imageFileNames = await self.imageManager.crop_image(imageId=imageId, outputDirectory=outputDirectory, width=width, height=height)
        if shouldUseIpfs:
            fileContentMap = {imageFileName: open(os.path.join(outputDirectory, imageFileName), 'rb') for imageFileName in imageFileNames}
            cid = await self.ipfsManager.upload_files_to_ipfs(fileContentMap=fileContentMap)
            for openFile in fileContentMap.values():
                openFile.close()
            imageUrls = [f'ipfs://{cid}/{imageFileName}' for imageFileName in imageFileNames]
        else:
            target = f's3://mdtp-images/uploads/n/{network}/t/{tokenId}/gi/{str(uuid.uuid4())}'
            await self.s3Manager.upload_directory(sourceDirectory=outputDirectory, target=target, accessControl='public-read', cacheControl='public,max-age=31536000')
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
            fileContentMap = {metadataFileName: open(os.path.join(outputDirectory, metadataFileName), 'r') for metadataFileName in metadataFileNames}
            cid = await self.ipfsManager.upload_files_to_ipfs(fileContentMap=fileContentMap)
            for openFile in fileContentMap.values():
                openFile.close()
            tokenMetadataUrls = [f'ipfs://{cid}/{metadataFileName}' for metadataFileName in metadataFileNames]
        else:
            target = f's3://mdtp-images/uploads/n/{network}/t/{tokenId}/gm/{str(uuid.uuid4())}'
            await self.s3Manager.upload_directory(sourceDirectory=outputDirectory, target=target, accessControl='public-read', cacheControl='public,max-age=31536000')
            outputUrl = target.replace('s3://mdtp-images', 'https://mdtp-images.s3.amazonaws.com')
            tokenMetadataUrls = [os.path.join(outputUrl, metadataFileName) for metadataFileName in metadataFileNames]
        await file_util.remove_directory(directory=outputDirectory)
        return tokenMetadataUrls

    async def update_tokens_deferred(self, network: str, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UpdateTokensMessageContent(network=network).to_message(), delaySeconds=delay or 0)

    async def update_tokens(self, network: str) -> None:
        try:
            networkUpdate = await self.retriever.get_network_update_by_network(network=network)
        except NotFoundException:
            raise KibaException(message=f'No networkUpdate has been created for network {network}')
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
        resizableImageUrl = f'https://d2a7i2107hou45.cloudfront.net/v1/images/{imageId}/go'
        await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, resizableImageUrl=resizableImageUrl)

    async def update_token_deferred(self, network: str, tokenId: str, delay: Optional[int] = None) -> None:
        await self.workQueue.send_message(message=UpdateTokenMessageContent(network=network, tokenId=tokenId).to_message(), delaySeconds=delay or 0)

    async def update_token(self, network: str, tokenId: int) -> None:
        logging.info(f'Updating token {network}/{tokenId}')
        try:
            ownerId = await self.contractStore.get_token_owner(network=network, tokenId=tokenId)
        except Exception:
            ownerId = '0x0000000000000000000000000000000000000000'
        contentUrl = await self.contractStore.get_token_content_url(network=network, tokenId=tokenId)
        contentJson = await self._get_json_content(url=contentUrl)
        title = contentJson.get('title') or contentJson.get('name') or None
        imageUrl = contentJson.get('imageUrl') or contentJson.get('image') or None
        description = contentJson.get('description')
        url = contentJson.get('url')
        groupId = contentJson.get('groupId') or contentJson.get('blockId')
        if title is None or imageUrl is None:
            logging.info(f'Getting metadata because title or image is None')
            metadata = await self.get_token_metadata(network=network, tokenId=tokenId)
            title = title or metadata.title
            imageUrl = imageUrl or metadata.image
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        except NotFoundException:
            logging.info(f'Creating token {network}/{tokenId}')
            gridItem = await self.saver.create_grid_item(tokenId=tokenId, network=network, contentUrl=contentUrl, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=None, url=url, groupId=groupId, ownerId=ownerId)
        resizableImageUrl = gridItem.resizableImageUrl
        if gridItem.imageUrl != imageUrl:
            resizableImageUrl = None
        if not resizableImageUrl:
            await self.upload_token_image_deferred(network=network, tokenId=tokenId, delay=1)
        if gridItem.contentUrl != contentUrl or gridItem.title != title or gridItem.description != description or gridItem.imageUrl != imageUrl or gridItem.resizableImageUrl != resizableImageUrl or gridItem.url != url or gridItem.groupId != groupId or gridItem.ownerId != ownerId:
            logging.info(f'Saving token {network}/{tokenId}')
            await self.saver.update_grid_item(gridItemId=gridItem.gridItemId, contentUrl=contentUrl, title=title, description=description, imageUrl=imageUrl, resizableImageUrl=resizableImageUrl, url=url, groupId=groupId, ownerId=ownerId)

    async def go_to_image(self, imageId: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        return await self.imageManager.get_image_url(imageId=imageId, width=width, height=height)

    async def go_to_token_image(self, network: str, tokenId: int, width: Optional[int] = None, height: Optional[int] = None) -> str:
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(network=network, tokenId=tokenId)
        except NotFoundException:
            gridItem = await self.get_token_default_grid_item(tokenId=tokenId)
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
