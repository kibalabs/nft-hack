import dataclasses
from typing import Any, List, Optional

from core.exceptions import NotFoundException
from core.web3.eth_client import EthClientInterface
from web3.main import Web3

@dataclasses.dataclass
class Contract:
    network: str
    address: str
    abi: dict
    ethClient: EthClientInterface
    ownerOfMethodName: str
    tokenUriMethodName: str
    totalSupplyMethodName: str

class ContractStore:

    def __init__(self, contracts: List[Contract]):
        self.contracts = contracts

    def get_contract(self, network: str) -> Contract:
        for contract in self.contracts:
            if contract.network == network:
                return contract
        raise NotFoundException()

    async def _call_function(self, contract: Contract, functionName: str, arguments: Optional[dict] = None) -> List[Any]:
        methodAbi = [abi for abi in contract.abi if abi.get('name') == functionName][0]
        response = await contract.ethClient.call_function(toAddress=contract.address, contractAbi=contract.abi, functionAbi=methodAbi, arguments=arguments)
        return response

    async def get_owner_id(self, network: str, tokenId: int) -> str:
        contract = self.get_contract(network=network)
        ownerIdResponse = await self._call_function(contract=contract, functionName=contract.ownerOfMethodName, arguments={'tokenId': int(tokenId)})
        print('ownerIdResponse', ownerIdResponse)
        ownerId = Web3.toChecksumAddress(ownerIdResponse[0].strip())
        print('ownerId', ownerId)
        return ownerId

    async def get_total_supply(self, network: str) -> int:
        contract = self.get_contract(network=network)
        tokenCountResponse = await self._call_function(contract=contract, functionName=contract.totalSupplyMethodName)
        print('tokenCountResponse', tokenCountResponse)
        tokenCount = int(tokenCountResponse[0])
        print('tokenCount', tokenCount)
        return tokenCount

    async def get_token_content_url(self, network: str, tokenId: int) -> int:
        contract = self.get_contract(network=network)
        tokenUriResponse = await self._call_function(contract=contract, functionName=contract.tokenUriMethodName, arguments={'tokenId': int(tokenId)})
        print('tokenUriResponse', tokenUriResponse)
        tokenUri = tokenUriResponse[0].strip()
        print('tokenUri', tokenUri)
        return tokenUri
