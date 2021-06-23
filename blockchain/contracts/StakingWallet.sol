// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/payment/escrow/Escrow.sol";

contract StakingWallet is Escrow, Ownable {

    CErc20 cToken = CToken(0x3FDA...);
    unit256 totalOnDeposit = 0;

    override event Withdrawn(address indexed payee, unint256 tokenId, uint256 weiAmount);

    function validTokenId() {}

    constructor() {
        cToken.approve(...);
        super();
    }

    public override deposit(uint256 tokenId) public payable virtual onlyOwner validTokenId{
        super.deposit(address(tokenId))
        totalOnDeposit += msg.amount;
        cToken.mint(msg.amount);
    }

    public withdrawStake(address payable payee, uint256 tokenId) public virtual onlyOwner {
        uint256 deposits = _deposits[tokenId];
        _deposits[tokenId] = 0;
        totalOnDeposit -= deposits;

        cToken.redeemUnderlying(deposits);

        payee.sendValue(deposits);
        emit Withdrawn(payee, tokenId, deposits);
    }

    public override withdraw() {
        throw()
    }

    public sendAccumulatedInterest(address payable payee, uint256 claimToken) onlyOwner {
        // TODO validate the claim token

        uint256 earnedInterest = getInterestEarned();
        cToken.redeemUnderlying(earnedInterest);

        payee.sendValue(earnedInterest);
        emit RewardWithdrawn(payee, earnedInterest);
    }

    public getInterestEarned() returns (uint256) {
        uint exchangeRateMantissa = cToken.exchangeRateCurrent();
        uint256 reserved = totalOnDeposit / exchangeRateMantissa;
        return reserved;
    }
}