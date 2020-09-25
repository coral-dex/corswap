pragma solidity ^0.4.25;

import "./strings.sol";
import "./math.sol";

contract SeroInterface {

    bytes32 private topic_sero_issueToken = 0x3be6bf24d822bcd6f6348f6f5a5c2d3108f04991ee63e80cde49a8c4746a0ef3;
    bytes32 private topic_sero_balanceOf = 0xcf19eb4256453a4e30b6a06d651f1970c223fb6bd1826a28ed861f0e602db9b8;
    bytes32 private topic_sero_send = 0x868bd6629e7c2e3d2ccf7b9968fad79b448e7a2bfb3ee20ed1acbc695c3c8b23;
    bytes32 private topic_sero_currency = 0x7c98e64bd943448b4e24ef8c2cdec7b8b1275970cfe10daf2a9bfa4b04dce905;
    bytes32 private topic_sero_setCallValues = 0xa6cafc6282f61eff9032603a017e652f68410d3d3c69f0a3eeca8f181aec1d17;

    function sero_setCallValues(string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal {
        bytes memory temp = new bytes(0x80);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _amount)
            mstore(add(temp, 0x40), _category)
            mstore(add(temp, 0x60), _ticket)
            log1(temp, 0x80, sload(topic_sero_setCallValues_slot))
        }
        return;
    }

    function sero_balanceOf(string memory _currency) internal view returns (uint256 amount){
        bytes memory temp = new bytes(32);
        assembly {
            mstore(temp, _currency)
            log1(temp, 0x20, sload(topic_sero_balanceOf_slot))
            amount := mload(temp)
        }
    }


    function sero_msg_currency() internal returns (string memory) {
        bytes memory tmp = new bytes(32);
        bytes32 b32;
        assembly {
            log1(tmp, 0x20, sload(topic_sero_currency_slot))
            b32 := mload(tmp)
        }
        return strings.bytes32ToString(b32);
    }

    function sero_issueToken(uint256 _total, string memory _currency) internal returns (bool success){
        bytes memory temp = new bytes(64);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _total)
            log1(temp, 0x40, sload(topic_sero_issueToken_slot))
            success := mload(add(temp, 0x20))
        }
    }

    function sero_send_token(address _receiver, string memory _currency, uint256 _amount) internal returns (bool success){
        return sero_send(_receiver, _currency, _amount, "", 0);
    }

    function sero_send(address _receiver, string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal returns (bool success){
        bytes memory temp = new bytes(160);
        assembly {
            mstore(temp, _receiver)
            mstore(add(temp, 0x20), _currency)
            mstore(add(temp, 0x40), _amount)
            mstore(add(temp, 0x60), _category)
            mstore(add(temp, 0x80), _ticket)
            log1(temp, 0xa0, sload(topic_sero_send_slot))
            success := mload(add(temp, 0x80))
        }
    }
}

contract Ownable {
    address public owner;
    address public operator;


    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() public {
        owner = msg.sender;
        operator = msg.sender;
    }


    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner);
        _;
    }


    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setOperator(address newOperator) public onlyOperator {
        require(newOperator != address(0));
        operator = newOperator;
    }

}

contract CoralToken is SeroInterface, Ownable{
    using SafeMath for uint256;

    string private _name;
    uint8 private _decimals;
    uint256 private _totalSupply;

    address public swapAddress;

    bytes32[] private tokens;
    mapping(bytes32=>bool) private hasTokens;

    address public blackhole;

    constructor(address _blackhole, uint256 initialSupply, string memory tokenName, uint8 decimals) public payable{
        createToken(initialSupply, tokenName, decimals);
        blackhole = _blackhole;
    }

    function createToken(uint256 initialSupply, string memory tokenName, uint8 decimals) internal{
        _totalSupply = initialSupply * 10 ** uint256(decimals);
        require(sero_issueToken(_totalSupply, tokenName));
        require(sero_send_token(owner,tokenName, _totalSupply));

        _name = tokenName;
        _decimals = decimals;
    }

    function() external payable {}

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory){
        return _name;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function getBalance() public view returns(bytes32[] tokenList, uint256[] balances) {
        balances = new uint256[](tokens.length);
        tokenList = new bytes32[](tokens.length);
        for(uint256 i=0;i< tokens.length;i++) {
            tokenList[i] = tokens[i];
            balances[i] = sero_balanceOf(strings.bytes32ToString(tokens[i]));
        }
    }

    function setSwapAddress(address _swapAddr) public onlyOperator {
        swapAddress = _swapAddr;
    }

    function addToken(string memory token) public onlyOperator {
        bytes32 tokenBytes = strings._stringToBytes(token);
        require(!hasTokens[tokenBytes]);
        hasTokens[tokenBytes] = true;
        tokens.push(tokenBytes);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(msg.sender == swapAddress);

        _totalSupply = _totalSupply.add(_value);
        require(sero_issueToken(_value, _name));
        return sero_send(_to, _name, _value, '', '');
    }

    function exchange(address _to) public payable returns(bool) {
        require(_totalSupply > 0);
        require(tokens.length > 0);
        string memory _currency = sero_msg_currency();
        require(strings._stringEq(_currency, _name));

        if(_to==address(0)) {
            _to = msg.sender;
        }

        uint256 _burnedValue = msg.value;
        burn(_burnedValue);
        for(uint256 i=0;i< tokens.length;i++) {
            _send(_to, strings.bytes32ToString(tokens[i]), _burnedValue);
        }

        _totalSupply = _totalSupply.sub(_burnedValue);
        return true;
    }

    function _send(address _to, string memory token, uint256 burnedValue) private {
        uint256 balance = sero_balanceOf(token);
        if(balance > 0) {
            require(sero_send_token(_to, token, balance.mul(burnedValue).div(_totalSupply)));
        }
    }

    function burn(uint256 _burnedValue) internal  {
        require(sero_send_token(blackhole, _name ,_burnedValue));
    }


    function showExchange(uint256 amount) public view returns(bytes32[] memory tokenList, uint256[] memory amounts) {
        if(_totalSupply == 0) {
            return;
        }
        amounts = new uint256[](tokens.length);
        tokenList = new bytes32[](tokens.length);
        for(uint256 i=0;i< tokens.length;i++) {
            tokenList[i] = tokens[i];
            uint256 balance = sero_balanceOf(strings.bytes32ToString(tokens[i]));
            if(balance > 0) {
                amounts[i] = balance.mul(amount).div(_totalSupply);
            }
        }
        return (tokens, amounts);
    }
}


