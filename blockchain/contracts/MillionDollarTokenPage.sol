// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
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


contract MillionDollarTokenPage is ERC721, AdminManageable {

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "Ownable: caller is not the tokenOwner");
        _;
    }

    constructor() ERC721("MillionDollarTokenPage", "\u22A1") {
        ERC721._setBaseURI("https://api.milliondollartokenpage.com/contract-base/");
        setAdmin(_msgSender(), true);
    }

    function mintNFT(address recipient, uint256 tokenId) public onlyAdmin returns (uint256) {
        require(!ERC721._exists(tokenId));
        require(tokenId > 0 && tokenId <= 10000);
        ERC721._mint(recipient, tokenId);
        return tokenId;
    }

    // function setTokenURI(uint256 tokenId, string memory tokenURI) onlyTokenOwner(tokenId) public {
    //     _setTokenURI(tokenId, tokenURI);
    // }

    function totalSupply() public pure returns (uint256) {
        return 10000;
    }

}
