import json
from typing import Optional

from core.web3.eth_client import EthClientInterface

from mdtp.contract_store import Contract, ContractStore


def create_contract_store(rinkebyEthClient: EthClientInterface, mumbaiEthClient: EthClientInterface, accountAddress: Optional[str] = None, privateKey: Optional[str] = None) -> ContractStore:
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
    contractStore = ContractStore(accountAddress=accountAddress, privateKey=privateKey, contracts=[
        Contract(network='rinkeby', address='0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3', abi=contractJson, ethClient=rinkebyEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenURI', setTokenContentUriFieldName='tokenURI', setTokenGroupContentUriMethodName=None, transferTokenMethodName='transferFrom', mintTokenMethodName='mintNFT', mintTokenGroupMethodName=None, transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature=None),
        Contract(network='mumbai', address='0x87084477F7172dfC303A31efd33e9cA6eA8CABCE', abi=contractJson, ethClient=mumbaiEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenURI', setTokenContentUriFieldName='tokenURI', setTokenGroupContentUriMethodName=None, transferTokenMethodName='transferFrom', mintTokenMethodName='mintNFT', mintTokenGroupMethodName=None, transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature=None),
        Contract(network='rinkeby2', address='0xeDa9C05612579ff3888C5dCd689566406Df54e01', abi=contract2Json, ethClient=rinkebyEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='metadataURI', setTokenGroupContentUriMethodName=None, transferTokenMethodName='transferFrom', mintTokenMethodName='mint', mintTokenGroupMethodName=None, transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
        Contract(network='rinkeby3', address='0x19559Ac1471e2e4887d63c9363C85BF9f85Fdb67', abi=contract3Json, ethClient=rinkebyEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='metadataURI', setTokenGroupContentUriMethodName=None, transferTokenMethodName='transferFrom', mintTokenMethodName='mint', mintTokenGroupMethodName=None, transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
        Contract(network='rinkeby4', address='0x9B84318C9aC64F564eEc4a703f2dbb742a4D1401', abi=contract4Json, ethClient=rinkebyEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='metadataURI', setTokenGroupContentUriMethodName=None, transferTokenMethodName='transferFrom', mintTokenMethodName='mint', mintTokenGroupMethodName=None, transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
        Contract(network='rinkeby5', address='0xaE70a9accF2E0c16b380C0aa3060E9fBa6718daf', abi=contract5Json, ethClient=rinkebyEthClient, metadataUriMethodName='tokenURI', tokenContentUriMethodName='tokenContentURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='contentURI', setTokenGroupContentUriMethodName='setTokenGroupContentURIs', transferTokenMethodName='transferFrom', mintTokenMethodName='mintToken', mintTokenGroupMethodName='mintTokenGroup', transferMethodSignature='Transfer(address,address,uint256)', updateMethodSignature='TokenContentURIChanged(uint256)'),
    ])
    return contractStore
