
from eth_typing.encoding import HexStr
from web3.main import Web3

NON_OWNER_ID = '0x0000000000000000000000000000000000000000'


def int_to_hex(value: int) -> HexStr:
    hex = Web3.toHex(value)
    if len(hex) < 66:
        leftPadding = '0' * (66 - len(hex))
        hex = f'0x{leftPadding}{hex[2:]}'
    return hex
