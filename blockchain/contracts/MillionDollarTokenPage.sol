// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";
// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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

    mapping (uint256 => string) private _tokenGridDataURIs;
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;

    event TokenGridDataURIChanged(uint256 indexed tokenId);

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "MDTP: caller is not the tokenOwner");
        _;
    }

    constructor() ERC721("MillionDollarTokenPage", "\u22A1") {
        _admins[_msgSender()] = true;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.mdtp.com/token-metadatas/";
    }

    function _baseGridDataURI() internal pure returns (string memory) {
        return "https://api.mdtp.com/token-grid-datas/";
    }

    function mint(address recipient, uint256 tokenId) public onlyAdmin returns (uint256) {
        require(tokenId > 0 && tokenId <= 10000, "MDTP: invalid tokenId");
        ERC721._safeMint(recipient, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
    }

    function setTokenGridDataURI(uint256 tokenId, string memory metadataURI) public onlyTokenOwner(tokenId) {
        _tokenGridDataURIs[tokenId] = metadataURI;
        emit TokenGridDataURIChanged(tokenId);
    }

    function tokenGridDataURI(uint256 tokenId) public view returns (string memory) {
        string memory _tokenGridDataURI = _tokenGridDataURIs[tokenId];
        if (bytes(_tokenGridDataURI).length > 0) {
            return _tokenGridDataURI;
        }
        return string(abi.encodePacked(_baseGridDataURI(), Strings.toString(tokenId)));
    }

    // IERC721Enumerable

    function totalSupply() public pure override returns (uint256) {
        return 10000;
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256 tokenId) {
        return _ownedTokens[owner][index];
    }

    function tokenByIndex(uint256 index) public pure override returns (uint256) {
        require(index >= 0 && index < 10000, "MDTP: invalid index");
        return index + 1;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        if (from != address(0)) {
            uint256 lastTokenIndex = ERC721.balanceOf(from) - 1;
            uint256 tokenIndex = _ownedTokensIndex[tokenId];
            // If any token except the last is being removed, swap it with the last one
            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
                _ownedTokens[from][tokenIndex] = lastTokenId;
                _ownedTokensIndex[lastTokenId] = tokenIndex;
            }
            delete _ownedTokensIndex[tokenId];
            delete _ownedTokens[from][lastTokenIndex];
        }
        if (to != address(0)) {
            uint256 length = ERC721.balanceOf(to);
            _ownedTokens[to][length] = tokenId;
            _ownedTokensIndex[tokenId] = length;
        }
    }

}
