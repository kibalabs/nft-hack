const { ethers } = require("hardhat");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

const args = require("./arguments");

const GWEI = 1000000000

async function main() {
  const provider = ethers.getDefaultProvider(process.env.ALCHEMY_MAINNET_URL);
  // const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  // const signer = await new LedgerSigner(provider, "hid", "m/44'/60'/0'/0");
  signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider)
  const contractFactory = await ethers.getContractFactory("MillionDollarTokenPage", signer);
  const deployedContract = await contractFactory.deploy(...args, { gasPrice: 100 * GWEI });
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
