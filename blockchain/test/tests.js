const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MillionDollarTokenPage contract", async function() {
  let myWallet;
  let otherWallet;
  let mdtp;

  beforeEach(async () => {
    [myWallet, otherWallet] = await ethers.getSigners();
    const contract = await ethers.getContractFactory("MillionDollarTokenPage");
    mdtp = await contract.deploy();
  });

  describe("Admin", async function() {
    it("should have a default totalMintLimit", async function() {
      const defaultLimit = 1000;
      const totalMintLimit = await mdtp.totalMintLimit();
      expect(totalMintLimit).to.equal(defaultLimit);
    });

    it("should allow admins to setTotalMintLimit", async function() {
      const newLimit = 123;
      await mdtp.setTotalMintLimit(newLimit);
      const totalMintLimit = await mdtp.totalMintLimit();
      expect(totalMintLimit).to.equal(newLimit);
    });

    it("should not allow non-admins to setTotalMintLimit", async function() {
      const transaction = mdtp.connect(otherWallet).setTotalMintLimit(100);
      await expect(transaction).to.be.reverted;
    });

    it("should have a default singleMintLimit", async function() {
      const defaultLimit = 20;
      const singleMintLimit = await mdtp.singleMintLimit();
      expect(singleMintLimit).to.equal(defaultLimit);
    });

    it("should allow admins to setSingleMintLimit", async function() {
      const newLimit = 123;
      await mdtp.setSingleMintLimit(newLimit);
      const singleMintLimit = await mdtp.singleMintLimit();
      expect(singleMintLimit).to.equal(newLimit);
    });

    it("should not allow non-admins to setSingleMintLimit", async function() {
      const transaction = mdtp.connect(otherWallet).setSingleMintLimit(100);
      await expect(transaction).to.be.reverted;
    });

    it("should have a default mintPrice", async function() {
      const defaultPrice = 0;
      const mintPrice = await mdtp.mintPrice();
      expect(mintPrice).to.equal(defaultPrice);
    });

    it("should allow admins to setMintPrice", async function() {
      const newPrice = 123;
      await mdtp.setMintPrice(newPrice);
      const mintPrice = await mdtp.mintPrice();
      expect(mintPrice).to.equal(newPrice);
    });

    it("should not allow non-admins to setMintPrice", async function() {
      const transaction = mdtp.connect(otherWallet).setMintPrice(100);
      await expect(transaction).to.be.reverted;
    });
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

    it("does not allow a token to be minted twice", async function() {
      await mdtp.mint(100);
      const transaction = mdtp.mint(100);
      await expect(transaction).to.be.reverted;
    });

    it("emits a Transfer event when a token is minted", async function() {
      const transaction = mdtp.mint(100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
    });

    it("updates mintedCount when a token is minted", async function() {
      await mdtp.mint(100);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(1);
    });

    it("cannot mint over the totalMintLimit", async function() {
      await mdtp.setTotalMintLimit(2);
      await mdtp.mint(100);
      await mdtp.mint(101);
      const transaction = mdtp.mint(102);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mint(100, {value: 1});
      expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mint(100, {value: 2});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mint(100, {value: 3});
    });

    it("does not allow access to the _mint function", async function() {
      expect(() => mdtp._mint(100)).to.throw(TypeError);
    });
  });

  describe("Minting Admin", async function () {
    it("does not allow minting a token with id over 10000", async function() {
      const transaction = mdtp.mintAdmin(10001);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting a token with id 0", async function() {
      const transaction = mdtp.mintAdmin(0);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting a token with negative id", async function() {
      const transaction = mdtp.mintAdmin(-100);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a token to be minted twice", async function() {
      await mdtp.mintAdmin(100);
      const transaction = mdtp.mintAdmin(100);
      await expect(transaction).to.be.reverted;
    });

    it("emits a Transfer event when a token is minted", async function() {
      const transaction = mdtp.mintAdmin(100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
    });

    it("updates mintedCount when a token is minted", async function() {
      await mdtp.mintAdmin(100);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(1);
    });

    it("can mint over the totalMintLimit", async function() {
      await mdtp.setTotalMintLimit(2);
      await mdtp.mintAdmin(100);
      await mdtp.mintAdmin(101);
      await mdtp.mintAdmin(102);
    });

    it("can mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      await mdtp.mintAdmin(100);
    });
  });

  describe("Minting Many", async function () {
    it("does not allow minting any token with id over 10000", async function() {
      const transaction = mdtp.mintMany([100, 10001]);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id 0", async function() {
      const transaction = mdtp.mintMany([100, 0]);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with negative id", async function() {
      const transaction = mdtp.mintMany([100, -100]);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow any token to be minted twice", async function() {
      await mdtp.mintMany([100, 101, 102]);
      const transaction = mdtp.mintMany([102, 103]);
      await expect(transaction).to.be.reverted;
    });

    it("emits Transfer events when tokens are minted", async function() {
      const transaction = mdtp.mintMany([100, 101, 103]);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
    });

    it("updates mintedCount when tokens are minted", async function() {
      await mdtp.mintMany([1100, 101, 102, 03, 104, 105, 106, 107, 108, 109]);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(10);
    });

    it("cannot mint over the singleMintLimit", async function() {
      await mdtp.setSingleMintLimit(2);
      const transaction = mdtp.mintMany([100, 101, 102]);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in separate transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      await mdtp.mintMany([100, 101]);
      const transaction = mdtp.mintMany([102, 103]);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in a single transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      const transaction = mdtp.mintMany([100, 101, 102, 103]);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mintMany([100, 101], {value: 3});
      expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintMany([100, 101], {value: 4});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintMany([100, 101], {value: 5});
    });
  });

  describe("Transferring", async function () {
    it("emits a Transfer event when a token is transferred", async function() {
      await mdtp.mint(100);
      const transaction = mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs(myWallet.address, otherWallet.address, 100);
    });

    it("does not change mintedCount when a token is transferred", async function() {
      await mdtp.mint(100);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(1);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
      const mintedCount2 = await mdtp.mintedCount();
      expect(mintedCount2).to.equal(1);
    });
  });
});

// NOTE(krishan711): left to do:
// move base uri to be a settable var?
// move default content uri to be a settable var?
