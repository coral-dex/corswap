import * as React from 'react';
import Layout from "./layout";
import i18n from "../i18n";
import {showValue,toValue,fromValue} from "./utils/common";
import abi from "./abi";
import BigNumber from "bignumber.js";
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
        initValue:""
    }

    async init (pkey) {
        let self = this;
        return new Promise((resolve, reject) => {
            abi.init.then(() => {
                let pk = localStorage.getItem("accountPK")
                if(pkey){
                    pk = pkey;
                }
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
        const datas = await abi.pairList(account.mainPKr,token)
        const tokensTmp = [];
        for(let pair of datas){
            if(pair.reserveA*1 == 0 || pair.reserveB*1 == 0 ){
                continue
            }
            // console.log(datas,"datas");
            await abi.getDecimalAsync(pair.tokenA)
            await abi.getDecimalAsync(pair.tokenB)
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
        return tokensTmp
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
            abi.estimateSwap(account.mainPKr,tokenFrom,tTo,tokenFrom,"0x"+toValue(v?v:0,abi.getDecimalLocal(tokenFrom)).toString(16),function (rest) {
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
            abi.estimateSwapBuy(account.mainPKr,tFrom,tokenTo,tokenTo,"0x"+toValue(v?v:0,abi.getDecimalLocal(tokenTo)).toString(16),function (rest) {
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
        const {tokenFromValue,account,tokenFrom} = this.state;
        this.setState({
            tokenTo:v,
            showSelectTokenTo:false
        })
        this.setTokenFromValue(tokenFromValue,v)

        this.setInitValue(tokenFrom,v);

    }

    setInitValue = (tFrom,tTo)=>{
        const that = this;
        const {account} = this.state;
        abi.estimateSwap(account.mainPKr,tFrom,tTo,tFrom,"0x"+toValue(1,abi.getDecimalLocal(tTo)).toString(16),function (rest) {
            that.setState({
                initValue:rest?fromValue(rest,abi.getDecimalLocal(tTo)).toFixed(6):""
            })
        })
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

        this.setInitValue(tokenTo,tokenFrom);
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
                Toast.loading(i18n.t("pending"),60)
                that.startGetTxReceipt(hash,()=>{
                    that.setState({
                        tokenFromValue:"",
                        tokenToValue:""
                    })
                    Toast.success(i18n.t("success"))
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

    setMaxFromValue = ()=>{
        const {account,tokenFrom} = this.state;
        if(account && account.balances && account.balances.has(tokenFrom)){
            this.setTokenFromValue(fromValue(account.balances.get(tokenFrom),abi.getDecimalLocal(tokenFrom)).toString(10))
        }
    }

    render() {
        const {tokenFrom,tokenTo,tokens,account,showSelectTokenFrom,showSelectTokenTo,tokenFromValue,tokenToValue,estimate,initValue} = this.state;
        return (
            <Layout selectedTab="1" doUpdate={()=>this.init()}>
                <div style={{padding:"10px"}} className="flex-center fontSize am-center">
                    <div className="header">
                        <div className="from" style={{marginTop:"20px"}}>

                            <div className="cst-border color">
                                <Flex>
                                    <Flex.Item style={{flex:1}}>
                                        {i18n.t("from")}{estimate == "from"?`(${i18n.t("estimated")})`:""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className=' text-right color2 cst-balance'>{i18n.t("balance")}: {this.getBalance(tokenFrom)}</div>
                                    </Flex.Item>
                                </Flex>

                                <Flex>
                                    <Flex.Item style={{flex:2}}>
                                        <div>
                                            <InputItem type="digit" placeholder="0.0" value={tokenFromValue} onChange={(v)=>{
                                                this.setTokenFromValue(v)
                                            }} clear extra={<div className="max" onClick={()=>{
                                                this.setMaxFromValue()
                                            }}>MAX</div>}/>
                                        </div>
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}} onClick={()=>{
                                        this.setShowSelectTokenFrom(true);
                                    }}>
                                        <div style={{textAlign:"right"}}>
                                            <span>{tokenFrom?tokenFrom:i18n.t("selectToken")}</span> <img width="13px" src={require('../images/bottom.png')} alt=""/>
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
                                        {i18n.t("to")}{estimate == "to"?`(${i18n.t("estimated")})`:""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className=' text-right color2'>{i18n.t("balance")}: {this.getBalance(tokenTo)}</div>
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
                                            <span>{tokenTo?tokenTo:i18n.t("selectToken")}</span>
                                            <img width="13px" src={require('../images/bottom.png')} alt=""/>
                                        </div>
                                    </Flex.Item>
                                </Flex>
                            </div>
                        </div>
                        <div style={{padding:"12px"}} className="color">
                            {tokenToValue && tokenFromValue ?`1 ${tokenFrom} = ${(tokenToValue/tokenFromValue).toFixed(6)} ${tokenTo}`:initValue && `1 ${tokenFrom} = ${initValue} ${tokenTo}` }
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