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

    mapping(address => InitValueList.List) private initValues;

    mapping(bytes32 => ExchangePair.Pair) private pairs;
    bytes32[] public pairKeys;
    mapping(bytes32 => bytes32[]) private tokenIndexs;

    VolumeList.List private wholeVolume;
    mapping(bytes32 => VolumeList.List) private volumes;
    mapping(address => mapping(bytes32 => uint256)) public lastIndexsMap;

    TokenPool private tokenPool;
    mapping(bytes32 => uint256) public feeRateMap;
    mapping(bytes32 => uint256) public rateMap;

    uint256 public startDay;
    uint256[7000] public outputs;
    uint256 public mintDayIndex;

    //test
    uint256 public lastFee;
    uint256 public lastSupply;

    constructor(address _tokenPool) public payable {
        tokenPool = TokenPool(_tokenPool);
    }

    receive() external payable {
    }

    function start() public onlyOwner {
        require(startDay == 0);
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

    function setFeeRate(string memory tokenA, string memory tokenB, uint256 _feeRate, uint256 _rate) public onlyOwner {
        require(_feeRate < 10000);
        bytes32 _tokenA = strings._stringToBytes32(tokenA);
        bytes32 _tokenB = strings._stringToBytes32(tokenB);
        bytes32 key = hashKey(_tokenA, _tokenB);

        require(pairs[key].reserveA != 0 && pairs[key].reserveB != 0, "exchange not initialized");

        if (pairs[key].tokenA != Constants.SEROBYTES && pairs[key].tokenB != Constants.SEROBYTES) {
            bytes32 _key = hashKey(pairs[key].tokenB, Constants.SEROBYTES);
            require(pairs[_key].reserveA != 0 && pairs[_key].reserveB != 0);
        }

        feeRateMap[key] = _feeRate;
        rateMap[key] = _rate;
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
            myOrderList : new Order[](0),
            mining : feeRateMap[key] > 0
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
            myOrderList : _userOrderList,
            mining : feeRateMap[key] > 0
            });
        return pair;
    }

    function nowDays() public view returns (uint256) {
        return now / Constants.ONEDAY;
    }

    function volumesOfPair(string memory tokenA, string memory tokenB) public view returns (Volume[] memory, Volume[] memory) {
        bytes32 key = hashKey(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        return (wholeVolume.listVolume(), volumes[key].listVolume());
    }

    function liquidityOfPair(string memory tokenA, string memory tokenB) public view returns (Liquidity[] memory, Liquidity[] memory) {
        bytes32 key = hashKey(strings._stringToBytes32(tokenA), strings._stringToBytes32(tokenB));
        return pairs[key].liquidityList(msg.sender);
    }

    function shareReward(bytes32 key) public view returns (uint256 reward) {
        uint256 lastIndex = lastIndexsMap[msg.sender][key];
        if (lastIndex == 0) {
            lastIndex = startDay;
        }

        uint256 selfVolume;
        uint256 totalVolume;
        uint256 selfLiquidity;
        uint256 totalLiquidity;
        uint256 value;

        for (uint256 i = lastIndex; i < (now / Constants.ONEDAY); i++) {

            (selfLiquidity, totalLiquidity) = pairs[key].liquidity(msg.sender, i);

            if (selfLiquidity == 0 || totalLiquidity == 0) {
                continue;
            }

            totalVolume = wholeVolume.volumeOfDay(i);
            selfVolume = volumes[key].volumeOfDay(i);

            if (selfVolume == 0 || totalVolume == 0) {
                continue;
            }

            value = output(i);
            value = value.sub(value / 10);

            reward = reward.add(value.mul(selfVolume).mul(selfLiquidity).div(totalVolume).div(totalLiquidity));
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
        lastIndexsMap[msg.sender][key] = now / Constants.ONEDAY;
        require(sero_send_token(msg.sender, Constants.CORAL, value));
    }

    function investLiquidity(uint256 _minShares) external payable {
        require(startDay > 0);
        require(msg.value > 0);
        bytes32 token = strings._stringToBytes32(sero_msg_currency());

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

        bytes32 key = hashKey(tokenA, tokenB);

        if (pairs[key].tokenA == bytes32(0) && pairs[key].tokenB == bytes32(0)) {
            tokenIndexs[initValues[msg.sender].tokens[0]].push(key);
            tokenIndexs[initValues[msg.sender].tokens[1]].push(key);

            pairKeys.push(key);

            pairs[key] = ExchangePair.Pair({seq : 0, tokenA : tokenA, tokenB : tokenB,
                reserveA : 0, reserveB : 0,
                totalShares : 0,
                wholeLiquidity : LiquidityList.List({lastIndex : 0}),
                orderlist : CycleList.List()});
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
            lastIndexsMap[sender][key] = now / Constants.ONEDAY;
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

    function mint() internal {
        require(mintDayIndex < now / Constants.ONEDAY);
        mintDayIndex = now / Constants.ONEDAY;
        uint256 value = output(mintDayIndex);

        require(tokenPool.transfer(address(this), value));
        require(sero_send_token(owner, Constants.CORAL, value / 10));
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

    function _excuteSwap(address sender, bytes32 key, bytes32 _token, uint256 value, uint256 _minTokensReceived, address _recipient) internal returns (uint256){
        (uint256 tokenOutValue, uint256 fee) = _swap(sender, key, _token, value, feeRateMap[key]);
        if (_recipient != address(0)) {
            require(_minTokensReceived <= tokenOutValue);
            if (_token == pairs[key].tokenA) {
                require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenB), tokenOutValue));
            } else {
                require(sero_send_token(_recipient, strings._bytes32ToStr(pairs[key].tokenA), tokenOutValue));
            }
        }

        lastFee = fee;
        if (fee > 0) {
            require(sero_send_token(address(tokenPool), "SERO", fee));
            if (rateMap[key] != 0) {
                fee = fee.mul(rateMap[key]).div(100);
                wholeVolume.add(fee);
                volumes[key].add(fee);
            } else {
                wholeVolume.add(fee);
                volumes[key].add(fee);
            }

            if (mintDayIndex != now / Constants.ONEDAY) {
                mint();
            }
        }
        return tokenOutValue;
    }

    function _swap(address sender, bytes32 key, bytes32 _token, uint256 _value, uint256 _feeRate) private returns (uint256, uint256) {
        (uint256 tokenOutValue, bytes32 tokenFee, uint256 fee) = pairs[key].swap(sender, _token, _value, _feeRate);
        if (tokenFee == Constants.SEROBYTES || fee == 0) {
            return (tokenOutValue, fee);
        } else {
            bytes32 _key = hashKey(tokenFee, Constants.SEROBYTES);
            require(pairs[_key].reserveA != 0 && pairs[_key].reserveB != 0, "exchange not initialized");
            fee = _excuteSwap(address(0), _key, tokenFee, fee, 0, address(0));

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









