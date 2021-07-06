
async function main() {
  const contract = await ethers.getContractFactory("NftStakingWallet");

  // Start deployment, returning a promise that resolves to a contract object
  const rinkebyMDTPAddress = "0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3";
  const rinkebyDaiAddress = "0x95b58a6bff3d14b7db2f5cb5f0ad413dc2940658";
  const rinkebyCompoundDaiAddress = "0x6d7f0754ffeb405d23c51ce938289d4835be3b14";
  const rinkebyCompAddress = "0x6d7f0754ffeb405d23c51ce938289d4835be3b14"; // TODO: Find correct COMP address
  const deployedContract = await contract.deploy(rinkebyMDTPAddress, rinkebyCompoundDaiAddress, rinkebyDaiAddress, rinkebyCompAddress);
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
