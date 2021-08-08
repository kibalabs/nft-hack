// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";


contract MillionDollarTokenPage is ERC721, IERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Strings for uint256;

    mapping (uint256 => string) private _tokenContentURIs;
    mapping (address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping (uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _mintedTokenIds;

    uint16 public constant COLUMN_COUNT = 100;
    uint16 public constant ROW_COUNT = 100;
    uint16 public constant SUPPLY_LIMIT = COLUMN_COUNT * ROW_COUNT;

    uint16 public totalMintLimit = 1000;
    uint16 public singleMintLimit = 20;
    uint256 public mintPrice = 0; // 50000000000000000 = 0.05 ETH

    string public _metadataBaseURI;
    string public _defaultContentBaseURI;

    event TokenContentURIChanged(uint256 indexed tokenId);

    constructor(string memory newMetadataBaseURI, string memory newDefaultContentBaseURI) ERC721("MillionDollarTokenPage", "\u22A1") Ownable() {
        _metadataBaseURI = newMetadataBaseURI;
        _defaultContentBaseURI = newDefaultContentBaseURI;
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

    function setTotalMintLimit(uint16 newTotalMintLimit) external onlyOwner {
        totalMintLimit = newTotalMintLimit;
    }

    function setSingleMintLimit(uint16 newSingleMintLimit) external onlyOwner {
        singleMintLimit = newSingleMintLimit;
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
    }

    function setMetadataBaseURI(string memory newMetadataBaseURI) external onlyOwner {
        _metadataBaseURI = newMetadataBaseURI;
    }

    function setDefaultContentBaseURI(string memory newDefaultContentBaseURI) external onlyOwner {
        _defaultContentBaseURI = newDefaultContentBaseURI;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    // Metadata URIs

    function metadataBaseURI() internal view returns (string memory) {
        return _metadataBaseURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(metadataBaseURI(), Strings.toString(tokenId), ".json"));
    }

    // Content URIs

    // NOTE(krishan711): contract URIs should point to a JSON file that contains:
    // name: string -> the high level title for your content. This should be <250 chars.
    // description: string -> a description of your content. This should be <2500 chars.
    // image: string -> a URI pointing to and image for your item in the grid. This should be at least 300x300 and will be cropped if not square.
    // url: optional[string] -> a URI pointing to the location you want visitors of your content to go to.
    // groupId: optional[string] -> a unique identifier you can use to group multiple grid items together by giving them all the same groupId.

    function setTokenContentURI(uint256 tokenId, string memory metadataURI) public onlyTokenOwner(tokenId) {
        _setTokenContentURI(tokenId, metadataURI);
    }

    function setTokenGroupContentURIs(uint256 tokenId, uint8 width, uint8 height, string[] memory metadataURIs) public onlyTokenGroupOwner(tokenId, width, height) onlyValidGroup(tokenId, width, height) {
        require(width * height == metadataURIs.length, "MDTP: length of metadataURIs must be the same as width * height");
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint16 index = (width * y) + x;
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                _setTokenContentURI(innerTokenId, metadataURIs[index]);
            }
        }
    }

    function _setTokenContentURI(uint256 tokenId, string memory metadataURI) internal {
        _tokenContentURIs[tokenId] = metadataURI;
        emit TokenContentURIChanged(tokenId);
    }

    function defaultContentBaseURI() internal view returns (string memory) {
        return _defaultContentBaseURI;
    }

    function tokenContentURI(uint256 tokenId) public view returns (string memory) {
        string memory _tokenContentURI = _tokenContentURIs[tokenId];
        if (bytes(_tokenContentURI).length > 0) {
            return _tokenContentURI;
        }
        return string(abi.encodePacked(defaultContentBaseURI(), Strings.toString(tokenId), ".json"));
    }

    // Minting

    function mintAdmin(uint256 tokenId) public onlyOwner {
        _mint(tokenId);
    }

    function mintTokenGroupAdmin(uint256 tokenId, uint8 width, uint8 height) public payable {
        _mintTokenGroup(tokenId, width, height);
    }

    function mint(uint256 tokenId) public payable {
        require(msg.value >= mintPrice, "MDTP: Insufficient payment");
        require(mintedCount() + 1 <= totalMintLimit, "MDTP: reached current minting limit");
        _mint(tokenId);
    }

    function mintTokenGroup(uint256 tokenId, uint8 width, uint8 height) public payable {
        require(msg.value >= mintPrice.mul(width * height), "MDTP: Insufficient payment");
        require(mintedCount() + (width * height) <= totalMintLimit, "MDTP: reached current minting limit");
        require(width * height <= singleMintLimit, "MDTP: requested token count is over singleMintLimit");
        _mintTokenGroup(tokenId, width, height);
    }

    function _mintTokenGroup(uint256 tokenId, uint8 width, uint8 height) internal onlyValidGroup(tokenId, width, height) {
        for (uint8 y = 0; y < height; y++) {
            for (uint8 x = 0; x < width; x++) {
                uint256 innerTokenId = tokenId + (ROW_COUNT * y) + x;
                _mint(innerTokenId);
            }
        }
    }

    function _mint(uint256 tokenId) internal {
        require(tokenId > 0 && tokenId <= SUPPLY_LIMIT, "MDTP: invalid tokenId");
        super._safeMint(msg.sender, tokenId);
        // _setTokenContentURI(tokenId, tokenURI(tokenId))
    }

    function mintedCount() public view returns (uint256) {
        return _mintedTokenIds.length;
    }

    // IERC721Enumerable

    function totalSupply() public pure override returns (uint256) {
        return SUPPLY_LIMIT;
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256 tokenId) {
        return _ownedTokens[owner][index];
    }

    function tokenByIndex(uint256 index) public pure override returns (uint256) {
        require(index >= 0 && index < SUPPLY_LIMIT, "MDTP: invalid index");
        return index + 1;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        if (to != from) {
            if (from == address(0)) {
                _mintedTokenIds.push(tokenId);
            } else {
                uint256 lastTokenIndex = ERC721.balanceOf(from) - 1;
                uint256 tokenIndex = _ownedTokensIndex[tokenId];
                // If any token except the last is being removed, swap it with the last one
                if (tokenIndex != lastTokenIndex) {
                    uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
                    _ownedTokens[from][tokenIndex] = lastTokenId;
                    _ownedTokensIndex[lastTokenId] = tokenIndex;
                }
                delete _ownedTokens[from][lastTokenIndex];
                // delete _tokenContentURIs[tokenId];
            }
            if (to != address(0)) {
                uint256 length = ERC721.balanceOf(to);
                _ownedTokens[to][length] = tokenId;
                _ownedTokensIndex[tokenId] = length;
            }
        }
    }

}
