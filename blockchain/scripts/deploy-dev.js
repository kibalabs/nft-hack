const hardhat = require('hardhat');

const METADATA_BASE_URI = 'ipfs://QmVTktJb8VSi4AGeuRrv7eeedRxn8Zsh3VU543ZDwDwMbB/';
const DEFAULT_CONTENT_BASE_URI = 'ipfs://QmYeZHGzfUS4R2wfTi1wYW8Cq9eyK4Rea8QQKtG3ERhKfC/'
const COLLECTION_URI = 'ipfs://QmYeZHGzfUS4R2wfTi1wYW8Cq9eyK4Rea8QQKtG3ERhKfC'
const DEFAULT_TOTAL_MINT_LIMIT = 2000;
const DEFAULT_SINGLE_MINT_LIMIT = 35;
const DEFAULT_USER_MINT_LIMIT = 35;
const DEFAULT_MINT_PRICE = hardhat.ethers.utils.parseEther('0.01');
const DEFAULT_ROYALTY_BASIS_POINTS = 500; // 5%


async function main() {
  const [deployer] = await hardhat.ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', hardhat.ethers.utils.formatEther(await deployer.getBalance()));

  const originalArguments = [
    DEFAULT_TOTAL_MINT_LIMIT,
    DEFAULT_SINGLE_MINT_LIMIT,
    DEFAULT_USER_MINT_LIMIT,
    DEFAULT_MINT_PRICE,
    METADATA_BASE_URI,
    DEFAULT_CONTENT_BASE_URI,
  ];
  // const originalContractFactory = await hardhat.ethers.getContractFactory('contracts/MillionDollarTokenPage-v1.sol:MillionDollarTokenPage');
  // const originalContract = await originalContractFactory.deploy(...originalArguments);
  // await originalContract.deployed();
  // const originalContractAddress = originalContract.address;
  // console.log('originalContract deployed to address:', originalContractAddress);
  const originalContractAddress = '0x7aad38ac82B2FAf01317dd5428Dd3B9845A24e0C';

  const arguments = [
    DEFAULT_TOTAL_MINT_LIMIT,
    DEFAULT_SINGLE_MINT_LIMIT,
    DEFAULT_USER_MINT_LIMIT,
    DEFAULT_MINT_PRICE,
    METADATA_BASE_URI,
    DEFAULT_CONTENT_BASE_URI,
    COLLECTION_URI,
    DEFAULT_ROYALTY_BASIS_POINTS,
    originalContractAddress,
  ];
  // const contractFactory = await hardhat.ethers.getContractFactory('contracts/MillionDollarTokenPage-v2.sol:MillionDollarTokenPageV2');
  // const contract = await contractFactory.deploy(...arguments);
  // await contract.deployed();
  // const contractAddress = contract.address;
  // console.log('contract deployed to address:', contractAddress);
  const contractAddress = '0xE1a62F1DCb4bAD97fF1F63EDB8b98274B3AEF3bA';

  console.log('waiting 30 secs for etherscan to register deployments...');
  await new Promise(r => setTimeout(r, 30000));

  await hardhat.run('verify:verify', {
    address: originalContractAddress,
    contract: 'contracts/MillionDollarTokenPage-v1.sol:MillionDollarTokenPage',
    constructorArguments: originalArguments,
  });
  await hardhat.run('verify:verify', {
    address: contractAddress,
    contract: 'contracts/MillionDollarTokenPage-v2.sol:MillionDollarTokenPageV2',
    constructorArguments: arguments,
  });
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
