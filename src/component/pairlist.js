import React, {Component} from 'react';
import {Button, Steps,Checkbox, Flex, Modal, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {showValue} from "./utils/common";
import Layout from "./layout";
import SelectToken from './selectToken'
import i18n from '../i18n'
const Step = Steps.Step;

const risklist = ["USDT"];

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
        this.setState({
            selectTokenA:v,
            showSelectTokenA:false
        })
    }

    setSelectTokenB = (v)=>{
        this.setState({
            selectTokenB:v,
            showSelectTokenB:false
        })
    }

    init(account, search) {
        let self = this;
        if (!account) {
            account = this.state.account;
        }
        if (!search) {
            search = this.state.search;
        }

        abi.pairList(account.mainPKr, search, function (pairs) {
            abi.investAmount(account.mainPKr).then(data=>{
                self.setState({pairs: pairs,pairsOrigin:pairs,investAmount:data});
            })

        });
    }

    startGetTxReceipt = (hash,cb) =>{
        const that = this;
        abi.getTransactionReceipt(hash).then(res=>{
            if(res && res.result){
                Toast.success(i18n.t("success"))
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

    doUpdate = (pkey)=>{
        let self = this;
        let pk = localStorage.getItem("accountPK")
        if(pkey){
            pk = pkey;
        }
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
                Toast.fail(i18n.t("inputAmount"),1.5)
                return
            }
        }
        let self = this;

        const token = investAmount[0]?selectPair.tokenA:selectPair.tokenB;
        abi.getDecimal(token, function (decimals) {
            let amount = new BigNumber(inputValue).multipliedBy(Math.pow(10, decimals))
            abi.investLiquidity(account.pk, self.state.account.mainPKr, token, amount).then(rest=>{
                if(rest){
                    Toast.loading(i18n.t("pending"),60);
                    self.setShowInvestModal(false,selectPair).catch()
                    self.setInputValue("")
                    self.startGetTxReceipt(rest,function () {
                        abi.investAmount(account.mainPKr).then(data=>{
                            if(data[0]){
                                self.setState({
                                    investAmount:data
                                })
                                self.setShowInvestModal(true,selectPair).catch()
                            }else {
                                Toast.success(i18n.t("success"))
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
            Toast.info(i18n.t("inputShares"),1.5)
            return
        }
        abi.divestLiquidity(account.pk, account.mainPKr, selectPair.tokenA, selectPair.tokenB, inputValue).then(rest=>{
            Toast.loading(i18n.t("pending"),60)
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
            Toast.loading(i18n.t("pending"),60)
            self.startGetTxReceipt(rest);
        }).catch(e=>{
            Toast.fail(e)
        })
    }

    searchcoral=(e)=>{
        const {pairs,pairsOrigin} = this.state;
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
            this.setState({
                investAmount:rest,
            })
        }
        this.setState({
            showInitModal:f
        })
    }

    async setShowDivestModal(f,pair){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
            this.setState({
                investAmount:rest,
            })
        }
        this.setState({
            showDivestModal:f,
            selectPair:pair
        })
    }

    async setShowInvestModal(f,pair){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
            this.setState({
                investAmount:rest,
            })
        }
        this.setState({
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
                Toast.loading(i18n.t("pending"),60)
                that.setShowInitModal(false).catch()
                that.setInputValue("")
                that.startGetTxReceipt(rest,()=>{
                    if(rest[0]){
                        abi.investAmount(account.mainPKr).then(data=>{
                           if(data[0]){
                               that.setState({
                                   investAmount:data
                               })
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

    revert = ()=>{
        const that = this;
        const {account} = this.state;
        abi.cancelInvest(account.pk,account.mainPKr).then(rest=>{
            Toast.loading(i18n.t("pending"),60)
            that.setShowInitModal(false).catch()
            that.setShowInvestModal(false).catch()
            that.startGetTxReceipt(rest,()=>{
                Toast.success(i18n.t("success"))
            });
        }).catch(e=>{
            Toast.fail(e)
        })
    }

    render() {
        let {account,pictures,showDivestModal,showInvestModal,showInitModal,investAmount,showSelectTokenA,pairs,showSelectTokenB,selectTokenA,selectTokenB,inputValue,selectPair} = this.state;
        let tokensB = [];
        let tokensA = [];

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
        let investTokenValue = 0;
        let investShares = 0;
        if(selectPair && selectPair.totalShares &&selectPair.totalShares *1 ==0){
            investShares = 1000;
        }else{
            if(!investAmount[0]){
                investTokenValue = selectPair && inputValue &&selectPair.reserveA && selectPair.reserveA*1>0?new BigNumber(inputValue).multipliedBy(new BigNumber(selectPair.reserveA)).dividedBy(new BigNumber(selectPair.reserveB)).toFixed(3,1):0
                investShares = selectPair && inputValue && selectPair.reserveB&&selectPair.reserveB*1>0 ? new BigNumber(inputValue).dividedBy(new BigNumber(selectPair.reserveB).dividedBy(10**abi.getDecimalLocal(selectPair.tokenB))).multipliedBy(selectPair.totalShares*1).toFixed(0,1):0
                console.log("investShares>>>",investShares,selectPair && inputValue && selectPair.reserveB&&selectPair.reserveB*1>0,selectPair);
            }else{
                investTokenValue = selectPair && investAmount[0] && selectPair.reserveA && selectPair.reserveA*1>0?new BigNumber(investAmount[1]).multipliedBy(new BigNumber(selectPair.reserveA)).dividedBy(10**abi.getDecimalLocal(investAmount[0])).dividedBy(new BigNumber(selectPair.reserveB)).toFixed(3,1):0
                investShares = selectPair && investAmount[0]&&selectPair.reserveB&&selectPair.reserveB*1>0 ? new BigNumber(investAmount[1]).dividedBy(new BigNumber(selectPair.reserveB)).multipliedBy(selectPair.totalShares*1).toFixed(0,1):0
                if(inputValue){
                    const tmpShares = selectPair && inputValue &&selectPair.reserveA&&selectPair.reserveA*1>0 ? new BigNumber(inputValue).dividedBy(new BigNumber(selectPair.reserveA).dividedBy(10**abi.getDecimalLocal(selectPair.tokenA))).multipliedBy(selectPair.totalShares*1).toFixed(0,1):0
                    if(investShares>tmpShares){
                        investShares = tmpShares
                    }
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
        return (
            <Layout selectedTab="3" doUpdate={this.doUpdate}>
                <div className="pairlist fontSize">
                    <p className="flex-center" style={{color:"#00456b",fontSize:"12px"}}>
                        <img width="14px" src={require('../images/horn.png')} alt=""/>
                        &ensp;
                        <span>{i18n.t("tips1")}</span>
                    </p>
                    <WhiteSpace/>
                    <WingBlank>
                        <Button type="warning" size="small" onClick={()=>{this.setShowInitModal(true).catch()}} >+ {i18n.t("createLiquidity")}</Button>
                    </WingBlank>
                    <WhiteSpace/>
                    <div className="searchdiv">
                        <input type="text" onChange={(e)=>this.searchcoral(e)} onBlur={(e)=>this.searchcoral(e)} placeholder={i18n.t("searchToken")} className="input search"/>
                    </div>
                    <WhiteSpace/>
                    <div className="text-right">
                        <div style={{color:"#00456b",fontSize:"12px"}} className="pledge fontSize">
                            <Checkbox onChange={e=>{ this.showMyOnly(e.target.checked)}}>
                            </Checkbox>
                            <span>{i18n.t("showMine")}</span>
                        </div>
                    </div>
                    <WhiteSpace/>
                    <div style={{paddingBottom:'70px'}}>
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
                                                    <div style={{color:"#f75552",marginRight:"30px",fontSize:"12px",whiteSpace:"nowrap"}}>
                                                        {`${i18n.t("myShares").replace("$1",pair.myShare).replace("$2",pair.totalShares*1>0?(pair.myShare/pair.totalShares*100).toFixed(3):"0.00")}`}%

                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-weight" style={{margin:"10px 0",fontSize:"20px"}}>{pair.tokenA}-{pair.tokenB} {(risklist.indexOf(pair.tokenA)>-1||risklist.indexOf(pair.tokenB)>-1) && <div style={{fontSize:"10px",color:"red"}}>{i18n.t("risk")}</div>}</div>
                                                <div>
                                                    {
                                                        pair && showValue(pair.reserveA, abi.getDecimalLocal(pair.tokenA))}{pair.tokenA} = {showValue(pair.reserveB, abi.getDecimalLocal(pair.tokenB))}{pair.tokenB}
                                                </div>
                                                <WhiteSpace/>
                                                <div>
                                                    {i18n.t("totalShares").replace("$1",pair.totalShares)}
                                                </div>

                                                { (pair.mining||pair.shareRreward*1>0)  && <div>
                                                    <WhiteSpace/>
                                                    {i18n.t("withdrawAble")}{showValue(pair.shareRreward,18,3)}CORAL
                                                </div>
                                                }
                                                <WhiteSpace/>
                                                <Flex>
                                                    <Flex.Item>
                                                        <Button  type="warning" size="small" disabled={pair.myShare*1 == 0} onClick={() => {this.setShowDivestModal(true,pair).catch()}}>{i18n.t("recyclingLiquidity")}</Button>
                                                    </Flex.Item>
                                                    <Flex.Item>
                                                        <Button style={{backgroundColor:"#00456b",border:"none"}} disabled={investAmount[0]&&investAmount[0]!==pair.tokenB} type="primary" size="small" onClick={() => {this.setShowInvestModal(true,pair).catch();}}>{i18n.t("provideLiquidity")}</Button>
                                                    </Flex.Item>
                                                    {
                                                        (pair.mining||pair.shareRreward*1>0) && <Flex.Item>
                                                            <Button style={{backgroundColor:"#00456b",border:"none"}} type="primary" size="small" disabled={pair.shareRreward*1 === 0} onClick={() => {this.withdrawCoral(pair)}}>{i18n.t("withdraw")}</Button>
                                                        </Flex.Item>
                                                    }
                                                </Flex>
                                            </div>
                                        </div>
                                        <WhiteSpace size="lg"/>
                                    </div>
                                )
                            })
                        }
                    </div>


                    <Modal

                        className="Modal"
                        visible={showInitModal}
                        transparent
                        title={i18n.t("createLiquidity")}
                        footer={[
                            {
                                text: i18n.t("cancel"),
                                onPress:()=>{
                                    this.setShowInitModal(false).catch()
                                }
                            },
                            {
                                text: i18n.t("ok"),
                                onPress:()=>{
                                    this.initExchange(selectTokenA,selectTokenB).catch()
                                }
                            }
                        ]}
                    >
                        <div>
                            <Flex>
                                <Flex.Item>
                                    {i18n.t("tips2").replace("$1",i18n.t("createLiquidity"))}<br/>
                                    {i18n.t("tips3")}
                                    <Steps current={investAmount[0]?1:0}>
                                        <Step key={0} title={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}}>
                                                        {i18n.t("tx1")}
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 1}}>
                                                        {investAmount[0]?<Button size="small" type="ghost" onClick={()=>this.revert()}>{i18n.t("revoke")}</Button>:""}
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
                                                                <input style={{width: '95%', height: '25px'}} type="number" placeholder={i18n.t("input")} onChange={(e) => { this.setInputValue(e.target.value) }}/>
                                                        }

                                                    </Flex.Item>
                                                </Flex>

                                            </div>

                                        } />
                                        <Step key={1} title={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}}>
                                                        {i18n.t("tx2")}
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
                           title={i18n.t("provideLiquidity")}
                           footer={[
                               {
                                   text:i18n.t("cancel"),
                                   onPress:()=>{
                                       this.setShowInvestModal(false).catch()
                                       this.setInputValue("")
                                   }
                               },
                               {
                                   text:i18n.t("ok"),
                                   onPress:()=>{
                                       this.invest(investTokenValue).catch()
                                   }
                               }
                           ]}>
                        <Flex>
                            <Flex.Item>
                                {i18n.t("tips2").replace("$1",i18n.t("provideLiquidity"))}<br/>
                                {i18n.t("tips3")}
                                <Steps current={investAmount[0]?1:0}>
                                    <Step key={0} title={
                                        <div>
                                            <div>
                                                <div style={{flex: 1}}>
                                                    <span>{i18n.t("tx1")}</span>&emsp;&emsp;{selectPair&&selectPair.tokenB} {i18n.t("balance")}:
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
                                        <span>{i18n.t("tx2")}</span>&emsp;&emsp;{selectPair&&selectPair.tokenA} {i18n.t("balance")}:
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
                                    {i18n.t("estimated")} {investShares} {i18n.t("shares")}
                                </div>
                            </Flex.Item>
                        </Flex>
                    </Modal>

                    <Modal visible={showDivestModal}
                           transparent
                           title={i18n.t("recyclingLiquidity")}
                           footer={[
                               {
                                   text:i18n.t("cancel"),
                                   onPress:()=>{
                                       this.setShowDivestModal(false)
                                    //    this.setInputValue("")
                                   }
                               },
                               {
                                   text:i18n.t("ok"),
                                   onPress:()=>{
                                       if(selectPair.myShare*1<inputValue*1){
                                           Toast.info(i18n.t("maxShares")+selectPair.myShare)
                                           return
                                       }
                                       this.divest()
                                   }
                               }
                           ]}
                        >
                        <WingBlank>
                            <Flex>
                                <Flex.Item style={{flex: 1}}><span>{i18n.t("shares")}</span></Flex.Item>
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

                    <SelectToken visible={showSelectTokenB} onOk={this.setSelectTokenB} onClose={this.setShowSelectTokenB} tokens={tokensB} balance={account&&account.balances}/>
                </div>
            </Layout>
        )
    }
}