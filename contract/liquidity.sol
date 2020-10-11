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
        if (!self.list[index].flag) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.add(
                value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY)
            ),
                nextValue : self.list[self.lastIndex].nextValue.add(value),
                index : self.lastIndex, flag : true});

            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.add(value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.add(value);
        }
    }

    function sub(List storage self, uint256 value) internal {
        uint256 index = now / Constants.ONEDAY;
        if (!self.list[index].flag) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.sub(
                value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY)
            ),
                nextValue : self.list[self.lastIndex].nextValue.sub(value),
                index : self.lastIndex, flag : true});

            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.sub(value.mul(Constants.ONEDAY - now % Constants.ONEDAY).div(Constants.ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.sub(value);
        }
    }

    event LogLiquidity(uint256, uint256);

    function liquidityOfDay(List storage self, uint256 index) internal view returns (uint256) {
        if (self.list[index].flag) {
            return self.list[index].value;
        } else {
            uint256 currentIndex = self.lastIndex;
            while (currentIndex > index) {
                currentIndex = self.list[currentIndex].index;
            }
            return self.list[currentIndex].nextValue;
        }
    }

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