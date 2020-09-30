pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

import "../common/math.sol";
import "./liquidity.sol";
import "./cyclelist.sol";
import "../common/strings.sol";
import "./types.sol";

library ExchangePair {
    using SafeMath for uint256;
    using LiquidityList for LiquidityList.List;
    using CycleList for CycleList.List;

    struct Pair {
        uint256 seq;
        bytes32 tokenA;
        bytes32 tokenB;

        uint256 reserveA;
        uint256 reserveB;

        uint256 totalShares;
        mapping(address => uint256) shares;

        LiquidityList.List wholeLiquidity;
        mapping(address => LiquidityList.List) liquiditys;


        mapping(uint256 => Order) ordersMap;
        CycleList.List orderlist;
        mapping(address => CycleList.List) usersOrderList;
    }

    event OrderLog(bytes32 tokenA, bytes32 tokenB, uint256 amountIn, uint256 amountOut, uint256 feeRate);

    function investLiquidity(Pair storage self, address owner, uint256 valueA, uint256 valueB, uint256 _minShares) internal returns (uint256 returnA, uint256 returnB) {

        uint256 perShareB = self.reserveB.div(self.totalShares);
        uint256 perShareA = self.reserveA.div(self.totalShares);

        require(valueB >= perShareB && valueA >= perShareA);

        uint256 sharesPurchased = valueB.div(perShareB);
        if (valueA.div(perShareA) < sharesPurchased) {
            sharesPurchased = valueA.div(perShareA);
        }

        require(_minShares <= sharesPurchased);

        self.shares[owner] = self.shares[owner].add(sharesPurchased);
        self.totalShares = self.totalShares.add(sharesPurchased);

        self.wholeLiquidity.add(sharesPurchased);
        self.liquiditys[owner].add(sharesPurchased);

        self.reserveA = self.reserveA.add(sharesPurchased.mul(perShareA));
        self.reserveB = self.reserveB.add(sharesPurchased.mul(perShareB));

        return (valueA.sub(sharesPurchased.mul(perShareA)), valueB.sub(sharesPurchased.mul(perShareB)));
    }

    function removeLiquidity(Pair storage self, address owner, uint256 _sharesBurned) internal returns (uint256, uint256) {

        uint256 perShareB = self.reserveB.div(self.totalShares);
        uint256 perShareA = self.reserveA.div(self.totalShares);

        self.totalShares = self.totalShares.sub(_sharesBurned);
        self.shares[owner] = self.shares[owner].sub(_sharesBurned);

        self.wholeLiquidity.sub(_sharesBurned);
        self.liquiditys[owner].sub(_sharesBurned);

        uint256 divestedB = perShareB.mul(_sharesBurned);
        uint256 divestedA = perShareA.mul(_sharesBurned);

        self.reserveA = self.reserveA.sub(divestedA);
        self.reserveB = self.reserveB.sub(divestedB);

        return (divestedA, divestedB);
    }

    function caleSwap(Pair storage self, bytes32 token, uint256 amountIn, uint256 feeRate) internal view returns (uint256, uint256) {
        uint256 invariant = self.reserveA.mul(self.reserveB);
        uint256 fee;
        uint256 amountOut;

        bool flag;
        if (feeRate == 0) {
            feeRate = 30;
            flag = true;
        }

        if (token == self.tokenB) {
            fee = amountIn.mul(feeRate).div(10000);
            amountOut = self.reserveA.sub(invariant.div(self.reserveB.add(amountIn.sub(fee))));
            if (flag) {
                return (amountOut, 0);
            } else {
                return (amountOut, fee);
            }
        } else if (token == self.tokenA) {
            amountOut = self.reserveB.sub(invariant.div(self.reserveA.add(amountIn)));
            fee = amountOut.mul(feeRate).div(10000);
            if (flag) {
                return (amountOut.sub(fee), 0);
            } else {
                return (amountOut.sub(fee), fee);
            }
        } else {
            require(false);
        }
    }

    function swap(Pair storage self, address owner, bytes32 token, uint256 amountIn, uint256 feeRate) internal returns (uint256, uint256) {
        (uint256 amountOut,  uint256 fee) = caleSwap(self, token, amountIn, feeRate);

        uint8 orderType;
        if (token == self.tokenB) {
            self.reserveA = self.reserveA.sub(amountOut);
            self.reserveB = self.reserveB.add(amountIn.sub(fee));
            emit OrderLog(self.tokenB, self.tokenA, amountIn, amountOut, fee);
        } else {
            self.reserveA = self.reserveA.add(amountIn);
            self.reserveB = self.reserveB.sub(amountOut.add(fee));
            emit OrderLog(self.tokenA, self.tokenB, amountIn, amountOut, fee);
        }

        uint256 id = self.seq++;
        self.ordersMap[id] = Order({amountIn : amountIn, amountOut : amountOut, orderType : orderType, timestamp : now});
        self.usersOrderList[owner].push(id);
        uint256[] memory delIds = self.orderlist.push(id);
        for (uint256 i = 0; i < delIds.length; i++) {
            delete self.ordersMap[delIds[i]];
        }

        return (amountOut, fee);
    }

    function feeToken(Pair storage self) internal view returns (bytes32) {
        return self.tokenB;
    }

    function liquidity(Pair storage self, address owner, uint256 index) internal view returns (uint256, uint256) {
        uint256 selfTotal = self.liquiditys[owner].liquidityOfDay(index);
        uint256 total = self.wholeLiquidity.liquidityOfDay(index);
        return (selfTotal, total);
    }

    function liquidityList(Pair storage self, address owner) internal view returns (Liquidity[] memory, Liquidity[] memory) {
        return (self.wholeLiquidity.listLiquidity(), self.liquiditys[owner].listLiquidity());
    }

    function userOrderIds(Pair storage self, address owner) internal view returns (uint256[] memory) {
        return self.usersOrderList[owner].list(0);
    }

    function orderList(Pair storage self, address owner) internal view returns (Order[] memory, Order[] memory) {

        uint256[] memory _userIds = self.usersOrderList[owner].list(0);
        Order[] memory _userOrderList = new Order[](_userIds.length);
        for (uint256 i = 0; i < _userIds.length; i++) {
            _userOrderList[i] = self.ordersMap[_userIds[i]];
        }

        uint256[] memory _ids = self.orderlist.list(0);
        Order[] memory _orderList = new Order[](_ids.length);
        for (uint256 i = 0; i < _ids.length; i++) {
            _orderList[i] = self.ordersMap[_ids[i]];
        }

        return (_orderList, _userOrderList);
    }

}




