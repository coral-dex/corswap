pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;
pragma experimental ABIEncoderV2;

import "../common/math.sol";
import "../common/ownable.sol";
import "../common/strings.sol";
import "../common/serointerface.sol";
import "./pair.sol";
import "./volume.sol";
import "./liquidity.sol";
import "./cyclelist.sol";

contract Token is SeroInterface, Ownable {
    uint256 constant ONEDAY = 600;
    uint256 private systemStartDay;

    constructor() public {
        systemStartDay = now / ONEDAY;
    }

    function output(uint256 _startDay) public view returns (uint256) {
        return _output(_startDay, now / ONEDAY);
    }

    function _output(uint256 _startDay, uint256 _endDay) private view returns (uint256){
        if (_endDay <= systemStartDay) {
            return 0;
        }

        if (_startDay < systemStartDay) {
            _startDay = systemStartDay;
        }

        if (_endDay <= systemStartDay + 90) {

            return (_endDay - _startDay) * 2e22;

        } else if (_endDay <= systemStartDay + 360) {

            if (_startDay >= systemStartDay + 90) {
                return (_endDay - _startDay) * 5e21;
            } else {
                return (_endDay - systemStartDay - 90) * 5e21 + _output(_startDay, systemStartDay + 90);
            }

        } else {
            uint256 n = (_endDay - systemStartDay - 361) / 1800;
            uint256 levelNStartDay = systemStartDay + 360 + 1800 * n;

            uint256 _dayOutput = 25e20 / (2 ** n);
            if (_dayOutput < 1e9) {
                _dayOutput = 1e9;
            }
            if (_startDay >= levelNStartDay) {
                return (_endDay - _startDay) * _dayOutput;
            } else {
                return _dayOutput * (_endDay - levelNStartDay) + _output(_startDay, levelNStartDay);
            }
        }
    }
}

interface TokenPool {
    function transfer(address _to, uint256 _value) external returns (bool success);

    function exchange() external payable returns (bool);

    function totalSupply() external view returns (uint256);
}

library InitValueList {
    using SafeMath for uint256;
    struct List {
        mapping(bytes32 => uint256) valueMap;
        bytes32[] tokens;
    }

    function push(List storage self, bytes32 token, uint256 value) internal returns (uint256){
        if (self.valueMap[token] == 0) {
            self.tokens.push(token);
            self.valueMap[token] = value;
        } else {
            self.valueMap[token] = self.valueMap[token].add(value);
        }
        return self.tokens.length;
    }

    function clear(List storage self) internal {
        delete self.valueMap[self.tokens[0]];
        delete self.valueMap[self.tokens[1]];
        delete self.tokens;
    }
}

