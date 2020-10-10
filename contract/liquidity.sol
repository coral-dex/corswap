pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./constants.sol";
import "./types.sol";

library LiquidityList {
    //TODO
    using SafeMath for uint256;

    struct List {
        uint256 lastIndex;
        mapping(uint256 => Liquidity) list;
    }

    function add(List storage self, uint256 value) internal {
        uint256 index = now / Constants.ONEDAY;
        if (self.list[index].index == 0) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.add(
                value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY)
            ),
                nextValue : self.list[self.lastIndex].nextValue.add(value),
                index : self.lastIndex});

            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.add(value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.add(value);
        }
    }

    function sub(List storage self, uint256 value) internal {
        uint256 index = now / Constants.ONEDAY;
        if (self.list[index].index == 0) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.sub(
                value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY)
            ),
                nextValue : self.list[self.lastIndex].nextValue.sub(value),

                index : self.lastIndex});
            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.sub(value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.sub(value);
        }
    }

    function liquidityOfDay(List storage self, uint256 index) internal view returns (uint256) {
        if (self.list[index].value != 0) {
            return self.list[index].value;
        } else {
            uint256 currentIndex = self.lastIndex;
            while (self.list[currentIndex].index != 0 && currentIndex > index) {
                currentIndex = self.list[index].index;
            }
            return self.list[currentIndex].nextValue;
        }
    }

    // function totalLiquidity(List storage self, uint256 startIndex) internal view returns(uint256 liquidity) {
    //     uint256 currentIndex = now/Constants.ONEDAY;
    //     uint256 index = self.lastIndex;
    //     if(index == 0 || startIndex >= currentIndex) {
    //         return 0;
    //     }

    //     if(index < startIndex) {
    //         return self.list[index].nextValue.mul(currentIndex.sub(startIndex));
    //     } else {
    //         if(index == currentIndex) {
    //             index = self.list[index].prevIndex;
    //         }

    //         while(self.list[index].value != 0 && index >= startIndex) {
    //             liquidity = liquidity.add(self.list[index].value);
    //             liquidity = liquidity.add(self.list[index].nextValue.mul(currentIndex.sub(index+1)));
    //             currentIndex = index;
    //             index = self.list[index].prevIndex;
    //         }

    //         if(currentIndex > startIndex && self.list[index].value != 0) {
    //           liquidity = liquidity.add(self.list[index].nextValue.mul(currentIndex.sub(startIndex)));
    //         }
    //     }

    // }

    function listLiquidity(List storage self) internal view returns (Liquidity[] memory rets){
        uint256 index = self.lastIndex;
        uint256 count;
        while (self.list[index].value != 0) {
            count++;
            index = self.list[index].index;
        }

        rets = new Liquidity[](count);
        index = self.lastIndex;
        uint256 len;
        while (self.list[index].value != 0) {
            rets[len] = self.list[index];
            (index, rets[len].index) = (rets[len].index, index);
            len++;
        }
    }
}