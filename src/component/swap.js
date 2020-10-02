import * as React from 'react';
import Layout from "./layout";
import i18n from "../i18n";
import {showValue,toValue,fromValue} from "./utils/common";
import abi from "./abi";
import BigNumber from "bignumber.js";
import {Select} from "./select";
import {Button, Flex, InputItem, List} from "antd-mobile";
import SelectToken from "./selectToken";

class Swap extends React.Component{

    state = {
        account:{},
        tokenFrom:"SERO",
        tokenTo:"",

        tokenFromValue:"",
        tokenToValue:"",

        tokens:[],

        showSelectTokenFrom:"",
        showSelectTokenTo:"",

        estimate:""

    }

    async init () {
        let self = this;
        return new Promise((resolve, reject) => {
            abi.init.then(() => {
                let pk = localStorage.getItem("accountPK")
                abi.accountList(function (accounts) {
                    if (pk) {
                        for (let act of accounts) {
                            if (pk === act.pk) {
                                self.setState({account: act});
                                break;
                            }
                        }
                    } else {
                        pk = accounts[0].pk;
                        localStorage.setItem("accountPK",pk);
                        self.setState({account: accounts[0]});
                    }
                    resolve();
                });
            });

        })
    }


    componentDidMount() {
        this.init().then(()=>{
            this.initPairs().catch()
        })
    }

    async initPairs (token){
        // const swapBase = ["SERO","SUSD"];
        let { account}= this.state;
        return new Promise((resolve)=>{
            // if(!token || swapBase.indexOf(token) == -1){
            //     resolve(swapBase)
            //     return
            // }
            abi.pairList(account.mainPKr,token,function (datas) {
                const tokensTmp = [];
                for(let pair of datas){
                    abi.getDecimal(pair.tokenA)
                    abi.getDecimal(pair.tokenB)
                    if(!token){
                        if(tokensTmp.indexOf(pair.tokenB) == -1){
                            tokensTmp.push(pair.tokenB)
                        }
                        if(tokensTmp.indexOf(pair.tokenA) == -1){
                            tokensTmp.push(pair.tokenA)
                        }
                    }else{
                        if(token === pair.tokenA){
                            if(tokensTmp.indexOf(pair.tokenB) == -1){
                                tokensTmp.push(pair.tokenB)
                            }
                        }else{
                            if(tokensTmp.indexOf(pair.tokenA) == -1){
                                tokensTmp.push(pair.tokenA)
                            }
                        }
                    }
                }
                resolve(tokensTmp)
            })
        })
    }

    setTokenFromValue = (v,tTo)=>{
        console.log("v=>>",v);
        const that = this;
        const {tokenFrom,tokenTo,account} = this.state;
        if(!tTo){
            tTo = tokenTo
        }
        if(tTo){
            abi.estimateSwap(account.mainPKr,tTo,tokenFrom,tokenFrom,"0x"+toValue(v?v:0,abi.getDecimalLocal(tokenFrom)).toString(16),function (rest) {
                console.log("setTokenFromValue>>",rest);
                that.setState({
                    tokenFromValue:v,
                    tokenToValue:fromValue(rest,abi.getDecimalLocal(tTo)).toFixed(6),
                    estimate:"to"
                })
            })
        }else{
            that.setState({
                tokenFromValue:v,
                estimate:"to"
            })
        }
    }

    setTokenToValue = (v,tFrom)=>{
        const that = this;
        const {tokenFrom,tokenTo,account} = this.state;
        if(!tFrom){
            tFrom = tokenFrom
        }
        if(tFrom){
            abi.estimateSwap(account.mainPKr,tokenTo,tFrom,tokenTo,"0x"+toValue(v?v:0,abi.getDecimalLocal(tokenTo)).toString(16),function (rest) {
                console.log("setTokenToValue>>",rest);
                that.setState({
                    tokenFromValue:fromValue(rest,abi.getDecimalLocal(tFrom)).toFixed(6),
                    tokenToValue:v,
                    estimate:"from"
                })
            })
        }else{
            this.setState({
                tokenToValue:v,
                estimate:"from"
            })
        }

    }

    setTokenFrom = (v)=>{
        const {tokenToValue} = this.state;
        this.setState({
            tokenFrom:v,
            tokenTo:"",
            showSelectTokenFrom:false
        })
        this.setTokenToValue(tokenToValue,v)
    }

    setShowSelectTokenFrom = (f) =>{
        const {tokenTo} = this.state;
        if(f){
            this.initPairs().then(tokens=>{
                this.setState({
                    showSelectTokenFrom:f,
                    tokens:tokens
                })
            })
        }else{
            this.setState({
                showSelectTokenFrom:f
            })
        }
    }

