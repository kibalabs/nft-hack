require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");

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
      from: '0xF3A535cEdf65cB8C287Cb5CAc67E970E94eb372D',
    },
    rinkeby: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 100,
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
