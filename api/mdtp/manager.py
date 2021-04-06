import json
import logging
from typing import Dict
from typing import Sequence

from web3 import Web3

from mdtp.core.requester import Requester
from mdtp.eth_client import EthClientInterface
from mdtp.store.saver import MdtpSaver
from mdtp.store.retriever import MdtpRetriever
from mdtp.core.exceptions import NotFoundException
from mdtp.model import GridItem

class MdtpManager:

    def __init__(self, requester: Requester, retriever: MdtpRetriever, saver: MdtpSaver, ethClient: EthClientInterface, contractAddress: str, contractJson: Dict):
        self.w3 = Web3()
        self.requester = requester
        self.retriever = retriever
        self.saver = saver
        self.ethClient = ethClient
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

    async def update(self) -> None:
        tokenCountResponse = await self.ethClient.call_function(toAddress=self.contractAddress, contractAbi=self.contractAbi, functionAbi=self.contractTotalSupplyMethodAbi, arguments={})
        tokenCount = tokenCountResponse[0]
        print('tokenCount', tokenCount)
        for tokenIndex in range(tokenCount):
            await self.update_token(tokenId=(tokenIndex + 1))

    async def update_token(self, tokenId: int) -> None:
        logging.info(f'Updating token {tokenId}')
        tokenMetadataUrlResponse = await self.ethClient.call_function(toAddress=self.contractAddress, contractAbi=self.contractAbi, functionAbi=self.contractTokenUriAbi, arguments={'tokenId': int(tokenId)})
        tokenMetadataUrl = tokenMetadataUrlResponse[0].strip()
        tokenMetadataResponse = await self.requester.make_request(method='GET', url=tokenMetadataUrl)
        tokenMetadataJson = json.loads(tokenMetadataResponse.text)
        network = 'rinkeby'
        try:
            gridItem = await self.retriever.get_grid_item_by_token_id_network(tokenId=tokenId, network=network)
        except NotFoundException:
            ownerIdResponse = await self.ethClient.call_function(toAddress=self.contractAddress, contractAbi=self.contractAbi, functionAbi=self.contractTokenUriAbi, arguments={'tokenId': int(tokenId)})
            ownerId = ownerIdResponse[0].strip()
            title = tokenMetadataJson.get('title') or tokenMetadataJson.get('name')
            imageUrl = tokenMetadataJson.get('imageUrl') or tokenMetadataJson.get('image')
            gridItem = await self.saver.create_grid_item(tokenId=tokenId, network=network, title=title, description=tokenMetadataJson.get('description'), imageUrl=imageUrl, ownerId=ownerId)
