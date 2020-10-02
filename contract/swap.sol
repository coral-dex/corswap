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
import "./constants.sol";
import "./types.sol";

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
        for (uint256 i = 0; i < self.tokens.length; i++) {
            delete self.valueMap[self.tokens[i]];
        }
        delete self.tokens;
    }
}


interface TokenPool {
    function transfer(address _to, uint256 _value) external returns (bool success);
}

contract SwapExchange is SeroInterface, Ownable {

    using SafeMath for uint256;
    using ExchangePair for ExchangePair.Pair;
    using VolumeList for VolumeList.List;
    using LiquidityList for LiquidityList.List;
    using InitValueList for InitValueList.List;

    bytes32 SEROBYTES = strings._stringToBytes32("SERO");

    mapping(address => InitValueList.List) private initValues;

    mapping(bytes32 => ExchangePair.Pair) private pairs;
    bytes32[] public pairKeys;
    mapping(bytes32 => bytes32[]) private tokenIndexs;

    VolumeList.List private wholeVolume;
    mapping(bytes32 => VolumeList.List) private volumes;
    mapping(address => uint256) public lastIndexsMap;

    TokenPool private tokenPool;
    mapping(bytes32 => uint256) public feeRateMap;
    mapping(bytes32 => uint256) public drawRateMap;

    uint256 public startDay;
    uint256[7000] public outputs;

    constructor(address _tokenPool) public payable {
        tokenPool = TokenPool(_tokenPool);
    }

    function start() public onlyOwner {
        startDay = now / Constants.ONEDAY;
    }

    function setOutputs(uint256 _start, uint256[] memory _outputs) public onlyOwner {
        for (uint256 i = 0; i < _outputs.length; i++) {
            outputs[_start + i] = _outputs[i];
        }
    }

    function setTokenPool(address _tokenPool) public onlyOwner {
        tokenPool = TokenPool(_tokenPool);
    }

    function setFeeRate(string memory tokenA, string memory tokenB, uint256 _feeRate) public onlyOwner {
        require(_feeRate < 10000);
        bytes32 key = _hash(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        feeRateMap[key] = _feeRate;
    }

    function setDrawRate(string memory tokenA, string memory tokenB, uint256 _drawRate) public onlyOwner {
        require(_drawRate < 10000);
        bytes32 key = _hash(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        drawRateMap[key] = _drawRate;
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

    function orderIds(bytes32 key) public view returns (uint256[] memory) {
        return pairs[key].userOrderIds(msg.sender);
    }

    function orderList(bytes32 key) public view returns (Order[] memory, Order[] memory) {
        return pairs[key].orderList(msg.sender);
    }

    function pairListByToken(bytes32 token, uint256 _start, uint256 _end) public view returns (Pair[] memory rets) {
        bytes32[] memory keys = tokenIndexs[token];
        if (_start >= keys.length || _start >= _end) {
            return rets;
        }

        if (_end > keys.length) {
            _end = keys.length;
        }

        rets = new Pair[](_end - _start);
        for (uint256 i = _start; i < _end; i++) {
            rets[i - _start] = pairInfo(keys[i]);
        }
    }

    function pairList(uint256 _start, uint256 _end) public view returns (Pair[] memory rets) {

        if (_start >= pairKeys.length || _start >= _end) {
            return rets;
        }
        if (_end > pairKeys.length) {
            _end = pairKeys.length;
        }

        rets = new Pair[](_end - _start);
        for (uint256 i = _start; i < _end; i++) {
            rets[i - _start] = pairInfo(pairKeys[i]);
        }
    }

    function pairInfo(bytes32 key) public view returns (Pair memory) {
        uint256 shareRreward = shareReward(key);

        Pair memory pair = Pair({
            tokenA : pairs[key].tokenA,
            tokenB : pairs[key].tokenB,
            reserveA : pairs[key].reserveA,
            reserveB : pairs[key].reserveB,
            totalShares : pairs[key].totalShares,
            myShare : pairs[key].shares[msg.sender],
            shareRreward : shareRreward,
            orderList : new Order[](0),
            myOrderList : new Order[](0)
            });
        return pair;
    }

    function pairInfoWithOrders(bytes32 key) public view returns (Pair memory){

        uint256 shareRreward = shareReward(key);
        (Order[] memory _orderList, Order[] memory _userOrderList) = orderList(key);

        Pair memory pair = Pair({
            tokenA : pairs[key].tokenA,
            tokenB : pairs[key].tokenB,
            reserveA : pairs[key].reserveA,
            reserveB : pairs[key].reserveB,
            totalShares : pairs[key].totalShares,
            myShare : pairs[key].shares[msg.sender],
            shareRreward : shareRreward,
            orderList : _orderList,
            myOrderList : _userOrderList
            });
        return pair;
    }

    function volumesOfPair(string memory tokenA, string memory tokenB) public view returns (Volume[] memory, Volume[] memory) {
        bytes32 key = _hash(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        return (wholeVolume.listVolume(), volumes[key].listVolume());
    }

    function liquidityOfPair(string memory tokenA, string memory tokenB) public view returns (Liquidity[] memory, Liquidity[] memory) {
        bytes32 key = _hash(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        return pairs[key].liquidityList(msg.sender);
    }

    function shareReward(bytes32 key) public view returns (uint256 reward) {
        uint256 lastIndex = lastIndexsMap[msg.sender];
        if (lastIndex == 0) {
            lastIndex = startDay;
        }

        uint256 selfVolume;
        uint256 totalVolume;
        uint256 selfLiquidity;
        uint256 totalLiquidity;

        for (uint256 i = startDay; i < (now / Constants.ONEDAY); i++) {
            totalVolume = wholeVolume.volumeOfDay(i);
            selfVolume = volumes[key].volumeOfDay(i);

            if (selfVolume == 0 || totalVolume == 0) {
                continue;
            }
            (selfLiquidity, totalLiquidity) = pairs[key].liquidity(msg.sender, i);

            if (selfLiquidity == 0 || totalLiquidity == 0) {
                continue;
            }

            reward = reward.add(output(i).mul(selfVolume).mul(selfLiquidity).div(totalVolume).div(totalLiquidity));
        }
    }

    function output(uint256 index) public view returns (uint256) {
        if (startDay == 0) {
            return 0;
        }

        if (index < startDay) {
            return 0;
        }

        if (index - startDay >= outputs.length) {
            return 1e21;
        } else {
            return 1e22;
            // return outputs[index-startDay]
        }
    }

    function investAmount() public view returns (bytes32 token, uint256 value){
        InitValueList.List storage list = initValues[msg.sender];
        if (list.tokens.length == 0) {
            return (bytes32(0), 0);
        }
        token = list.tokens[0];
        value = list.valueMap[token];
    }

    function cancelInvest() public returns (bool) {
        InitValueList.List storage list = initValues[msg.sender];
        require(list.tokens.length == 1);
        bytes32 token = list.tokens[0];
        uint256 value = list.valueMap[token];

        require(sero_send_token(msg.sender, strings._bytes32ToStr(token), value));
        list.clear();
    }

    function withdrawShareReward(bytes32 key) external {
        uint256 value = shareReward(key);
        lastIndexsMap[msg.sender] = now / Constants.ONEDAY;
        require(tokenPool.transfer(msg.sender, value));
    }

    function initializePair() external payable {
        require(startDay > 0);
        require(msg.value > 0);
        bytes32 token = strings._stringToBytes32(sero_msg_currency());
        uint256 size = initValues[msg.sender].push(token, msg.value);
        if (size < 2) {
            return;
        }

        _investLiquidity(msg.sender, 0);
    }

    function investLiquidity(uint256 _minShares) external payable {
        require(startDay > 0);
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
                if (pairs[_key].reserveA == 0 || pairs[_key].reserveB == 0) {
                    require(sero_send_token(sender, strings._bytes32ToStr(tokenA), initValue.valueMap[tokenA]));
                    require(sero_send_token(sender, strings._bytes32ToStr(tokenB), initValue.valueMap[tokenB]));
                    initValues[sender].clear();
                    return;
                }
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
            require(false);
        }

        if (lastIndexsMap[sender] == 0) {
            lastIndexsMap[sender] = now / Constants.ONEDAY;
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

    function estimateSwap(bytes32 key, bytes32 tokenIn, uint256 amountIn) public view returns (uint256 value){
        if (pairs[key].reserveA == 0 || pairs[key].reserveB == 0) {
            return 0;
        }

        (value,) = pairs[key].caleSwap(tokenIn, amountIn, feeRateMap[key]);
    }

    function swap(bytes32 key, uint256 _minTokensReceived, uint256 _timeout, address _recipient) public payable {
        require(startDay > 0);
        require(pairs[key].reserveA != 0 && pairs[key].reserveB != 0, "exchange not initialized");
        require(address(tokenPool) != address(0));
        require(now < _timeout && msg.value > 0);

        if (_recipient == address(0)) {
            _recipient = msg.sender;
        }

        bytes32 _token = strings._stringToBytes32(sero_msg_currency());
        require(pairs[key].tokenA == _token || pairs[key].tokenB == _token);
        _excuteSwap(msg.sender, key, _token, msg.value, _minTokensReceived, _recipient);
    }

    function _excuteSwap(address sender, bytes32 key, bytes32 _token, uint256 value, uint256 _minTokensReceived, address _recipient) internal {
        (uint256 tokenOutValue, uint256 fee) = _swap(sender, key, _token, value, feeRateMap[key]);
        require(_minTokensReceived <= tokenOutValue);
        if (_token == pairs[key].tokenA) {
            require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenB), tokenOutValue));
        } else {
            require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenA), tokenOutValue));
        }

        if (fee > 0) {
            require(sero_send_token(address(tokenPool), "SERO", fee));
            wholeVolume.add(fee);
            volumes[key].add(fee);
        }
    }

    function _swap(address sender, bytes32 key, bytes32 _token, uint256 _value, uint256 _feeRate) private returns (uint256, uint256) {
        (uint256 tokenOutValue, uint256 fee) = pairs[key].swap(sender, _token, _value, _feeRate);
        if (pairs[key].tokenB == SEROBYTES) {
            return (tokenOutValue, fee);
        } else {
            bytes32 _key = _hash(pairs[key].tokenB, SEROBYTES);
            (uint256 fee1, uint256 fee2) = _swap(sender, _key, pairs[key].tokenB, fee, feeRateMap[_key]);
            return (tokenOutValue, fee1 + fee2);
        }
    }

    function _hash(bytes32 tokenA, bytes32 tokenB) private pure returns (bytes32) {
        require(tokenA != tokenB, 'same token');
        (bytes32 token0, bytes32 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encode(token0, token1));
    }

    function hasPair(bytes32 _key) public view returns (bool) {
        return pairs[_key].reserveA != 0 && pairs[_key].reserveB != 0;
    }

}









