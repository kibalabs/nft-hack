// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract ICERC20 is IERC20 {
    function redeemUnderlying(uint redeemAmount) external virtual returns (uint);
    function mint(uint mintAmount) external virtual returns (uint);
    function exchangeRateCurrent() public view virtual returns(uint);
}

abstract contract ICompERC20 is IERC20 {
    function claimComp(address holder) public virtual;
}

// I found an example contract for interacting with compound here: https://github.com/Instadapp/dsa-connectors/blob/main/contracts/mainnet/connectors/compound/main.sol

// This is meant to be constructed and owned by an ERC721 contract
contract StakingWallet is Ownable {
    using SafeMath for uint256;
    using Address for address payable;

    IERC721 collection;
    ICERC20 cToken;
    IERC20 underlyingERC20;
    ICompERC20 compErc20Token; // TODO

    event Deposited(uint256 tokenId, address indexed payer, uint256 weiAmount);
    event Withdrawn(uint256 tokenId, address indexed payee, uint256 weiAmount);
    event InterestClaimed(address indexed payee, uint256 weiAmount);

    modifier validTokenId(uint256 tokenId) {
        collection.ownerOf(tokenId); // Throws if the token doesn't exist
        _;
    }

    constructor(address tokenCollectionContract, address _cTokenAddress, address _underlying, address _compErc20Address) Ownable() {
        collection = IERC721(tokenCollectionContract);
        underlyingERC20 = IERC20(_underlying);
        cToken = ICERC20(_cTokenAddress);
        compErc20Token = ICompERC20(_compErc20Address);
    }

    mapping(uint256 => uint256) private _deposits;
    uint256 totalOnDeposit = 0;

    function depositsOf(uint256 tokenId) public view returns (uint256) {
        return _deposits[tokenId];
    }

    function deposit(uint256 tokenId, uint256 amount) public payable virtual onlyOwner validTokenId(tokenId) {
        _deposits[tokenId] += amount;
        totalOnDeposit += amount;
        assert(_supplyErc20ToCompound(amount) == 0);

        emit Deposited(tokenId, tx.origin, amount);
    }

    function withdraw(address payable payee, uint256 tokenId) public onlyOwner validTokenId(tokenId) {
        uint256 onDeposit = _deposits[tokenId];
        _deposits[tokenId] = 0;
        totalOnDeposit -= onDeposit;
        assert(_redeemCErc20Tokens(onDeposit) == 0);
        underlyingERC20.approve(payee, onDeposit);
        emit Withdrawn(tokenId, payee, onDeposit);
    }

    function claimPrize(address payable payee) public onlyOwner {
        uint256 interestEarned = getInterestEarned();
        underlyingERC20.approve(payee, interestEarned);
        assert(_redeemCErc20Tokens(interestEarned) == 0);
        emit InterestClaimed(payee, interestEarned);
    }

    function claimComp() public onlyOwner {
        compErc20Token.claimComp(address(this)); // TODO this isn't the right contract, claimComp is on the Comptroller contract
    }

    function sendComp(address payable payee) public onlyOwner {
        uint256 balance = compErc20Token.balanceOf(address(this));
        compErc20Token.approve(payee, balance);
        compErc20Token.transfer(payee, balance);
    }

    function _supplyErc20ToCompound(uint256 _numTokensToSupply) private onlyOwner returns (uint) {
        // Approve transfer on the ERC20 contract
        underlyingERC20.approve(address(cToken), _numTokensToSupply);

        // Mint cTokens
        uint mintResult = cToken.mint(_numTokensToSupply);
        return mintResult;
    }

    function _redeemCErc20Tokens(uint256 amount) private onlyOwner returns (uint) {
        // Retrieve your asset based on an amount of the asset
        return cToken.redeemUnderlying(amount);
    }

    function getInterestEarned() public view returns (uint256) {
        uint exchangeRate = cToken.exchangeRateCurrent();
        uint cTokenBalance = cToken.balanceOf(address(this));

        uint256 valueOnDeposit = cTokenBalance * exchangeRate;

        uint256 interest = valueOnDeposit - totalOnDeposit;
        return interest;
    }

    function totalDeposits() public view returns (uint256) {
        return totalOnDeposit;
    }
}