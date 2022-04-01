const hardhat = require("hardhat");
const args = require("./arguments-dev");

const GWEI = 1000000000;

async function main() {
  const [deployer] = await hardhat.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const contractFactory = await hardhat.ethers.getContractFactory("MillionDollarTokenPageV2");
  const deployedContract = await contractFactory.deploy(...args, { gasPrice: 5 * GWEI });
  await deployedContract.deployed();
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
