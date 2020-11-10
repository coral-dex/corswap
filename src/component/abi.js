import serojs from "serojs";
import seropp from "sero-pp";
import BigNumber from 'bignumber.js'
// import configs from './address/config'

import {Toast} from "antd-mobile";
import {bytes32ToToken, hashKey, tokenToBytes, toValue} from "./utils/common"
import {JsonRpc} from "./utils/jsonrpc";
import i18n from "../i18n";
import {sortToken} from './utils/common'

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

	items(mainPkr,callback){
        this.callMethod(Proaddress,"items",mainPkr,[],function(all){
            callback(all)
        })
    }
	

    create(pk,mainPkr,index,desc,spend,callback){
		this.executeMethod(Proaddress,"create",pk,mainPkr,[index,desc],this.coral,spend,function(ret){
			callback(ret)
		})
	}


	chooseProposal(pk,mainPkr,index,bool,amount,callback){
        this.executeMethod(Proaddress,"vot",pk,mainPkr,[index,bool],this.coral,toValue(amount,18),function(ret){
            console.log("chooseProposal>>>>>>>>>>>>>>>>>>>",ret)
            if(ret){
                callback(ret)
            }else{
                callback(false)
            }
        })
	}
	

    confirmVote(pk,mainPkr,index,bool,amount,callback){
        this.executeMethod(Proaddress,"vot",pk,mainPkr,[index,bool],this.coral,toValue(amount,18),function(ret){
            if(ret){
                callback(true)
            }else{
                callback(false)
            }
        })
	}
	withdrawVote(pk,mainPkr,index,callback){
        this.executeMethod(Proaddress,"withdrawVote",pk,mainPkr,[index],this.coral,0,function(ret){
			callback(ret);
        })
	}
	

	withdrawPledgeAmount(pk,mainPkr,index,callback){
        this.executeMethod(Proaddress,"withdrawPledgeAmount",pk,mainPkr,[index],this.coral,0,function(ret){
            callback(ret);
        })
	}
	withdrawPledgeCoralAmount(pk,mainPkr,index,callback){
        this.executeMethod(Proaddress,"withdrawPledgeCoralAmount",pk,mainPkr,[index],this.coral,0,function(ret){
            callback(ret);
        })
	}
 
	
	isRepeatVote(pk,mainPKr,index,callback){
		this.callMethod(Proaddress,"participated",mainPKr,[index],function(repeat){	
			console.log(repeat,"is repeat vote!")
			callback(repeat);
		})
	}
    myCreate(mainPkr,callback){
        this.callMethod(Proaddress,"queryMyCreate",mainPkr,[],function(cre){
            callback(cre)
        })
    }
    myVote(mainPkr,callback){
        this.callMethod(Proaddress,"queryMyVote",mainPkr,[],function(vote){
            callback(vote)
        })
    }
    queryAll(mainPkr,start,end,callback){
        this.callMethod(Proaddress,"query",mainPkr,[start,end],function(all){
            callback(all)
        })
    }
    queryDetail(mainPkr,index,callback){
        this.callMethod(Proaddress,"detail",mainPkr,[index],function(detail){
            if(detail){
                callback(detail)
            }
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
                    rpc.seroRpc(info.rpc, "sero_getDecimal", [token], function (rets) {
                        localStorage.setItem("D_" + token, new BigNumber(rets.result, 16).toNumber());
                        resolve(new BigNumber(rets.result, 16).toNumber());
                    });
                });
            }
        })
    }

    accountDetails(pk, callback) {
        if (!pk) {
            return;
        }
        let self = this;
        seropp.getAccountDetail(pk, function (item) {
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

        seropp.estimateGas(estimateParam, function(gas, error) {
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
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'estimateSwap', from, [key, tokenToBytes(tokenIn), amountIn], function (ret) {
            callback(ret[0]);
        });
    }
    estimateSwapBuy(from, tokenA, tokenB, tokenOut, amountOut, callback){
        let key = hashKey(tokenA, tokenB);
        this.callMethod(contract, 'estimateSwapBuy', from, [key, tokenToBytes(tokenOut), amountOut], function (ret){
            callback(ret[0]);
        })
    }

   
    getGroupTokensEx(from, flag, callback) {
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
                    if(ret && ret.rets){
						ret.rets.forEach((pair) => {
							pairs.push(self.convertToPair(pair));
						})
						pairs.sort(self.compare)
					}
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
            let pair = ret[0];
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
            if(ret && ret !="0x0"){
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


const config = {
	name: "Coral Swap",
	contractAddress: "5bYB1DSe18ad7oFiJSnt861ett8fT5GFSva3BBrdYvyU8SK6CJoyDrMyijZWiGmkT1ZDaQt2AMZr5yxu23n62YnQ",
	proposalAddress: "4VU7KaZBA51Qik7N7Hnfz4ZMiViisp9L2LBTCAWgdRK96vHjLridwhN75TuLKakNdNL8iTWcJCKJbzSwGxW5gvv5",
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

// const contract = serojs.callContract(abiJson, "5bYB1DSe18ad7oFiJSnt861ett8fT5GFSva3BBrdYvyU8SK6CJoyDrMyijZWiGmkT1ZDaQt2AMZr5yxu23n62YnQ");
const contract = serojs.callContract(abiJson, "38qaVPVMCNpoKMhubqJPCSK86uMoaGwzUhyjnawoUwhejgtQVoEsQWz9JfiDkexjF7EYvxDrXQXtc9B9FQyAYZ5f");

const poolContract = serojs.callContract([{"constant":true,"inputs":[],"name":"getBalance","outputs":[{"name":"tokenList","type":"bytes32[]"},{"name":"balances","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"amount","type":"uint256"}],"name":"showExchange","outputs":[{"name":"tokenList","type":"bytes32[]"},{"name":"amounts","type":"uint256[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"}],"name":"exchange","outputs":[{"name":"","type":"bool"}],"payable":true,"stateMutability":"payable","type":"function"}],
	"eX4rXhV94QMsMftenDiiJQCKckHvpvoLA8MoRtFXhmeMaLRb7ggM1UjG49BLviKHU1mjnTjQgJTLLc2dQQuiY1J");


const proposal=[
    {
        "constant": false,
        "inputs": [
            {
                "name": "itemIndex",
                "type": "uint256"
            },
            {
                "name": "desc",
                "type": "string"
            }
        ],
        "name": "create",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "queryMyVote",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "name": "itemIndex",
                                "type": "uint256"
                            },
                            {
                                "name": "desc",
                                "type": "string"
                            },
                            {
                                "name": "startTime",
                                "type": "uint256"
                            },
                            {
                                "name": "support",
                                "type": "uint256"
                            },
                            {
                                "name": "oppose",
                                "type": "uint256"
                            },
                            {
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            }
                        ],
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeCurrency",
                                "type": "string"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralPeriod",
                                "type": "uint256"
                            },
                            {
                                "name": "moreThan",
                                "type": "uint256"
                            },
                            {
                                "name": "fee",
                                "type": "uint256"
                            },
                            {
                                "name": "period",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "moreThanPercent",
                                "type": "uint256"
                            }
                        ],
                        "name": "item",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            }
                        ],
                        "name": "voteInfo",
                        "type": "tuple"
                    },
                    {
                        "name": "isMy",
                        "type": "bool"
                    },
                    {
                        "name": "infoIdex",
                        "type": "uint256"
                    }
                ],
                "name": "details",
                "type": "tuple[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "withdrawPledgeCoralAmount",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "queryMyCreate",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "name": "itemIndex",
                                "type": "uint256"
                            },
                            {
                                "name": "desc",
                                "type": "string"
                            },
                            {
                                "name": "startTime",
                                "type": "uint256"
                            },
                            {
                                "name": "support",
                                "type": "uint256"
                            },
                            {
                                "name": "oppose",
                                "type": "uint256"
                            },
                            {
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            }
                        ],
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeCurrency",
                                "type": "string"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralPeriod",
                                "type": "uint256"
                            },
                            {
                                "name": "moreThan",
                                "type": "uint256"
                            },
                            {
                                "name": "fee",
                                "type": "uint256"
                            },
                            {
                                "name": "period",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "moreThanPercent",
                                "type": "uint256"
                            }
                        ],
                        "name": "item",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            }
                        ],
                        "name": "voteInfo",
                        "type": "tuple"
                    },
                    {
                        "name": "isMy",
                        "type": "bool"
                    },
                    {
                        "name": "infoIdex",
                        "type": "uint256"
                    }
                ],
                "name": "details",
                "type": "tuple[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            },
            {
                "name": "state",
                "type": "uint8"
            }
        ],
        "name": "updateItem",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "infoIndex",
                "type": "uint256"
            }
        ],
        "name": "participated",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "pledgeCurrency",
                "type": "string"
            },
            {
                "name": "pledgeAmount",
                "type": "uint256"
            },
            {
                "name": "pledgeCoralAmount",
                "type": "uint256"
            },
            {
                "name": "pledgeCoralPeriod",
                "type": "uint256"
            },
            {
                "name": "moreThan",
                "type": "uint256"
            },
            {
                "name": "fee",
                "type": "uint256"
            },
            {
                "name": "period",
                "type": "uint256"
            },
            {
                "name": "moreThanPercent",
                "type": "uint256"
            }
        ],
        "name": "createItem",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "x",
                "type": "uint256"
            }
        ],
        "name": "_sqrt",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "withdrawVote",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "x",
                "type": "bytes32"
            }
        ],
        "name": "bytes32ToString",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            },
            {
                "name": "state",
                "type": "uint8"
            }
        ],
        "name": "updateInfoState",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "withdrawPledgeAmount",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "start",
                "type": "uint256"
            },
            {
                "name": "limit",
                "type": "uint256"
            }
        ],
        "name": "query",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "name": "itemIndex",
                                "type": "uint256"
                            },
                            {
                                "name": "desc",
                                "type": "string"
                            },
                            {
                                "name": "startTime",
                                "type": "uint256"
                            },
                            {
                                "name": "support",
                                "type": "uint256"
                            },
                            {
                                "name": "oppose",
                                "type": "uint256"
                            },
                            {
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            }
                        ],
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeCurrency",
                                "type": "string"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralPeriod",
                                "type": "uint256"
                            },
                            {
                                "name": "moreThan",
                                "type": "uint256"
                            },
                            {
                                "name": "fee",
                                "type": "uint256"
                            },
                            {
                                "name": "period",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "moreThanPercent",
                                "type": "uint256"
                            }
                        ],
                        "name": "item",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            }
                        ],
                        "name": "voteInfo",
                        "type": "tuple"
                    },
                    {
                        "name": "isMy",
                        "type": "bool"
                    },
                    {
                        "name": "infoIdex",
                        "type": "uint256"
                    }
                ],
                "name": "details",
                "type": "tuple[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "items",
        "outputs": [
            {
                "components": [
                    {
                        "name": "pledgeCurrency",
                        "type": "string"
                    },
                    {
                        "name": "pledgeAmount",
                        "type": "uint256"
                    },
                    {
                        "name": "pledgeCoralAmount",
                        "type": "uint256"
                    },
                    {
                        "name": "pledgeCoralPeriod",
                        "type": "uint256"
                    },
                    {
                        "name": "moreThan",
                        "type": "uint256"
                    },
                    {
                        "name": "fee",
                        "type": "uint256"
                    },
                    {
                        "name": "period",
                        "type": "uint256"
                    },
                    {
                        "name": "state",
                        "type": "uint8"
                    },
                    {
                        "name": "moreThanPercent",
                        "type": "uint256"
                    }
                ],
                "name": "",
                "type": "tuple[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "infoIndex",
                "type": "uint256"
            },
            {
                "name": "support",
                "type": "bool"
            }
        ],
        "name": "vot",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "detail",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "name": "itemIndex",
                                "type": "uint256"
                            },
                            {
                                "name": "desc",
                                "type": "string"
                            },
                            {
                                "name": "startTime",
                                "type": "uint256"
                            },
                            {
                                "name": "support",
                                "type": "uint256"
                            },
                            {
                                "name": "oppose",
                                "type": "uint256"
                            },
                            {
                                "name": "owner",
                                "type": "address"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            }
                        ],
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeCurrency",
                                "type": "string"
                            },
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "pledgeCoralPeriod",
                                "type": "uint256"
                            },
                            {
                                "name": "moreThan",
                                "type": "uint256"
                            },
                            {
                                "name": "fee",
                                "type": "uint256"
                            },
                            {
                                "name": "period",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            },
                            {
                                "name": "moreThanPercent",
                                "type": "uint256"
                            }
                        ],
                        "name": "item",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "pledgeAmount",
                                "type": "uint256"
                            },
                            {
                                "name": "state",
                                "type": "uint8"
                            }
                        ],
                        "name": "voteInfo",
                        "type": "tuple"
                    },
                    {
                        "name": "isMy",
                        "type": "bool"
                    },
                    {
                        "name": "infoIdex",
                        "type": "uint256"
                    }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "cy",
                "type": "string"
            }
        ],
        "name": "withdrawFee",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const rpc = new JsonRpc();
 
const Proaddress = serojs.callContract(proposal,"3iq9iJLr3PhjmjD3GeKnhy4pYPFRGUu1cEmnYJ62QaVjjezLP3yREuVb8BT5EsJNMsdMQPDBMBQJdvVrd5hcFjUe")


const abi = new Abi();
export default abi;