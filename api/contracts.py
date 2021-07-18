import json
from typing import Optional

from core.web3.eth_client import EthClientInterface
from mdtp.contract_store import Contract
from mdtp.contract_store import ContractStore

def create_contract_store(rinkebyEthClient: EthClientInterface, mumbaiEthClient: EthClientInterface, accountAddress: Optional[str] = None, privateKey: Optional[str] = None) -> ContractStore:
    with open('./contract1.json') as contractJsonFile:
        contractJson = json.load(contractJsonFile)['abi']
    with open('./contract2.json') as contractJsonFile:
        contract2Json = json.load(contractJsonFile)['abi']
    contractStore = ContractStore(accountAddress=accountAddress, privateKey=privateKey, contracts=[
        Contract(network='rinkeby', address='0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3', abi=contractJson, ethClient=rinkebyEthClient, tokenContentUriMethodName='tokenURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenURI', setTokenContentUriFieldName='tokenURI', transferTokenMethodName='transferFrom', mintTokenMethodName='mintNFT'),
        Contract(network='mumbai', address='0x87084477F7172dfC303A31efd33e9cA6eA8CABCE', abi=contractJson, ethClient=mumbaiEthClient, tokenContentUriMethodName='tokenURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenURI', setTokenContentUriFieldName='tokenURI', transferTokenMethodName='transferFrom', mintTokenMethodName='mintNFT'),
        Contract(network='rinkeby2', address='0xeDa9C05612579ff3888C5dCd689566406Df54e01', abi=contract2Json, ethClient=rinkebyEthClient, tokenContentUriMethodName='tokenContentURI', ownerOfMethodName='ownerOf', totalSupplyMethodName='totalSupply', setTokenContentUriMethodName='setTokenContentURI', setTokenContentUriFieldName='metadataURI', transferTokenMethodName='transferFrom', mintTokenMethodName='mint'),
    ])
    return contractStore
