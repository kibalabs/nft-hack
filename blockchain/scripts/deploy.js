const { ethers } = require("hardhat");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const args = require("./arguments");

async function main() {
  const provider = ethers.getDefaultProvider('rinkeby');
  console.log('provider', provider)
  const ledgerSigner = await new LedgerSigner(provider, "hid", "m/44'/60'/0'/0");
  const contractFactory = await ethers.getContractFactory("MillionDollarTokenPage", ledgerSigner);
  const deployedContract = await contractFactory.deploy(...args);
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
