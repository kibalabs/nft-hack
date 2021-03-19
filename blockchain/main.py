from web3 import Web3

ALCHEMY_URL = os.environ['ALCHEMY_URL']
w3 = Web3(Web3.HTTPProvider(ALCHEMY_URL))
