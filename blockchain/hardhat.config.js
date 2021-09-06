require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: {
    version: "0.8.4",
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    rinkeby: {
      url: process.env.ALCHEMY_URL,
      from: '0xF3A535cEdf65cB8C287Cb5CAc67E970E94eb372D',
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
}
