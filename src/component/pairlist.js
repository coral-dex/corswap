import React, {Component} from 'react';
import {Button, Card,NoticeBar,Icon,Steps, Flex, InputItem, List, Modal, SearchBar, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {Select} from "./select";
import {showValue} from "./utils/common";
import Layout from "./layout";
import SelectToken from './selectToken'

const alert = Modal.alert;
const Step = Steps.Step;

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
            selectTokenB:""

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
        console.log("init",search);
        let self = this;
        if (!account) {
            account = this.state.account;
        }
        if (!search) {
            search = this.state.search;
        }

        abi.pairList(account.mainPKr, search, function (pairs) {
            self.setState({pairs: pairs,pairsOrigin:pairs});
        });
    }

    startGetTxReceipt = (hash,cb) =>{
        const that = this;
        abi.getTransactionReceipt(hash).then(res=>{
            console.log("getTxReceipt>>>> ",res);
            if(res && res.result){
                Toast.success("Success")
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
        abi.init.then(() => {
            abi.accountDetails(self.state.pk, function (account) {
                self.setState({account: account});
                self.init(account);
                // let iterId = sessionStorage.getItem("iterId")
                // if(iterId){
                //     clearInterval(iterId);
                // }
                // iterId = setInterval(function () {
                //     self.init();
                // }, 10000)
                // sessionStorage.setItem("iterId",iterId)
            });
        });
    }
    componentWillReceiveProps(nextProps, nextContext) {
        this.doUpdate()
    }

    async invest(pair) {
        const {tokenA,tokenB,reserveA,reserveB} = pair;
        const price = new BigNumber(reserveB).dividedBy(reserveA)

        const {account,inputValue} = this.state;
        let self = this;
        let token = tokenA;
        let value;
        let decimal = 18;
        const rest = await abi.investAmount(account.mainPKr)
        let valueB = ""
        if(rest[0]){
            decimal = await abi.getDecimalAsync(rest[0])
            valueB = new BigNumber(rest[1]).dividedBy(10**18).dividedBy(price).toFixed(3,1)
        }else{
            token = tokenB;
            if(inputValue){
                valueB = new BigNumber(inputValue).dividedBy(price).toFixed(3,1)
            }
        }

        alert("提供流动性", <div>

                <Flex>
                    <Flex.Item>
                        1. 需要分两次交易完成<br/>
                        2. 请等待第一笔交易完成后再发送第二笔交易<br/>
                        3. 提供流动性，你将获得CORAL。
                        <Steps current={rest[0]?1:0}>
                            <Step key={0} title="交易1" description={
                                <div>
                                    <Flex>
                                        <Flex.Item style={{flex: 4}}>
                                            {tokenB}
                                        </Flex.Item>
                                        <Flex.Item style={{flex: 5}}>
                                            {
                                                rest[0]?showValue(rest[1],decimal,3): <input style={{width: '95%', height: '25px'}} onChange={(e) => {self.setState({inputValue:e.target.value});value=e.target.value}}/>
                                            }
                                        </Flex.Item>
                                    </Flex>
                                </div>
                            } />
                            <Step key={1} title="交易2" description={
                                <div>
                                    <Flex>
                                        <Flex.Item style={{flex: 4}}>
                                            {tokenA}
                                        </Flex.Item>
                                        <Flex.Item style={{flex: 5}}>
                                            <input style={{width: '95%', height: '25px'}} disabled={!rest[0]} onChange={(e) => {value=e.target.value}} value={valueB}/>
                                        </Flex.Item>
                                    </Flex>
                                </div>
                            } />
                        </Steps>

                    </Flex.Item>
                </Flex>
            </div>,
            [
                {text: '取消', onPress: () => {
                        self.setState({
                            inputValue:""
                        })
                    }, style: 'default'},
                {
                    text: '确定', onPress: () => {
                        self.setState({
                            inputValue:""
                        })
                        abi.getDecimal(token, function (decimals) {
                            let amount = new BigNumber(value).multipliedBy(Math.pow(10, decimals))
                            abi.investLiquidity(self.state.account.pk, self.state.account.mainPKr, token, amount).then(rest=>{
                                Toast.loading("Pending...",60);
                                self.startGetTxReceipt(rest,function () {
                                    if(!rest[0]){
                                        self.invest(tokenA,tokenB).catch()
                                    }
                                });
                            }).catch(e=>{
                                Toast.fail(e)
                            })
                        })
                    }
                },
            ])
    }

    divest(pair) {
        let self = this;
        const {tokenA, tokenB,inputValue,reserveA,reserveB,totalShares} = pair;

        console.log(tokenA, tokenB,inputValue,reserveA,reserveB,totalShares);

        const valueA = new BigNumber(reserveA).dividedBy(new BigNumber(totalShares)).multipliedBy(new BigNumber(inputValue?inputValue:0)).toFixed(3,1)
        const valueB = new BigNumber(reserveB).dividedBy(new BigNumber(totalShares)).multipliedBy(new BigNumber(inputValue?inputValue:0)).toFixed(3,1)

        let sharesBurned;
        alert("回收流动性", <WingBlank>
                <Flex>
                    <Flex.Item style={{flex: 1}}>份数</Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '100%', height: '25px'}} onChange={(e) => {
                        sharesBurned = e.target.value;
                        self.setState({inputValue:e.target.value})
                    }}/></Flex.Item>
                </Flex>
                <Flex>
                    <Flex.Item style={{flex: 1}}>{tokenA}</Flex.Item>
                    <Flex.Item style={{flex: 2}}>{valueA}</Flex.Item>
                </Flex>
                <Flex>
                    <Flex.Item style={{flex: 1}}>{tokenB}</Flex.Item>
                    <Flex.Item style={{flex: 2}}>{valueB}</Flex.Item>
                </Flex>
            </WingBlank>,
            [
                {text: '取消', onPress: () => {
                        self.setState({
                        inputValue:""
                    })
                    }, style: 'default'},
                {
                    text: '确定', onPress: () => {
                        self.setState({
                            inputValue:""
                        })
                        abi.divestLiquidity(self.state.account.pk, self.state.account.mainPKr, tokenA, tokenB, sharesBurned).then(rest=>{
                            Toast.loading("Pending...",60);
                            self.startGetTxReceipt(rest);
                        }).catch(e=>{
                            Toast.fail(e)
                        })
                    }
                },
            ])
    }

    withdrawCoral = (pair) => {
        const self = this;
        abi.withdrawShareReward(this.state.account.pk, this.state.account.mainPKr, pair.tokenA, pair.tokenB).then(rest=>{
            Toast.loading("Pending...",60);
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

    async setShowDivestModal(f){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
        }
        this.setState({
            investAmount:rest,
            showDivestModal:f
        })
    }

    async setShowInvestModal(f){
        let account = this.state.account;
        let rest = ["",0];
        if(f){
            rest = await abi.investAmount(account.mainPKr)
        }
        this.setState({
            investAmount:rest,
            showInvestModal:f
        })
    }

    async initExchange(selectTokenA,selectTokenB) {
        const that = this;
        const {account,investAmount,inputValue}= this.state;
        const token = investAmount[0]?selectTokenB:selectTokenA
        abi.getDecimal(token, function (decimals) {
            let value = new BigNumber(inputValue).multipliedBy(Math.pow(10, decimals));
            abi.initializePair(account.pk, account.mainPKr, token, value).then(rest=>{
                Toast.loading("Pending...",60);
                that.startGetTxReceipt(rest,function () {
                    if(!rest[0]){
                        that.setShowInitModal(false).catch()
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

    render() {

        let imgs = []
        let {account,pictures,showDivestModal,showInvestModal,showInitModal,investAmount,showSelectTokenA,showSelectTokenB,selectTokenA,selectTokenB,inputValue} = this.state;
        imgs.push(pictures);
        account.imgs = pictures;


        let tokensB = [];
        let tokensA = [];
        const ops = ["SERO","SUSD"];

        account.balances.forEach((val, key) => {
            if (val > 0) {
                if(ops.indexOf(key) == -1){
                    tokensB.push(key)
                }else{
                    tokensA.push(key)
                }
            }
        });

        if(!selectTokenA){
            selectTokenA = tokensA.length>0 ? tokensA[0]:""
        }
        if(!selectTokenB){
            selectTokenB = tokensB.length>0 ? tokensB[0]:""
        }

        console.log("render>>>> ",investAmount,selectTokenA,selectTokenB);

        return (
            <Layout selectedTab="3" doUpdate={this.doUpdate}>
                <div className="pairlist">
                    <p className="flex" style={{color:"#00456b",fontSize:"12px"}} className="text-center">
                        <img width="14px" src={require('../images/horn.png')}/>
                        <span>通过为不同交易池提供流动性，获得CORAL</span>
                    </p>
                    <WhiteSpace/>
                    <WingBlank>
                        <Button type="primary" size="small" onClick={()=>{this.setShowInitModal(true).catch()}} className="btn-bg">+ 初始化资金池</Button>
                    </WingBlank>
                    <WhiteSpace/>
                    <div>
                        <input type="text" onChange={(e)=>this.searchcoral(e)} onBlur={(e)=>this.searchcoral(e)} placeholder="搜索CoralSwap对和令牌" className="input search"/>
                    </div>
                    <WhiteSpace/>
                    <div className="text-right ">
                        <span style={{color:"#00456b",fontSize:"12px"}} className="flex-direction"><input style={{borderRadius:"50%",marginTop:"5px"}} type="checkbox" onChange={e=>{
                            this.showMyOnly(e.target.checked)
                        }} />只看我的质押</span>
                    </div>
                    <WhiteSpace/>
                    {
                        this.state.pairs.map((pair, index) => {
                            return (
                                <div>
                                    <div className="am-card card-border">
                                        <div className="flex" style={{borderBottom:"1px dotted #00456b",paddingBottom:"7px"}}>
                                            <div>
                                                <img width="50%" src={pictures[0]} />
                                            </div>
                                            <div style={{color:"#f75552"}}>
                                                <div className="text-right">{pair.myShare*1>0?<img src={require("../images/user.png")} width="20%"/>:""}</div>
                                                <div style={{color:"#f75552",marginRight:"30px",fontSize:"12px",whiteSpace:"nowrap"}}>我持有{pair.myShare}份, 比例: {(pair.myShare/pair.totalShares*100).toFixed(2)}%</div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-weight" style={{margin:"10px 0",fontSize:"20px"}}>{pair.tokenA}-{pair.tokenB}</div>
                                            <div>
                                                {showValue(pair.reserveA, abi.getDecimalLocal(pair.tokenA,))}{pair.tokenA} = {showValue(pair.reserveB, abi.getDecimalLocal(pair.tokenB))}{pair.tokenB}
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
                                                    <Button type="warning" size="small" disabled={pair.myShare*1 == 0} onClick={() => {this.setShowDivestModal(true).catch()}}>回收流动性</Button>
                                                </Flex.Item>
                                                <Flex.Item>
                                                    <Button type="primary" size="small" onClick={() => {this.setShowInitModal(true).catch();}}>提供流动性</Button>
                                                </Flex.Item>
                                                <Flex.Item>
                                                    <Button type="primary" size="small" disabled={pair.shareRreward*1 == 0} onClick={() => {this.withdrawCoral(pair)}}>提现</Button>
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
                                                    <Flex.Item style={{flex: 2}}>
                                                        {/*余额: {account && showValue(account.balances.get(selectTokenA),abi.getDecimalLocal(selectTokenA),3)} {selectTokenA}*/}
                                                    </Flex.Item>
                                                </Flex>
                                            </div>
                                        } description={
                                            <div>
                                                {
                                                    <InputItem className="inputItem" readOnly={!!investAmount[0]} value={investAmount[0]?showValue(investAmount[1],abi.getDecimalLocal(investAmount[0]),3):inputValue} onChange={(e)=>this.setInputValue(e)} >
                                                        <div onClick={()=>this.setShowSelectTokenA(true)}>
                                                            <span>{investAmount[0]?investAmount[0]:selectTokenA}</span>
                                                            <img width="13px" className="absolute1" src={require('../images/bottom.png')}/>
                                                        </div>
                                                    </InputItem>
                                                }


                                            </div>
                                        } />
                                        <Step key={1} title={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}}>
                                                        交易二
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 2}}>
                                                        {/*余额: {account&&showValue(account.balances.get(selectTokenB),abi.getDecimalLocal(selectTokenB),3)} {selectTokenB}*/}
                                                    </Flex.Item>
                                                </Flex>
                                            </div>
                                        } description={
                                            <div>
                                                <Flex>
                                                    <Flex.Item style={{flex: 1}} onClick={()=>this.setShowSelectTokenB(true)}>
                                                        <span>{selectTokenB}</span>
                                                        <img width="13px" className="absolute1" src={require('../images/bottom.png')}/>
                                                    </Flex.Item>
                                                    <Flex.Item style={{flex: 2}}>
                                                        <input style={{width: '95%', height: '25px'}} type="number" disabled={!investAmount[0]} onChange={(e) => { this.setInputValue(e.target.value) }}/>
                                                    </Flex.Item>
                                                </Flex>
                                            </div>
                                        } />
                                    </Steps>

                                </Flex.Item>
                            </Flex>

                        </div>
                    </Modal>

                    {/*<Modal visible={showInvestModal}>*/}
                    {/*    <Flex>*/}
                    {/*        <Flex.Item>*/}
                    {/*            1. 需要分两次交易完成<br/>*/}
                    {/*            2. 请等待第一笔交易完成后再发送第二笔交易<br/>*/}
                    {/*            3. 提供流动性，你将获得CORAL。*/}
                    {/*            <Steps current={investAmount[0]?1:0}>*/}
                    {/*                <Step key={0} title="交易1" description={*/}
                    {/*                    <div>*/}
                    {/*                        <Flex>*/}
                    {/*                            <Flex.Item style={{flex: 4}}>*/}
                    {/*                                {tokenB}*/}
                    {/*                            </Flex.Item>*/}
                    {/*                            <Flex.Item style={{flex: 5}}>*/}
                    {/*                                {*/}
                    {/*                                    investAmount[0]?showValue(investAmount[1],decimal,3): <input style={{width: '95%', height: '25px'}} onChange={(e) => {self.setState({inputValue:e.target.value});value=e.target.value}}/>*/}
                    {/*                                }*/}
                    {/*                            </Flex.Item>*/}
                    {/*                        </Flex>*/}
                    {/*                    </div>*/}
                    {/*                } />*/}
                    {/*                <Step key={1} title="交易2" description={*/}
                    {/*                    <div>*/}
                    {/*                        <Flex>*/}
                    {/*                            <Flex.Item style={{flex: 4}}>*/}
                    {/*                                {tokenA}*/}
                    {/*                            </Flex.Item>*/}
                    {/*                            <Flex.Item style={{flex: 5}}>*/}
                    {/*                                <input style={{width: '95%', height: '25px'}} disabled={!investAmount[0]} onChange={(e) => {value=e.target.value}} value={valueB}/>*/}
                    {/*                            </Flex.Item>*/}
                    {/*                        </Flex>*/}
                    {/*                    </div>*/}
                    {/*                } />*/}
                    {/*            </Steps>*/}

                    {/*        </Flex.Item>*/}
                    {/*    </Flex>*/}
                    {/*</Modal>*/}

                    {/*<Modal visible={showDivestModal}>*/}
                    {/*    <WingBlank>*/}
                    {/*        <Flex>*/}
                    {/*            <Flex.Item style={{flex: 1}}>份数</Flex.Item>*/}
                    {/*            <Flex.Item style={{flex: 2}}><input style={{width: '100%', height: '25px'}} onChange={(e) => {*/}
                    {/*                sharesBurned = e.target.value;*/}
                    {/*                self.setState({inputValue:e.target.value})*/}
                    {/*            }}/></Flex.Item>*/}
                    {/*        </Flex>*/}
                    {/*        <Flex>*/}
                    {/*            <Flex.Item style={{flex: 1}}>{tokenA}</Flex.Item>*/}
                    {/*            <Flex.Item style={{flex: 2}}>{valueA}</Flex.Item>*/}
                    {/*        </Flex>*/}
                    {/*        <Flex>*/}
                    {/*            <Flex.Item style={{flex: 1}}>{tokenB}</Flex.Item>*/}
                    {/*            <Flex.Item style={{flex: 2}}>{valueB}</Flex.Item>*/}
                    {/*        </Flex>*/}
                    {/*    </WingBlank>*/}
                    {/*</Modal>*/}

                    <SelectToken visible={showSelectTokenA} onOk={this.setSelectTokenA} tokens={tokensA} balance={account&&account.balances}/>

                    <SelectToken visible={showSelectTokenB} onOk={this.setSelectTokenB} tokens={tokensB} balance={account&&account.balances}/>
                </div>
            </Layout>
        )
    }
}