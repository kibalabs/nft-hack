// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

contract AdminManageable {

    mapping (address => bool) public _admins;

    modifier onlyAdmin() {
        require(_admins[msg.sender], "Admin: caller is not an admin");
        _;
    }

    function setAdmin(address admin, bool state) public onlyAdmin {
        _admins[admin] = state;
    }

}

contract MillionDollarTokenPage is ERC721, IERC721Enumerable, AdminManageable {
    using SafeMath for uint256;
    using Strings for uint256;

    mapping (uint256 => string) private _tokenContentURIs;
    mapping (address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping (uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _mintedTokenIds;

    event TokenContentURIChanged(uint256 indexed tokenId);

    uint16 public constant SUPPLY_LIMIT = 10000;
    uint16 public totalMintLimit = 1000;
    uint16 public singleMintLimit = 20;
    uint256 public mintPrice = 0; // 50000000000000000 = 0.05 ETH

    constructor() ERC721("MillionDollarTokenPage", "\u22A1") {
        _admins[_msgSender()] = true;
    }

    // Utils

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "MDTP: caller is not the tokenOwner");
        _;
    }

    // Admin

    function setTotalMintLimit(uint16 newTotalMintLimit) external onlyAdmin {
        totalMintLimit = newTotalMintLimit;
    }

    function setSingleMintLimit(uint16 newSingleMintLimit) external onlyAdmin {
        singleMintLimit = newSingleMintLimit;
    }

    function setMintPrice(uint256 newMintPrice) external onlyAdmin {
        mintPrice = newMintPrice;
    }

    // Metadata URIs

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.mdtp.co/token-metadatas/";
    }

    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
    }

    // Content URIs

    // NOTE(krishan711): contract URIs should point to a JSON file that contains:
    // name: string -> the high level title for your content. This should be <250 chars.
    // description: string -> a description of your content. This should be <2500 chars.
    // image: string -> a URI pointing to and image for your item in the grid. This should be at least 300x300 and will be cropped if not square.
    // url: optional[string] -> a URI pointing to the location you want visitors of your content to go to.
    // blockId: optional[string] -> a unique identifier you can use to group multiple grid items together by giving them all the same blockId.

    function _defaultBaseContentURI() internal pure returns (string memory) {
        return "https://api.mdtp.co/token-default-contents/";
    }

    function setTokenContentURI(uint256 tokenId, string memory metadataURI) public onlyTokenOwner(tokenId) {
        _tokenContentURIs[tokenId] = metadataURI;
        emit TokenContentURIChanged(tokenId);
    }

    function tokenContentURI(uint256 tokenId) public view returns (string memory) {
        string memory _tokenContentURI = _tokenContentURIs[tokenId];
        if (bytes(_tokenContentURI).length > 0) {
            return _tokenContentURI;
        }
        return string(abi.encodePacked(_defaultBaseContentURI(), Strings.toString(tokenId)));
    }

    // Minting

    function mintAdmin(uint256 tokenId) public onlyAdmin {
        _mint(tokenId);
    }

    function mint(uint256 tokenId) public payable {
        require(msg.value >= mintPrice, "MDTP: Insufficient payment");
        require(mintedCount() + 1 <= totalMintLimit, "MDTP: reached current minting limit");
        _mint(tokenId);
    }

    function mintMany(uint256[] memory tokenIds) public payable {
        require(msg.value >= mintPrice.mul(tokenIds.length), "MDTP: Insufficient payment");
        require(mintedCount() + tokenIds.length <= totalMintLimit, "MDTP: reached current minting limit");
        require(tokenIds.length <= singleMintLimit, "MDTP: tokenIds.length is over singleMintLimit");
        for(uint i = 0; i < tokenIds.length; i++) {
            _mint(tokenIds[i]);
        }
    }

    function _mint(uint256 tokenId) internal {
        require(tokenId > 0 && tokenId <= SUPPLY_LIMIT, "MDTP: invalid tokenId");
        super._safeMint(msg.sender, tokenId);
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
                delete _tokenContentURIs[tokenId];
            }
            if (to != address(0)) {
                uint256 length = ERC721.balanceOf(to);
                _ownedTokens[to][length] = tokenId;
                _ownedTokensIndex[tokenId] = length;
            }
        }
    }

}
