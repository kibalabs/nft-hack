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
    tokenContentUriMethodName: str
    totalSupplyMethodName: str
    setTokenContentUriMethodName: str
    setTokenContentUriFieldName: str
    transferTokenMethodName: str
    mintTokenMethodName: str

class ContractStore:

    def __init__(self, contracts: List[Contract], accountAddress: Optional[str] = None, privateKey: Optional[str] = None):
        self.contracts = contracts
        self.accountAddress = accountAddress
        self.privateKey = privateKey

    def get_contract(self, network: str) -> Contract:
        for contract in self.contracts:
            if contract.network == network:
                return contract
        raise NotFoundException()

    async def _call_function(self, contract: Contract, methodName: str, arguments: Optional[dict] = None) -> List[Any]:
        functionAbi = [abi for abi in contract.abi if abi.get('name') == methodName][0]
        response = await contract.ethClient.call_function(toAddress=contract.address, contractAbi=contract.abi, functionAbi=functionAbi, arguments=arguments)
        return response

    async def _send_transaction(self, contract: Contract, methodName: str, nonce: int, gas: int, gasPrice: int, arguments: Optional[dict] = None) -> str:
        if not self.accountAddress or not self.privateKey:
            raise Exception('accountAddress and privateKey must be provided to ContractStore in order to make transactions')
        functionAbi = [abi for abi in contract.abi if abi.get('name') == methodName][0]
        transactionHash = await contract.ethClient.send_transaction(toAddress=contract.address, contractAbi=contract.abi, functionAbi=functionAbi, arguments=arguments, fromAddress=self.accountAddress, privateKey=self.privateKey, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def get_token_owner(self, network: str, tokenId: int) -> str:
        contract = self.get_contract(network=network)
        ownerIdResponse = await self._call_function(contract=contract, methodName=contract.ownerOfMethodName, arguments={'tokenId': int(tokenId)})
        ownerId = Web3.toChecksumAddress(ownerIdResponse[0].strip())
        return ownerId

    async def get_total_supply(self, network: str) -> int:
        contract = self.get_contract(network=network)
        tokenCountResponse = await self._call_function(contract=contract, methodName=contract.totalSupplyMethodName)
        tokenCount = int(tokenCountResponse[0])
        return tokenCount

    async def get_token_content_url(self, network: str, tokenId: int) -> int:
        contract = self.get_contract(network=network)
        tokenUriResponse = await self._call_function(contract=contract, methodName=contract.tokenContentUriMethodName, arguments={'tokenId': int(tokenId)})
        tokenUri = tokenUriResponse[0].strip()
        return tokenUri

    async def set_token_content_url(self, network: str, tokenId: int, tokenContentUri: str, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, contract.setTokenContentUriFieldName: tokenContentUri}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.setTokenContentUriMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def transfer_token(self, network: str, tokenId: int, toAddress: str, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, 'to': toAddress, 'from': self.accountAddress}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.transferTokenMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def mint_token(self, network: str, tokenId: int, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, 'recipient': self.accountAddress}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.mintTokenMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def get_transaction_receipt(self, network: str, transactionHash: str) -> str:
        contract = self.get_contract(network=network)
        transactionReceipt = await contract.ethClient.get_transaction_receipt(transactionHash=transactionHash)
        return transactionReceipt
