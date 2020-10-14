pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./types.sol";
import "./constants.sol";

library VolumeList {
    using SafeMath for uint256;

    struct List {
        uint256 lastIndex;
        mapping(uint256 => Volume) list;
    }

    function add(List storage self, uint256 value) internal {
        uint256 index = Constants.toUTC(now) / Constants.ONEDAY;
        if (self.list[index].value == 0) {
            self.list[index] = Volume({value : value, index : self.lastIndex});
            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.add(value);
        }
    }

    function volumeOfDay(List storage self, uint256 index) internal view returns (uint256) {
        return self.list[index].value;
    }

    function listVolume(List storage self) internal view returns (Volume[] memory rets){
        uint256 index = self.lastIndex;
        uint256 count;
        while (self.list[index].value != 0) {
            count++;
            index = self.list[index].index;
        }

        rets = new Volume[](count);
        index = self.lastIndex;
        uint256 len;
        while (self.list[index].value != 0) {
            rets[len] = self.list[index];
            (index, rets[len].index) = (rets[len].index, index);
            len++;
        }
    }
}

