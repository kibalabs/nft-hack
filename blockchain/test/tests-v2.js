const { expect } = require("chai");
const hardhat = require("hardhat");

const arrayWithRange = (start, end) => {
  return Array(end - start).fill().map((item, index) => start + index);
};

describe("MillionDollarTokenPageV2 contract", async function() {
  let ownerWallet;
  let otherWallet;
  let contractFactory;
  let originalContractFactory;
  let originalContractAccount;
  let mdtp;
  let originalMdtp;
  const tokenIdsToMigrate = arrayWithRange(700, 800);
  const metadataBaseUri = 'ipfs://123/';
  const defaultContentBaseUri = 'ipfs://456/';
  const defaultCollectionUri = 'ipfs://789';
  const defaultTotalMintLimit = 1000;
  const defaultSingleMintLimit = 20;
  const defaultOwnershipMintLimit = 35;
  const defaultMintPrice = 0;
  const defaultRoyaltyBasisPoints = 250; // 2.5%

  before(async () => {
    [ownerWallet, otherWallet] = await hardhat.ethers.getSigners();
    originalContractFactory = await hardhat.ethers.getContractFactory("MillionDollarTokenPage");
    contractFactory = await hardhat.ethers.getContractFactory("MillionDollarTokenPageV2");
  })

  beforeEach(async () => {
    originalMdtp = await originalContractFactory.deploy(defaultTotalMintLimit, defaultSingleMintLimit, defaultOwnershipMintLimit, defaultMintPrice, metadataBaseUri, defaultContentBaseUri);
    originalContractAccount = hardhat.ethers.utils.getAddress(originalMdtp.address);
    mdtp = await contractFactory.deploy(defaultTotalMintLimit, defaultSingleMintLimit, defaultOwnershipMintLimit, defaultMintPrice, metadataBaseUri, defaultContentBaseUri, defaultCollectionUri, defaultRoyaltyBasisPoints, originalContractAccount);
  });

  describe("Admin", async function() {
    it("should have a default totalMintLimit", async function() {
      const totalMintLimit = await mdtp.totalMintLimit();
      expect(totalMintLimit).to.equal(defaultTotalMintLimit);
    });

    it("allows admins to setTotalMintLimit", async function() {
      const newLimit = 123;
      await mdtp.setTotalMintLimit(newLimit);
      const totalMintLimit = await mdtp.totalMintLimit();
      expect(totalMintLimit).to.equal(newLimit);
    });

    it("prevents non-admins to setTotalMintLimit", async function() {
      const transaction = mdtp.connect(otherWallet).setTotalMintLimit(100);
      await expect(transaction).to.be.reverted;
    });

    it("should have a default singleMintLimit", async function() {
      const singleMintLimit = await mdtp.singleMintLimit();
      expect(singleMintLimit).to.equal(defaultSingleMintLimit);
    });

    it("allows admins to setSingleMintLimit", async function() {
      const newLimit = 123;
      await mdtp.setSingleMintLimit(newLimit);
      const singleMintLimit = await mdtp.singleMintLimit();
      expect(singleMintLimit).to.equal(newLimit);
    });

    it("prevents non-admins to setSingleMintLimit", async function() {
      const transaction = mdtp.connect(otherWallet).setSingleMintLimit(100);
      await expect(transaction).to.be.reverted;
    });

    it("should have a default ownershipMintLimit", async function() {
      const ownershipMintLimit = await mdtp.ownershipMintLimit();
      expect(ownershipMintLimit).to.equal(defaultOwnershipMintLimit);
    });

    it("allows admins to setOwnershipMintLimit", async function() {
      const newLimit = 123;
      await mdtp.setOwnershipMintLimit(newLimit);
      const ownershipMintLimit = await mdtp.ownershipMintLimit();
      expect(ownershipMintLimit).to.equal(newLimit);
    });

    it("prevents non-admins to setOwnershipMintLimit", async function() {
      const transaction = mdtp.connect(otherWallet).setOwnershipMintLimit(100);
      await expect(transaction).to.be.reverted;
    });

    it("should have a default mintPrice", async function() {
      const mintPrice = await mdtp.mintPrice();
      expect(mintPrice).to.equal(defaultMintPrice);
    });

    it("allows admins to setMintPrice", async function() {
      const newPrice = 123;
      await mdtp.setMintPrice(newPrice);
      const mintPrice = await mdtp.mintPrice();
      expect(mintPrice).to.equal(newPrice);
    });

    it("prevents non-admins to setMintPrice", async function() {
      const transaction = mdtp.connect(otherWallet).setMintPrice(100);
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to setMetadataBaseURI", async function() {
      const newUri = 'abc/';
      await mdtp.setMetadataBaseURI(newUri);
      const tokenURI = await mdtp.tokenURI(1);
      expect(tokenURI).to.equal(`${newUri}1.json`);
    });

    it("prevents non-admins to setMetadataBaseURI", async function() {
      const transaction = mdtp.connect(otherWallet).setMetadataBaseURI(100);
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to setDefaultContentBaseURI", async function() {
      const newUri = 'abc/';
      await mdtp.setDefaultContentBaseURI(newUri);
      const tokenContentURI = await mdtp.tokenContentURI(1);
      expect(tokenContentURI).to.equal(`${newUri}1.json`);
    });

    it("prevents non-admins to setDefaultContentBaseURI", async function() {
      const transaction = mdtp.connect(otherWallet).setDefaultContentBaseURI(100);
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to setIsCenterSaleActive", async function() {
      await mdtp.setIsCenterSaleActive(true);
      const isCenterSaleActive = await mdtp.isCenterSaleActive();
      expect(isCenterSaleActive).to.equal(true);
    });

    it("prevents non-admins to setDefaultContentBaseURI", async function() {
      const transaction = mdtp.connect(otherWallet).setIsCenterSaleActive(true);
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to pause", async function() {
      await mdtp.pause();
    });

    it("prevents non-admins to pause", async function() {
      const transaction = mdtp.connect(otherWallet).pause();
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to unpause", async function() {
      await mdtp.pause();
      await mdtp.unpause();
    });

    it("prevents non-admins to unpause", async function() {
      const transaction = mdtp.connect(otherWallet).unpause();
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to setIsSaleActive", async function() {
      await mdtp.pause();
      await mdtp.setIsSaleActive(true);
      await mdtp.setIsSaleActive(false);
    });

    it("prevents non-admins to setIsSaleActive", async function() {
      const transaction = mdtp.connect(otherWallet).setIsSaleActive(true);
      await expect(transaction).to.be.reverted;
      const transaction2 = mdtp.connect(otherWallet).setIsSaleActive(false);
      await expect(transaction2).to.be.reverted;
    });

    it("allows admins to setRoyaltyBasisPoints", async function() {
      await mdtp.setRoyaltyBasisPoints(17);
      const royaltyBasisPoints = await mdtp.royaltyBasisPoints();
      expect(royaltyBasisPoints).to.equal(17);
    });

    it("prevents non-admins to setRoyaltyBasisPoints", async function() {
      const transaction = mdtp.connect(otherWallet).setRoyaltyBasisPoints(8);
      await expect(transaction).to.be.reverted;
    });

    it("allows admins to withdraw funds", async function() {
      await mdtp.setIsSaleActive(true);
      await mdtp.setMintPrice(ethers.utils.parseEther("0.01"));
      await mdtp.connect(otherWallet).mintToken(100, {value: ethers.utils.parseEther("0.01")});
      const previousBalance = await ownerWallet.getBalance();
      const transaction = await((await mdtp.withdraw()).wait());
      const transactionGasUsed = transaction.cumulativeGasUsed * transaction.effectiveGasPrice;
      const newBalance = await ownerWallet.getBalance();
      expect(newBalance.add(transactionGasUsed).sub(previousBalance)).to.equal(ethers.utils.parseEther("0.01"));
    });

    it("prevents non-admins to withdraw funds", async function() {
      const transaction = mdtp.connect(otherWallet).withdraw();
      await expect(transaction).to.be.reverted;
    });
  });

  describe("Metadata URIs", async function() {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("should have the correct metadata uri for a non-minted token", async function() {
      const metadataUri = await mdtp.tokenURI(100);
      expect(metadataUri).to.equal(`${metadataBaseUri}100.json`);
    });

    it("should have the correct metadata uri for a minted token", async function() {
      await mdtp.mintToken(100);
      const metadataUri = await mdtp.tokenURI(100);
      expect(metadataUri).to.equal(`${metadataBaseUri}100.json`);
    });

    it("prevents retrieving metadata uri for an invalid token", async function() {
      const transaction = mdtp.tokenURI(10001);
      await expect(transaction).to.be.reverted;
    });

    it("should have the correct collectionURI", async function() {
      const collectionUri = await mdtp.collectionURI();
      expect(collectionUri).to.equal(defaultCollectionUri);
    });

    it("should have the correct contractURI", async function() {
      const contractURI = await mdtp.contractURI();
      expect(contractURI).to.equal(defaultCollectionUri);
    });
  });

  describe("Token Content URIs", async function() {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("should have the correct content uri for a non-minted token", async function() {
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(`${defaultContentBaseUri}100.json`);
    });

    // it("should reset content URI when a token is transferred", async function () {
    //   await mdtp.mintToken(100);
    //   const newUri = "https://www.com/tokens/100"
    //   await mdtp.setTokenContentURI(100, newUri);
    //   await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
    //   const contentUri = await mdtp.tokenContentURI(100);
    //   expect(contentUri).to.equal(`${defaultContentBaseUri}100.json`);
    // });

    it("allows the owner to change the content uri", async function() {
      await mdtp.mintToken(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
    });

    it("prevents changing the content uri of non-minted token", async function() {
      const newUri = "https://www.com/tokens/100";
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.be.reverted;
    });

    it("should have the correct content uri for a minted token with an overwritten uri", async function() {
      await mdtp.mintToken(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(newUri);
    });

    it("prevents a non-owner to change the content uri", async function() {
      await mdtp.mintToken(100);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100)
      const newUri = "https://www.com/tokens/100";
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.be.reverted;
    });

    it("emits a TokenContentURIChanged event when a token content is changed", async function() {
      await mdtp.mintToken(100);
      const newUri = "https://www.com/tokens/100"
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.emit(mdtp, 'TokenContentURIChanged').withArgs(100);
    });

    it("setting setDefaultContentBaseURI should not change existing URIs", async function() {
      await mdtp.mintToken(100);
      const newUri = "https://www.com/tokens/100"
      await mdtp.setTokenContentURI(100, newUri);
      const newUri2 = 'abc/';
      await mdtp.setDefaultContentBaseURI(newUri2);
      const tokenContentURI = await mdtp.tokenContentURI(100);
      expect(tokenContentURI).to.equal(newUri);
    });

    it("prevents setting content URI when paused", async function() {
      await mdtp.mintToken(100);
      await mdtp.pause();
      const newUri = "https://www.com/tokens/100"
      const transaction = mdtp.setTokenContentURI(100, newUri);
      await expect(transaction).to.be.reverted;
    });

    it("prevents retrieving content URI for an invalid token", async function() {
      const transaction = mdtp.tokenContentURI(10001);
      await expect(transaction).to.be.reverted;
    });
  });

  describe("Set Token Group Content URIs", async function() {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("prevents a width < 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, -1, 1, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a width = 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, 0, 1, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a height < 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, 1, -1, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a height = 0", async function() {
      await mdtp.mintTokenGroup(100, 1, 1);
      const transaction = mdtp.setTokenGroupContentURIs(100, 1, 0, ["1"]);
      await expect(transaction).to.be.reverted;
    });

    it("prevents changing the content uri of any non-minted token in the group", async function() {
      await mdtp.mintTokenGroup(100, 2, 1);
      const newUris = ["1", "2", "3", "4"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a non-owner of any token in the group to set content uri", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 101)
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

    it("prevents the number of uris passed to be too small when setting content uris for a token group", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const newUris = ["1", "2", "3"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.be.reverted;
    });

    it("prevents the number of uris passed to be too big when setting content uris for a token group", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const newUris = ["1", "2", "3", "4", "5"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.be.reverted;
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

    it("prevents setting content URI when paused", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      await mdtp.pause();
      const newUris = ["1", "2", "3", "4"]
      const transaction = mdtp.setTokenGroupContentURIs(100, 2, 2, newUris);
      await expect(transaction).to.be.reverted;
    });
  });

  describe("Minting", async function () {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("prevents minting a when sale has not started", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintToken(10001);
      await expect(transaction).to.be.reverted;
    });

    it("does allow minting a token with id 10000", async function() {
      const transaction = mdtp.mintToken(10000);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token with id over 10000", async function() {
      const transaction = mdtp.mintToken(10001);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token with id 0", async function() {
      const transaction = mdtp.mintToken(0);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token with negative id", async function() {
      const transaction = mdtp.mintToken(-100);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a token to be minted twice", async function() {
      await mdtp.mintToken(100);
      const transaction = mdtp.mintToken(100);
      await expect(transaction).to.be.reverted;
    });

    it("emits a Transfer event when a token is minted", async function() {
      const transaction = mdtp.mintToken(100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', ownerWallet.address, 100);
    });

    it("updates mintedCount when a token is minted", async function() {
      await mdtp.mintToken(100);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(1);
    });

    it("cannot mint over the totalMintLimit", async function() {
      await mdtp.setTotalMintLimit(2);
      await mdtp.mintToken(100);
      await mdtp.mintToken(101);
      const transaction = mdtp.mintToken(102);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the ownershipMintLimit", async function() {
      await mdtp.setOwnershipMintLimit(2);
      await mdtp.mintToken(100);
      await mdtp.mintToken(101);
      const transaction = mdtp.mintToken(102);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mintToken(100, {value: 1});
      await expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintToken(100, {value: 2});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintToken(100, {value: 3});
    });

    it("sets the owner to the caller", async function() {
      await mdtp.mintToken(100);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(ownerWallet.address)
    });

    it("should change the content uri to the metadata uri after minting", async function() {
      await mdtp.mintToken(100);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(`${metadataBaseUri}100.json`);
    });

    it("prevents minting top left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintToken(4038);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting top right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintToken(4062);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintToken(5938);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintToken(5962);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting middle center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintToken(5054);
      await expect(transaction).to.be.reverted;
    });

    it("allows minting non-center blocks when isCenterSaleActive is false", async function() {
      await mdtp.mintToken(3038);
      await mdtp.mintToken(4037);
      await mdtp.mintToken(3062);
      await mdtp.mintToken(4063);
      await mdtp.mintToken(6938);
      await mdtp.mintToken(5937);
      await mdtp.mintToken(6962);
      await mdtp.mintToken(5963);
    });

    it("does allow minting center blocks when isCenterSaleActive is true", async function() {
      await mdtp.setIsCenterSaleActive(true);
      await mdtp.mintToken(4038);
      await mdtp.mintToken(4062);
      await mdtp.mintToken(5938);
      await mdtp.mintToken(5962);
      await mdtp.mintToken(5054);
    });

    it("prevents minting when paused", async function() {
      await mdtp.pause();
      const transaction = mdtp.mintToken(1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting when isSaleActive is false", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintToken(1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token id from the old contract", async function() {
      await mdtp.addTokensToMigrate(tokenIdsToMigrate);
      const transaction = mdtp.mintToken(tokenIdsToMigrate[0]);
      await expect(transaction).to.be.reverted;
      const transaction2 = mdtp.mintToken(tokenIdsToMigrate[tokenIdsToMigrate.length - 1]);
      await expect(transaction2).to.be.reverted;
    });
  });

  describe("Minting To", async function () {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("prevents minting a when sale has not started", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintTokenTo(otherWallet.address, 10001);
      await expect(transaction).to.be.reverted;
    });

    it("does allow minting a token with id 10000", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 10000);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token with id over 10000", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 10001);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token with id 0", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 0);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token with negative id", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, -100);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a token to be minted twice", async function() {
      await mdtp.mintTokenTo(otherWallet.address, 100);
      const transaction = mdtp.mintTokenTo(otherWallet.address, 100);
      await expect(transaction).to.be.reverted;
    });

    it("emits a Transfer event when a token is minted", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', otherWallet.address, 100);
    });

    it("updates mintedCount when a token is minted", async function() {
      await mdtp.mintTokenTo(otherWallet.address, 100);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(1);
    });

    it("cannot mint over the totalMintLimit", async function() {
      await mdtp.setTotalMintLimit(2);
      await mdtp.mintTokenTo(otherWallet.address, 100);
      await mdtp.mintTokenTo(otherWallet.address, 101);
      const transaction = mdtp.mintTokenTo(otherWallet.address, 102);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the ownershipMintLimit", async function() {
      await mdtp.setOwnershipMintLimit(2);
      await mdtp.mintTokenTo(otherWallet.address, 100);
      await mdtp.mintTokenTo(otherWallet.address, 101);
      const transaction = mdtp.mintTokenTo(otherWallet.address, 102);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mintTokenTo(otherWallet.address, 100, {value: 1});
      await expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenTo(otherWallet.address, 100, {value: 2});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenTo(otherWallet.address, 100, {value: 3});
    });

    it("sets the owner to the caller", async function() {
      await mdtp.mintTokenTo(otherWallet.address, 100);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(otherWallet.address)
    });

    it("should change the content uri to the metadata uri after minting", async function() {
      await mdtp.mintTokenTo(otherWallet.address, 100);
      const contentUri = await mdtp.tokenContentURI(100);
      expect(contentUri).to.equal(`${metadataBaseUri}100.json`);
    });

    it("prevents minting top left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 4038);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting top right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 4062);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 5938);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 5962);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting middle center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenTo(otherWallet.address, 5054);
      await expect(transaction).to.be.reverted;
    });

    it("allows minting non-center blocks when isCenterSaleActive is false", async function() {
      await mdtp.mintTokenTo(otherWallet.address, 3038);
      await mdtp.mintTokenTo(otherWallet.address, 4037);
      await mdtp.mintTokenTo(otherWallet.address, 3062);
      await mdtp.mintTokenTo(otherWallet.address, 4063);
      await mdtp.mintTokenTo(otherWallet.address, 6938);
      await mdtp.mintTokenTo(otherWallet.address, 5937);
      await mdtp.mintTokenTo(otherWallet.address, 6962);
      await mdtp.mintTokenTo(otherWallet.address, 5963);
    });

    it("does allow minting center blocks when isCenterSaleActive is true", async function() {
      await mdtp.setIsCenterSaleActive(true);
      await mdtp.mintTokenTo(otherWallet.address, 4038);
      await mdtp.mintTokenTo(otherWallet.address, 4062);
      await mdtp.mintTokenTo(otherWallet.address, 5938);
      await mdtp.mintTokenTo(otherWallet.address, 5962);
      await mdtp.mintTokenTo(otherWallet.address, 5054);
    });

    it("prevents minting when paused", async function() {
      await mdtp.pause();
      const transaction = mdtp.mintTokenTo(otherWallet.address, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting when isSaleActive is false", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintTokenTo(otherWallet.address, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token id from the old contract", async function() {
      await mdtp.addTokensToMigrate(tokenIdsToMigrate);
      const transaction = mdtp.mintTokenTo(otherWallet.address, tokenIdsToMigrate[0]);
      await expect(transaction).to.be.reverted;
      const transaction2 = mdtp.mintTokenTo(otherWallet.address, tokenIdsToMigrate[tokenIdsToMigrate.length - 1]);
      await expect(transaction2).to.be.reverted;
    });
  });

  describe("Minting Group", async function () {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("prevents minting a when sale has not started", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintTokenGroup(100, 2, 2);
      await expect(transaction).to.be.reverted;
    });

    it("sets the owner to the caller", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(ownerWallet.address)
      const owner2 = await mdtp.ownerOf(101);
      expect(owner2).to.equal(ownerWallet.address)
      const owner3 = await mdtp.ownerOf(200);
      expect(owner3).to.equal(ownerWallet.address)
      const owner4 = await mdtp.ownerOf(201);
      expect(owner4).to.equal(ownerWallet.address)
    });

    it("prevents a width < 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, -1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a width = 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 0, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a height < 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 1, -1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a height = 0", async function() {
      const transaction = mdtp.mintTokenGroup(100, 1, 0);
      await expect(transaction).to.be.reverted;
    });

    it("does allow minting token with id 10000", async function() {
      const transaction = mdtp.mintTokenGroup(10000, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id over 10000", async function() {
      const transaction = mdtp.mintTokenGroup(10001, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id over 10000 (with height overflow)", async function() {
      const transaction = mdtp.mintTokenGroup(9999, 1, 2);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id over 10000 (with width overflow)", async function() {
      const transaction = mdtp.mintTokenGroup(9999, 3, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id 0", async function() {
      const transaction = mdtp.mintTokenGroup(0);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with negative id", async function() {
      const transaction = mdtp.mintTokenGroup(-100);
      await expect(transaction).to.be.reverted;
    });

    it("prevents any token to be minted twice", async function() {
      await mdtp.mintTokenGroup(100, 2, 1);
      const transaction = mdtp.mintTokenGroup(101);
      await expect(transaction).to.be.reverted;
    });

    it("emits Transfer events when tokens are minted", async function() {
      const transaction = mdtp.mintTokenGroup(100, 2, 2);
      const receipt = await transaction;
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', ownerWallet.address, 100);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', ownerWallet.address, 101);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', ownerWallet.address, 200);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', ownerWallet.address, 201);
    });

    it("updates mintedCount when tokens are minted", async function() {
      await mdtp.mintTokenGroup(100, 5, 2);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(10);
    });

    it("cannot mint over the singleMintLimit", async function() {
      await mdtp.setSingleMintLimit(2);
      const transaction = mdtp.mintTokenGroup(100, 3, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in separate transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      await mdtp.mintTokenGroup(100, 2, 1);
      const transaction = mdtp.mintTokenGroup(102, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in a single transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      const transaction = mdtp.mintTokenGroup(100, 4, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the ownershipMintLimit in separate transactions", async function() {
      await mdtp.setOwnershipMintLimit(3);
      await mdtp.mintTokenGroup(100, 2, 1);
      const transaction = mdtp.mintTokenGroup(102, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the ownershipMintLimit in a single transactions", async function() {
      await mdtp.setOwnershipMintLimit(3);
      const transaction = mdtp.mintTokenGroup(100, 4, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mintTokenGroup(100, 2, 1, {value: 3});
      await expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroup(100, 2, 1, {value: 4});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroup(100, 2, 1, {value: 5});
    });

    it("should change the content uri to the metadata uri after minting", async function() {
      await mdtp.mintTokenGroup(100, 2, 1);
      const contentUri1 = await mdtp.tokenContentURI(100);
      expect(contentUri1).to.equal(`${metadataBaseUri}100.json`);
      const contentUri2 = await mdtp.tokenContentURI(101);
      expect(contentUri2).to.equal(`${metadataBaseUri}101.json`);
    });

    it("prevents minting top left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroup(4037, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting top right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroup(4062, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroup(5937, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroup(5962, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting middle center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroup(5054, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does allow minting center blocks when isCenterSaleActive is true", async function() {
      await mdtp.setIsCenterSaleActive(true);
      await mdtp.mintTokenGroup(4037, 1, 1);
      await mdtp.mintTokenGroup(4062, 1, 1);
      await mdtp.mintTokenGroup(5937, 1, 1);
      await mdtp.mintTokenGroup(5962, 1, 1);
      await mdtp.mintTokenGroup(5054, 1, 1);
    });

    it("prevents minting when paused", async function() {
      await mdtp.pause();
      const transaction = mdtp.mintTokenGroup(1, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting when isSaleActive is false", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintTokenGroup(1, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token id from the old contract", async function() {
      await mdtp.addTokensToMigrate(tokenIdsToMigrate);
      const transaction = mdtp.mintTokenGroup(tokenIdsToMigrate[0] - 1, 2, 2);
      await expect(transaction).to.be.reverted;
      const transaction2 = mdtp.mintTokenGroup(tokenIdsToMigrate[tokenIdsToMigrate.length - 1] - 1, 2, 2);
      await expect(transaction2).to.be.reverted;
    });
  });

  describe("Minting Group To", async function () {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("prevents minting a when sale has not started", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 2);
      await expect(transaction).to.be.reverted;
    });

    it("sets the owner to the caller", async function() {
      await mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 2);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(otherWallet.address)
      const owner2 = await mdtp.ownerOf(101);
      expect(owner2).to.equal(otherWallet.address)
      const owner3 = await mdtp.ownerOf(200);
      expect(owner3).to.equal(otherWallet.address)
      const owner4 = await mdtp.ownerOf(201);
      expect(owner4).to.equal(otherWallet.address)
    });

    it("prevents a width < 0", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, -1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a width = 0", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 0, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a height < 0", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 1, -1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a height = 0", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 1, 0);
      await expect(transaction).to.be.reverted;
    });

    it("does allow minting token with id 10000", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 10000, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id over 10000", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 10001, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id over 10000 (with height overflow)", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 9999, 1, 2);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id over 10000 (with width overflow)", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 9999, 3, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with id 0", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 0);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting any token with negative id", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, -100);
      await expect(transaction).to.be.reverted;
    });

    it("prevents any token to be minted twice", async function() {
      await mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 101);
      await expect(transaction).to.be.reverted;
    });

    it("emits Transfer events when tokens are minted", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 2);
      const receipt = await transaction;
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', otherWallet.address, 100);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', otherWallet.address, 101);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', otherWallet.address, 200);
      expect(receipt).to.emit(mdtp, 'Transfer').withArgs('0x0000000000000000000000000000000000000000', otherWallet.address, 201);
    });

    it("updates mintedCount when tokens are minted", async function() {
      await mdtp.mintTokenGroupTo(otherWallet.address, 100, 5, 2);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(10);
    });

    it("cannot mint over the singleMintLimit", async function() {
      await mdtp.setSingleMintLimit(2);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 3, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in separate transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      await mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 102, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the totalMintLimit in a single transactions", async function() {
      await mdtp.setTotalMintLimit(3);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 4, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the ownershipMintLimit in separate transactions", async function() {
      await mdtp.setOwnershipMintLimit(3);
      await mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 102, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint over the ownershipMintLimit in a single transactions", async function() {
      await mdtp.setOwnershipMintLimit(3);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 4, 1);
      await expect(transaction).to.be.reverted;
    });

    it("cannot mint with less money than the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1, {value: 3});
      await expect(transaction).to.be.reverted;
    });

    it("can mint with money equal to the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1, {value: 4});
    });

    it("can mint with money above the mintPrice", async function() {
      await mdtp.setMintPrice(2);
      mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1, {value: 5});
    });

    it("should change the content uri to the metadata uri after minting", async function() {
      await mdtp.mintTokenGroupTo(otherWallet.address, 100, 2, 1);
      const contentUri1 = await mdtp.tokenContentURI(100);
      expect(contentUri1).to.equal(`${metadataBaseUri}100.json`);
      const contentUri2 = await mdtp.tokenContentURI(101);
      expect(contentUri2).to.equal(`${metadataBaseUri}101.json`);
    });

    it("prevents minting top left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 4037, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting top right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 4062, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom left center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 5937, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting bottom right center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 5962, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting middle center block when isCenterSaleActive is false", async function() {
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 5054, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("does allow minting center blocks when isCenterSaleActive is true", async function() {
      await mdtp.setIsCenterSaleActive(true);
      await mdtp.mintTokenGroupTo(otherWallet.address, 4037, 1, 1);
      await mdtp.mintTokenGroupTo(otherWallet.address, 4062, 1, 1);
      await mdtp.mintTokenGroupTo(otherWallet.address, 5937, 1, 1);
      await mdtp.mintTokenGroupTo(otherWallet.address, 5962, 1, 1);
      await mdtp.mintTokenGroupTo(otherWallet.address, 5054, 1, 1);
    });

    it("prevents minting when paused", async function() {
      await mdtp.pause();
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 1, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting when isSaleActive is false", async function() {
      await mdtp.setIsSaleActive(false);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, 1, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents minting a token id from the old contract", async function() {
      await mdtp.addTokensToMigrate(tokenIdsToMigrate);
      const transaction = mdtp.mintTokenGroupTo(otherWallet.address, tokenIdsToMigrate[0] - 1, 2, 2);
      await expect(transaction).to.be.reverted;
      const transaction2 = mdtp.mintTokenGroupTo(otherWallet.address, tokenIdsToMigrate[tokenIdsToMigrate.length - 1] - 1, 2, 2);
      await expect(transaction2).to.be.reverted;
    });
  });

  describe("IERC721Enumerable", async function() {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("should have a totalSupply of 10000 initially", async function() {
      const totalSupply = await mdtp.totalSupply();
      expect(totalSupply).to.equal(10000);
    });

    it("should have a totalSupply of 10000 after tokens have been minted", async function() {
      await mdtp.mintToken(1);
      await mdtp.mintToken(2);
      const totalSupply = await mdtp.totalSupply();
      expect(totalSupply).to.equal(10000);
    });

    it("returns 0 for the balance of a non-token holder", async function () {
      const balance = await mdtp.balanceOf(ownerWallet.address);
      expect(balance).to.equal(0);
    });

    it("returns the correct value for the balance of a token holder", async function () {
      await mdtp.mintToken(100);
      await mdtp.mintToken(101);
      await mdtp.mintToken(102);
      const balance = await mdtp.balanceOf(ownerWallet.address);
      expect(balance).to.equal(3);
    });

    it("returns the correct value for the balance of a transferred token", async function () {
      await mdtp.mintToken(100);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
      const balance1 = await mdtp.balanceOf(ownerWallet.address);
      expect(balance1).to.equal(0);
      const balance2 = await mdtp.balanceOf(otherWallet.address);
      expect(balance2).to.equal(1);
    });

    it("raises an error for ownerOf of a non-minted token", async function () {
      const transaction = mdtp.ownerOf(100);
      await expect(transaction).to.be.reverted;
    });

    it("returns the correct value for ownerOf of a minted token", async function () {
      await mdtp.mintToken(100);
      const owner = await mdtp.ownerOf(100);
      expect(owner).to.equal(ownerWallet.address);
    });

    it("returns the correct value for ownerOf of a transferred token", async function () {
      await mdtp.mintToken(100);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
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
      await mdtp.mintToken(100);
      await mdtp.mintToken(101);
      await mdtp.mintToken(102);
      const tokenId = await mdtp.tokenOfOwnerByIndex(ownerWallet.address, 1);
      expect(tokenId).to.equal(101);
    });

    it("returns the correct value for tokenOfOwnerByIndex after tokens are transferred", async function () {
      await mdtp.mintToken(100);
      await mdtp.mintToken(101);
      await mdtp.mintToken(102);
      const tokenId = await mdtp.tokenOfOwnerByIndex(ownerWallet.address, 0);
      expect(tokenId).to.equal(100);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
      const tokenId2 = await mdtp.tokenOfOwnerByIndex(ownerWallet.address, 0);
      expect(tokenId2).to.equal(101);
      const tokenId3 = await mdtp.tokenOfOwnerByIndex(ownerWallet.address, 1);
      expect(tokenId3).to.equal(102);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 101);
      const tokenId4 = await mdtp.tokenOfOwnerByIndex(ownerWallet.address, 0);
      expect(tokenId4).to.equal(102);
    });
  });

  describe("Transferring", async function () {
    beforeEach(async () => {
      await mdtp.setIsSaleActive(true);
    });

    it("emits a Transfer event when a token is transferred", async function() {
      await mdtp.mintToken(100);
      const transaction = mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
      await expect(transaction).to.emit(mdtp, 'Transfer').withArgs(ownerWallet.address, otherWallet.address, 100);
    });

    it("does not change mintedCount when a token is transferred", async function() {
      await mdtp.mintToken(100);
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(1);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
      const mintedCount2 = await mdtp.mintedCount();
      expect(mintedCount2).to.equal(1);
    });

    it("prevents transferFrom when paused", async function() {
      await mdtp.mintToken(100);
      await mdtp.pause();
      const transaction = mdtp.transferFrom(ownerWallet.address, otherWallet.address, 100);
      await expect(transaction).to.be.reverted;
    });

    it("prevents transferFrom a non-owned token", async function() {
      await mdtp.mintToken(100);
      const transaction = mdtp.transferFrom(ownerWallet.address, otherWallet.address, 101);
      await expect(transaction).to.be.reverted;
    });

    it("allows transferGroupFrom", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      await mdtp.transferGroupFrom(ownerWallet.address, otherWallet.address, 100, 2, 1);
      const owner100 = await mdtp.ownerOf(100);
      expect(owner100).to.equal(otherWallet.address);
      const owner101 = await mdtp.ownerOf(101);
      expect(owner101).to.equal(otherWallet.address);
      const owner200 = await mdtp.ownerOf(200);
      expect(owner200).to.equal(ownerWallet.address);
      const owner201 = await mdtp.ownerOf(201);
      expect(owner201).to.equal(ownerWallet.address);
    });

    it("prevents transferGroupFrom when paused", async function() {
      await mdtp.mintToken(100);
      await mdtp.pause();
      const transaction = mdtp.transferGroupFrom(ownerWallet.address, otherWallet.address, 100, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents transferGroupFrom of a non-owned token", async function() {
      await mdtp.mintToken(100);
      await mdtp.pause();
      const transaction = mdtp.transferGroupFrom(ownerWallet.address, otherWallet.address, 100, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("allows safeTransferGroupFrom", async function() {
      await mdtp.mintTokenGroup(100, 2, 2);
      await mdtp.safeTransferGroupFrom(ownerWallet.address, otherWallet.address, 100, 2, 1);
      const owner100 = await mdtp.ownerOf(100);
      expect(owner100).to.equal(otherWallet.address);
      const owner101 = await mdtp.ownerOf(101);
      expect(owner101).to.equal(otherWallet.address);
      const owner200 = await mdtp.ownerOf(200);
      expect(owner200).to.equal(ownerWallet.address);
      const owner201 = await mdtp.ownerOf(201);
      expect(owner201).to.equal(ownerWallet.address);
    });

    it("prevents safeTransferGroupFrom when paused", async function() {
      await mdtp.mintToken(100);
      await mdtp.pause();
      const transaction = mdtp.safeTransferGroupFrom(ownerWallet.address, otherWallet.address, 100, 1, 1);
      await expect(transaction).to.be.reverted;
    });

    it("prevents safeTransferGroupFrom of a non-owned token", async function() {
      await mdtp.mintToken(100);
      await mdtp.pause();
      const transaction = mdtp.safeTransferGroupFrom(ownerWallet.address, otherWallet.address, 100, 2, 1);
      await expect(transaction).to.be.reverted;
    });

    it("calculates royalties correctly for a single token transfer", async function() {
      const royaltyValue = await mdtp.royaltyInfo(100, 1000);
      expect(royaltyValue).to.eql([mdtp.address, ethers.BigNumber.from(Math.floor(1000 * defaultRoyaltyBasisPoints / 10000))]);
    });

    it("calculates royalties correctly for a single token transfer after update", async function() {
      await mdtp.setRoyaltyBasisPoints(100); // 1%
      const royaltyValue = await mdtp.royaltyInfo(100, 1000000);
      expect(royaltyValue).to.eql([mdtp.address, ethers.BigNumber.from(Math.floor(1000000 * 0.01))]);
    });
  });

  describe("Migration", async function () {
    beforeEach(async () => {
      await mdtp.addTokensToMigrate(tokenIdsToMigrate);
    });

    it("allows admins to completeMigration", async function() {
      await mdtp.completeMigration();
    });

    it("prevents non-admins to completeMigration", async function() {
      const transaction = mdtp.connect(otherWallet).completeMigration();
      await expect(transaction).to.be.reverted;
    });

    it("prevents non-admins from calling addTokensToMigrate", async function() {
      const transaction = mdtp.connect(otherWallet).addTokensToMigrate(tokenIdsToMigrate);
      await expect(transaction).to.be.reverted;
    });

    it("prevents calling addTokensToMigrate after migration is complete", async function() {
      await mdtp.completeMigration();
      const transaction = mdtp.addTokensToMigrate(tokenIdsToMigrate);
      await expect(transaction).to.be.reverted;
    });

    it("has the original contract as the owner for tokens to migrate", async function() {
      tokenIdsToMigrate.forEach(async tokenId => {
        const owner = await mdtp.ownerOf(tokenId);
        expect(owner).to.equal(originalContractAccount);
      })
    });

    it("has a mint count equal to migration tokens", async function() {
      const tokenCount = await mdtp.mintedCount();
      expect(tokenCount).to.equal(tokenIdsToMigrate.length);
    });

    it("has the original contract with a balance equal to the length of tokens to migrate", async function() {
      const balance = await mdtp.balanceOf(originalContractAccount);
      expect(balance).to.equal(tokenIdsToMigrate.length);
    });

    it("prevents a transfer from a contract that is not the original", async function() {
      const oldMdtp2 = await originalContractFactory.deploy(defaultTotalMintLimit, defaultSingleMintLimit, defaultOwnershipMintLimit, defaultMintPrice, metadataBaseUri, defaultContentBaseUri);
      await oldMdtp2.mintToken(tokenIdsToMigrate[0]);
      const transaction = oldMdtp2['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      await expect(transaction).to.be.reverted;
    });

    it("prevents a transfer if the token is not in the migration list", async function() {
      await originalMdtp.mintToken(100);
      const transaction = originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, 100);
      await expect(transaction).to.be.reverted;
    });

    it("sets the transferrer as the new owner when a token is migrated", async function() {
      const owner = await mdtp.ownerOf(tokenIdsToMigrate[0]);
      expect(owner).to.equal(originalContractAccount);
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const owner2 = await mdtp.ownerOf(tokenIdsToMigrate[0]);
      expect(owner2).to.equal(ownerWallet.address);
    });

    it("keeps the minted count the same when a token is migrated", async function() {
      const mintedCount = await mdtp.mintedCount();
      expect(mintedCount).to.equal(tokenIdsToMigrate.length);
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const mintedCount2 = await mdtp.mintedCount();
      expect(mintedCount2).to.equal(tokenIdsToMigrate.length);
    });

    it("increments the new transerrer's balance when a token is migrated", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      const balance = await mdtp.balanceOf(ownerWallet.address);
      expect(balance).to.equal(0);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const balance2 = await mdtp.balanceOf(ownerWallet.address);
      expect(balance2).to.equal(1);
    });

    it("decrements the old contracts balance when a token is migrated", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      const balance = await mdtp.balanceOf(originalMdtp.address);
      expect(balance).to.equal(tokenIdsToMigrate.length);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const balance2 = await mdtp.balanceOf(originalMdtp.address);
      expect(balance2).to.equal(tokenIdsToMigrate.length - 1);
    });

    it("prevents a token to be migrated twice", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const transaction = originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      await expect(transaction).to.be.reverted;
    });

    it("allows transferring after the token is migrated", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      await mdtp.transferFrom(ownerWallet.address, otherWallet.address, tokenIdsToMigrate[0]);
      const owner = await mdtp.ownerOf(tokenIdsToMigrate[0]);
      expect(owner).to.equal(otherWallet.address);
    });

    it("uses the the old contracts content url for un-migrated tokens", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      const contentUri = 'https://url.com';
      await originalMdtp.setTokenContentURI(tokenIdsToMigrate[0], contentUri);
      const receivedContentUri = await mdtp.tokenContentURI(tokenIdsToMigrate[0])
      expect(receivedContentUri).to.equal(contentUri);
    });

    it("allows setting a content url after the token is migrated", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const contentUri = 'https://url.com';
      await mdtp.setTokenContentURI(tokenIdsToMigrate[0], contentUri)
      const receivedContentUri = await mdtp.tokenContentURI(tokenIdsToMigrate[0])
      expect(receivedContentUri).to.equal(contentUri);
    });

    it("returns the normal owner from proxiedOwnerOf if token is new", async function() {
      await mdtp.setIsSaleActive(true);
      await mdtp.mintToken(100);
      const owner = await mdtp.proxiedOwnerOf(100);
      expect(owner).to.equal(ownerWallet.address);
    });

    it("returns the original contracts owner for un-migrated tokens from proxiedOwnerOf", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      const owner = await mdtp.proxiedOwnerOf(tokenIdsToMigrate[0]);
      expect(owner).to.equal(ownerWallet.address);
    });

    it("returns an error from proxiedOwnerOf for a token that is not owned in either contract", async function() {
      const transaction = mdtp.proxiedOwnerOf(100);
      await expect(transaction).to.be.reverted;
    });

    it("returns the correct owner from proxiedOwnerOf after a migration", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      await originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      const owner = await mdtp.proxiedOwnerOf(tokenIdsToMigrate[0]);
      expect(owner).to.equal(ownerWallet.address);
    });

    it("allows sending 1000 tokens to migrate", async function() {
      await mdtp.addTokensToMigrate(arrayWithRange(1000, 2000));
    });

    it("emit an event on migration", async function() {
      await originalMdtp.mintToken(tokenIdsToMigrate[0]);
      const transaction = originalMdtp['safeTransferFrom(address,address,uint256)'](ownerWallet.address, mdtp.address, tokenIdsToMigrate[0]);
      await expect(transaction).to.emit(mdtp, 'TokenMigrated').withArgs(tokenIdsToMigrate[0]);
    });
  });
});
