const hardhat = require("hardhat");
const args = require("./arguments-dev");

const GWEI = 1000000000;

async function main() {
  const provider = hardhat.ethers.getDefaultProvider(process.env.ALCHEMY_URL);
  const signer = new hardhat.ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractFactory = await hardhat.ethers.getContractFactory("MillionDollarTokenPageV2", signer);
  const deployedContract = await hardhat.upgrades.deployProxy(contractFactory, args, { gasPrice: 100 * GWEI });
  await deployedContract.deployed();
  console.log("Contract deployed to address:", deployedContract.address, '->', await hardhat.upgrades.erc1967.getImplementationAddress(deployedContract.address));
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
