//Contract based on https://docs.openzeppelin.com/contracts/3.x/erc721
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

// import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract MyNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // TODO(krishan711): update the name and symbol
    constructor() public ERC721("MyNFT", "NFT") {
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "Ownable: caller is not the tokenOwner");
        _;
    }

    function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256){
        // TODO(krishan711): prevent more than 1000000
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) onlyTokenOwner(tokenId) public {
        _setTokenURI(tokenId, tokenURI);
    }

}
