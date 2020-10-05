import React, {Component} from 'react';
import {Button, Card,NoticeBar,Icon,Steps,Checkbox, Flex, InputItem, List, Modal, SearchBar, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {Select} from "./select";
import {showValue} from "./utils/common";
import Layout from "./layout";
import SelectToken from './selectToken'
import i18n from '../i18n'
const alert = Modal.alert;
const Step = Steps.Step;
const CheckboxItem = Checkbox.CheckboxItem;
export class PairList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pk: localStorage.getItem("accountPK"),
            account: {balances: new Map()},
            pairs: [],
            pairsOrigin:[],
            pair: null,
            orderList: [],
            showType: props.showType,
            pictures:['./images/coral_sero.png','./images/coral_susd.png','./images/coral_aces.png'],
            inputValue:"",

            investAmount:["",0],

            showInitModal:false,
            showInvestModal:false,
            showDivestModal:false,

            showSelectTokenA:false,
            showSelectTokenB:false,
            // tokensA:[],
            // tokensB:[],
            selectTokenA:"",
            selectTokenB:"",

            selectPair:{},

        }
    }

    setShowSelectTokenA = (f)=>{
        this.setState({
            showSelectTokenA:f
        })
    }

    setShowSelectTokenB = (f)=>{
        this.setState({
            showSelectTokenB:f
        })
    }

    setSelectTokenA = (v)=>{
        console.log(v,"vv");
        this.setState({
            selectTokenA:v,
            showSelectTokenA:false
        })
    }

    setSelectTokenB = (v)=>{
        console.log(v,"vSK");
        this.setState({
            selectTokenB:v,
            showSelectTokenB:false
        })
    }

    init(account, search) {
        console.log("init",search);
        let self = this;
        if (!account) {
            account = this.state.account;
        }
        if (!search) {
            search = this.state.search;
        }

        abi.pairList(account.mainPKr, search, function (pairs) {
            console.log(pairs,"pairss");
            self.setState({pairs: pairs,pairsOrigin:pairs});
        });
    }

    startGetTxReceipt = (hash,cb) =>{
        const that = this;
        abi.getTransactionReceipt(hash).then(res=>{
            console.log("getTxReceipt>>>> ",res);
            if(res && res.result){
                Toast.success("SUCCESSFUL")
                this.init()
                if(cb){
                    cb();
                }
            }else{
                setTimeout(function () {
                    that.startGetTxReceipt(hash,cb)
                },1500)
            }
        })
    }

    componentDidMount() {
        this.doUpdate()
    }

    doUpdate = ()=>{
        let self = this;
        let pk = localStorage.getItem("accountPK")
        if(pk){
            self.setState({pk:pk})
        }else{
            pk = self.state.pk;
        }
        abi.init.then(() => {
            abi.accountDetails(pk, function (account) {
                self.setState({account: account});
                self.init(account);
            });
        });
    }
    componentWillReceiveProps(nextProps, nextContext) {
        this.doUpdate()
    }

    async invest(investTokenValue) {

        let {account,inputValue,selectPair} = this.state;
        const investAmount = await abi.investAmount(account.mainPKr);
        if(!inputValue ){
            if(investTokenValue){
                inputValue = investTokenValue;
            }
            if(!inputValue){
                Toast.fail("请输入金额",1.5)
                return
            }
        }
        let self = this;

        const token = investAmount[0]?selectPair.tokenA:selectPair.tokenB;
        abi.getDecimal(token, function (decimals) {
            let amount = new BigNumber(inputValue).multipliedBy(Math.pow(10, decimals))
            abi.investLiquidity(account.pk, self.state.account.mainPKr, token, amount).then(rest=>{
                if(rest){
                    Toast.loading("PENDING...",60);
                    self.setShowInvestModal(false,selectPair).catch()
                    self.setInputValue("")
                    self.startGetTxReceipt(rest,function () {
                        abi.investAmount(account.mainPKr).then(data=>{
                            if(data[0]){
                                self.setShowInvestModal(true,selectPair).catch()
                            }else {
                                Toast.success("SUCCESSFUL")
                            }
                        })
                    });
                }
            }).catch(e=>{
                Toast.fail(e)
            })
        })
    }

    divest() {
        let self = this;
        const {selectPair,account,inputValue} = this.state;
        if(!inputValue){
            Toast.info("请输入份数",1.5)
            return
        }
        abi.divestLiquidity(account.pk, account.mainPKr, selectPair.tokenA, selectPair.tokenB, inputValue).then(rest=>{
            Toast.loading("PENDING...",60)
            self.startGetTxReceipt(rest,()=>{
                self.setState({
                    // selectPair:{},
                    inputValue:"",
                    showDivestModal:false
                })
            });
        }).catch(e=>{
            Toast.fail(e)
        })
    }

    withdrawCoral = (pair) => {
        const self = this;
        abi.withdrawShareReward(this.state.account.pk, this.state.account.mainPKr, pair.tokenA, pair.tokenB).then(rest=>{
            Toast.loading("PENDING...",60)
            self.startGetTxReceipt(rest);
        }).catch(e=>{
            Toast.fail(e)
        })
    }

    searchcoral=(e)=>{
        const {pairs,pairsOrigin} = this.state;
        console.log(e.target.value,"Eeeeee");
        console.log(pairsOrigin,"pairoriginsss");
        let vals = e.target.value;
        if(!vals){
            this.setState({
                pairs:pairsOrigin
            })
        }else{
            let arr = [];
            vals = vals.toUpperCase();
            for(let pair of pairsOrigin){
                if(pair.tokenA.indexOf(vals)>-1 || pair.tokenB.indexOf(vals)>-1){
                    arr.push(pair)
                }
            }
            this.setState({
                pairs:arr
            })
            console.log(arr,"pair.arr");
        }


    }

    showMyOnly = (f)=>{
        const {pairsOrigin} = this.state;
        if(!f){
            this.setState({
                pairs:pairsOrigin
            })
        }else{
            let arr = [];
            for(let pair of pairsOrigin){
                if(pair.myShare*1>0){
                    arr.push(pair)
                }
            }
            this.setState({
                pairs:arr
            })
        }
    }

    async setShowInitModal(f){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
        }
        this.setState({
            investAmount:rest,
            showInitModal:f
        })
    }

    async setShowDivestModal(f,pair){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
        }
        this.setState({
            investAmount:rest,
            showDivestModal:f,
            selectPair:pair
        })
    }

    async setShowInvestModal(f,pair){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
        }
        this.setState({
            investAmount:rest,
            showInvestModal:f,
            selectPair:pair
        })
    }

    async initExchange(selectTokenA,selectTokenB) {
        const that = this;
        const {account,investAmount,inputValue}= this.state;
        const token = investAmount[0]?selectTokenB:selectTokenA
        abi.getDecimal(token, function (decimals) {
            let value = new BigNumber(inputValue).multipliedBy(Math.pow(10, decimals));
            abi.initializePair(account.pk, account.mainPKr, token, value).then(rest=>{
                Toast.loading("PENDING...",60)
                that.setShowInitModal(false).catch()
                that.setInputValue("")
                that.startGetTxReceipt(rest,()=>{
                    if(rest[0]){
                        abi.investAmount(account.mainPKr).then(data=>{
                           if(data[0]){
                               that.setShowInitModal(true).catch()
                           }
                        })
                    }
                });
            }).catch(e=>{
                Toast.fail(e)
            });
        })
    }

    setInputValue = (v)=>{
        this.setState({
            inputValue:v
        })
    }

    // existed = (token)=>{
    //     const {pairs} = this.state;
    //
    //     pairs.find(function(o){
    //         if(o==1){
    //             return true;
    //         }
    //     })
    //
    // }

    revert = ()=>{
        const that = this;
        const {account} = this.state;
        abi.cancelInvest(account.pk,account.mainPKr,function (rest) {
            Toast.loading("PENDING...",60)
            that.setShowInitModal(false).catch()
            that.setShowInvestModal(false).catch()
            that.startGetTxReceipt(rest,()=>{
                Toast.success("SUCCESSFULLY")
            });
        })
    }

    render() {
        console.log(this.state.account,"accountssss");
        let {account,pictures,showDivestModal,showInvestModal,showInitModal,investAmount,showSelectTokenA,pairs,showSelectTokenB,selectTokenA,selectTokenB,inputValue,selectPair} = this.state;
        console.log(account&& account,"accccc");
       
        let tokensB = [];
        let tokensA = [];
        const ops = ["SERO","SUSD"];

        account.balances.forEach((val, key) => {
            if (val > 0) {
                // if(ops.indexOf(key) === -1){
                    tokensB.push(key)
                // }else{
                    tokensA.push(key)
                // }
            }
        });
        if(!selectTokenA){
            selectTokenA = tokensA.length>0 ? tokensA[0]:""
        }
        if(!selectTokenB){
            selectTokenB = tokensB.length>0 ? tokensB[0]:""
        }
        console.log(account,"余额");
        console.log(tokensA,tokensB,"余额吗");
        // console.log("render>>>> ",investAmount,selectTokenA,selectTokenB);

        let investTokenValue = 0;
        let investShares = 0;
        if(!investAmount[0]){
            investTokenValue = selectPair && inputValue?new BigNumber(inputValue).multipliedBy(new BigNumber(selectPair.reserveA)).dividedBy(new BigNumber(selectPair.reserveB)).toFixed(3,1):0
            investShares = selectPair && inputValue ? new BigNumber(inputValue).dividedBy(new BigNumber(selectPair.reserveB).dividedBy(10**abi.getDecimalLocal(selectPair.tokenB))).multipliedBy(selectPair.totalShares*1).toFixed(0,1):0
        }else{
            investTokenValue = selectPair && investAmount[0]?new BigNumber(investAmount[1]).multipliedBy(new BigNumber(selectPair.reserveA)).dividedBy(10**abi.getDecimalLocal(investAmount[0])).dividedBy(new BigNumber(selectPair.reserveB)).toFixed(3,1):0
            investShares = selectPair && investAmount[0] ? new BigNumber(investAmount[1]).dividedBy(new BigNumber(selectPair.reserveB)).multipliedBy(selectPair.totalShares*1).toFixed(0,1):0
            if(inputValue){
                const tmpShares = selectPair && inputValue ? new BigNumber(inputValue).dividedBy(new BigNumber(selectPair.reserveA).dividedBy(10**abi.getDecimalLocal(selectPair.tokenA))).multipliedBy(selectPair.totalShares*1).toFixed(0,1):0
                if(investShares>tmpShares){
                    investShares = tmpShares
                }
            }
        }
        let balances;
        let balances2;
        if(selectPair && this.state.account.balances.has(selectPair.tokenB)){
            balances = this.state.account.balances.get(selectPair.tokenB)
        }
        if(selectPair && this.state.account.balances.has(selectPair.tokenA)){
            balances2 = this.state.account.balances.get(selectPair.tokenA)
        }
        console.log(pairs,"pairs是什么是什么");
        let imgCurrent=0;
        return (
            <Layout selectedTab="3" doUpdate={this.doUpdate}>
                <div className="pairlist fontSize">
                    <p className="flex-center" style={{color:"#00456b",fontSize:"12px"}}>
                        <img width="14px" src={require('../images/horn.png')} alt=""/>
                        &ensp;
                        <span>通过为不同交易池提供流动性，获得CORAL</span>
                    </p>
                    <WhiteSpace/>
                    <WingBlank>
                        <Button type="warning" size="small" onClick={()=>{this.setShowInitModal(true).catch()}} >+ 创建流动池</Button>
                    </WingBlank>
                    <WhiteSpace/>
                    <div className="searchdiv">
                        <input type="text" onChange={(e)=>this.searchcoral(e)} onBlur={(e)=>this.searchcoral(e)} placeholder={i18n.t("SearchCoralSwapPairAndToken")} className="input search"/>
                    </div>
                    <WhiteSpace/>
                    <div className="text-right">
                        <div style={{color:"#00456b",fontSize:"12px"}} className="pledge fontSize">
                            <Checkbox onChange={e=>{ this.showMyOnly(e.target.checked)}}>

                            </Checkbox>
                            <span>{i18n.t("MyPledge")}</span>
                        </div>
                    </div>
                    <WhiteSpace/>
                    {
                        pairs.map((pair, index) => {

                            return (
                                <div className="fontSize">
                                    <div className="am-card card-border">
                                        <div className="flex" style={{borderBottom:"1px dotted #00456b",paddingBottom:"7px"}}>
                                            <div>
                                                <img width="50%" src={pictures[index%3]} alt=""/>
                                            </div>
                                            <div style={{color:"#f75552"}}>
                                                <div className="text-right">{pair.myShare*1>0?<img src={require("../images/user.png")} width="10%" alt=""/>:""}</div>
                                                <div style={{color:"#f75552",marginRight:"30px",fontSize:"12px",whiteSpace:"nowrap"}}>{i18n.t("MyHold")}{pair.myShare}{i18n.t("Share")}, {i18n.t("Proporttion")}: {(pair.myShare/pair.totalShares*100).toFixed(2)}%</div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-weight" style={{margin:"10px 0",fontSize:"20px"}}>{pair.tokenA}-{pair.tokenB}</div>
                                            <div>
                                                {
                                                    pair && showValue(pair.reserveA, abi.getDecimalLocal(pair.tokenA,))}{pair.tokenA} = {showValue(pair.reserveB, abi.getDecimalLocal(pair.tokenB))}{pair.tokenB
                                                }
                                            </div>
                                            <WhiteSpace/>
                                            <div>
                                                总共{pair.totalShares}份
                                            </div>
                                            <WhiteSpace/>
                                            <div>
                                                可提现{showValue(pair.shareRreward,18,3)}CORAL
                                            </div>
                                            <WhiteSpace/>
                                            <Flex>
                                                <Flex.Item>
                                                    <Button  type="warning" size="small" disabled={pair.myShare*1 == 0} onClick={() => {this.setShowDivestModal(true,pair).catch()}}>回收流动性</Button>
                                                </Flex.Item>
                                                <Flex.Item>
                                                    <Button style={{backgroundColor:"#00456b",border:"none"}} type="primary" size="small" onClick={() => {this.setShowInvestModal(true,pair).catch();}}>提供流动性</Button>
                                                </Flex.Item>
                                                <Flex.Item>
                                                    <Button style={{backgroundColor:"#00456b",border:"none"}} type="primary" size="small" disabled={pair.shareRreward*1 === 0} onClick={() => {this.withdrawCoral(pair)}}>提现</Button>
                                                </Flex.Item>
                                            </Flex>
                                        </div>
                                    </div>
                                    <WhiteSpace size="lg"/>
                                </div>
                            )
                        })
                    }


                    <Modal

                        className="Modal"
                        visible={showInitModal}
                        transparent
                        title="初始化资金池"
                        footer={[
                            {
                                text:"取消",
                                onPress:()=>{
                                    this.setShowInitModal(false).catch()
                                }
                            },
                            {
                                text:"确定",
                                onPress:()=>{
                                    this.initExchange(selectTokenA,selectTokenB).catch()
                                }
                            }
                        ]}
                    >
                        <div>
                            <Flex>
                                <Flex.Item>
                                    1. 初始化资金需要分两次交易完成<br/>
                                    2. 请等待第一笔交易完成后再发送
                                    <Steps current={investAmount[0]?1:0}>
                                        <Step key={0} title={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}}>
                                                        交易一
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 1}}>
                                                        {investAmount[0]?<Button size="small" type="ghost" onClick={()=>this.revert()}>撤销</Button>:""}
                                                    </Flex.Item>
                                                </Flex>
                                            </div>
                                        } description={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}} onClick={()=>this.setShowSelectTokenA(true)}>
                                                        <span>{investAmount[0]?investAmount[0]:selectTokenA}</span>
                                                        <img width="13px" className="absolute1" src={require('../images/bottom.png')} alt=""/>
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 2}}>
                                                        {
                                                            investAmount[0]?showValue(investAmount[1],abi.getDecimalLocal(investAmount[0]),3):
                                                                <input style={{width: '95%', height: '25px'}} type="number" placeholder="请输入" onChange={(e) => { this.setInputValue(e.target.value) }}/>
                                                        }

                                                    </Flex.Item>
                                                </Flex>

                                            </div>

                                        } />
                                        <Step key={1} title={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}}>
                                                        交易二
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 2}}>
                                                        {/* 余额: {account&&showValue(account.balances.get(selectTokenB),abi.getDecimalLocal(selectTokenB),3)} {selectTokenB} */}
                                                    </Flex.Item>
                                                </Flex>
                                            </div>
                                        } description={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}} onClick={()=>this.setShowSelectTokenB(true)}>
                                                        <span>{selectTokenB}</span>
                                                        <img width="13px" className="absolute1" src={require('../images/bottom.png')} alt=" "/>
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 2}}>
                                                        <input style={{width: '95%', height: '25px'}} type="number" disabled={!investAmount[0]} placeholder={0} onChange={(e) => { this.setInputValue(e.target.value) }}/>
                                                    </Flex.Item>
                                                </Flex>
                                            </div>
                                        } />
                                    </Steps>

                                </Flex.Item>
                            </Flex>

                        </div>
                    </Modal>

                    <Modal visible={showInvestModal}
                           transparent
                           title="提供流动性"
                           footer={[
                               {
                                   text:"取消",
                                   onPress:()=>{
                                       this.setShowInvestModal(false).catch()
                                       this.setInputValue("")
                                   }
                               },
                               {
                                   text:"确定",
                                   onPress:()=>{
                                       this.invest(investTokenValue).catch()
                                   }
                               }
                           ]}>
                        <Flex>
                            <Flex.Item>
                                1. 需要分两次交易完成<br/>
                                2. 请等待第一笔交易完成后再发送<br/>
                                3. 提供流动性，你将获得CORAL。
                                <Steps current={investAmount[0]?1:0}>
                                    <Step key={0} title={
                                        <div>
                                            <div>
                                                <div style={{flex: 1}}>
                                                   <span>交易一</span>&emsp;&emsp;{selectPair&&selectPair.tokenB}余额:
                                                   <span>{selectPair && showValue(balances, abi.getDecimalLocal(selectPair.tokenB))}</span>    
                                                </div>
                                                
                                                 <div style={{flex: 1}}>
                                                    {investAmount[0]?<Button style={{width:"50px",backgroundColor:"#00456e",color:"#fff"}} size="small" type="ghost" onClick={()=>this.revert()}>撤销</Button>:""}
                                                </div>
                                            </div>
                                        </div>
                                    } description={
                                        <div>
                                            <Flex>
                                                <Flex.Item style={{flex: 1}}>
                                                    {selectPair&&selectPair.tokenB}
                                                </Flex.Item>
                                                <Flex.Item style={{flex: 2}}>
                                                    {
                                                        investAmount[0]?showValue(investAmount[1],abi.getDecimalLocal(investAmount[0]),3): <input style={{width: '95%', height: '25px'}} onChange={(e) => {
                                                            this.setInputValue(e.target.value)
                                                        }}/>
                                                    }
                                                </Flex.Item>
                                            </Flex>
                                        </div>
                                    } />
                                    <Step key={1} title={<div> 
                                            <span>交易二</span>&emsp;&emsp;{selectPair&&selectPair.tokenA}余额:
                                            <span>{selectPair&&showValue(balances2, abi.getDecimalLocal(selectPair.tokenA))}</span>
                                    </div>} description={
                                        <div>
                                            <Flex>
                                                <Flex.Item style={{flex: 1}}> 
                                                    {selectPair&&selectPair.tokenA}
                                                </Flex.Item>
                                                <Flex.Item style={{flex: 2}}>
                                                    <input style={{width: '95%', height: '25px'}} disabled={!investAmount[0]} onChange={(e) => {
                                                        this.setInputValue(e.target.value)
                                                    }} placeholder={investTokenValue}/>
                                                </Flex.Item>
                                            </Flex>
                                        </div>
                                    } />
                                </Steps>

                                <div>
                                    预计提供 {investShares} 份
                                </div>
                            </Flex.Item>
                        </Flex>
                    </Modal>

                    <Modal visible={showDivestModal}
                           transparent
                           title="销毁流动性"
                           footer={[
                               {
                                   text:"取消",
                                   onPress:()=>{
                                       this.setShowDivestModal(false)
                                    //    this.setInputValue("")
                                   }
                               },
                               {
                                   text:"确定",
                                   onPress:()=>{
                                       if(selectPair.myShare*1<inputValue*1){
                                           Toast.info("您最多可回收"+selectPair.myShare+"份")
                                           return
                                       }
                                       this.divest()
                                   }
                               }
                           ]}
                        >
                        <WingBlank>
                            <Flex>
                                <Flex.Item style={{flex: 1}}><span>份数</span></Flex.Item>
                                <Flex.Item style={{flex: 2}}>
                                    <input style={{width: '100%', height: '25px'}} placeholder={selectPair && selectPair.myShare} onChange={(e) => {
                                    this.setInputValue(e.target.value)
                                }}/></Flex.Item>
                            </Flex>
                            <WhiteSpace/>
                            <Flex>
                                <Flex.Item style={{flex: 1}}>{selectPair && selectPair.tokenA}</Flex.Item>
                                <Flex.Item style={{flex: 2}}>{showDivestModal && selectPair&&inputValue? new BigNumber(selectPair.reserveA).dividedBy(10**abi.getDecimalLocal(selectPair.tokenA)).multipliedBy(new BigNumber(inputValue)).dividedBy(selectPair.totalShares*1).toFixed(3,1):0}</Flex.Item>
                            </Flex>
                            <WhiteSpace/>
                            <Flex>
                                <Flex.Item style={{flex: 1}}>{selectPair && selectPair.tokenB}</Flex.Item>
                                <Flex.Item style={{flex: 2}}>{showDivestModal&& selectPair&&inputValue? new BigNumber(selectPair.reserveB).dividedBy(10**abi.getDecimalLocal(selectPair.tokenB)).multipliedBy(new BigNumber(inputValue)).dividedBy(selectPair.totalShares*1).toFixed(3,1):0}</Flex.Item>
                            </Flex>
                        </WingBlank>
                    </Modal>

                    <SelectToken visible={showSelectTokenA} onOk={this.setSelectTokenA} onClose={this.setShowSelectTokenA} tokens={tokensA} balance={account&&account.balances}/>

                    <SelectToken visible={showSelectTokenB} onOk={this.setSelectTokenB} onClose={this.setShowSelectTokenB}  tokens={tokensB} balance={account&&account.balances}/>
                </div>
            </Layout>
        )
    }
}