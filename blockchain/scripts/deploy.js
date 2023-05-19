const hardhat = require("hardhat");

const METADATA_BASE_URI = 'ipfs://QmVTktJb8VSi4AGeuRrv7eeedRxn8Zsh3VU543ZDwDwMbB/';
const DEFAULT_CONTENT_BASE_URI = 'ipfs://QmYeZHGzfUS4R2wfTi1wYW8Cq9eyK4Rea8QQKtG3ERhKfC/'
const COLLECTION_URI = 'ipfs://QmYeZHGzfUS4R2wfTi1wYW8Cq9eyK4Rea8QQKtG3ERhKfC'
const DEFAULT_TOTAL_MINT_LIMIT = 2000;
const DEFAULT_SINGLE_MINT_LIMIT = 35;
const DEFAULT_USER_MINT_LIMIT = 35;
const DEFAULT_MINT_PRICE = hardhat.ethers.utils.parseEther('0.01');
const DEFAULT_ROYALTY_BASIS_POINTS = 500; // 5%
const ORIGINAL = hardhat.ethers.utils.getAddress('0x1cf33f4c6c4e6391f4d2b445aa3a36639b77dd68');

async function main() {
  console.log(hardhat.network.name);
  const [deployer] = await hardhat.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractFactory = await hardhat.ethers.getContractFactory("MillionDollarTokenPageV2");
  const ARGUMENTS = [
    DEFAULT_TOTAL_MINT_LIMIT,
    DEFAULT_SINGLE_MINT_LIMIT,
    DEFAULT_USER_MINT_LIMIT,
    DEFAULT_MINT_PRICE,
    METADATA_BASE_URI,
    DEFAULT_CONTENT_BASE_URI,
    COLLECTION_URI,
    DEFAULT_ROYALTY_BASIS_POINTS,
    ORIGINAL,
  ];
  const deployedContract = await contractFactory.deploy(...ARGUMENTS);
  await deployedContract.deployed();
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
