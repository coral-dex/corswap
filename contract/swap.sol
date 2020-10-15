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
import "./constants.sol";
import "./types.sol";
import "./output.sol";

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

    mapping(address => InitValueList.List) private initValues;

    mapping(bytes32 => ExchangePair.Pair) private pairs;
    bytes32[] public pairKeys;
    mapping(bytes32 => bytes32[]) private tokenIndexs;

    VolumeList.List private wholeVolume;
    mapping(bytes32 => VolumeList.List) private volumes;
    mapping(address => mapping(bytes32 => uint256)) public lastIndexsMap;

    TokenPool private tokenPool;
    mapping(bytes32 => uint256) public feeRateMap;
    mapping(bytes32 => uint256) public weightsMap;

    uint256 public startDay;
    uint256 public mintDayIndex;


    constructor(address _tokenPool) public payable {
        tokenPool = TokenPool(_tokenPool);
    }

    receive() external payable {
    }

    function start() public onlyOwner {
        require(startDay == 0);
        startDay = Constants.toUTC(now) / Constants.ONEDAY;
    }

    function setFeeRate(string memory tokenA, string memory tokenB, uint256 _feeRate) public onlyOwner {
        require(_feeRate < 10000);
        bytes32 _tokenA = strings._stringToBytes32(tokenA);
        bytes32 _tokenB = strings._stringToBytes32(tokenB);
        bytes32 key = hashKey(_tokenA, _tokenB);

        require(pairs[key].tokenA != bytes32(0) && pairs[key].tokenB != bytes32(0), "exchange not initialized");

        feeRateMap[key] = _feeRate;
    }

    function setTokenBase(string memory tokenA, string memory tokenB, uint256 _weight) public onlyOwner {
        require(_weight <= 100);
        bytes32 _tokenA = strings._stringToBytes32(tokenA);
        bytes32 _tokenB = strings._stringToBytes32(tokenB);
        bytes32 key = hashKey(_tokenA, _tokenB);

        require(pairs[key].tokenA != bytes32(0) && pairs[key].tokenB != bytes32(0), "exchange not initialized");

        pairs[key].baseToken = _tokenB;
        if (_tokenB != Constants.SEROBYTES) {
            bytes32 _key = hashKey(_tokenB, Constants.SEROBYTES);
            require(_key != key && pairs[_key].reserveA != 0 && pairs[_key].reserveB != 0);
        }
        weightsMap[key] = _weight;
    }

    function clearTokenBase(string memory tokenA, string memory tokenB) public onlyOwner {
        bytes32 _tokenA = strings._stringToBytes32(tokenA);
        bytes32 _tokenB = strings._stringToBytes32(tokenB);
        bytes32 key = hashKey(_tokenA, _tokenB);

        require(pairs[key].tokenA != bytes32(0) && pairs[key].tokenB != bytes32(0), "exchange not initialized");
        pairs[key].baseToken = bytes32(0);
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

        (uint256 totalShares, uint256 myShare) = pairs[key].currentLiquidity(msg.sender);
        Pair memory pair = Pair({
            tokenA : pairs[key].tokenA,
            tokenB : pairs[key].tokenB,
            reserveA : pairs[key].reserveA,
            reserveB : pairs[key].reserveB,
            totalShares : totalShares,
            myShare : myShare,
            shareRreward : shareRreward,
            mining : pairs[key].baseToken != bytes32(0)
            });
        return pair;
    }

    function volumeDayOfPair(string memory tokenA, string memory tokenB, uint256 time) public view returns (uint256, uint256) {
        bytes32 key = hashKey(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        uint256 index = Constants.toUTC(time) / Constants.ONEDAY;
        return (wholeVolume.volumeOfDay(index), volumes[key].volumeOfDay(index));
    }

    function caleReward(bytes32 key, uint256 dayIndex, uint256 selfLiquidity, uint256 totalLiquidity) private view returns (uint256) {
        if (selfLiquidity == 0 || totalLiquidity == 0) {
            return 0;
        }

        uint256 totalVolume = wholeVolume.volumeOfDay(dayIndex);
        uint256 selfVolume = volumes[key].volumeOfDay(dayIndex);

        if (selfVolume == 0 || totalVolume == 0) {
            return 0;
        }

        uint256 value = output(dayIndex);
        value = value.sub(value / 10);

        return value.mul(selfVolume).mul(selfLiquidity).div(totalVolume).div(totalLiquidity);
    }

    function shareReward(bytes32 key) public view returns (uint256 reward) {
        uint256 lastIndex = lastIndexsMap[msg.sender][key];
        if (lastIndex == 0) {
            return 0;
        }

        uint256 _nowIndex = Constants.toUTC(now) / Constants.ONEDAY;
        if (lastIndex == _nowIndex) {
            return 0;
        }

        LiquidityList.List storage wholeLiquidityList = pairs[key].wholeLiquidity;
        LiquidityList.List storage selfLiquidityList = pairs[key].liquiditys[msg.sender];

        uint256 selfIndex = selfLiquidityList.lastIndex;
        uint256 wholeIndex = wholeLiquidityList.lastIndex;

        if (selfIndex == _nowIndex) {
            selfIndex = selfLiquidityList.list[selfIndex].prevIndex;
        }

        if (wholeIndex == _nowIndex) {
            wholeIndex = wholeLiquidityList.list[wholeIndex].prevIndex;
        }

        uint256 startIndex = _nowIndex - 1;
        while (true) {
            if (selfIndex == 0) {
                return reward;
            }

            Liquidity storage selfNode = selfLiquidityList.list[selfIndex];
            uint256 selfLiquidity = selfNode.nextValue;

            if (selfLiquidity != 0) {
                uint256 wholeLiquidity;
                Liquidity storage wholeNode = wholeLiquidityList.list[wholeIndex];
                for (uint256 i = startIndex; i > selfIndex; i--) {
                    if (i == wholeIndex) {
                        wholeLiquidity = wholeNode.value;
                        wholeIndex = wholeNode.prevIndex;
                        wholeNode = wholeLiquidityList.list[wholeIndex];
                    } else {
                        wholeLiquidity = wholeNode.nextValue;
                    }

                    reward = reward.add(caleReward(key, i, selfLiquidity, wholeLiquidity));

                    if (i == lastIndex) {
                        return reward;
                    }
                }
            } else {
                if (lastIndex > selfIndex) {
                    return reward;
                }
            }

            reward = reward.add(caleReward(key, selfIndex, selfNode.value, wholeLiquidityList.list[selfIndex].value));

            if (selfIndex == lastIndex) {
                return reward;
            }

            startIndex = selfIndex - 1;
            wholeIndex = wholeLiquidityList.list[selfIndex].prevIndex;
            selfIndex = selfNode.prevIndex;
        }
    }

    function output(uint256 index) public view returns (uint256) {
        if (startDay == 0) {
            return 0;
        }
        if (index < startDay) {
            return 0;
        }
        return Output.calc(index - startDay);
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

        list.clear();
        require(sero_send_token(msg.sender, strings._bytes32ToStr(token), value));
        return true;
    }

    function withdrawShareReward(bytes32 key) external {
        uint256 value = shareReward(key);
        lastIndexsMap[msg.sender][key] = Constants.toUTC(now) / Constants.ONEDAY;
        if (value > 0) {
            require(sero_send_token(msg.sender, Constants.CORAL, value));
        }
    }

    function investLiquidity(uint256 _minShares) external payable {
        require(startDay > 0);
        require(msg.value > 10000);
        bytes32 token = strings._stringToBytes32(sero_msg_currency());

        uint256 size = initValues[msg.sender].push(token, msg.value);
        if (size < 2) {
            return;
        }
        _investLiquidity(msg.sender, _minShares);
    }

    function _investLiquidity(address sender, uint256 _minShares) internal {

        InitValueList.List storage initValue = initValues[sender];
        bytes32 tokenA = initValue.tokens[0];
        bytes32 tokenB = initValue.tokens[1];

        bytes32 key = hashKey(tokenA, tokenB);

        if (pairs[key].tokenA == bytes32(0) && pairs[key].tokenB == bytes32(0)) {
            tokenIndexs[initValues[msg.sender].tokens[0]].push(key);
            tokenIndexs[initValues[msg.sender].tokens[1]].push(key);

            pairKeys.push(key);

            pairs[key] = ExchangePair.Pair({tokenA : tokenA, tokenB : tokenB, baseToken : bytes32(0),
                reserveA : 0, reserveB : 0,
                wholeLiquidity : LiquidityList.List({lastIndex : 0})});
        }

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

        if (lastIndexsMap[sender][key] == 0) {
            lastIndexsMap[sender][key] = Constants.toUTC(now) / Constants.ONEDAY;
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

    function estimateSwapBuy(bytes32 key, bytes32 tokenOut, uint256 amountOut) public view returns (uint256 amountIn){
        if (pairs[key].reserveA == 0 || pairs[key].reserveB == 0) {
            return 0;
        }

        uint256 feeRate = feeRateMap[key];
        if (feeRate == 0) {
            feeRate = 20;
        }

        ExchangePair.Pair storage pair = pairs[key];
        uint256 invariant = pair.reserveA.mul(pair.reserveB);

        if (pair.baseToken == bytes32(0)) {
            if (tokenOut == pair.tokenA) {
                if (amountOut >= pair.reserveA) {
                    return 0;
                }
                amountIn = invariant.div(pair.reserveA.sub(amountOut)).sub(pair.reserveB);
            } else {
                if (amountOut >= pair.reserveB) {
                    return 0;
                }
                amountIn = invariant.div(pair.reserveB.sub(amountOut)).sub(pair.reserveA);
            }
            amountIn = amountIn.mul(10000).div(10000 - feeRate);
        } else {
            if (pair.baseToken == tokenOut) {
                amountOut = amountOut.mul(10000).div(10000 - feeRate);
                if (tokenOut == pair.tokenA) {
                    if (amountOut >= pair.reserveA) {
                        return 0;
                    }
                    amountIn = invariant.div(pair.reserveA.sub(amountOut)).sub(pair.reserveB);
                } else {
                    if (amountOut >= pair.reserveB) {
                        return 0;
                    }
                    amountIn = invariant.div(pair.reserveB.sub(amountOut)).sub(pair.reserveA);
                }

            } else {
                if (tokenOut == pair.tokenA) {
                    if (amountOut >= pair.reserveA) {
                        return 0;
                    }
                    amountIn = invariant.div(pair.reserveA.sub(amountOut)).sub(pair.reserveB);
                } else {
                    if (amountOut >= pair.reserveB) {
                        return 0;
                    }
                    amountIn = invariant.div(pair.reserveB.sub(amountOut)).sub(pair.reserveA);
                }
                amountIn = amountIn.mul(10000).div(10000 - feeRate);
            }
        }
    }

    function swap(bytes32 key, uint256 _minTokensReceived, uint256 _timeout, address _recipient) public payable returns (uint256) {
        require(startDay > 0);
        require(pairs[key].reserveA != 0 && pairs[key].reserveB != 0, "exchange not initialized");
        require(address(tokenPool) != address(0));
        require(now < _timeout && msg.value > 0);

        if (_recipient == address(0)) {
            _recipient = msg.sender;
        }

        bytes32 _token = strings._stringToBytes32(sero_msg_currency());
        require(pairs[key].tokenA == _token || pairs[key].tokenB == _token);
        return _excuteSwap(key, _token, msg.value, _minTokensReceived, _recipient);
    }

    function _excuteSwap(bytes32 key, bytes32 _tokenIn, uint256 valueIn, uint256 _minTokensReceived, address _recipient) internal returns (uint256){
        (uint256 tokenOutValue, uint256 fee) = _swap(key, _tokenIn, valueIn, feeRateMap[key]);
        if (_recipient != address(0)) {
            require(_minTokensReceived <= tokenOutValue);
            if (_tokenIn == pairs[key].tokenA) {
                require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenB), tokenOutValue));
            } else {
                require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenA), tokenOutValue));
            }
        }

        if (fee > 0) {
            require(sero_send_token(address(tokenPool), "SERO", fee));
            fee = fee.mul(weightsMap[key]).div(100);

            wholeVolume.add(fee);
            volumes[key].add(fee);

            uint256 _now = Constants.toUTC(now);
            if (mintDayIndex != _now / Constants.ONEDAY) {
                mintDayIndex = _now / Constants.ONEDAY;
                uint256 value = output(mintDayIndex);

                require(tokenPool.transfer(address(this), value));
                require(sero_send_token(owner, Constants.CORAL, value / 10));
            }
        }
        return tokenOutValue;
    }

    function _swap(bytes32 key, bytes32 _token, uint256 _value, uint256 _feeRate) private returns (uint256, uint256) {
        (uint256 tokenOutValue, bytes32 tokenFee, uint256 fee) = pairs[key].swap(_token, _value, _feeRate);
        if (tokenFee == Constants.SEROBYTES || fee == 0) {
            return (tokenOutValue, fee);
        } else {
            bytes32 _key = hashKey(tokenFee, Constants.SEROBYTES);
            require(pairs[_key].reserveA != 0 && pairs[_key].reserveB != 0, "exchange not initialized");
            fee = _excuteSwap(_key, tokenFee, fee, 0, address(0));

            return (tokenOutValue, fee);
        }
    }

    function hashKey(bytes32 tokenA, bytes32 tokenB) public pure returns (bytes32) {
        require(tokenA != tokenB, 'same token');
        (bytes32 token0, bytes32 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return keccak256(abi.encode(token0, token1));
    }

    function hasPair(bytes32 _key) public view returns (bool) {
        return pairs[_key].tokenA != bytes32(0) && pairs[_key].tokenB != bytes32(0);
    }

}








