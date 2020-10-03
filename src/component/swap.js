import * as React from 'react';
import Layout from "./layout";
import i18n from "../i18n";
import {showValue,toValue,fromValue} from "./utils/common";
import abi from "./abi";
import BigNumber from "bignumber.js";
import {Select} from "./select";
import {Button, Flex, InputItem, List, Toast} from "antd-mobile";
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

        estimate:"",
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
            abi.pairList(account.mainPKr,token,function (datas) {
                const tokensTmp = [];
                for(let pair of datas){
                    // console.log(datas,"datas");
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
        const that = this;
        if(!v){
            this.setState({
                tokenFromValue: "",
                tokenToValue:""
            })
            return
        }
        const {tokenFrom,tokenTo,account} = this.state;
        if(!tTo){
            tTo = tokenTo
        }
        if(tTo && tokenFrom){
            abi.estimateSwap(account.mainPKr,tTo,tokenFrom,tokenFrom,"0x"+toValue(v?v:0,abi.getDecimalLocal(tokenFrom)).toString(16),function (rest) {
                that.setState({
                    tokenFromValue:v,
                    tokenToValue:rest?fromValue(rest,abi.getDecimalLocal(tTo)).toFixed(6):"",
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
        if(!v){
            this.setState({
                tokenFromValue: "",
                tokenToValue:""
            })
            return
        }
        const {tokenFrom,tokenTo,account} = this.state;
        if(!tFrom){ 
            tFrom = tokenFrom
        }
        if(tFrom && tokenTo){
            abi.estimateSwap(account.mainPKr,tFrom,tokenTo,tokenTo,"0x"+toValue(v?v:0,abi.getDecimalLocal(tokenTo)).toString(16),function (rest) {
                that.setState({
                    tokenFromValue:rest?fromValue(rest,abi.getDecimalLocal(tFrom)).toFixed(6):"",
                    tokenToValue:v,
                    estimate:"from"
                })
            })
        }else{
            that.setState({
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
        const that = this;
        const {tokenTo,tokenFrom,tokenToValue,tokenFromValue,estimate,account} = this.state;
        let amount = new BigNumber(0)
        if(estimate){
            amount = toValue(tokenFromValue,abi.getDecimalLocal(tokenFrom));
        }
        abi.swap(account.pk,account.mainPKr,tokenFrom,tokenTo,amount,function (hash) {
            if(hash){
                Toast.info("PENDING...")
                that.startGetTxReceipt(hash,()=>{
                    Toast.success("SUCCESSFULLY")
                    that.init().catch();
                })
            }
        })
    }

    getBalance = (cy)=>{
        const {account} = this.state;
        if(account && account.balances && account.balances.has(cy)){
            return fromValue(account.balances.get(cy),abi.getDecimalLocal(cy)).toFixed(3,1)
        }
        return "0.000"

    }

    startGetTxReceipt = (hash,cb) =>{
        const that = this;
        abi.getTransactionReceipt(hash).then(res=>{
            if(res && res.result){
                if(cb){
                    cb();
                }
            }else{
                setTimeout(function () {
                    that.startGetTxReceipt(hash,cb)
                },2000)
            }
        })
    }

    render() {
        const {tokenFrom,tokenTo,tokens,account,showSelectTokenFrom,showSelectTokenTo,tokenFromValue,tokenToValue,estimate} = this.state;
        return (
            <Layout selectedTab="1" doUpdate={()=>this.init()}>
                <div style={{padding:"10px"}} className="flex-center fontSize">
                    <div className="header">
                        <div className="from" style={{marginTop:"20px"}}>

                            <div className="cst-border color">
                                <Flex>
                                    <Flex.Item style={{flex:1}}>
                                        FROM{estimate == "from"?"(estimated)":""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className=' text-right color2 cst-balance'>余额: {this.getBalance(tokenFrom)}</div>
                                    </Flex.Item>
                                </Flex>

                                <Flex>
                                    <Flex.Item style={{flex:2}}>
                                        <div>
                                            <InputItem type="digit" placeholder="0.0" value={tokenFromValue} onChange={(v)=>{
                                                this.setTokenFromValue(v)
                                            }} clear/>
                                        </div>
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}} onClick={()=>{
                                        this.setShowSelectTokenFrom(true);
                                    }}>
                                        <div style={{textAlign:"right"}}>
                                            <span>{tokenFrom?tokenFrom:"请选择"}</span> <img width="13px" src={require('../images/bottom.png')} alt=""/>
                                        </div>
                                    </Flex.Item>
                                </Flex>
                            </div>

                            <Flex>
                                <Flex.Item style={{textAlign:'center',margin:"10px 0"}} onClick={()=>{this.convert()}}>
                                    <img src="./images/down.png" width={22} alt=" "/>
                                </Flex.Item>
                            </Flex>

                            <div className="cst-border color" >
                                <Flex style={{height:"30%"}}>
                                    <Flex.Item style={{flex:1}}>
                                        TO{estimate == "to"?"(estimated)":""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className=' text-right color2'>余额: {this.getBalance(tokenTo)}</div>
                                    </Flex.Item>
                                </Flex>

                                <Flex style={{height:"70%"}}>
                                    <Flex.Item style={{flex:2}}>
                                        <div className="align-items">
                                            <InputItem type="digit" placeholder="0.0" value={tokenToValue} onChange={(v)=>{
                                                this.setTokenToValue(v)
                                            }} clear/>
                                        </div>
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}} onClick={()=>{
                                        this.setShowSelectTokenTo(true);
                                    }}>
                                        <div style={{textAlign:"right"}}>
                                            <span>{tokenTo?tokenTo:"Select Token"}</span>
                                            <img width="13px" src={require('../images/bottom.png')} alt=""/>
                                        </div>
                                    </Flex.Item>
                                </Flex>
                            </div>
                        </div>
                        <div style={{padding:"12px"}} className="color">
                            { tokenToValue&& tokenFromValue &&`1 ${tokenFrom} = ${(tokenToValue/tokenFromValue).toFixed(6)} ${tokenTo}` }
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