    setTokenTo = (v)=>{
        const {tokenFromValue} = this.state;
        console.log("setTokenTo tokenFromValue>>>",tokenFromValue);
        this.setState({
            tokenTo:v,
            showSelectTokenTo:false
        })
        this.setTokenFromValue(tokenFromValue,v)
    }

    setShowSelectTokenTo = (f) =>{
        const {tokenFrom} = this.state;
        if(f){
            this.initPairs(tokenFrom).then(tokens=>{
                this.setState({
                    showSelectTokenTo:f,
                    tokens:tokens
                })
            })
        }else{
            this.setState({
                showSelectTokenTo:f
            })
        }
    }

    convert = ()=>{
        const {tokenTo,tokenFrom,tokenToValue,tokenFromValue,estimate} = this.state;
        if(tokenTo && tokenFrom ){
            this.setState({
                tokenFrom: tokenTo,
                tokenTo: tokenFrom,
                tokenFromValue: tokenToValue,
                tokenToValue:tokenFromValue,
                estimate:estimate?(estimate=="from"?"to":"from"):""
            })
        }
    }

    swap = ()=>{
        const {tokenTo,tokenFrom,tokenToValue,tokenFromValue,estimate,account} = this.state;
        let amount = new BigNumber(0)
        if(estimate){
            amount = toValue(tokenFromValue,abi.getDecimalLocal(tokenFrom));
        }
        abi.swap(account.pk,account.mainPKr,tokenFrom,tokenTo,amount,function (hash) {

        })
    }

    getBalance = (cy)=>{
        const {account} = this.state;
        if(account && account.balances && account.balances.has(cy)){
            return fromValue(account.balances.get(cy),abi.getDecimalLocal(cy)).toFixed(3,1)
        }
        return "0.000"

    }
    render() {

        const {tokenFrom,tokenTo,tokens,account,showSelectTokenFrom,showSelectTokenTo,tokenFromValue,tokenToValue,estimate} = this.state;

        return (
            <Layout selectedTab="1" doUpdate={()=>this.init()}>
                <div style={{padding:"10px"}} className="flex-center">
                    <div className="header">
                        <div className="from" style={{marginTop:"20px"}}>

                            <div className="cst-border">
                                <Flex>
                                    <Flex.Item style={{flex:1}}>
                                        FROM{estimate == "from"?"(estimated)":""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className='fontSize text-right color2 cst-balance'>Balance: {this.getBalance(tokenFrom)}</div>
                                    </Flex.Item>
                                </Flex>

                                <Flex>
                                    <Flex.Item style={{flex:3}}>
                                        <div>
                                            <InputItem type="number" placeholder="0.0" value={tokenFromValue} onChange={(v)=>{
                                                this.setTokenFromValue(v)
                                            }} clear/>
                                        </div>
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}} onClick={()=>{
                                        this.setShowSelectTokenFrom(true);
                                    }}>
                                        <div>
                                            <span>{tokenFrom?tokenFrom:"Select Token"}</span> <img width="13px" src={require('../images/bottom.png')} alt=""/>
                                        </div>
                                    </Flex.Item>
                                </Flex>
                            </div>

                            <Flex>
                                <Flex.Item style={{textAlign:'center'}} onClick={()=>{this.convert()}}>
                                    <img src="./images/down.png" width={22}/>
                                </Flex.Item>
                            </Flex>

                            <div className="cst-border">
                                <Flex>
                                    <Flex.Item style={{flex:1}}>
                                        TO{estimate == "to"?"(estimated)":""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className='fontSize text-right color2'>Balance: {this.getBalance(tokenTo)}</div>
                                    </Flex.Item>
                                </Flex>

                                <Flex>
                                    <Flex.Item style={{flex:3}}>
                                        <div>
                                            <InputItem type="number" placeholder="0.0" value={tokenToValue} onChange={(v)=>{
                                                this.setTokenToValue(v)
                                            }} clear/>
                                        </div>
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}} onClick={()=>{
                                        this.setShowSelectTokenTo(true);
                                    }}>
                                        <div>
                                            <span>{tokenTo?tokenTo:"Select Token"}</span> <img width="13px" src={require('../images/bottom.png')} alt=""/>
                                        </div>
                                    </Flex.Item>
                                </Flex>
                            </div>
                        </div>
                        <div className="text-center">
                            <Button type="primary" onClick={()=>this.swap()} disabled={!tokenToValue || !tokenFromValue}>确认</Button>
                        </div>
                    </div>
                </div>

                <SelectToken visible={showSelectTokenFrom} onOk={this.setTokenFrom} onClose={this.setShowSelectTokenFrom}  tokens={tokens} balance={account&&account.balances}/>

                <SelectToken visible={showSelectTokenTo} onOk={this.setTokenTo} onClose={this.setShowSelectTokenTo}  tokens={tokens} balance={account&&account.balances}/>

            </Layout>
        )
    }
}

export default Swap;