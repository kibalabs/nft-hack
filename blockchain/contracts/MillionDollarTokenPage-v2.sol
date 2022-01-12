// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "hardhat/console.sol";
import "./ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface MillionDollarTokenPageV1 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function tokenContentURI(uint256 tokenId) external view returns (string memory);
}

contract MillionDollarTokenPageV2 is ERC721, Pausable, Ownable, IERC721Receiver {
    // using SafeMathUpgradeable for uint256;
    // using StringsUpgradeable for uint256;

    mapping(uint256 => string) private _tokenContentURIs;
    uint256 private mintedTokenCount;

    uint16 public constant COLUMN_COUNT = 100;
    uint16 public constant ROW_COUNT = 100;
    uint16 public constant SUPPLY_LIMIT = COLUMN_COUNT * ROW_COUNT;

    bool public isCenterSaleActive;
    uint16 public totalMintLimit;
    uint16 public singleMintLimit;
    uint16 public userMintLimit;
    uint256 public mintPrice;
    bool public isSaleActive;
    bool public isMigrationComplete;

    string public metadataBaseURI;
    string public defaultContentBaseURI;

    // TODO(krishan711): document migration process here
    MillionDollarTokenPageV1 public original;
    // uint256[] public tokenIdsToMigrate;
    // uint256[] public tokenIdsMigrated;
    uint256 private tokenIdsToMigrateCount;
    uint256 private tokenIdsMigratedCount;
    // mapping(uint256 => bool) public tokenIdsToMigrate;

    event TokenContentURIChanged(uint256 indexed tokenId);

    constructor(uint16 _totalMintLimit, uint16 _singleMintLimit, uint16 _userMintLimit, uint256 _mintPrice, string memory _metadataBaseURI, string memory _defaultContentBaseURI, address _original) ERC721("MillionDollarTokenPage", "\u22A1") Ownable() Pausable() {
        isCenterSaleActive = false;
        isSaleActive = false;
        isMigrationComplete = false;
        metadataBaseURI = _metadataBaseURI;
        defaultContentBaseURI = _defaultContentBaseURI;
        totalMintLimit = _totalMintLimit;
        singleMintLimit = _singleMintLimit;
        userMintLimit = _userMintLimit;
        mintPrice = _mintPrice;
        original = MillionDollarTokenPageV1(_original);
    }

    // Utils

    modifier onlyValidGroup(uint256 tokenId, uint8 width, uint8 height) {
        require(width > 0, "MDTP: width must be > 0");
        require(height > 0, "MDTP: height must be > 0");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "MDTP: caller is not the tokenOwner");
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

    function setMetadataBaseURI(string memory newMetadataBaseURI) external onlyOwner {
        metadataBaseURI = newMetadataBaseURI;
    }

    function setDefaultContentBaseURI(string memory newDefaultContentBaseURI) external onlyOwner {
        defaultContentBaseURI = newDefaultContentBaseURI;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Metadata URIs

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
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

    function setTokenGroupContentURIs(uint256 tokenId, uint8 width, uint8 height, string[] memory contentURIs) external onlyTokenGroupOwner(tokenId, width, height) onlyValidGroup(tokenId, width, height) {
        require(width * height == contentURIs.length, "MDTP: length of contentURIs must be the same as width * height");
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

    function tokenContentURI(uint256 tokenId) external view returns (string memory) {
        string memory _tokenContentURI = _tokenContentURIs[tokenId];
        if (bytes(_tokenContentURI).length > 0) {
            return _tokenContentURI;
        }
        address owner = _owners[tokenId];
        if (owner == address(original)) {
            return original.tokenContentURI(tokenId);
        }
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
        mintTokenTo(_msgSender(), tokenId);
    }

    function mintTokenTo(address receiver, uint256 tokenId) public payable {
        require(msg.value >= mintPrice, "MDTP: insufficient payment");
        _mintToken(receiver, tokenId);
    }

    function mintTokenGroup(uint256 tokenId, uint8 width, uint8 height) external payable {
        mintTokenGroupTo(_msgSender(), tokenId, width, height);
    }

    function mintTokenGroupTo(address receiver, uint256 tokenId, uint8 width, uint8 height) public payable {
        uint256 quantity = (width * height);
        require(quantity > 0, "MDTP: insufficient quantity");
        require(quantity <= singleMintLimit, "MDTP: over singleMintLimit");
        require(msg.value >= (mintPrice * quantity), "MDTP: insufficient payment");
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                _mintToken(receiver, innerTokenId);
            }
        }
    }

    function _mintToken(address receiver, uint256 tokenId) internal {
        require(isSaleActive, "MDTP: sale has not started");
        require(mintedCount() + 1 <= totalMintLimit, "MDTP: reached totalMintLimit");
        require(balanceOf(receiver) + 1 <= userMintLimit, "MDTP: reached userMintLimit");
        require(tokenId > 0 && tokenId <= SUPPLY_LIMIT, "MDTP: invalid tokenId");
        require(isCenterSaleActive || !isInMiddle(tokenId), "MDTP: minting the middle 500 tokens is not permitted yet");
        _safeMint(receiver, tokenId);
    }

    function mintedCount() public view returns (uint256) {
        return mintedTokenCount + tokenIdsToMigrateCount - tokenIdsMigratedCount;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override whenNotPaused() {
        super._beforeTokenTransfer(from, to, tokenId);
        if (to != from) {
            if (from == address(0)) {
                mintedTokenCount += 1;
            }
        }
    }

    // Migration

    function proxiedOwnerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        if (owner == address(original)) {
            return original.ownerOf(tokenId);
        }
        return owner;
    }

    function completeMigration() external onlyOwner {
        isMigrationComplete = true;
    }

    function addTokensToMigrate(uint256[] calldata _tokenIdsToMigrate) external onlyOwner {
        require(!isMigrationComplete, "MDTP: migration has already happened!");
        // tokenIdsToMigrate = _tokenIdsToMigrate;
        for (uint8 tokenIdIndex = 0; tokenIdIndex < _tokenIdsToMigrate.length; tokenIdIndex++) {
            uint256 tokenId = _tokenIdsToMigrate[tokenIdIndex];
            require(_owners[tokenId] == address(0), "MDTP: cannot migrate an owned token");
            // _mintedTokenIds.push(tokenId);
            // _balances[address(original)] += 1;
            _owners[tokenId] = address(original);
        }
        _balances[address(original)] += _tokenIdsToMigrate.length;
        tokenIdsToMigrateCount += _tokenIdsToMigrate.length;
    }

    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) external override returns (bytes4) {
        require(_msgSender() == address(original), "MDTP: cannot accept token from contract");
        require(ownerOf(tokenId) == address(original), "MDTP: cannot accept token not set for migration");
        // _owners[tokenId] = address(this);
        // _balances[address(original)] -= 1;
        // _balances[address(this)] += 1;
        _transfer(address(original), from, tokenId);
        // tokenIdsMigrated.push(tokenId);
        tokenIdsMigratedCount += 1;
        mintedTokenCount += 1;
        return this.onERC721Received.selector;
    }

}
