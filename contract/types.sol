pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

struct Order {
uint256 amountIn;
uint256 amountOut;
uint256 timestamp;
uint8 orderType;
}

struct Pair {
bytes32 tokenA;
bytes32 tokenB;
uint256 reserveA;
uint256 reserveB;
uint256 totalShares;
uint256 myShare;
uint256 shareRreward;
bool mining;
}

struct Volume {
uint256 index;
uint256 value;
}

struct Liquidity {
uint256 value;
uint256 nextValue;
uint256 prevIndex;
bool flag;
}
    