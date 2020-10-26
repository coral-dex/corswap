import serojs from "serojs";
import seropp from "sero-pp";
import BigNumber from 'bignumber.js'

import {Toast} from "antd-mobile";
import {bytes32ToToken, hashKey, tokenToBytes} from "./utils/common"
import {JsonRpc} from "./utils/jsonrpc";
import i18n from "../i18n";
import {sortToken} from './utils/common'

const config = {
    name: "Coral Swap",
    contractAddress: "5bYB1DSe18ad7oFiJSnt861ett8fT5GFSva3BBrdYvyU8SK6CJoyDrMyijZWiGmkT1ZDaQt2AMZr5yxu23n62YnQ",
    github: "https://github.com/coswap",
    author: "coswap",
    url: window.location.origin+window.location.pathname,
    logo: window.location.origin+window.location.pathname+ '/logo.png',
    barColor:"#00456e",
    navColor:"#00456e",
    barMode:"dark",
    navMode:"light"
};


const abiJson = [{"inputs":[{"internalType":"address","name":"_tokenPool","type":"address"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"cancelInvest","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"uint256","name":"_sharesBurned","type":"uint256"},{"internalType":"uint256","name":"_minTokenA","type":"uint256"},{"internalType":"uint256","name":"_minTokenB","type":"uint256"}],"name":"divestLiquidity","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"bytes32","name":"tokenIn","type":"bytes32"},{"internalType":"uint256","name":"amountIn","type":"uint256"}],"name":"estimateSwap","outputs":[{"internalType":"uint256","name":"value","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"bytes32","name":"tokenOut","type":"bytes32"},{"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"estimateSwapBuy","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"feeRateMap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"tokens","type":"bytes32[]"}],"name":"getGroupTokens","outputs":[{"internalType":"bytes32[][]","name":"rets","type":"bytes32[][]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"token","type":"bytes32"}],"name":"getTokens","outputs":[{"internalType":"bytes32[]","name":"rets","type":"bytes32[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_key","type":"bytes32"}],"name":"hasPair","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"tokenA","type":"bytes32"},{"internalType":"bytes32","name":"tokenB","type":"bytes32"}],"name":"hashKey","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"investAmount","outputs":[{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"value","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_minShares","type":"uint256"}],"name":"investLiquidity","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"lastIndexsMap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tokenA","type":"string"},{"internalType":"string","name":"tokenB","type":"string"}],"name":"liquidityOfPair","outputs":[{"components":[{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"nextValue","type":"uint256"},{"internalType":"uint256","name":"nextIndex","type":"uint256"},{"internalType":"uint256","name":"prevIndex","type":"uint256"},{"internalType":"bool","name":"flag","type":"bool"}],"internalType":"struct Liquidity[]","name":"","type":"tuple[]"},{"components":[{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"nextValue","type":"uint256"},{"internalType":"uint256","name":"nextIndex","type":"uint256"},{"internalType":"uint256","name":"prevIndex","type":"uint256"},{"internalType":"bool","name":"flag","type":"bool"}],"internalType":"struct Liquidity[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mintDayIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"output","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"}],"name":"pairInfo","outputs":[{"components":[{"internalType":"bytes32","name":"tokenA","type":"bytes32"},{"internalType":"bytes32","name":"tokenB","type":"bytes32"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"myShare","type":"uint256"},{"internalType":"uint256","name":"shareRreward","type":"uint256"},{"internalType":"bool","name":"mining","type":"bool"}],"internalType":"struct Pair","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"pairKeys","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_start","type":"uint256"},{"internalType":"uint256","name":"_end","type":"uint256"}],"name":"pairList","outputs":[{"components":[{"internalType":"bytes32","name":"tokenA","type":"bytes32"},{"internalType":"bytes32","name":"tokenB","type":"bytes32"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"myShare","type":"uint256"},{"internalType":"uint256","name":"shareRreward","type":"uint256"},{"internalType":"bool","name":"mining","type":"bool"}],"internalType":"struct Pair[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"token","type":"bytes32"},{"internalType":"uint256","name":"_start","type":"uint256"},{"internalType":"uint256","name":"_end","type":"uint256"}],"name":"pairListByToken","outputs":[{"components":[{"internalType":"bytes32","name":"tokenA","type":"bytes32"},{"internalType":"bytes32","name":"tokenB","type":"bytes32"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"myShare","type":"uint256"},{"internalType":"uint256","name":"shareRreward","type":"uint256"},{"internalType":"bool","name":"mining","type":"bool"}],"internalType":"struct Pair[]","name":"rets","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"rateMap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tokenA","type":"string"},{"internalType":"string","name":"tokenB","type":"string"},{"internalType":"uint256","name":"_feeRate","type":"uint256"}],"name":"setFeeRate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"tokenA","type":"string"},{"internalType":"string","name":"tokenB","type":"string"},{"internalType":"string","name":"_baseToken","type":"string"},{"internalType":"uint256","name":"_rate","type":"uint256"}],"name":"setTokenBase","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"}],"name":"shareReward","outputs":[{"internalType":"uint256","name":"reward","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"start","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"startDay","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"},{"internalType":"uint256","name":"_minTokensReceived","type":"uint256"},{"internalType":"uint256","name":"_timeout","type":"uint256"},{"internalType":"address","name":"_recipient","type":"address"}],"name":"swap","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"tokenA","type":"string"},{"internalType":"string","name":"tokenB","type":"string"},{"internalType":"uint256","name":"time","type":"uint256"}],"name":"volumeDayOfPair","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"tokenA","type":"string"},{"internalType":"string","name":"tokenB","type":"string"}],"name":"volumesOfPair","outputs":[{"components":[{"internalType":"uint256","name":"index","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"internalType":"struct Volume[]","name":"","type":"tuple[]"},{"components":[{"internalType":"uint256","name":"index","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"internalType":"struct Volume[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"key","type":"bytes32"}],"name":"withdrawShareReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];

const contract = serojs.callContract(abiJson, "5bYB1DSe18ad7oFiJSnt861ett8fT5GFSva3BBrdYvyU8SK6CJoyDrMyijZWiGmkT1ZDaQt2AMZr5yxu23n62YnQ");

const poolContract = serojs.callContract([{"constant":true,"inputs":[],"name":"getBalance","outputs":[{"name":"tokenList","type":"bytes32[]"},{"name":"balances","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"amount","type":"uint256"}],"name":"showExchange","outputs":[{"name":"tokenList","type":"bytes32[]"},{"name":"amounts","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"}],"name":"exchange","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"}],
    "eX4rXhV94QMsMftenDiiJQCKckHvpvoLA8MoRtFXhmeMaLRb7ggM1UjG49BLviKHU1mjnTjQgJTLLc2dQQuiY1J");

const rpc = new JsonRpc();

class Abi {

    coral = "CORAL"

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
                this.getPopupInfo();
            }
        )
    }

    getDecimalLocal(token) { //SERO PFIDKEY GAIL 
        if (token == "SERO" || token == "SUSD") {
            return 18;
        } else {
            return localStorage.getItem("D_" + token);
        }
    }

    getDecimal(token, callback) {
        let decimalLocal = this.getDecimalLocal(token);
        if (decimalLocal) {
            if(callback){
                return callback(decimalLocal)
            }
        } else {
            seropp.getInfo(function (info) {
                rpc.seroRpc(info.rpc, "sero_getDecimal", [token], function (rets) {
                    localStorage.setItem("D_" + token, new BigNumber(rets.result, 16).toNumber());
                    if(callback){
                        callback(new BigNumber(rets.result, 16).toNumber());
                    }
                });
            });
        }
    }
    
    getPopupInfo(){
        seropp.getInfo(function (info) {
            localStorage.setItem("language",info.language)
            i18n.changeLanguage(info.language).catch()
        });
    }

    async getTransactionReceipt(txHash){
        return new Promise((resolve,reject)=>{
            seropp.getInfo(function (info) {
                // console.log(info,"getinfo");
                rpc.seroRpc(info.rpc, "sero_getTransactionReceipt", [txHash], function (rest) {
                    resolve(rest)
                });
            });
        })


    }

    async getDecimalAsync(token) {
        return new Promise((resolve)=>{
            let decimalLocal = this.getDecimalLocal(token);
            if (decimalLocal) {
                return resolve(parseInt(decimalLocal))
            } else {
                seropp.getInfo(function (info) {
                    // console.log(info,"getinfo");
                    rpc.seroRpc(info.rpc, "sero_getDecimal", [token], function (rets) {
                        localStorage.setItem("D_" + token, new BigNumber(rets.result, 16).toNumber());
                        resolve(new BigNumber(rets.result, 16).toNumber());
                    });
                });
            }
        })
    }

    accountDetails(pk, callback) {
        // console.log(callback,"callback");
        if (!pk) {
            return;
        }
        let self = this;
        seropp.getAccountDetail(pk, function (item) {
            // console.log(item,"itemss");
            let balances = new Map();
            if (item.Balance) {
                const balance = item.Balance
                if(balance && !(balance instanceof Map)){
                    const keys = Object.keys(balance);
                    const tmp = new Map();
                    for(let key of keys){
                        tmp.set(key,balance[key])
                    }
                    balances = tmp;
                }else{
                    item.Balance.forEach((value, key) => {
                        balances.set(key, value);
                    })
                }
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
                    const balance = item.Balance
                    if(balance && !(balance instanceof Map)){
                        const keys = Object.keys(balance);
                        const tmp = new Map();
                        for(let key of keys){
                            tmp.set(key,balance[key])
                        }
                        balances = tmp;
                    }else{
                        item.Balance.forEach((value, key) => {
                            balances.set(key, value);
                        })
                    }
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
        // console.log(contract.packData,"contract.packData");
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
                Toast.fail("Failed to execute smart contract",2)
            } else {
                executeData["gas"] = "0x"+(gas*2).toString(16);
                seropp.executeContract(executeData, function (res, error) {
                    if (callback) {
                        callback(res, error)
                    }
                })
            }
        });
    }


    estimateSwap(from, tokenA, tokenB, tokenIn, amountIn, callback) {
        // console.log("estimateSwap>>>> ",tokenA, tokenB, tokenIn);
        let key = hashKey(tokenA, tokenB);
        console.log("estimateSwap>>>>",key,tokenToBytes(tokenIn));
        this.callMethod(contract, 'estimateSwap', from, [key, tokenToBytes(tokenIn), amountIn], function (ret) {
            console.log(tokenA, tokenB, tokenIn,new BigNumber(ret[0]).dividedBy(10**18).toString(10),"---------ret");
            callback(ret[0]);
        });
    }
    estimateSwapBuy(from, tokenA, tokenB, tokenOut, amountOut, callback){
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'estimateSwapBuy', from, [key, tokenToBytes(tokenOut), amountOut], function (ret){
            console.log(tokenA, tokenB, tokenOut,new BigNumber(ret[0]).dividedBy(10**18).toString(10),"---------ret");
            callback(ret[0]);
        })
    }

    async volumeOfDay(from,tokenA,tokenB){
        const that = this;
        const date = Math.floor(new Date().getTime()/1000);
        return new Promise((resolve,reject)=>{
            that.callMethod(contract, 'volumeDayOfPair', from, [tokenA,tokenB,date], function (ret){
                if(ret && ret != "0x"){
                    resolve((ret[1]*100/ret[0]).toFixed(2)+"%")
                }else{
                    reject()
                }
            })
        })
    }
    
    // getGroupTokens(from, tokens, callback) {
    //     let tokenBytes = [];
    //     tokens.forEach(each => {
    //         tokenBytes.push(tokenToBytes(each));
    //     });
    //     // console.log(tokenBytes,"tokenbytes,");
    //     this.callMethod(contract, 'getGroupTokens', from, [tokenBytes],function (ret) {
    //         let _tokens = [];
    //         let _tokensList = new Map();
    //         // console.log(ret,"ret------------");
    //         ret[0].forEach((each, index) => {
    //             // console.log(index,"index+each"); 
    //             if (each.length > 0) {
    //                 // console.log(each,"eacheacheach");
    //                 _tokens.push(tokens[index]);
    //                 let list = [];
    //                 each.forEach(item => {
    //                     list.push(bytes32ToToken(item));
    //                 })
    //                 _tokensList.set(tokens[index], list);
    //                 // console.log(_tokensList,"tokenlist");
    //             }
    //         });
    //         callback(_tokens, _tokensList);
    //     });
    // }
    getGroupTokensEx(from, flag, callback) {

        // flag false sero->[a,b,c]
        // flag true  a ->[sero,susd], b->[sero], c->[susd]
       
        abi.pairList(from,"").then(pairArray=>{
            let tokens = [];
            let restMap = new Map();
            for(let pair of pairArray){
                let key = "";
                let val;
                if(!flag){
                    key = pair.tokenB;
                    val = pair.tokenA;
                }else{
                    key = pair.tokenA;
                    val = pair.tokenB;
                }

                if(restMap.has(key)){
                    let value = restMap.get(key);
                    // console.log(value,"restMap");
                    value.push(val);
                }else{
                    tokens.push(key);
                    restMap.set(key,[val]);
                }
            }
            callback(tokens,restMap)
        })
    }

    getTokens(from, token, callback) {
        this.callMethod(contract, 'getTokens', from, [tokenToBytes(token)], function (ret) {
            callback(ret.rets);
        });
    }

    convertToPair(pair){
        // console.log(pair,"pair");
        return {
            tokenA: bytes32ToToken(pair.tokenA),
            tokenB: bytes32ToToken(pair.tokenB),
            reserveA: pair.reserveA,
            reserveB: pair.reserveB,
            totalShares: pair.totalShares,
            myShare: pair.myShare,
            shareRreward: pair.shareRreward,
            orders: pair.orderList,
            selfOrders: pair.myOrderList,
            mining : pair.mining,
            displayOrder: pair.mining?10:(sortToken[bytes32ToToken(pair.tokenA)+"-"+bytes32ToToken(pair.tokenB)] ? sortToken[bytes32ToToken(pair.tokenA)+"-"+bytes32ToToken(pair.tokenB)]:0)
        }
    }

    orderList(from, tokenA, tokenB, callback) {
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'orderList', from, [key], function (ret) {
            callback(ret);
        });
    }

    async pairList(from, token) {
        let self = this;
        return new Promise((resolve,reject)=>{
            if (token) {
                this.callMethod(contract, 'pairListByToken', from, [tokenToBytes(token), 0, 1000], function (ret) {
                    let pairs = [];
                    ret.rets.forEach((pair) => {
                        pairs.push(self.convertToPair(pair));
                    })
                    pairs.sort(self.compare)
                    resolve(pairs);
                });
            } else {
                this.callMethod(contract, 'pairList', from, [0, 1000], function (ret) {

                    let pairs = [];

                    ret.rets.forEach((pair) => {
                        pairs.push(self.convertToPair(pair));
                    })
                    pairs.sort(self.compare)
                    console.log("pairList>>> ",pairs);
                    resolve(pairs);
                });
            }
        })
    }

    compare(m,n){
        if (m.displayOrder < n.displayOrder) return 1
        else if (m.displayOrder > n.displayOrder) return -1
        else return 0

    }

    pairInfoWithOrders(from, tokenA, tokenB, callback) {
        let self = this;
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'pairInfoWithOrders', from, [key], function (ret) {
            // console.log([key],ret,"key");
            let pair = ret[0];
            // console.log(pair,"pairinfowithorders");
            self.orderList(from, tokenA, tokenB, function (ret) {

            })
            callback(self.convertToPair(pair));
        });
    }

    async investAmount(from) {
        return new Promise((resolve,reject)=>{
            this.callMethod(contract, 'investAmount', from, [], function (ret) {
                console.log("investAmount>>> ",ret,ret[0],ret[1]);
                resolve([bytes32ToToken(ret[0]), ret[1]]);
            });
        })

    }

    async initializePair(pk, mainPKr, currency, value) {
        return new Promise((resolve,reject)=>{
            this.executeMethod(contract, 'investLiquidity', pk, mainPKr, [0], currency, value,function (rest,err) {

                if(err){
                    reject(err)
                }else{
                    resolve(rest)
                }
            });
        })

    }

    async cancelInvest(pk, mainPKr) {
        return new Promise((resolve,reject)=>{
            this.executeMethod(contract, 'cancelInvest', pk, mainPKr, [], "SERO", 0, function (rest,err) {
                if(err){
                    reject(err)
                }else{
                    resolve(rest)
                }
            });
        })
    }

    async investLiquidity(pk, mainPKr, currency, value) {
        return new Promise((resolve,reject)=>{
            this.executeMethod(contract, 'investLiquidity', pk, mainPKr, [0], currency, value, function (rest,err) {
                if(err){
                    reject(err)
                }else{
                    resolve(rest)
                }
            });
        })

    }

    async  divestLiquidity(pk, mainPKr, tokenA, tokenB, sharesBurned) {
        return new Promise((resolve,reject)=>{
            let key = hashKey(tokenA, tokenB);
            this.executeMethod(contract, 'divestLiquidity', pk, mainPKr, [key, sharesBurned, 0, 0], "", 0, function (rest,err) {
                if(err){
                    reject(err)
                }else{
                    resolve(rest)
                }
            });
        })
    }

    swap(pk, mainPKr, tokenA, tokenB, amount, callback) {
        let key = hashKey(tokenA, tokenB);
        let timeOut = Math.round(new Date() / 1000) + 600;
        this.executeMethod(contract, 'swap', pk, mainPKr, [key, 0, timeOut, mainPKr], tokenA, amount, callback);
    }

    async withdrawShareReward(pk, mainPKr, tokenA, tokenB) {
        return new Promise((resovle,reject)=>{
            let key = hashKey(tokenA, tokenB);
            this.executeMethod(contract, 'withdrawShareReward', pk, mainPKr, [key], "", 0, function (rest,err) {
                if(err){
                    reject(err)
                }else{
                    resovle(rest)
                }
            });
        })
    }

    totalSupply(from, callback) {
        this.callMethod(poolContract, 'totalSupply', from, [], function (ret) {
            callback(ret[0]);
        });
    }

    balanceOf(from, callback) {
        this.callMethod(poolContract, 'getBalance', from, [], function (ret) {
            console.log("balanceOf>>>",ret);
            if(ret){
                let tokens = [];
                ret[0].forEach(each => {
                    tokens.push(bytes32ToToken(each));
                });
                let balances = [];
                ret[1].forEach(each => {
                    balances.push(each);
                })
                callback(tokens, balances);
            }else {
                callback([""],[0]);
            }
        });
    }

    showExchange(from, amount, callback) {
        // console.log(amount,"abi.amount");
        this.callMethod(poolContract, 'showExchange', from, [amount], function (ret) {
            if(ret){
                let tokens = [];
                ret[0].forEach(each => {
                    tokens.push(bytes32ToToken(each));
                });
                let amounts = [];
                ret[1].forEach(each => {
                    amounts.push(each);
                })
                callback(tokens, amounts);
            }else {
                callback([""],[0]);
            }
        });
    }

    exchange(pk, mainPKr, to, amount, callback) {
        this.executeMethod(poolContract, 'exchange', pk, mainPKr, [to], this.coral, amount, callback);
    }

}

const abi = new Abi();
export default abi;