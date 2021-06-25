// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract ICERC20 {
    function redeemUnderlying(uint redeemAmount) external virtual returns (uint);
    function mint(uint mintAmount) external virtual returns (uint);
    function exchangeRateCurrent() public view virtual returns(uint); // TODO This is part of CToken. How do they relate to each other?
}

// This is meant to be constructed and owned by an ERC721 contract
contract StakingWallet is Ownable {
    using SafeMath for uint256;
    using Address for address payable;

    IERC721 collection;
    ICERC20 cToken;
    IERC20 underlyingERC20;

    event Deposited(uint256 tokenId, address indexed payer, uint256 weiAmount);
    event Withdrawn(uint256 tokenId, address indexed payee, uint256 weiAmount);
    event InterestClaimed(address indexed payee, uint256 weiAmount);

    modifier validTokenId(uint256 tokenId) {
        collection.ownerOf(tokenId); // Throws if the token doesn't exist
        _;
    }

    constructor(address _cTokenAddress, address _underlying) Ownable() {
        collection = IERC721(msg.sender);
        underlyingERC20 = IERC20(_underlying);
        cToken = ICERC20(_cTokenAddress);
    }

    mapping(uint256 => uint256) private _deposits;
    uint256 totalOnDeposit = 0;

    function depositsOf(uint256 tokenId) public view returns (uint256) {
        return _deposits[tokenId];
    }

    function deposit(uint256 tokenId) public payable virtual onlyOwner validTokenId(tokenId) {
        // TODO This should be sending and recieving an ERC20, not ether
        uint256 amount = msg.value;
        _deposits[tokenId] += amount;
        totalOnDeposit += amount;
        _mint(amount);

        emit Deposited(tokenId, tx.origin, amount);
    }

    function withdraw(address payable payee, uint256 tokenId) public onlyOwner validTokenId(tokenId) {
        // TODO This should be sending and recieving an ERC20, not ether
        uint256 onDeposit = _deposits[tokenId];
        _deposits[tokenId] = 0;
        totalOnDeposit -= onDeposit;

        cToken.redeemUnderlying(onDeposit);

        payee.sendValue(onDeposit);

        emit Withdrawn(tokenId, payee, onDeposit);
    }

    function sendAccumulatedInterest(address payable payee) public onlyOwner {
        // TODO This should be sending and recieving an ERC20, not ether
        uint256 earnedInterest = getInterestEarned();
        cToken.redeemUnderlying(earnedInterest);

        payee.sendValue(earnedInterest);
        emit InterestClaimed(payee, earnedInterest);
    }

    function getInterestEarned() public view returns (uint256) {
        uint exchangeRateMantissa = cToken.exchangeRateCurrent();
        uint256 interest = totalOnDeposit / exchangeRateMantissa;
        return interest;
    }

    function _mint(uint amount) private {
        underlyingERC20.approve(address(cToken), amount);
        assert(cToken.mint(100) == 0);            // mint the cTokens and assert there is no error
    }
}