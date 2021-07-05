/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const { ALCHEMY_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

module.exports = {
   solidity: "0.8.0",
   defaultNetwork: "rinkeby",
   networks: {
      hardhat: {},
      rinkeby: {
         url: ALCHEMY_URL,
         accounts: [PRIVATE_KEY]
      },
      matic: {
         url: "https://rpc-mumbai.maticvigil.com",
         accounts: [PRIVATE_KEY]
      }
   },
   etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
}
