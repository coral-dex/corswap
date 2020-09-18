pragma solidity ^0.6.10;

import "../common/math.sol";

library LiquidityList {
    uint256 public constant ONEDAY = 600;
    using SafeMath for uint256;

    struct Liquidity {
        uint256 value;
        uint256 nextValue;
        uint256 prevIndex;
    }

    struct List {
        uint256 lastIndex;
        mapping(uint256 => Liquidity) list;
    }

    function add(List storage self, uint256 value) internal {
        uint256 index = now / ONEDAY;
        if (self.list[index].value == 0) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.add(value.mul(ONEDAY - now % ONEDAY).div(ONEDAY)),
                nextValue : self.list[self.lastIndex].nextValue.add(value),
                prevIndex : self.lastIndex});

            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.add(value.mul(ONEDAY - now % ONEDAY).div(ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.add(value);
        }
    }

    function sub(List storage self, uint256 value) internal {
        uint256 index = now / ONEDAY;
        if (self.list[index].value == 0) {
            self.list[index] = Liquidity({value : self.list[self.lastIndex].nextValue.add(value.mul(ONEDAY - now % ONEDAY).div(ONEDAY)),
                nextValue : self.list[self.lastIndex].nextValue.sub(value),
                prevIndex : self.lastIndex});
            self.lastIndex = index;
        } else {
            self.list[index].value = self.list[index].value.sub(value.mul(ONEDAY - now % ONEDAY).div(ONEDAY));
            self.list[index].nextValue = self.list[self.lastIndex].nextValue.sub(value);
        }
    }

    function totalLiquidity(List storage self, uint256 startIndex) internal view returns (uint256 liquidity) {
        uint256 currentIndex = now / ONEDAY;
        uint256 index = self.lastIndex;
        if (index == 0) {
            return 0;
        }

        if (index == currentIndex) {
            index = self.list[index].prevIndex;
        }

        while (self.list[index].value != 0 && index >= startIndex) {
            liquidity = liquidity.add(self.list[index].value);
            liquidity = liquidity.add(self.list[index].nextValue.mul(currentIndex.sub(index + 1)));
            currentIndex = index;
            index = self.list[index].prevIndex;
        }
    }

    function listLiquidity(List storage self) internal view returns (Liquidity[] memory rets){
        uint256 index = self.lastIndex;
        uint256 count;
        while (self.list[index].value != 0) {
            count++;
            index = self.list[index].prevIndex;
        }

        rets = new Liquidity[](count);
        index = self.lastIndex;
        uint256 len;
        while (self.list[index].value != 0) {
            rets[len++] = self.list[index];
            index = self.list[index].prevIndex;
        }
    }
}