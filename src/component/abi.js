import serojs from "serojs";
import seropp from "sero-pp";
import BigNumber from 'bignumber.js'

import {Toast} from "antd-mobile";
import {bytes32ToToken, hashKey, tokenToBytes} from "./utils/common"
import {JsonRpc} from "./utils/jsonrpc";

const config = {
    name: "SWAP",
    contractAddress: "3bkm8Dgxf7iiVJtWAKJH8zUjKJHbjwtx5746Czpf7rVRsV3dUxYQiRLYDayHPjAV1Hn5GUAfhJ7jjoYuYgFNJtTD",
    github: "https://github.com/coswap",
    author: "coswap",
    url: document.location.href,
    logo: document.location.protocol + '//' + document.location.host + '/logo.png'
};

const abiJson = [{
    "inputs": [{"internalType": "address", "name": "_tokenPool", "type": "address"}],
    "stateMutability": "payable",
    "type": "constructor"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
    }, {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "OwnershipTransferred",
    "type": "event"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}, {
        "internalType": "uint256",
        "name": "_sharesBurned",
        "type": "uint256"
    }, {"internalType": "uint256", "name": "_minTokenA", "type": "uint256"}, {
        "internalType": "uint256",
        "name": "_minTokenB",
        "type": "uint256"
    }], "name": "divestLiquidity", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "drawRateMap",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}, {
        "internalType": "bytes32",
        "name": "tokenIn",
        "type": "bytes32"
    }, {"internalType": "uint256", "name": "amountIn", "type": "uint256"}],
    "name": "estimateSwap",
    "outputs": [{"internalType": "uint256", "name": "value", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "feeRateMap",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32[]", "name": "tokens", "type": "bytes32[]"}],
    "name": "getGroupTokens",
    "outputs": [{"internalType": "bytes32[][]", "name": "rets", "type": "bytes32[][]"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "token", "type": "bytes32"}],
    "name": "getTokens",
    "outputs": [{"internalType": "bytes32[]", "name": "rets", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "initializePair",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_minShares", "type": "uint256"}],
    "name": "investLiquidity",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "lastIndexsMap",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}],
    "name": "orderIds",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}],
    "name": "orderList",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "amountIn",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
        }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
        "internalType": "struct SwapExchange.Order[]",
        "name": "",
        "type": "tuple[]"
    }, {
        "components": [{"internalType": "uint256", "name": "amountIn", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "amountOut",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}, {
            "internalType": "uint8",
            "name": "orderType",
            "type": "uint8"
        }], "internalType": "struct SwapExchange.Order[]", "name": "", "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_startDay", "type": "uint256"}],
    "name": "output",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}], "name": "pairInfo", "outputs": [{
        "components": [{"internalType": "bytes32", "name": "tokenA", "type": "bytes32"}, {
            "internalType": "bytes32",
            "name": "tokenB",
            "type": "bytes32"
        }, {"internalType": "uint256", "name": "reserveA", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reserveB",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "totalShares", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "myShare",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "shareRreward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "totalVolume",
            "type": "uint256"
        }, {
            "internalType": "uint256",
            "name": "selfVolume",
            "type": "uint256"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "orderList",
            "type": "tuple[]"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "myOrderList",
            "type": "tuple[]"
        }], "internalType": "struct SwapExchange.Pair", "name": "", "type": "tuple"
    }], "stateMutability": "view", "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}],
    "name": "pairInfoWithOrders",
    "outputs": [{
        "components": [{"internalType": "bytes32", "name": "tokenA", "type": "bytes32"}, {
            "internalType": "bytes32",
            "name": "tokenB",
            "type": "bytes32"
        }, {"internalType": "uint256", "name": "reserveA", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reserveB",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "totalShares", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "myShare",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "shareRreward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "totalVolume",
            "type": "uint256"
        }, {
            "internalType": "uint256",
            "name": "selfVolume",
            "type": "uint256"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "orderList",
            "type": "tuple[]"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "myOrderList",
            "type": "tuple[]"
        }], "internalType": "struct SwapExchange.Pair", "name": "", "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "pairKeys",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_start", "type": "uint256"}, {
        "internalType": "uint256",
        "name": "_end",
        "type": "uint256"
    }], "name": "pairList", "outputs": [{
        "components": [{"internalType": "bytes32", "name": "tokenA", "type": "bytes32"}, {
            "internalType": "bytes32",
            "name": "tokenB",
            "type": "bytes32"
        }, {"internalType": "uint256", "name": "reserveA", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reserveB",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "totalShares", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "myShare",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "shareRreward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "totalVolume",
            "type": "uint256"
        }, {
            "internalType": "uint256",
            "name": "selfVolume",
            "type": "uint256"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "orderList",
            "type": "tuple[]"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "myOrderList",
            "type": "tuple[]"
        }], "internalType": "struct SwapExchange.Pair[]", "name": "rets", "type": "tuple[]"
    }], "stateMutability": "view", "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "token", "type": "bytes32"}, {
        "internalType": "uint256",
        "name": "_start",
        "type": "uint256"
    }, {"internalType": "uint256", "name": "_end", "type": "uint256"}], "name": "pairListByToken", "outputs": [{
        "components": [{"internalType": "bytes32", "name": "tokenA", "type": "bytes32"}, {
            "internalType": "bytes32",
            "name": "tokenB",
            "type": "bytes32"
        }, {"internalType": "uint256", "name": "reserveA", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reserveB",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "totalShares", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "myShare",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "shareRreward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "totalVolume",
            "type": "uint256"
        }, {
            "internalType": "uint256",
            "name": "selfVolume",
            "type": "uint256"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "orderList",
            "type": "tuple[]"
        }, {
            "components": [{
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "amountOut", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint8", "name": "orderType", "type": "uint8"}],
            "internalType": "struct SwapExchange.Order[]",
            "name": "myOrderList",
            "type": "tuple[]"
        }], "internalType": "struct SwapExchange.Pair[]", "name": "rets", "type": "tuple[]"
    }], "stateMutability": "view", "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}, {
        "internalType": "uint256",
        "name": "_drawRate",
        "type": "uint256"
    }], "name": "setDrawRate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}, {
        "internalType": "uint256",
        "name": "_feeRate",
        "type": "uint256"
    }], "name": "setFeeRate", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_start", "type": "uint256"}, {
        "internalType": "uint256[]",
        "name": "_outputs",
        "type": "uint256[]"
    }], "name": "setOutputs", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "_tokenPool", "type": "address"}],
    "name": "setTokenPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [],
    "name": "start",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}, {
        "internalType": "uint256",
        "name": "_minTokensReceived",
        "type": "uint256"
    }, {"internalType": "uint256", "name": "_timeout", "type": "uint256"}, {
        "internalType": "address",
        "name": "_recipient",
        "type": "address"
    }], "name": "swap", "outputs": [], "stateMutability": "payable", "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "name": "volumes",
    "outputs": [{"internalType": "uint256", "name": "lastIndex", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "wholeVolume",
    "outputs": [{"internalType": "uint256", "name": "lastIndex", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "key", "type": "bytes32"}],
    "name": "withdrawShareReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}];

const contract = serojs.callContract(abiJson, "3bkm8Dgxf7iiVJtWAKJH8zUjKJHbjwtx5746Czpf7rVRsV3dUxYQiRLYDayHPjAV1Hn5GUAfhJ7jjoYuYgFNJtTD");

const poolContract = serojs.callContract([{
        "constant": true,
        "inputs": [{"name": "amount", "type": "uint256"}],
        "name": "showExchange",
        "outputs": [{"name": "tokenList", "type": "bytes32[]"}, {"name": "amounts", "type": "uint256[]"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": true,
        "inputs": [],
        "name": "info",
        "outputs": [{"name": "", "type": "uint256"}, {"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }, {
        "constant": false,
        "inputs": [],
        "name": "exchange",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    }],
    "5H6Bu5S5yjM8mirj7XN75WXskSbZGKHVgj2ERoU3NXcBZUJpMPWCh1i2Yur8sGweVdBjEsuKLQ2JKLPamJKeQrQS");

const rpc = new JsonRpc();

class Abi {
    constructor() {
        let self = this;
        self.init = new Promise(
            (resolve, reject) => {
                seropp.init(config, function (rest) {
                    if (rest === 'success') {
                        return resolve()
                    } else {
                        return reject(rest)
                    }
                })
            }
        )
    }

    getDecimalLocal(token) {
        if (token == "SERO") {
            return 18;
        } else {
            return localStorage.getItem("D_" + token);
        }
    }

    getDecimal(token, callback) {
        let decimalLocal = this.getDecimalLocal(token);
        if (decimalLocal) {
            return callback(decimalLocal)
        } else {
            seropp.getInfo(function (info) {
                rpc.seroRpc(info.rpc, "sero_getDecimal", [token], function (rets) {
                    localStorage.setItem("D_" + token, new BigNumber(rets.result, 16).toNumber());
                    callback(new BigNumber(rets.result, 16).toNumber());
                });
            });
        }
    }

    accountDetails(pk, callback) {
        if (!pk) {
            return;
        }
        let self = this;
        seropp.getAccountDetail(pk, function (item) {
            let balances = new Map();
            if (item.Balance) {
                item.Balance.forEach((value, key) => {
                    balances.set(key, value);
                })
            }
            callback({pk: item.PK, mainPKr: item.MainPKr, name: item.Name, balances: balances})
        });
    }

    accountList(callback) {
        seropp.getAccountList(function (data) {
            let accounts = [];
            data.forEach(function (item, index) {
                let balances = new Map();
                if (item.Balance) {
                    item.Balance.forEach((value, key) => {
                        balances.set(key, value);
                    })
                }

                accounts.push({
                    pk: item.PK,
                    mainPKr: item.MainPKr,
                    name: item.Name,
                    balances: balances,
                })
            });
            callback(accounts)
        });
    }

    callMethod(contract, _method, from, _args, callback) {
        let that = this;
        let packData = contract.packData(_method, _args, true);
        let callParams = {
            from: from,
            to: contract.address,
            data: packData
        };

        seropp.call(callParams, function (callData) {
            if (callData !== "0x") {
                let res = contract.unPackDataEx(_method, callData);
                if (callback) {
                    callback(res);
                }
            } else {
                callback("0x0");
            }
        });
    }

    executeMethod(contract, _method, pk, mainPKr, args, tokenName, value, callback) {
        let packData = "0x";
        if ("" !== _method) {
            packData = contract.packData(_method, args, true);
        }

        let executeData = {
            from: pk,
            to: contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: tokenName,
        };
        let estimateParam = {
            from: mainPKr,
            to: contract.address,
            value: "0x" + value.toString(16),
            data: packData,
            gasPrice: "0x" + new BigNumber("1000000000").toString(16),
            cy: tokenName,
        };

        seropp.estimateGas(estimateParam, function (gas, error) {
            if (error) {
                Toast.fail("Failed to execute smart contract")
            } else {
                executeData["gas"] = gas;
                seropp.executeContract(executeData, function (res, error) {
                    if (callback) {
                        callback(res, error)
                    }
                })
            }
        });
    }


    estimateSwap(from, tokenA, tokenB, tokenIn, amountIn, callback) {
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'estimateSwap', from, [key, tokenIn, amountIn], function (ret) {
            callback(ret[0]);
        });
    }

    getGroupTokens(from, tokens, callback) {
        let tokenBytes = [];
        tokens.forEach(each => {
            tokenBytes.push(tokenToBytes(each));
        });
        this.callMethod(contract, 'getGroupTokens', from, [tokenBytes],function (ret) {
            let _tokens = [];
            let _tokensList = new Map();
            ret[0].forEach((each, index) => {
                if (each.length > 0) {
                    _tokens.push(tokens[index]);
                    let list = [];
                    each.forEach(item => {
                        list.push(bytes32ToToken(item));
                    })
                    _tokensList.set(tokens[index], list);
                }
            });
            callback(_tokens, _tokensList);
        });
    }

    getTokens(from, token, callback) {
        this.callMethod(contract, 'getTokens', from, [tokenToBytes(token)], function (ret) {
            callback(ret.rets);
        });
    }
    convertToPair(pair){
        console.log(pair,"pair");
        return {
            tokenA: bytes32ToToken(pair.tokenA),
            tokenB: bytes32ToToken(pair.tokenB),
            reserveA: pair.reserveA,
            reserveB: pair.reserveB,
            totalShares: pair.totalShares,
            myShare: pair.myShare,
            shareRreward: pair.shareRreward,
            totalVolume: pair.totalVolume,
            selfVolume: pair.selfVolume,
            orders: pair.orderList,
            selfOrders: pair.myOrderList
        }
    }

    orderList(from, tokenA, tokenB, callback) {
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'orderList', from, [key], function (ret) {
            callback(ret);
        });
    }

    pairList(from, token, callback) {
        let self = this;
        if (token) {
            this.callMethod(contract, 'pairListByToken', from, [tokenToBytes(token), 0, 1000], function (ret) {
                let pairs = [];
                ret.rets.forEach((pair) => {
                    pairs.push(self.convertToPair(pair));
                })
                callback(pairs);
            });
        } else {
            this.callMethod(contract, 'pairList', from, [0, 1000], function (ret) {

                let pairs = [];
                ret.rets.forEach((pair) => {
                    pairs.push(self.convertToPair(pair));
                })
                callback(pairs);
            });
        }
    }

    pairInfoWithOrders(from, tokenA, tokenB, callback) {
        let self = this;
        let key = hashKey(tokenA, tokenB);

        this.callMethod(contract, 'pairInfoWithOrders', from, [key], function (ret) {
            let pair = ret[0];

            self.orderList(from, tokenA, tokenB, function (ret) {

            })
            callback(self.convertToPair(pair));
        });
    }

    initializePair(pk, mainPKr, currency, value, callback) {
        this.executeMethod(contract, 'initializePair', pk, mainPKr, [], currency, value, callback);
    }

    investLiquidity(pk, mainPKr, minShares, currency, value, callback) {
        this.executeMethod(contract, 'investLiquidity', pk, mainPKr, [minShares], currency, value, callback);
    }

    divestLiquidity(pk, mainPKr, tokenA, tokenB, sharesBurned, minTokenA, minTokenB, callback) {
        let key = hashKey(tokenA, tokenB);
        this.executeMethod(contract, 'divestLiquidity', pk, mainPKr, [key, sharesBurned, minTokenA, minTokenB], "", 0, callback);
    }

    swap(pk, mainPKr, tokenA, tokenB, amount, minTokensReceived, callback) {
        let key = hashKey(tokenA, tokenB);
        let timeOut = Math.round(new Date() / 1000) + 600;
        this.executeMethod(contract, 'swap', pk, mainPKr, [key, 0, timeOut, mainPKr], tokenA, amount, callback);
    }

    withdrawShareReward(pk, mainPKr, tokenA, tokenB, callback) {
        let key = hashKey(tokenA, tokenB);
        this.executeMethod(contract, 'withdrawShareReward', pk, mainPKr, [key], "", 0, callback);
    }


    poolInfo(from, callback) {
        this.callMethod(poolContract, 'info', from, [], function (ret) {
            callback(ret[0], ret[1]);
        });
    }

    showExchange(from, amount, callback) {
        this.callMethod(poolContract, 'showExchange', from, [amount], function (ret) {
            let tokens = [];
            ret[0].forEach(each => {
                tokens.push(bytes32ToToken(each));
            });
            let amounts = [];
            ret[1].forEach(each => {
                amounts.push(each);
            })
            callback(tokens, amounts);
        });
    }

    exchange(pk, mainPKr, amount, callback) {
        this.executeMethod(contract, 'exchange', pk, mainPKr, [], "FHJG", amount, callback);
    }
}

const abi = new Abi();
export default abi;