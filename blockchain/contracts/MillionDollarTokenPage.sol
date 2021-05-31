// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";
// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

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

// NOTE(krishan711): maybe we can make a UserMintable contract?

// NOTE(krishan711): how can we implement the "blocking"?

// NOTE(krishan711): This doesnt extend the IEnumerable interface which should be easy to support

contract MillionDollarTokenPage is ERC721, AdminManageable {

    mapping (uint256 => string) private _tokenGridDataURIs;

    event SetTokenGridDataURI(uint256 indexed tokenId);

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "MDTP: caller is not the tokenOwner");
        _;
    }

    constructor() ERC721("MillionDollarTokenPage", "\u22A1") {
        _admins[_msgSender()] = true;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://api.mdtp.com/token-metadatas/";
    }

    function _baseGridDataURI() internal view virtual returns (string memory) {
        return "https://api.mdtp.com/token-grid-datas/";
    }

    function mintNFT(address recipient, uint256 tokenId) public onlyAdmin returns (uint256) {
        require(tokenId > 0 && tokenId <= 10000, "MDTP: invalid tokenId");
        ERC721._safeMint(recipient, tokenId);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, Strings.toString(tokenId)));
    }

    function setTokenGridDataURI(uint256 tokenId, string memory metadataURI) onlyTokenOwner(tokenId) public {
        require(_exists(tokenId), "MDTP: token does not exist");
        _tokenGridDataURIs[tokenId] = metadataURI;
        emit SetTokenGridDataURI(tokenId);
    }

    function tokenGridDataURI(uint256 tokenId) public view virtual returns (string memory) {
        string memory _tokenGridDataURI = _tokenGridDataURIs[tokenId];
        if (bytes(_tokenGridDataURI).length > 0) {
            return _tokenGridDataURI;
        }
        return string(abi.encodePacked(_baseGridDataURI(), Strings.toString(tokenId)));
    }

    function totalSupply() public pure returns (uint256) {
        return 10000;
    }

}
