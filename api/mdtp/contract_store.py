import asyncio
import dataclasses
from typing import Any, List, Optional

from core.exceptions import NotFoundException, ServerException
from core.web3.eth_client import EthClientInterface
from web3.main import Web3
from web3.types import TxReceipt

class TransactionFailedException(ServerException):

    def __init__(self, transactionReceipt: TxReceipt) -> None:
        super().__init__(message=f'Transaction failed: {transactionReceipt}')
        self.transactionReceipt = transactionReceipt

@dataclasses.dataclass
class Contract:
    network: str
    address: str
    abi: dict
    ethClient: EthClientInterface
    ownerOfMethodName: str
    metadataUriMethodName: str
    tokenContentUriMethodName: str
    totalSupplyMethodName: str
    setTokenContentUriMethodName: str
    setTokenContentUriFieldName: str
    setTokenGroupContentUriMethodName: Optional[str]
    transferTokenMethodName: str
    mintTokenMethodName: str
    mintTokenGroupMethodName: str
    transferMethodSignature: str
    updateMethodSignature: Optional[str]

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

    async def get_token_metadata_url(self, network: str, tokenId: int) -> int:
        contract = self.get_contract(network=network)
        tokenUriResponse = await self._call_function(contract=contract, methodName=contract.metadataUriMethodName, arguments={'tokenId': int(tokenId)})
        tokenUri = tokenUriResponse[0].strip()
        return tokenUri

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

    async def set_token_group_content_urls(self, network: str, tokenId: int, width: int, height: int, tokenContentUris: List[str], nonce: int, gas: int, gasPrice: int) -> str:
        if width * height != len(tokenContentUris):
            raise Exception(f'length of tokenContentUris ({len(tokenContentUris)}) must be equal to width * height ({width * height})')
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, 'width': width, 'height': height, 'contentURIs': tokenContentUris}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.setTokenGroupContentUriMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def transfer_token(self, network: str, tokenId: int, toAddress: str, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, 'to': toAddress, 'from': self.accountAddress}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.transferTokenMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def mint_token_old(self, network: str, tokenId: int, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, 'recipient': self.accountAddress}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.mintTokenMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def mint_token(self, network: str, tokenId: int, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.mintTokenMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def mint_token_group(self, network: str, tokenId: int, width: int, height: int, nonce: int, gas: int, gasPrice: int) -> str:
        contract = self.get_contract(network=network)
        arguments = {'tokenId': tokenId, 'width': width, 'height': height}
        transactionHash = await self._send_transaction(contract=contract, methodName=contract.mintTokenGroupMethodName, arguments=arguments, nonce=nonce, gas=gas, gasPrice=gasPrice)
        return transactionHash

    async def get_transaction_receipt(self, network: str, transactionHash: str) -> TxReceipt:
        contract = self.get_contract(network=network)
        transactionReceipt = await contract.ethClient.get_transaction_receipt(transactionHash=transactionHash)
        return transactionReceipt

    async def get_latest_block_number(self, network: str) -> int:
        contract = self.get_contract(network=network)
        blockNumber = await contract.ethClient.get_latest_block_number()
        return blockNumber

    async def get_transferred_token_ids_in_blocks(self, network: str, startBlockNumber: int, endBlockNumber: int) -> List[int]:
        contract = self.get_contract(network=network)
        events = await contract.ethClient.get_log_entries(address=contract.address, startBlockNumber=startBlockNumber, endBlockNumber=endBlockNumber, topics=[Web3.keccak(text=contract.transferMethodSignature).hex()])
        return [int.from_bytes(bytes(event['topics'][3]), 'big') for event in events]

    async def get_updated_token_ids_in_blocks(self, network: str, startBlockNumber: int, endBlockNumber: int) -> List[int]:
        contract = self.get_contract(network=network)
        if not contract.updateMethodSignature:
            return []
        events = await contract.ethClient.get_log_entries(address=contract.address, startBlockNumber=startBlockNumber, endBlockNumber=endBlockNumber, topics=[Web3.keccak(text=contract.updateMethodSignature).hex()])
        return [int.from_bytes(bytes(event['topics'][1]), 'big') for event in events]

    async def wait_for_transaction(self, network: str, transactionHash: str, sleepTime: int = 15, raiseOnFailure: bool = True) -> TxReceipt:
        transactionReceipt = None
        while not transactionReceipt:
            await asyncio.sleep(sleepTime)
            transactionReceipt = await self.get_transaction_receipt(network=network, transactionHash=transactionHash)
        if not transactionReceipt['status'] == 1 and raiseOnFailure:
            raise TransactionFailedException(transactionReceipt=transactionReceipt)
        return transactionReceipt
