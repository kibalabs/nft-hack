const { expect } = require("chai");

describe("MillionDollarTokenPage contract", async function() {

  let myWallet;
  let otherWallet;
  let mdtp; // Contract

  beforeEach(async () => {
    [myWallet, otherWallet] = await ethers.getSigners();
    const contract = await ethers.getContractFactory("MillionDollarTokenPage");
    mdtp = await contract.deploy();
  });

  it("should have a totalSupply of 10000 initially", async function() {
    const totalSupply = await mdtp.totalSupply();
    expect(totalSupply).to.equal(10000);
  });

  it("should have a totalSupply of 10000 after tokens have been minted", async function() {
    await mdtp.mintNFT(myWallet.address, 1);
    await mdtp.mintNFT(myWallet.address, 2);
    const totalSupply = await mdtp.totalSupply();
    expect(totalSupply).to.equal(10000);
  });

  it("should have the correct grid-data uri for a non-minted token", async function() {
    const gridDataUri = await mdtp.tokenGridDataURI(100);
    expect(gridDataUri).to.equal("https://api.mdtp.com/token-grid-datas/100");
  });

  it("should have the correct grid-data uri for a minted token without an overwritten uri", async function() {
    await mdtp.mintNFT(myWallet.address, 100);
    const gridDataUri = await mdtp.tokenGridDataURI(100);
    expect(gridDataUri).to.equal("https://api.mdtp.com/token-grid-datas/100");
  });

  it("allows the owner to change the grid-data uri", async function() {
    await mdtp.mintNFT(myWallet.address, 100);
    const newUri = "https://google.com/tokens/100"
    await mdtp.setTokenGridDataURI(100, newUri);
  });

  it("should have the correct grid-data uri for a minted token with an overwritten uri", async function() {
    await mdtp.mintNFT(myWallet.address, 100);
    const newUri = "https://google.com/tokens/100"
    await mdtp.setTokenGridDataURI(100, newUri);
    const gridDataUri = await mdtp.tokenGridDataURI(100);
    expect(gridDataUri).to.equal(newUri);
  });

  it("does not allow a non-owner to change the grid-data uri", async function() {
    await mdtp.mintNFT(otherWallet.address, 100);
    const newUri = "https://google.com/tokens/100"
    await expect(mdtp.setTokenGridDataURI(100, newUri)).to.be.reverted;
  });

  it("should have the correct metadata uri for a non-minted token", async function() {
    const metadataUri = await mdtp.tokenURI(100);
    expect(metadataUri).to.equal("https://api.mdtp.com/token-metadatas/100");
  });

  it("should have the correct metadata uri for a minted token", async function() {

  });

  it("does not allow the owner to change the mdatadata uri", async function() {

  });

  it("does not allow a non-owner to change the mdatadata uri", async function() {

  });

  it("does not allow the owner to call mintNFT", async function() {

  });

  it("does not allow a non-owner to call mintNFT", async function() {

  });

  // Check the grid-data setting event
});
