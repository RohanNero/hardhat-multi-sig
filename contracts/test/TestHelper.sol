//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

error TestHelper__SaysNoThanks();

import "../MultiSig.sol";

contract TestHelper {

    MultiSig public multiSig;
    
    receive() external payable {
        revert TestHelper__SaysNoThanks();
    }

    // function sendValue(address payable _to, uint256 _amount) public returns(bool) {
    //     (bool sent, ) = _to.call{value: _amount}("");
    //     require(sent, "Failed to send!");
    //     return(sent);
    // }

    // function withdraw(uint amount) public {
    //     multiSig.withdraw(amount);
    // }
}