pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./constants.sol";
import "./types.sol";

library LiquidityList {
    using SafeMath for uint256;

    struct List {
        uint256 lastIndex;
        mapping(uint256 => Liquidity) list;
    }

    function add(List storage self, uint256 value) internal {
        uint256 _now = Constants.toUTC(now);
        uint256 index = _now / Constants.ONEDAY;
        if (!self.list[index].flag) {
            self.list[index] = Liquidity({
                value : self.list[self.lastIndex].nextValue.add(value.mul(Constants.ONEDAY - _now % Constants.ONEDAY).div(Constants.ONEDAY)),

                nextValue : self.list[self.lastIndex].nextValue.add(value),
                prevIndex : self.lastIndex,
                flag : true});
            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.add(value.mul(Constants.ONEDAY - _now % Constants.ONEDAY).div(Constants.ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.add(value);
        }
    }

    function sub(List storage self, uint256 value) internal {
        uint256 _now = Constants.toUTC(now);
        uint256 index = _now / Constants.ONEDAY;
        if (!self.list[index].flag) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.sub(
                value.mul(Constants.ONEDAY - _now % Constants.ONEDAY).div(Constants.ONEDAY)
            ),
                nextValue : self.list[self.lastIndex].nextValue.sub(value),
                prevIndex : self.lastIndex,
                flag : true});
            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.sub(value.mul(Constants.ONEDAY - _now % Constants.ONEDAY).div(Constants.ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.sub(value);
        }
    }

    function currentLiquidity(List storage self) internal view returns (uint256) {
        return self.list[self.lastIndex].nextValue;
    }

    function index(List storage self, uint256 startIndex) internal view returns (uint256, Liquidity storage) {
        if (self.list[startIndex].flag) {
            return (startIndex, self.list[startIndex]);
        } else {
            uint256 currentIndex = self.lastIndex;
            while (currentIndex > startIndex) {
                currentIndex = self.list[currentIndex].prevIndex;
            }
            return (currentIndex, self.list[currentIndex]);
        }
    }


    function listLiquidity(List storage self) internal view returns (Liquidity[] memory rets){
        uint256 _index = self.lastIndex;
        uint256 count;
        while (self.list[_index].value != 0) {
            count++;
            _index = self.list[_index].prevIndex;
        }

        rets = new Liquidity[](count);
        _index = self.lastIndex;
        uint256 len;
        while (self.list[_index].value != 0) {
            rets[len] = self.list[_index];
            (_index, rets[len].prevIndex) = (rets[len].prevIndex, _index);
            len++;
        }
    }
}