contract SwapExchange is Token {

    using SafeMath for uint256;
    using ExchangePair for ExchangePair.Pair;
    using ExchangePair for ExchangePair.Order;
    using VolumeList for VolumeList.List;
    using LiquidityList for LiquidityList.List;
    using InitValueList for InitValueList.List;


    bytes32 public SEROBYTES = strings._stringToBytes32("SERO");

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

        uint256 totalVolume;
        uint256 selfVolume;
        Order[] orderList;
        Order[] myOrderList;
    }

    mapping(address => InitValueList.List) initValues;

    mapping(bytes32 => ExchangePair.Pair) pairs;
    bytes32[] public pairKeys;
    mapping(bytes32 => bytes32[]) tokenIndexs;

    VolumeList.List public wholeVolume;
    mapping(bytes32 => VolumeList.List) public volumes;
    mapping(address => uint256) public lastIndexsMap;

    TokenPool private tokenPool;
    mapping(bytes32 => uint256) public feeRateMap;
    mapping(bytes32 => uint256) public drawRateMap;

    constructor(address _tokenPool) public payable {
        tokenPool = TokenPool(_tokenPool);
    }

    function setTokenPool(address _tokenPool) public onlyOwner {
        tokenPool = TokenPool(_tokenPool);
    }

    function feeRate(bytes32 key) public view returns (uint256) {
        uint256 _feeRate = feeRateMap[key];
        if (_feeRate == 0) {
            _feeRate = 30;
        }

        return _feeRate + drawRateMap[key];
    }

    function getGroupTokens(bytes32[] memory tokens) public view returns (bytes32[][] memory rets) {
        rets = new bytes32[][](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            rets[i] = getTokens(tokens[i]);
        }
    }

    function getTokens(bytes32 token) public view returns (bytes32[] memory rets) {
        bytes32[] memory keys = tokenIndexs[token];
        rets = new bytes32[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            ExchangePair.Pair storage pair = pairs[keys[i]];
            if (token == pair.tokenA) {
                rets[i] = pair.tokenB;
            } else {
                rets[i] = pair.tokenA;
            }
        }
    }

    function orderIdss(bytes32 key) public view returns (uint256[] memory) {
        return pairs[key].userOrderIds(msg.sender);
    }

    function orderList(bytes32 key) public view returns (Order[] memory, Order[] memory) {
        (ExchangePair.Order[] memory orders,
        ExchangePair.Order[] memory userOrders) = pairs[key].orderList(msg.sender);

        Order[] memory _orderList = new Order[](orders.length);
        for (uint256 i = 0; i < orders.length; i++) {
            _orderList[i] = Order({
                amountIn : orders[i].amountIn, amountOut : orders[i].amountOut, orderType : orders[i].orderType, timestamp : orders[i].timestamp});
        }

        Order[] memory _userOrderList = new Order[](userOrders.length);
        for (uint256 i = 0; i < userOrders.length; i++) {
            _userOrderList[i] = Order({
                amountIn : userOrders[i].amountIn,
                amountOut : userOrders[i].amountOut,
                orderType : userOrders[i].orderType,
                timestamp : userOrders[i].timestamp});
        }

        return (_orderList, _userOrderList);
    }

    function pairListByToken(bytes32 token, uint256 start, uint256 end) public view returns (Pair[] memory rets) {
        bytes32[] memory keys = tokenIndexs[token];
        if (start >= keys.length || start >= end) {
            return rets;
        }

        if (end > keys.length) {
            end = keys.length;
        }

        rets = new Pair[](end - start);
        for (uint256 i = start; i < end; i++) {
            rets[i - start] = pairInfo(keys[i]);
        }
    }

    function pairList(uint256 start, uint256 end) public view returns (Pair[] memory rets) {

        if (start >= pairKeys.length || start >= end) {
            return rets;
        }
        if (end > pairKeys.length) {
            end = pairKeys.length;
        }

        rets = new Pair[](end - start);
        for (uint256 i = start; i < end; i++) {
            rets[i - start] = pairInfo(pairKeys[i]);
        }
    }

    function pairInfo(bytes32 key) public view returns (Pair memory){

        uint256 shareRreward = _shareReward(key);

        Pair memory pair = Pair({
            tokenA : pairs[key].tokenA,
            tokenB : pairs[key].tokenB,
            reserveA : pairs[key].reserveA,
            reserveB : pairs[key].reserveB,
            totalShares : pairs[key].totalShares,
            myShare : pairs[key].shares[msg.sender],
            shareRreward : shareRreward,
            totalVolume : wholeVolume.totalVolume(lastIndexsMap[msg.sender]),
            selfVolume : volumes[key].totalVolume(lastIndexsMap[msg.sender]),
            orderList : new Order[](0),
            myOrderList : new Order[](0)
            });
        return pair;
    }

    function pairInfoWithOrders(bytes32 key) public view returns (Pair memory){

        uint256 shareRreward = _shareReward(key);
        (Order[] memory _orderList, Order[] memory _userOrderList) = orderList(key);

        Pair memory pair = Pair({
            tokenA : pairs[key].tokenA,
            tokenB : pairs[key].tokenB,
            reserveA : pairs[key].reserveA,
            reserveB : pairs[key].reserveB,
            totalShares : pairs[key].totalShares,
            myShare : pairs[key].shares[msg.sender],
            shareRreward : shareRreward,
            totalVolume : wholeVolume.totalVolume(lastIndexsMap[msg.sender]),
            selfVolume : volumes[key].totalVolume(lastIndexsMap[msg.sender]),
            orderList : _orderList,
            myOrderList : _userOrderList
            });
        return pair;
    }


    function minePool() public {

    }

    function exchange() public {


    }

    function withdrawShareReward(bytes32 key) external {
        uint256 value = _shareReward(key);
        lastIndexsMap[msg.sender] = now / ONEDAY;
        require(tokenPool.transfer(msg.sender, value));
    }


    function initializePair() external payable {
        require(msg.value > 0);
        bytes32 token = strings._stringToBytes32(sero_msg_currency());
        uint256 size = initValues[msg.sender].push(token, msg.value);
        if (size < 2) {
            return;
        }

        _investLiquidity(msg.sender, 0);
    }

    function investLiquidity(uint256 _minShares) external payable {
        require(msg.value > 0);
        bytes32 token = strings._stringToBytes32(sero_msg_currency());

        require(tokenIndexs[token].length > 0);

        uint256 size = initValues[msg.sender].push(token, msg.value);
        if (size < 2) {
            return;
        }
        _investLiquidity(msg.sender, _minShares);
    }

    function _investLiquidity(address sender, uint256 _minShares) internal {

        InitValueList.List storage initValue = initValues[sender];
        bytes32 tokenA = initValue.tokens[1];
        bytes32 tokenB = initValue.tokens[0];

        bytes32 key = _hash(tokenA, tokenB);

        if (pairs[key].reserveA == 0 && pairs[key].reserveB == 0) {

            //init pair
            if (tokenB != SEROBYTES) {
                bytes32 _key = _hash(tokenB, SEROBYTES);
                require(pairs[_key].reserveA != 0 && pairs[_key].reserveB != 0, "");
            }

            tokenIndexs[initValues[msg.sender].tokens[0]].push(key);
            tokenIndexs[initValues[msg.sender].tokens[1]].push(key);
            pairKeys.push(key);

            pairs[key] = ExchangePair.Pair({seq : 0, tokenA : tokenA, tokenB : tokenB,
                reserveA : initValue.valueMap[tokenA], reserveB : initValue.valueMap[tokenB],
                totalShares : 1000,
                wholeLiquidity : LiquidityList.List({lastIndex : 0}),
                orderlist : CycleList.List()});

            pairs[key].shares[msg.sender] = 1000;
            pairs[key].wholeLiquidity.add(1000);
            pairs[key].liquiditys[msg.sender].add(1000);
        } else if (pairs[key].reserveA != 0 && pairs[key].reserveB != 0) {
            //invest liquidity
            (uint256 returnA, uint256 returnB) = pairs[key].investLiquidity(sender,
                initValue.valueMap[pairs[key].tokenA],
                initValue.valueMap[pairs[key].tokenB],
                _minShares);

            if (returnA != 0) {
                require(sero_send_token(sender, strings._bytes32ToStr(pairs[key].tokenA), returnA));
            }
            if (returnB != 0) {
                require(sero_send_token(sender, strings._bytes32ToStr(pairs[key].tokenB), returnB));
            }
        } else {

        }
        initValues[sender].clear();
    }

    function divestLiquidity(bytes32 key, uint256 _sharesBurned, uint256 _minTokenA, uint256 _minTokenB) external {
        require(pairs[key].reserveA > 0 && pairs[key].reserveB > 0, "exchange not initialized");

        (uint256 returnA, uint256 returnB) = pairs[key].removeLiquidity(msg.sender, _sharesBurned);
        require(returnA >= _minTokenA);
        require(returnB >= _minTokenB);
        require(sero_send_token(msg.sender, strings._bytes32ToStr(pairs[key].tokenA), returnA));
        require(sero_send_token(msg.sender, strings._bytes32ToStr(pairs[key].tokenB), returnB));
    }

    function swap(bytes32 key, uint256 _minTokensReceived, uint256 _timeout, address _recipient) public payable {
        require(pairs[key].reserveA != 0 && pairs[key].reserveB != 0, "");
        require(address(tokenPool) != address(0));
        require(now < _timeout && msg.value > 0);

        if (_recipient == address(0)) {
            _recipient = msg.sender;
        }

        bytes32 _token = strings._stringToBytes32(sero_msg_currency());
        require(pairs[key].tokenA == _token || pairs[key].tokenB == _token);


        uint256 _feeRate = feeRate(key);
        (uint256 tokenOutValue, uint256 fee) = _swap(key, _token, msg.value, _feeRate);

        require(_minTokensReceived <= tokenOutValue);
        if (_token == pairs[key].tokenA) {

            require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenB), tokenOutValue));
        } else {
            require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenA), tokenOutValue));
        }

        uint256 volume = _sendFee(key, _feeRate, fee);

        wholeVolume.add(volume);
        volumes[key].add(volume);
    }

    function _sendFee(bytes32 key, uint256 _feeRate, uint256 fee) internal returns (uint256){
        if (drawRateMap[key] > 0) {
            uint256 _fee = fee.mul(feeRateMap[key]).div(_feeRate);
            require(sero_send_token(address(tokenPool), "SERO", _fee));
            require(sero_send_token(owner, "SERO", fee.sub(_fee)));
            return _fee;
        } else {
            require(sero_send_token(address(tokenPool), "SERO", fee.mul(feeRateMap[key]).div(_feeRate)));
            return fee;
        }
    }

    function _swap(bytes32 key, bytes32 _token, uint256 _value, uint256 _feeRate) private returns (uint256, uint256) {
        (uint256 tokenOutValue, uint256 fee) = pairs[key].swap(msg.sender, _token, _value, _feeRate);
        if (pairs[key].tokenB == SEROBYTES) {
            return (tokenOutValue, fee);
        } else {
            bytes32 _key = _hash(pairs[key].tokenB, SEROBYTES);
            (fee,) = _swap(_key, pairs[key].tokenB, fee, 0);
            return (tokenOutValue, fee);
        }
    }


    function _shareReward(bytes32 key) internal view returns (uint256) {
        uint256 lastIndex = lastIndexsMap[msg.sender];

        uint256 selfTotalVolume = volumes[key].totalVolume(lastIndex);
        uint256 totalVolume = wholeVolume.totalVolume(lastIndex);
        if (selfTotalVolume == 0 || totalVolume == 0) {
            return 0;
        }

        (uint256 selfTotal, uint256 total) = pairs[key].liquidity(msg.sender, lastIndex);
        if (selfTotal == 0 || total == 0) {
            return 0;
        }

        uint256 value = output(lastIndex);
        return value.mul(selfTotalVolume).mul(selfTotal).div(totalVolume).div(total);
    }

    function _hash(bytes32 tokenA, bytes32 tokenB) private pure returns (bytes32) {
        require(tokenA != tokenB, 'same token');
        (bytes32 token0, bytes32 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encode(token0, token1));
    }


    function hasPair(bytes32 tokenA, bytes32 tokenB) internal view returns (bool) {
        bytes32 key = _hash(tokenA, tokenB);
        return pairs[key].reserveA != 0 && pairs[key].reserveB != 0;
    }
}









