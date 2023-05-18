
from eth_typing.encoding import HexStr
from web3.main import Web3

NON_OWNER_ID = '0x0000000000000000000000000000000000000000'


def int_to_hex(value: int) -> HexStr:
    hexString = str(Web3.to_hex(value))
    if len(hexString) < 66:
        leftPadding = '0' * (66 - len(hexString))
        hexString = f'0x{leftPadding}{hexString[2:]}'
    return hexString
