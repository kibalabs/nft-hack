// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/MillionDollarTokenPage.sol";

contract TestMillionDollarTokenPage {

    function testTokenSupplyInitial() {
        MillionDollarTokenPage mdtp = MillionDollarTokenPage(DeployedAddresses.MillionDollarTokenPage());
        uint expected = 10000;
        Assert.equal(mdtp.totalSupply(), expected);
    }

    function testTokenSupplyAfterMint() {
        MillionDollarTokenPage mdtp = new MillionDollarTokenPage();
        mdtp.mintNFT(0x123, 1);
        uint expected = 10000;
        Assert.equal(mdtp.totalSupply(), expected);
    }


    // test the grid-data uri for a non-minted token
    // test the grid-data uri for a minted token without an overwritten uri
    // test the grid-data uri for a minted token with an overwritten uri
    // test that an owner can change the grid-data uri
    // test that a non-owner cannot change the grid-data uri

    // test the metadata uri for a non-minted token
    // test the metadata uri for a minted token
    // test that an owner cannot change the mdatadata uri
    // test that a non-owner cannot change the mdatadata uri

    // test that an owner cannot call mintNFT
    // test that a non-owner cannot call mintNFT
}
