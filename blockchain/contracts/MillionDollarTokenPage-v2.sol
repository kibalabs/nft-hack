// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "./ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// https://github.com/ethereum/solidity-examples/blob/master/docs/bits/Bits.md
library Bits {
    uint constant internal ONE = uint(1);

    function setBit(uint self, uint8 index) internal pure returns (uint) {
        return self | ONE << index;
    }

    function clearBit(uint self, uint8 index) internal pure returns (uint) {
        return self & ~(ONE << index);
    }

    function isBitSet(uint self, uint8 index) internal pure returns (bool) {
        return self >> index & 1 == 1;
    }
}

interface IERC721CollectionMetadata {
    /* Read more at https://dev.milliondollartokenpage.com/ierc721collectionmetadata */
    function collectionURI() external returns (string memory) ;
}

interface MillionDollarTokenPageV1 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenContentURI(uint256 tokenId) external view returns (string memory);
}

contract MillionDollarTokenPageV2 is ERC721, IERC2981, Pausable, Ownable, IERC721Receiver, IERC721Enumerable, IERC721CollectionMetadata {
    using Address for address;
    using Bits for uint256;

    uint256 private mintedTokenCount;
    mapping(uint256 => string) private _tokenContentURIs;

    uint16 public constant COLUMN_COUNT = 100;
    uint16 public constant ROW_COUNT = 100;
    uint16 public constant SUPPLY_LIMIT = COLUMN_COUNT * ROW_COUNT;

    uint8 public royaltyPercentage;
    uint16 public totalMintLimit;
    uint16 public singleMintLimit;
    uint16 public userMintLimit;
    uint256 public mintPrice;
    bool public isSaleActive;
    bool public isCenterSaleActive;

    string public metadataBaseURI;
    string public defaultContentBaseURI;
    string public override collectionURI;

    // TODO(krishan711): document migration process here
    MillionDollarTokenPageV1 public original;
    bool public canAddTokenIdsToMigrate;
    uint256 private tokenIdsToMigrateCount;
    uint256[(SUPPLY_LIMIT / 256) + 1] private tokenIdsToMigrateBitmap;

    event TokenContentURIChanged(uint256 indexed tokenId);

    constructor(uint16 _totalMintLimit, uint16 _singleMintLimit, uint16 _userMintLimit, uint256 _mintPrice, string memory _metadataBaseURI, string memory _defaultContentBaseURI, string memory _collectionURI, uint8 _royaltyPercentage, address _original) ERC721("MillionDollarTokenPage", "\u22A1") Ownable() Pausable() {
        isSaleActive = false;
        isCenterSaleActive = false;
        canAddTokenIdsToMigrate = false;
        metadataBaseURI = _metadataBaseURI;
        defaultContentBaseURI = _defaultContentBaseURI;
        collectionURI = _collectionURI;
        totalMintLimit = _totalMintLimit;
        singleMintLimit = _singleMintLimit;
        userMintLimit = _userMintLimit;
        mintPrice = _mintPrice;
        royaltyPercentage = _royaltyPercentage;
        original = MillionDollarTokenPageV1(_original);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC721Enumerable).interfaceId ||
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address, uint256) {
        return (address(this), salePrice * 100 / royaltyPercentage);
    }

    // Utils

    modifier onlyValidToken(uint256 tokenId) {
        require(tokenId > 0 && tokenId <= SUPPLY_LIMIT, "MDTP: invalid tokenId");
        _;
    }

    modifier onlyValidTokenGroup(uint256 tokenId, uint8 width, uint8 height) {
        require(width > 0, "MDTP: width must be > 0");
        require(height > 0, "MDTP: height must be > 0");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "MDTP: caller is not token owner");
        _;
    }

    modifier onlyTokenGroupOwner(uint256 tokenId, uint8 width, uint8 height) {
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                require(ownerOf(innerTokenId) == _msgSender(), "MDTP: caller is not the tokenOwner of all tokens in group");
            }
        }
        _;
    }

    // Admin

    function setIsSaleActive(bool newisSaleActive) external onlyOwner {
        isSaleActive = newisSaleActive;
    }

    function setIsCenterSaleActive(bool newIsCenterSaleActive) external onlyOwner {
        isCenterSaleActive = newIsCenterSaleActive;
    }

    function setTotalMintLimit(uint16 newTotalMintLimit) external onlyOwner {
        totalMintLimit = newTotalMintLimit;
    }

    function setSingleMintLimit(uint16 newSingleMintLimit) external onlyOwner {
        singleMintLimit = newSingleMintLimit;
    }

    function setUserMintLimit(uint16 newUserMintLimit) external onlyOwner {
        userMintLimit = newUserMintLimit;
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
    }

    function setMetadataBaseURI(string calldata newMetadataBaseURI) external onlyOwner {
        metadataBaseURI = newMetadataBaseURI;
    }

    function setDefaultContentBaseURI(string calldata newDefaultContentBaseURI) external onlyOwner {
        defaultContentBaseURI = newDefaultContentBaseURI;
    }

    function setCollectionURI(string calldata newCollectionURI) external onlyOwner {
        collectionURI = newCollectionURI;
    }

    function setRoyaltyPercentage(uint8 newRoyaltyPercentage) external onlyOwner {
        royaltyPercentage = newRoyaltyPercentage;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        console.log('balance', balance);
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed.");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Metadata URIs

    function tokenURI(uint256 tokenId) public view override onlyValidToken(tokenId) returns (string memory) {
        return string(abi.encodePacked(metadataBaseURI, Strings.toString(tokenId), ".json"));
    }

    // Content URIs

    // NOTE(krishan711): contract URIs should point to a JSON file that contains:
    // name: string -> the high level title for your content. This should be <250 chars.
    // description: string -> a description of your content. This should be <2500 chars.
    // image: string -> a URI pointing to and image for your item in the grid. This should be at least 300x300 and will be cropped if not square.
    // url: optional[string] -> a URI pointing to the location you want visitors of your content to go to.
    // groupId: optional[string] -> a unique identifier you can use to group multiple grid items together by giving them all the same groupId.

    function setTokenContentURI(uint256 tokenId, string memory contentURI) external onlyTokenOwner(tokenId) {
        _setTokenContentURI(tokenId, contentURI);
    }

    function setTokenGroupContentURIs(uint256 tokenId, uint8 width, uint8 height, string[] memory contentURIs) external onlyTokenGroupOwner(tokenId, width, height) onlyValidTokenGroup(tokenId, width, height) {
        require(width * height == contentURIs.length, "MDTP: length of contentURIs incorrect");
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint16 index = (width * y) + x;
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                _setTokenContentURI(innerTokenId, contentURIs[index]);
            }
        }
    }

    function _setTokenContentURI(uint256 tokenId, string memory contentURI) internal whenNotPaused() {
        _tokenContentURIs[tokenId] = contentURI;
        emit TokenContentURIChanged(tokenId);
    }

    function tokenContentURI(uint256 tokenId) external view onlyValidToken(tokenId) returns (string memory) {
        if (isTokenSetForMigration(tokenId)) {
            return original.tokenContentURI(tokenId);
        }
        string memory _tokenContentURI = _tokenContentURIs[tokenId];
        if (bytes(_tokenContentURI).length > 0) {
            return _tokenContentURI;
        }
        address owner = _owners[tokenId];
        if (owner != address(0)) {
            return tokenURI(tokenId);
        }
        return string(abi.encodePacked(defaultContentBaseURI, Strings.toString(tokenId), ".json"));
    }

    // Minting

    function isInMiddle(uint256 tokenId) internal pure returns (bool) {
        uint256 x = tokenId % COLUMN_COUNT;
        uint256 y = tokenId / ROW_COUNT;
        return x >= 38 && x <= 62 && y >= 40 && y <= 59;
    }

    function mintToken(uint256 tokenId) external payable {
        require(msg.value >= mintPrice, "MDTP: insufficient payment");
        _safeMint(_msgSender(), tokenId, 1, 1);
    }

    function mintTokenTo(address receiver, uint256 tokenId) external payable {
        require(msg.value >= mintPrice, "MDTP: insufficient payment");
        _safeMint(receiver, tokenId, 1, 1);
    }

    function mintTokenGroup(uint256 tokenId, uint8 width, uint8 height) external payable {
        require(msg.value >= (mintPrice * width * height), "MDTP: insufficient payment");
        _safeMint(_msgSender(), tokenId, width, height);
    }

    function mintTokenGroupTo(address receiver, uint256 tokenId, uint8 width, uint8 height) external payable {
        require(msg.value >= (mintPrice * width * height), "MDTP: insufficient payment");
        _safeMint(receiver, tokenId, width, height);
    }

    function _safeMint(address receiver, uint256 tokenId, uint8 width, uint8 height) internal {
        _safeMint(receiver, tokenId, width, height, "");
    }

    function _safeMint(address receiver, uint256 tokenId, uint8 width, uint8 height, bytes memory _data) internal onlyValidTokenGroup(tokenId, width, height) {
        uint256 quantity = (width * height);
        require(tokenId > 0, "MDTP: invalid tokenId");
        require(tokenId + (ROW_COUNT * height) + width < SUPPLY_LIMIT, "MDTP: invalid tokenId");
        require(quantity > 0, "MDTP: insufficient quantity");
        require(quantity <= singleMintLimit, "MDTP: over singleMintLimit");
        require(isSaleActive, "MDTP: sale not active");
        require(mintedCount() + quantity <= totalMintLimit, "MDTP: reached totalMintLimit");
        require(balanceOf(receiver) + quantity <= userMintLimit, "MDTP: reached userMintLimit");
        require(receiver != address(0), "MDTP: mint to the zero address");

        _beforeTokenTransfers(address(0), receiver, tokenId, width, height);
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                require(!_exists(innerTokenId), "MDTP: token already minted");
                require(isCenterSaleActive || !isInMiddle(innerTokenId), "MDTP: minting center not active");
                _owners[innerTokenId] = receiver;
                require(_checkOnERC721Received(address(0), receiver, innerTokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
                emit Transfer(address(0), receiver, innerTokenId);
            }
        }
        _balances[receiver] += quantity;
    }

    function mintedCount() public view returns (uint256) {
        return mintedTokenCount + tokenIdsToMigrateCount;
    }

    // Transfers

    function transferGroupFrom(address sender, address receiver, uint256 tokenId, uint8 width, uint8 height) public {
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                transferFrom(sender, receiver, innerTokenId);
            }
        }
    }

    function safeTransferGroupFrom(address sender, address receiver, uint256 tokenId, uint8 width, uint8 height) public {
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                safeTransferFrom(sender, receiver, innerTokenId);
            }
        }
    }

    function _beforeTokenTransfer(address sender, address receiver, uint256 tokenId) internal override {
        super._beforeTokenTransfer(sender, receiver, tokenId);
        _beforeTokenTransfers(sender, receiver, tokenId, 1, 1);
    }

    function _beforeTokenTransfers(address sender, address receiver, uint256, uint8 width, uint8 height) internal whenNotPaused() {
        if (sender != receiver) {
            if (sender == address(0)) {
                mintedTokenCount += width * height;
            }
        }
    }

    // Enumerable

    function totalSupply() external pure override(IERC721Enumerable) returns (uint256) {
        return SUPPLY_LIMIT;
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) external view override(IERC721Enumerable) returns (uint256) {
        require(index < balanceOf(owner), "MDTP: owner index out of bounds");
        uint256 tokenIndex;
        for (uint256 tokenId = 1; tokenId <= SUPPLY_LIMIT; tokenId++) {
            if (_owners[tokenId] == owner) {
                if (tokenIndex == index) {
                    return tokenId;
                }
                tokenIndex++;
            }
        }
        return 0;
    }

    function tokenByIndex(uint256 index) external pure override(IERC721Enumerable) returns (uint256) {
        require(index >= 0 && index < SUPPLY_LIMIT, "MDTP: invalid index");
        return index + 1;
    }

    // Migration

    function isTokenSetForMigration(uint256 tokenId) public view returns (bool) {
        return tokenIdsToMigrateCount > 0 && tokenIdsToMigrateBitmap[tokenId / 256].isBitSet(uint8(tokenId % 256));
    }

    function ownerOf(uint256 tokenId) public view override(ERC721, IERC721) returns (address) {
        if (isTokenSetForMigration(tokenId)) {
            return address(original);
        }
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }

    function _exists(uint256 tokenId) internal view override(ERC721) returns (bool) {
        if (isTokenSetForMigration(tokenId)) {
            return true;
        }
        return _owners[tokenId] != address(0);
    }

    function proxiedOwnerOf(uint256 tokenId) external view returns (address) {
        if (isTokenSetForMigration(tokenId)) {
            return original.ownerOf(tokenId);
        }
        return ownerOf(tokenId);
    }

    function completeMigration() external onlyOwner {
        canAddTokenIdsToMigrate = true;
    }

    function addTokensToMigrate(uint256[] calldata _tokenIdsToMigrate) external onlyOwner {
        require(!canAddTokenIdsToMigrate, "MDTP: migration has already happened!");
        for (uint16 tokenIdIndex = 0; tokenIdIndex < _tokenIdsToMigrate.length; tokenIdIndex++) {
            uint256 tokenId = _tokenIdsToMigrate[tokenIdIndex];
            require(tokenId > 0 && tokenId <= SUPPLY_LIMIT, "MDTP: invalid tokenId");
            require(_owners[tokenId] == address(0), "MDTP: cannot migrate an owned token");
            require(!isTokenSetForMigration(tokenId), "MDTP: token already set for migration");
            tokenIdsToMigrateBitmap[tokenId / 256] = tokenIdsToMigrateBitmap[tokenId / 256].setBit(uint8(tokenId % 256));
        }
        _balances[address(original)] += _tokenIdsToMigrate.length;
        tokenIdsToMigrateCount += _tokenIdsToMigrate.length;
    }

    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) external override returns (bytes4) {
        require(_msgSender() == address(original), "MDTP: cannot accept token from unknown contract");
        require(original.ownerOf(tokenId) == address(this), "MDTP: token not yet owned by this contract");
        require(ownerOf(tokenId) == address(original), "MDTP: cannot accept token not set for migration");
        _transfer(address(original), from, tokenId);
        tokenIdsToMigrateBitmap[tokenId / 256] = tokenIdsToMigrateBitmap[tokenId / 256].clearBit(uint8(tokenId % 256));
        tokenIdsToMigrateCount -= 1;
        mintedTokenCount += 1;
        return this.onERC721Received.selector;
    }

}
