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

        estimate:"",
        pair:[],
        flag:true,
        content:null,
        price:0,
        price2:0,
        showBuySell:true,
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
        let that = this;
        return new Promise((resolve)=>{
            // if(!token || swapBase.indexOf(token) == -1){
            //     resolve(swapBase)
            //     return
            // }
            abi.pairList(account.mainPKr,token,function (datas) {
                const tokensTmp = [];
                that.setState({
                    pair:datas
                })
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
        const self = this;
        const {tokenFrom,tokenTo,account} = this.state;
        if(!tTo){
            tTo = tokenTo
        }
        let amountOut;
        if(tTo && tokenFrom){
            abi.estimateSwap(account.mainPKr,tTo,tokenFrom,tokenFrom,"0x"+toValue(v?v:0,parseInt(abi.getDecimalLocal(tokenFrom)).toString(16)),function (rest) {
                amountOut = new BigNumber(rest).dividedBy(10**18);
                let price = new BigNumber(amountOut).dividedBy(v).toFixed(6);
                self.setState({
                    price:price,
                    tokenFromValue:v,
                    tokenToValue:rest?fromValue(rest,abi.getDecimalLocal(tTo)).toFixed(6):"",
                    estimate:"to"
                })
            })
        }else{
            self.setState({
                tokenFromValue:v,
                estimate:"from"
            })
        }
    }

    setTokenToValue = (v,tFrom)=>{
        const self = this;
        const {tokenFrom,tokenTo,account} = this.state;
        if(!tFrom){ 
            tFrom = tokenFrom
        }
        let amountOut;
        if(tFrom && tokenTo){
            abi.estimateSwap(account.mainPKr,tFrom,tokenTo,tokenTo,"0x"+fromValue(v?v:0,abi.getDecimalLocal(tokenTo)).toString(16),function (rest) {
                amountOut = new BigNumber(rest).dividedBy(10**18);
                let price = new BigNumber(amountOut).dividedBy(v).toFixed(6);
                self.setState({
                    tokenFromValue:rest?toValue(rest,abi.getDecimalLocal(tFrom)).toFixed(6):"",
                    tokenToValue:v,
                    price:price,
                    estimate:"to"
                })
            })
        }else{
            self.setState({
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
            content:"已选择",
            showSelectTokenFrom:false
        })
        this.setTokenToValue(tokenToValue,v)
    }

    setShowSelectTokenFrom = (f) =>{
        this.setState({content:undefined})
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
        // console.log("setTokenTo tokenFromValue>>>",tokenFromValue);
        this.setState({
            tokenTo:v,
            content:"已选择",
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
        const {tokenTo,tokenFrom,tokenToValue,tokenFromValue,estimate,price} = this.state;
        let self =this
        let amountOut;
        if(tokenTo && tokenFrom ){
            this.setState({
                price:price,
                flag:!self.state.flag,
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
        let amount = "0x0"
        if(estimate){
            amount = "0x"+toValue(tokenFromValue,abi.getDecimalLocal(tokenFrom)).toString(16);
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
        // let that = this;
        // let psk;
        // let reserveA;
        // let reserveB;
        const {pair,tokenFrom,tokenTo,tokens,account,showSelectTokenFrom,showSelectTokenTo,tokenFromValue,tokenToValue,estimate} = this.state;
        // if(this.state.pair){
            // for(psk of that.state.pair){
                // console.log(psk);
                // if(that.state.tokenTo == psk.tokenA || that.state.tokenFrom == psk.tokenA){
                //     reserveA = psk.reserveA;
                //     reserveB = psk.reserveB;
                // }
               
            // }  
        // }
        if(tokenFromValue&&tokenToValue){
            console.log(this.state.tokenFromValue,this.state.tokenToValue,"======");
        }
        return (
            <Layout selectedTab="1" doUpdate={()=>this.init()}>
                <div style={{padding:"10px"}} className="flex-center fontSize">
                    <div className="header">
                        <div className="from" style={{marginTop:"20px"}}>

                            <div className="cst-border color">
                                <Flex>
                                    <Flex.Item style={{flex:1}}>
                                        FROM{estimate == "from"?"预算的":""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className=' text-right color2 cst-balance'>{i18n.t("Balances")}: {this.getBalance(tokenFrom)}</div>
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
                                            <span>{tokenFrom?tokenFrom:i18n.t("Select")}</span> <img width="13px" src={require('../images/bottom.png')} alt=""/>
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
                                        TO{estimate == "to"?"预算的":""}
                                    </Flex.Item>
                                    <Flex.Item style={{flex:1}}>
                                        <div className=' text-right color2'>{i18n.t("Balances")}: {this.getBalance(tokenTo)}</div>
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
                                            <span>{tokenTo?tokenTo:i18n.t("Select")}</span>
                                            <img width="13px" src={require('../images/bottom.png')} alt=""/>
                                        </div>
                                    </Flex.Item>
                                </Flex>
                            </div>
                        </div>
                        <div style={{paddingLeft:"10px",height:"20PX",fontSize:"16px"}} className="color">

                                            
                                            {/* <div>
                                                {   !this.state.tokenFromValue||!this.state.tokenToValue?
                                                    this.state.content!=null &&
                                                    this.state.tokenFrom!="SERO" ? 
                                                    showValue(reserveA,abi.getDecimalLocal(this.state.tokenTo)) + this.state.tokenTo + "=" + showValue(reserveB,abi.getDecimalLocal(this.state.tokenFrom))+this.state.tokenFrom 
                                                    :
                                                    showValue(reserveB,abi.getDecimalLocal(this.state.tokenTo)) + this.state.tokenTo + "=" + showValue(reserveA,abi.getDecimalLocal(this.state.tokenFrom))+this.state.tokenFrom 
                                                    : " "
                                                } 
                                            </div> */}
                                                {/* {
                                                   this.state.price+
                                                   this.state.tokenFromValue&& this.state.tokenFromValue+this.state.tokenFrom+" : "+this.state.tokenToValue+this.state.tokenTo
                                                }  */}

                                                {  
                                                    this.state.tokenFrom&&this.state.tokenTo&&this.state.tokenToValue&&this.state.tokenFromValue&&this.state.flag?
                                                    1+this.state.tokenFrom+"="+this.state.price+this.state.tokenTo
                                                    :
                                                    1+this.state.tokenTo+"="+this.state.price+this.state.tokenFrom
                                                }                                                                    
                        </div>

                        <div className="text-center">
                            <Button type="primary" className={this.state.tokenFromValue && this.state.tokenFrom?'inputs':'nothing'} onClick={()=>this.swap()} disabled={!tokenToValue || !tokenFromValue}>确认</Button>
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