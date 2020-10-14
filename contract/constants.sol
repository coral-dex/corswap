pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

library Constants {
    uint256 constant ONEDAY = 300;

    string constant CORAL = "CORALA";

    bytes32 constant SEROBYTES = 0x5345524f00000000000000000000000000000000000000000000000000000000;

    function toUTC(uint256 time) internal pure returns (uint256) {
        return time;
        // return (time + 86400);
    }
}
