const hardhat = require("hardhat");

async function main() {
  console.log(hardhat.network.name);
  const args = require(hardhat.network.name === 'mainnet' ? './arguments' : './arguments-dev');
  const [deployer] = await hardhat.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const contractFactory = await hardhat.ethers.getContractFactory("MillionDollarTokenPageV2");
  const deployedContract = await contractFactory.deploy(...args);
  await deployedContract.deployed();
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
