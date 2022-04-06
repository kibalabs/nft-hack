require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-solhint");
require("hardhat-gas-reporter");

const GWEI = 1000000000;

module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20 * GWEI,
    },
    rinkeby: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 0.1 * GWEI,
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 50,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: [
      'ERC721Upgradeable.sol',
      'MillionDollarTokenPage.sol',
    ]
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
}
