pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./types.sol";

library VolumeList {
    uint256 public constant ONEDAY = 600;
    using SafeMath for uint256;

    struct List {
        uint256 lastIndex;
        mapping(uint256 => Volume) list;
    }

    function add(List storage self, uint256 value) internal {
        uint256 index = now / ONEDAY;
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

    // function totalVolume(List storage self, uint256 startIndex) internal view returns(uint256 volume) {
    //     uint256 currentIndex = now/ONEDAY;
    //     uint256 index = self.lastIndex;
    //     if(index == 0) {
    //         return 0;
    //     }

    //     if(index == currentIndex) {
    //         index = self.list[index].prevIndex;
    //     }

    //     while(index != 0 && self.list[index].value != 0 && index >= startIndex) {
    //         volume = volume.add(self.list[index].value);
    //         index = self.list[index].prevIndex;
    //     }
    // }

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

