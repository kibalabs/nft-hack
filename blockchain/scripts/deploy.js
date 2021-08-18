const args = require("./arguments");

async function main() {
  const contract = await ethers.getContractFactory("MillionDollarTokenPage");
  const deployedContract = await contract.deploy(...args);
  console.log("Contract deployed to address:", deployedContract.address);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });
