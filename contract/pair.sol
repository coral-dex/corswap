pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./liquidity.sol";
import "../common/strings.sol";
import "./types.sol";

library ExchangePair {
    using SafeMath for uint256;
    using LiquidityList for LiquidityList.List;

    struct Pair {
        bytes32 tokenA;
        bytes32 tokenB;
        bytes32 baseToken;

        uint256 reserveA;
        uint256 reserveB;

        LiquidityList.List wholeLiquidity;
        mapping(address => LiquidityList.List) liquiditys;

    }

    event OrderLog(bytes32 tokenIn, bytes32 tokenOut, uint256 amountIn, uint256 amountOut);

    function investLiquidity(Pair storage self, address owner, uint256 valueA, uint256 valueB, uint256 _minShares) internal returns (uint256 returnA, uint256 returnB) {

        uint256 divestedB;
        uint256 divestedA;
        uint256 sharesPurchased;
        uint256 totalShares = self.wholeLiquidity.currentLiquidity();
        if (totalShares == 0) {
            sharesPurchased = 1000;
            divestedB = valueB;
            divestedA = valueA;
        } else {
            uint256 perShareB = self.reserveB.div(totalShares);
            uint256 perShareA = self.reserveA.div(totalShares);

            require(valueB >= perShareB && valueA >= perShareA);

            sharesPurchased = valueB.div(perShareB);
            if (valueA.div(perShareA) < sharesPurchased) {
                sharesPurchased = valueA.div(perShareA);
            }

            divestedA = sharesPurchased.mul(perShareA);
            divestedB = sharesPurchased.mul(perShareB);
        }

        require(_minShares <= sharesPurchased);

        self.reserveA = self.reserveA.add(divestedA);
        self.reserveB = self.reserveB.add(divestedB);

        self.wholeLiquidity.add(sharesPurchased);
        self.liquiditys[owner].add(sharesPurchased);

        return (valueA.sub(divestedA), valueB.sub(divestedB));
    }

    function removeLiquidity(Pair storage self, address owner, uint256 _sharesBurned) internal returns (uint256, uint256) {
        uint256 divestedB;
        uint256 divestedA;
        uint256 totalShares = self.wholeLiquidity.currentLiquidity();
        if (_sharesBurned == totalShares) {
            divestedB = self.reserveB;
            divestedA = self.reserveA;
        } else {
            uint256 perShareB = self.reserveB.div(totalShares);
            uint256 perShareA = self.reserveA.div(totalShares);
            divestedB = perShareB.mul(_sharesBurned);
            divestedA = perShareA.mul(_sharesBurned);
        }

        self.wholeLiquidity.sub(_sharesBurned);
        self.liquiditys[owner].sub(_sharesBurned);

        self.reserveA = self.reserveA.sub(divestedA);
        self.reserveB = self.reserveB.sub(divestedB);

        return (divestedA, divestedB);
    }

    function caleSwap(Pair storage self, bytes32 tokenIn, uint256 amountIn, uint256 feeRate) internal view returns (uint256, uint256) {
        uint256 invariant = self.reserveA.mul(self.reserveB);
        uint256 fee;
        uint256 amountOut;

        if (feeRate == 0) {
            feeRate = 20;
        }

        if (self.baseToken == bytes32(0)) {
            fee = amountIn.mul(feeRate).div(10000);
            if (tokenIn == self.tokenA) {
                amountOut = self.reserveB.sub(invariant.div(self.reserveA.add(amountIn.sub(fee))));
            } else {
                amountOut = self.reserveA.sub(invariant.div(self.reserveB.add(amountIn.sub(fee))));
            }
            return (amountOut, 0);
        } else {
            if (self.baseToken == tokenIn) {
                fee = amountIn.mul(feeRate).div(10000);
                if (tokenIn == self.tokenA) {
                    amountOut = self.reserveB.sub(invariant.div(self.reserveA.add(amountIn.sub(fee))));
                } else {
                    amountOut = self.reserveA.sub(invariant.div(self.reserveB.add(amountIn.sub(fee))));
                }
            } else {
                if (tokenIn == self.tokenA) {
                    amountOut = self.reserveB.sub(invariant.div(self.reserveA.add(amountIn)));
                } else {
                    amountOut = self.reserveA.sub(invariant.div(self.reserveB.add(amountIn)));
                }
                fee = amountOut.mul(feeRate).div(10000);
                amountOut = amountOut.sub(fee);
            }
            return (amountOut, fee);
        }
    }

    function swap(Pair storage self, bytes32 tokenIn, uint256 amountIn, uint256 feeRate) internal returns (uint256, bytes32, uint256) {
        (uint256 amountOut, uint256 fee) = caleSwap(self, tokenIn, amountIn, feeRate);

        if (self.baseToken == bytes32(0)) {
            if (tokenIn == self.tokenA) {
                self.reserveA = self.reserveA.add(amountIn);
                self.reserveB = self.reserveB.sub(amountOut);
                emit OrderLog(self.tokenA, self.tokenB, amountIn, amountOut);
            } else {
                self.reserveB = self.reserveB.add(amountIn);
                self.reserveA = self.reserveA.sub(amountOut);
                emit OrderLog(self.tokenB, self.tokenA, amountIn, amountOut);
            }
        } else {
            if (self.baseToken == tokenIn) {
                if (tokenIn == self.tokenA) {
                    self.reserveA = self.reserveA.add(amountIn.sub(fee));
                    self.reserveB = self.reserveB.sub(amountOut);
                    emit OrderLog(self.tokenA, self.tokenB, amountIn, amountOut);
                } else {
                    self.reserveB = self.reserveB.add(amountIn.sub(fee));
                    self.reserveA = self.reserveA.sub(amountOut);
                    emit OrderLog(self.tokenB, self.tokenA, amountIn, amountOut);
                }
            } else {
                if (tokenIn == self.tokenA) {
                    self.reserveA = self.reserveA.add(amountIn);
                    self.reserveB = self.reserveB.sub(amountOut.add(fee));
                    emit OrderLog(self.tokenA, self.tokenB, amountIn, amountOut);
                } else {
                    self.reserveB = self.reserveB.add(amountIn);
                    self.reserveA = self.reserveA.sub(amountOut.add(fee));
                    emit OrderLog(self.tokenB, self.tokenA, amountIn, amountOut);
                }
            }
        }

        uint256 totalShares = self.wholeLiquidity.currentLiquidity();
        uint256 perShareB = self.reserveB.div(totalShares);
        uint256 perShareA = self.reserveA.div(totalShares);
        require(perShareB != 0 && perShareA != 0);

        return (amountOut, self.baseToken, fee);
    }


    function currentLiquidity(Pair storage self, address owner) internal view returns (uint256, uint256) {
        return (self.wholeLiquidity.currentLiquidity(), self.liquiditys[owner].currentLiquidity());
    }

    function liquidityList(Pair storage self, address owner) internal view returns (Liquidity[] memory, Liquidity[] memory) {
        return (self.wholeLiquidity.listLiquidity(), self.liquiditys[owner].listLiquidity());
    }
}




