
async function main() {
  const contract = await ethers.getContractFactory("StakingWallet");

  // Start deployment, returning a promise that resolves to a contract object
  const rinkebyDaiAddress = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";
  const rinkebyCompoundDaiAddress = "0x6d7f0754ffeb405d23c51ce938289d4835be3b14";
  const deployedContract = await contract.deploy(rinkebyCompoundDaiAddress, rinkebyDaiAddress, rinkebyCompoundDaiAddress);
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
