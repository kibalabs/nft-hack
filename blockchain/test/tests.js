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
    await mdtp.mint(myWallet.address, 1);
    await mdtp.mint(myWallet.address, 2);
    const totalSupply = await mdtp.totalSupply();
    expect(totalSupply).to.equal(10000);
  });

  it("doesn't allow minting a token with id over 10000", async function() {
    const transaction = mdtp.mint(myWallet.address, 10001);
    await expect(transaction).to.be.reverted;
  });

  it("doesn't allow minting a token with id 0", async function() {
    const transaction = mdtp.mint(myWallet.address, 0);
    await expect(transaction).to.be.reverted;
  });

  it("doesn't allow minting a token with negative id", async function() {
    const transaction = mdtp.mint(myWallet.address, -100);
    await expect(transaction).to.be.reverted;
  });

  it("should have the correct grid-data uri for a non-minted token", async function() {
    const gridDataUri = await mdtp.tokenGridDataURI(100);
    expect(gridDataUri).to.equal("https://api.mdtp.com/token-grid-datas/100");
  });

  it("should have the correct grid-data uri for a minted token without an overwritten uri", async function() {
    await mdtp.mint(myWallet.address, 100);
    const gridDataUri = await mdtp.tokenGridDataURI(100);
    expect(gridDataUri).to.equal("https://api.mdtp.com/token-grid-datas/100");
  });

  it("allows the owner to change the grid-data uri", async function() {
    await mdtp.mint(myWallet.address, 100);
    const newUri = "https://google.com/tokens/100"
    await mdtp.setTokenGridDataURI(100, newUri);
  });

  it("doesn't not allow changing the grid-data uri of non-minted token", async function() {
    const newUri = "https://google.com/tokens/100";
    const transaction = mdtp.setTokenGridDataURI(100, newUri);
    await expect(transaction).to.be.reverted;
  });

  it("should have the correct grid-data uri for a minted token with an overwritten uri", async function() {
    await mdtp.mint(myWallet.address, 100);
    const newUri = "https://google.com/tokens/100"
    await mdtp.setTokenGridDataURI(100, newUri);
    const gridDataUri = await mdtp.tokenGridDataURI(100);
    expect(gridDataUri).to.equal(newUri);
  });

  it("does not allow a non-owner to change the grid-data uri", async function() {
    await mdtp.mint(otherWallet.address, 100);
    const newUri = "https://google.com/tokens/100";
    const transaction = mdtp.setTokenGridDataURI(100, newUri);
    await expect(transaction).to.be.reverted;
  });

  it("should have the correct metadata uri for a non-minted token", async function() {
    const metadataUri = await mdtp.tokenURI(100);
    expect(metadataUri).to.equal("https://api.mdtp.com/token-metadatas/100");
  });

  it("should have the correct metadata uri for a minted token", async function() {
    await mdtp.mint(myWallet.address, 100);
    const metadataUri = await mdtp.tokenURI(100);
    expect(metadataUri).to.equal("https://api.mdtp.com/token-metadatas/100");
  });

  it("does not allow the owner to call mint", async function() {
    await mdtp.mint(myWallet.address, 100);
    const transaction = mdtp.mint(myWallet.address, 100);
    await expect(transaction).to.be.reverted;
  });

  it("does not allow a non-owner to call mint", async function() {
    await mdtp.mint(otherWallet.address, 100);
    const transaction = mdtp.mint(myWallet.address, 100);
    await expect(transaction).to.be.reverted;
  });

  it("emits a Transfer event when a token is minted", async function() {
    const transaction = mdtp.mint(myWallet.address, 100);
    await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
  });

  it("emits a Transfer event when a token is transferred", async function() {
    await mdtp.mint(myWallet.address, 100);
    const transaction = mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
    await expect(transaction).to.emit(mdtp, 'Transfer').withArgs(myWallet.address, otherWallet.address, 100);
  });

  it("emits a TokenGridDataURIChanged event when a token grid-data is changed", async function() {
    await mdtp.mint(myWallet.address, 100);
    const newUri = "https://google.com/tokens/100"
    const transaction = mdtp.setTokenGridDataURI(100, newUri);
    await expect(transaction).to.emit(mdtp, 'TokenGridDataURIChanged').withArgs(100);
  });

  it("returns 0 for the balance of a non-token holder", async function () {
    const balance = await mdtp.balanceOf(myWallet.address);
    expect(balance).to.equal(0);
  });

  it("returns the correct value for the balance of a token holder", async function () {
    await mdtp.mint(myWallet.address, 100);
    await mdtp.mint(myWallet.address, 101);
    await mdtp.mint(myWallet.address, 102);
    const balance = await mdtp.balanceOf(myWallet.address);
    expect(balance).to.equal(3);

  });

  it("raises an error for ownerOf of a non-minted token", async function () {
    const transaction = mdtp.ownerOf(100);
    await expect(transaction).to.be.reverted;
  });

  it("returns the correct value for ownerOf of a minted token", async function () {
    await mdtp.mint(myWallet.address, 100);
    const owner = await mdtp.ownerOf(100);
    expect(owner).to.equal(myWallet.address);
  });

});
