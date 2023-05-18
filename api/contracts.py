import json
from typing import Optional

from core.web3.eth_client import EthClientInterface

from mdtp.contract_store import Contract
from mdtp.contract_store import ContractStore


def create_contract_store(ethClient: EthClientInterface, sepoliaEthClient: EthClientInterface, mumbaiEthClient: EthClientInterface, accountAddress: Optional[str] = None, privateKey: Optional[str] = None) -> ContractStore:
    with open('./contract1.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)['abi']
    with open('./contract2.json') as contractJsonFile:
        contract2Json = json.load(contractJsonFile)['abi']
    with open('./contract3.json') as contractJsonFile:
        contract3Json = json.load(contractJsonFile)['abi']
    with open('./contract4.json') as contractJsonFile:
        contract4Json = json.load(contractJsonFile)['abi']
    with open('./contract5.json') as contractJsonFile:
        contract5Json = json.load(contractJsonFile)['abi']
    with open('./contract6.json') as contractJsonFile:
        contract6Json = json.load(contractJsonFile)['abi']
    with open('./contract7.json') as contractJsonFile:
        contract7Json = json.load(contractJsonFile)['abi']
    with open('./contract8.json') as contractJsonFile:
        contract8Json = json.load(contractJsonFile)['abi']
    contractStore = ContractStore(accountAddress=accountAddress, privateKey=privateKey, contracts=[
        Contract(network='mumbai', address='0x87084477F7172dfC303A31efd33e9cA6eA8CABCE', sourceNetwork=None, startBlockNumber=0, abi=contractJson, ethClient=mumbaiEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenURI', migrationTargetMethodName=None, isTokenSetForMigrationMethodName=None, ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenURI', setTokenContentUriFieldName='tokenURI', setTokenGroupContentUriMethodName=None, transferTokenMethodName='transferFrom', mintTokenMethodName='mintNFT', mintTokenGroupMethodName=None, mintLimitMethodName=None, transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature=None),
        Contract(network='mainnet1', address='0x1Cf33F4c6C4E6391F4D2B445aa3a36639b77dd68', sourceNetwork=None, startBlockNumber=13172762, abi=contract7Json, ethClient=ethClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', migrationTargetMethodName=None, isTokenSetForMigrationMethodName=None, ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='contentURI', setTokenGroupContentUriMethodName='setTokenGroupContentURIs', transferTokenMethodName='transferFrom', mintTokenMethodName='mintToken', mintTokenGroupMethodName='mintTokenGroup', mintLimitMethodName='totalMintLimit', transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
        Contract(network='mainnet2', address='0x8e720f90014fa4de02627f4a4e217b7e3942d5e8', sourceNetwork='mainnet1', startBlockNumber=14525868, abi=contract8Json, ethClient=ethClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', migrationTargetMethodName='original', isTokenSetForMigrationMethodName='isTokenSetForMigration', ownerOfMethodName='proxiedOwnerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='contentURI', setTokenGroupContentUriMethodName='setTokenGroupContentURIs', transferTokenMethodName='transferFrom', mintTokenMethodName='mintToken', mintTokenGroupMethodName='mintTokenGroup', mintLimitMethodName='totalMintLimit', transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
        Contract(network='sepolia1', address='0xE1a62F1DCb4bAD97fF1F63EDB8b98274B3AEF3bA', sourceNetwork=None, startBlockNumber=3504916, abi=contract8Json, ethClient=sepoliaEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', migrationTargetMethodName=None, isTokenSetForMigrationMethodName=None, ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='contentURI', setTokenGroupContentUriMethodName='setTokenGroupContentURIs', transferTokenMethodName='transferFrom', mintTokenMethodName='mintToken', mintTokenGroupMethodName='mintTokenGroup', mintLimitMethodName='totalMintLimit', transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
    ])
    return contractStore
