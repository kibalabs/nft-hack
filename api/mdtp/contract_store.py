import dataclasses
from typing import List

from core.exceptions import NotFoundException
from core.web3.eth_client import EthClientInterface

@dataclasses.dataclass
class Contract:
    network: str
    address: str
    abi: dict
    ethClient: EthClientInterface
    openSeaUrl


class ContractStore:

    def __init__(self, contracts: List[Contract]):
        self.contracts = contracts

    def get_contract(self, network: str) -> Contract:
        for contract in self.contracts:
            if contract.network == network:
                return contract
        raise NotFoundException()
