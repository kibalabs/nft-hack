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

  describe("Metadata URIs", async function() {
    it("should have the correct metadata uri for a non-minted token", async function() {
      const metadataUri = await mdtp.tokenURI(100);
      expect(metadataUri).to.equal("https://api.mdtp.co/token-metadatas/100");
    });

    it("should have the correct metadata uri for a minted token", async function() {
      await mdtp.mint(100);
      const metadataUri = await mdtp.tokenURI(100);
      expect(metadataUri).to.equal("https://api.mdtp.co/token-metadatas/100");
    });
  });

  describe("Content URIs", async function() {
    it("should have the correct content uri for a non-minted token", async function() {
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal("https://api.mdtp.co/token-default-contents/100");
    });

    it("should have the correct content uri for a minted token without an overwritten uri", async function() {
      await mdtp.mint(100);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal("https://api.mdtp.co/token-default-contents/100");
    });

    it("allows the owner to change the content uri", async function() {
      await mdtp.mint(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
    });

    it("does not not allow changing the content uri of non-minted token", async function() {
      const newUri = "https://www.com/tokens/100";
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.be.reverted;
    });

    it("should have the correct content uri for a minted token with an overwritten uri", async function() {
      await mdtp.mint(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(newUri);
    });

    it("does not allow a non-owner to change the content uri", async function() {
      await mdtp.mint(100);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 100)
      const newUri = "https://www.com/tokens/100";
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.be.reverted;
    });

    it("emits a TokenContentURIChanged event when a token content is changed", async function() {
      await mdtp.mint(100);
      const newUri = "https://www.com/tokens/100"
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.emit(mdtp, 'TokenContentURIChanged').withArgs(100);
    });

    it("should reset content URI when a token is transferred", async function () {
      await mdtp.mint(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal("https://api.mdtp.co/token-default-contents/100");
    });
  });

  describe("IERC721Enumerable", async function() {
    it("should have a totalSupply of 10000 initially", async function() {
      const totalSupply = await mdtp.totalSupply();
      expect(totalSupply).to.equal(10000);
    });

    it("should have a totalSupply of 10000 after tokens have been minted", async function() {
      await mdtp.mint(1);
      await mdtp.mint(2);
      const totalSupply = await mdtp.totalSupply();
      expect(totalSupply).to.equal(10000);
    });

    it("returns 0 for the balance of a non-token holder", async function () {
      const balance = await mdtp.balanceOf(myWallet.address);
      expect(balance).to.equal(0);
    });

    it("returns the correct value for the balance of a token holder", async function () {
      await mdtp.mint(100);
      await mdtp.mint(101);
      await mdtp.mint(102);
      const balance = await mdtp.balanceOf(myWallet.address);
      expect(balance).to.equal(3);
    });

    it("returns the correct value for the balance of a transferred token", async function () {
      await mdtp.mint(100);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      const balance1 = await mdtp.balanceOf(myWallet.address);
      expect(balance1).to.equal(0);
      const balance2 = await mdtp.balanceOf(otherWallet.address);
      expect(balance2).to.equal(1);
    });

    it("raises an error for ownerOf of a non-minted token", async function () {
      const transaction = mdtp.ownerOf(100);
      await expect(transaction).to.be.reverted;
    });

    it("returns the correct value for ownerOf of a minted token", async function () {
      await mdtp.mint(100);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(myWallet.address);
    });

    it("returns the correct value for ownerOf of a transferred token", async function () {
      await mdtp.mint(100);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(otherWallet.address);
    });

    it("returns the correct value for tokenByIndex", async function () {
      const tokenId = await mdtp.tokenByIndex(1);
      expect(tokenId).to.equal(2);
    });

    it("raises an error if tokenByIndex is called with an invalid index", async function () {
      const transaction = mdtp.tokenByIndex(10001);
      await expect(transaction).to.be.reverted;
    });

    it("returns the correct value for tokenOfOwnerByIndex of a token owner", async function () {
      await mdtp.mint(100);
      await mdtp.mint(101);
      await mdtp.mint(102);
      const tokenId = await mdtp.tokenOfOwnerByIndex(myWallet.address, 1);
      expect(tokenId).to.equal(101);
    });

    it("returns the correct value for tokenOfOwnerByIndex after tokens are transferred", async function () {
      await mdtp.mint(100);
      await mdtp.mint(101);
      await mdtp.mint(102);
      const tokenId = await mdtp.tokenOfOwnerByIndex(myWallet.address, 0);
      expect(tokenId).to.equal(100);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      const tokenId2 = await mdtp.tokenOfOwnerByIndex(myWallet.address, 0);
      expect(tokenId2).to.equal(102);
      const tokenId3 = await mdtp.tokenOfOwnerByIndex(myWallet.address, 1);
      expect(tokenId3).to.equal(101);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 101);
      const tokenId4 = await mdtp.tokenOfOwnerByIndex(myWallet.address, 0);
      expect(tokenId4).to.equal(102);
    });
  });

  describe("Minting", async function () {
    it("does not allow minting a token with id over 10000", async function() {
      const transaction = mdtp.mint(10001);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting a token with id 0", async function() {
      const transaction = mdtp.mint(0);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting a token with negative id", async function() {
      const transaction = mdtp.mint(-100);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a token ot be minted twice", async function() {
      await mdtp.mint(100);
      const transaction = mdtp.mint(100);
      await expect(transaction).to.be.reverted;
    });

    it("emits a Transfer event when a token is minted", async function() {
      const transaction = mdtp.mint(100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
    });
  })

  describe("Transferring", async function () {
    it("emits a Transfer event when a token is transferred", async function() {
      await mdtp.mint(100);
      const transaction = mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs(myWallet.address, otherWallet.address, 100);
    });
  });

});
