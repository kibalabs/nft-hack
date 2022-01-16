// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.7;

// import "@openzeppelin/contracts/utils/Address.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// contract BlackholePrevention is Ow {
//   using Address for address payable;

//   function _withdrawEther(address payable receiver, uint256 amount) internal virtual {
//     require(receiver != address(0), "BHP:E-403");
//     if (address(this).balance >= amount) {
//       receiver.sendValue(amount);
//     }
//   }

//   function _withdrawERC20(address payable receiver, address tokenAddress, uint256 amount) internal virtual {
//     require(receiver != address(0), "BHP:E-403");
//     if (IERC20(tokenAddress).balanceOf(address(this)) >= amount) {
//       IERC20(tokenAddress).safeTransfer(receiver, amount);
//     }
//   }

//   function _withdrawERC721(address payable receiver, address tokenAddress, uint256 tokenId) internal virtual {
//     require(receiver != address(0), "BHP:E-403");
//     if (IERC721(tokenAddress).ownerOf(tokenId) == address(this)) {
//       IERC721(tokenAddress).sefeTransferFrom(address(this), receiver, tokenId);
//     }
//   }

//   function _withdrawERC1155(address payable receiver, address tokenAddress, uint256 tokenId, uint256 amount) internal virtual {
//     require(receiver != address(0), "BHP:E-403");
//     if (IERC1155(tokenAddress).ownerOf(tokenId) == address(this)) {
//       IERC1155(tokenAddress).safeTransferFrom(address(this), receiver, tokenId, amount);
//     }
//   }
// }
