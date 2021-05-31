// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract AdminManageable {

    mapping (address => bool) public admins;

    modifier onlyAdmin() {
        require(admins[msg.sender], "Admin: caller is not a valid admin");
        _;
    }

    function setAdmin(address admin, bool state) public onlyAdmin {
        admins[admin] = state;
    }

}

// NOTE(krishan711): maybe we can make a UserMintable contract?

// NOTE(krishan711): how caan we implement the "blocking"?

contract MillionDollarTokenPage is ERC721, AdminManageable {

    mapping (uint256 => string) private _tokenGridDataURIs;
    string private _baseTokenGridDataURI;

    event SetTokenGridDataURI(uint256 indexed tokenId);

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "MDTP: caller is not the tokenOwner");
        _;
    }

    constructor() ERC721("MillionDollarTokenPage", "\u22A1") {
        setAdmin(_msgSender(), true);
        ERC721._setBaseURI("https://api.mdtp.com/token-metadatas/");
        _baseTokenGridDataURI = "https://api.mdtp.com/token-grid-datas/";
    }

    function mintNFT(address recipient, uint256 tokenId) public onlyAdmin returns (uint256) {
        require(tokenId > 0 && tokenId <= 10000, "MDTP: invalid tokenId");
        ERC721._mint(recipient, tokenId);
        return tokenId;
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

        return string(abi.encodePacked(_baseTokenGridDataURI, tokenId.toString()));
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(baseURI(), tokenId.toString()));
    }

    function totalSupply() public pure returns (uint256) {
        return 10000;
    }

}
