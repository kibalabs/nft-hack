const { expect } = require("chai");
const { ethers } = require("hardhat");

const METADATA_BASE_URI = 'ipfs://123/';
const DEFAULT_CONTENT_BASE_URI = 'ipfs://456/'; // ipfs://QmYWKVsSizmsLxfA213x2UW31mB8UxKr2pyynG794Cd497

describe("MillionDollarTokenPage contract", async function() {
  let myWallet;
  let otherWallet;
  let mdtp;

  beforeEach(async () => {
    [myWallet, otherWallet] = await ethers.getSigners();
    const contract = await ethers.getContractFactory("MillionDollarTokenPage");
    mdtp = await contract.deploy(METADATA_BASE_URI, DEFAULT_CONTENT_BASE_URI);
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

    it("should allow admins to setMetadataBaseURI", async function() {
      const newUri = 'abc/';
      await mdtp.setMetadataBaseURI(newUri);
      const tokenURI = await mdtp.tokenURI(1);
      expect(tokenURI).to.equal(`${newUri}1.json`);
    });

    it("should not allow non-admins to setMetadataBaseURI", async function() {
      const transaction = mdtp.connect(otherWallet).setMetadataBaseURI(100);
      await expect(transaction).to.be.reverted;
    });

    it("should allow admins to setDefaultContentBaseURI", async function() {
      const newUri = 'abc/';
      await mdtp.setDefaultContentBaseURI(newUri);
      const tokenContentURI = await mdtp.tokenContentURI(1);
      expect(tokenContentURI).to.equal(`${newUri}1.json`);
    });

    it("should not allow non-admins to setDefaultContentBaseURI", async function() {
      const transaction = mdtp.connect(otherWallet).setDefaultContentBaseURI(100);
      await expect(transaction).to.be.reverted;
    });
  });

  describe("Metadata URIs", async function() {
    it("should have the correct metadata uri for a non-minted token", async function() {
      const metadataUri = await mdtp.tokenURI(100);
      expect(metadataUri).to.equal(`${METADATA_BASE_URI}100.json`);
    });

    it("should have the correct metadata uri for a minted token", async function() {
      await mdtp.mint(100);
      const metadataUri = await mdtp.tokenURI(100);
      expect(metadataUri).to.equal(`${METADATA_BASE_URI}100.json`);
    });
  });

  describe("Token Content URIs", async function() {
    it("should have the correct content uri for a non-minted token", async function() {
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(`${DEFAULT_CONTENT_BASE_URI}100.json`);
    });

    it("should have the correct content uri for a minted token", async function() {
      await mdtp.mint(100);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(`${DEFAULT_CONTENT_BASE_URI}100.json`);
    });

    // it("should reset content URI when a token is transferred", async function () {
    //   await mdtp.mint(100);
    //   const newUri = "https://www.com/tokens/100"
    //   await mdtp.setTokenContentURI(100, newUri);
    //   await mdtp.transferFrom(myWallet.address, otherWallet.address, 100);
    //   const contentUri = await mdtp.tokenContentURI(100);
    //   expect(contentUri).to.equal(`${DEFAULT_CONTENT_BASE_URI}100.json`);
    // });

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

    it("setting setDefaultContentBaseURI should not change existing URIs", async function() {
      await mdtp.mint(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
      const newUri2 = 'abc/';
      await mdtp.setDefaultContentBaseURI(newUri2);
      const tokenContentURI = await mdtp.tokenContentURI(100);
      expect(tokenContentURI).to.equal(newUri);
    });
  });

  describe("Set Token Group Content URIs", async function() {
    it("does not allow a width < 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, -1, 1, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a width = 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, 0, 1, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a height < 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, 1, -1, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a height = 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, 1, 0, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("does not not allow changing the content uri of any non-minted token in the group", async function() {
      await mdtp.mintTokenGroup(100, 2, 1);
      const newUris = ["1", "2", "3", "4"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a non-owner of any token in the group to set content uri", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      await mdtp.transferFrom(myWallet.address, otherWallet.address, 101)
      const newUris = ["1", "2", "3", "4"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.be.reverted;
    });

    it("should have the correct content uri for a minted token group with overwritten uris", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const newUris = ["1", "2", "3", "4"]
      await mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(newUris[0]);
      const contentUri2 = await mdtp.tokenContentURI(101);
      expect(contentUri2).to.equal(newUris[1]);
      const contentUri3 = await mdtp.tokenContentURI(200);
      expect(contentUri3).to.equal(newUris[2]);
      const contentUri4 = await mdtp.tokenContentURI(201);
      expect(contentUri4).to.equal(newUris[3]);
    });

    it("should not allow the number of uris passed to be too small when setting content uris for a token group", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const newUris = ["1", "2", "3"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      expect(transaction).to.be.reverted;
    });

    it("should not allow the number of uris passed to be too big when setting content uris for a token group", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const newUris = ["1", "2", "3", "4", "5"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      expect(transaction).to.be.reverted;
    });

    it("emits a TokenContentURIChanged event for every token when a token group content is changed", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const newUris = ["1", "2", "3", "4"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.emit(mdtp, 'TokenContentURIChanged').withArgs(100);
      await expect(transaction).to.emit(mdtp, 'TokenContentURIChanged').withArgs(101);
      await expect(transaction).to.emit(mdtp, 'TokenContentURIChanged').withArgs(200);
      await expect(transaction).to.emit(mdtp, 'TokenContentURIChanged').withArgs(201);
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

    it("sets the owner to the caller", async function() {
      await mdtp.mint(100);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(myWallet.address)
    });
  });

  describe("Minting Group", async function () {
    it("sets the owner to the caller", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(myWallet.address)
      const owner2 = await mdtp.ownerOf(101);
      expect(owner2).to.equal(myWallet.address)
      const owner3 = await mdtp.ownerOf(200);
      expect(owner3).to.equal(myWallet.address)
      const owner4 = await mdtp.ownerOf(201);
      expect(owner4).to.equal(myWallet.address)
    });

    it("does not allow a width < 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, -1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a width = 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 0, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a height < 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 1, -1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a height = 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 1, 0);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000", async function() {
      const transaction = mdtp.mintTokenGroup(10001, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000", async function() {
      const transaction = mdtp.mintTokenGroup(10001, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000 (with height overflow)", async function() {
      const transaction = mdtp.mintTokenGroup(9999, 1, 2);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000 (with width overflow)", async function() {
      const transaction = mdtp.mintTokenGroup(9999, 3, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id 0", async function() {
      const transaction = mdtp.mintTokenGroup(0);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with negative id", async function() {
      const transaction = mdtp.mintTokenGroup(-100);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow any token to be minted twice", async function() {
      await mdtp.mintTokenGroup(100, 2, 1);
      const transaction = mdtp.mintTokenGroup(101);
      await expect(transaction).to.be.reverted;
    });

    it("emits Transfer events when tokens are minted", async function() {
      const transaction = mdtp.mintTokenGroup(100, 2, 2);
      const receipt = await transaction;
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 101);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 200);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 201);
    });

    it("updates mintedCount when tokens are minted", async function() {
      await mdtp.mintTokenGroup(100, 5, 2);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(10);
    });

    it("cannot mint over the singleMintLimit", async function() {
      await mdtp.setSingleMintLimit(2);
      const transaction = mdtp.mintTokenGroup(100, 3, 1);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in separate transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      await mdtp.mintTokenGroup(100, 2, 1);
      const transaction = mdtp.mintTokenGroup(102, 2, 1);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in a single transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      const transaction = mdtp.mintTokenGroup(100, 4, 1);
      expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mintTokenGroup(100, 2, 1, {value: 3});
      expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroup(100, 2, 1, {value: 4});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroup(100, 2, 1, {value: 5});
    });
  });

  describe("Minting Group Admin", async function () {
    it("sets the owner to the caller", async function() {
      await mdtp.mintTokenGroupAdmin(100, 2, 2);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(myWallet.address)
      const owner2 = await mdtp.ownerOf(101);
      expect(owner2).to.equal(myWallet.address)
      const owner3 = await mdtp.ownerOf(200);
      expect(owner3).to.equal(myWallet.address)
      const owner4 = await mdtp.ownerOf(201);
      expect(owner4).to.equal(myWallet.address)
    });

    it("does not allow a width < 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, -1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a width = 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 0, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a height < 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 1, -1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow a height = 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 1, 0);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000", async function() {
      const transaction = mdtp.mintTokenGroupAdmin(10001, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000 (with height overflow)", async function() {
      const transaction = mdtp.mintTokenGroupAdmin(9999, 1, 2);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id over 10000 (with width overflow)", async function() {
      const transaction = mdtp.mintTokenGroupAdmin(9999, 3, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with id 0", async function() {
      const transaction = mdtp.mintTokenGroupAdmin(0);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow minting any token with negative id", async function() {
      const transaction = mdtp.mintTokenGroupAdmin(-100);
      await expect(transaction).to.be.reverted;
    });

    it("does not allow any token to be minted twice", async function() {
      await mdtp.mintTokenGroupAdmin(100, 2, 1);
      const transaction = mdtp.mintTokenGroupAdmin(101);
      await expect(transaction).to.be.reverted;
    });

    it("emits Transfer events when tokens are minted", async function() {
      const transaction = mdtp.mintTokenGroupAdmin(100, 2, 2);
      const receipt = await transaction;
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 100);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 101);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 200);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', myWallet.address, 201);
    });

    it("updates mintedCount when tokens are minted", async function() {
      await mdtp.mintTokenGroupAdmin(100, 5, 2);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(10);
    });

    it("can mint over the singleMintLimit", async function() {
      await mdtp.setSingleMintLimit(2);
      await mdtp.mintTokenGroupAdmin(100, 3, 1);
    });

    it("can mint over the totalMintLimit in separate transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      await mdtp.mintTokenGroupAdmin(100, 2, 1);
      await mdtp.mintTokenGroupAdmin(102, 2, 1);
    });

    it("can mint over the totalMintLimit in a single transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      await mdtp.mintTokenGroupAdmin(100, 4, 1);
    });

    it("can mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      await mdtp.mintTokenGroupAdmin(100, 2, 1, {value: 3});
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroupAdmin(100, 2, 1, {value: 4});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroupAdmin(100, 2, 1, {value: 5});
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
