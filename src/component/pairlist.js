import React, {Component} from 'react';
import {Button, Card,NoticeBar,Icon,Steps, Flex, InputItem, List, Modal, SearchBar, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {Select} from "./select";
import {showValue} from "./utils/common";
import Layout from "./layout";

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
        }
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
        let self = this;
        abi.accountDetails(nextProps.pk, function (account) {
            self.setState({account: account});
            self.init(account);
        });
    }

    async invest(tokenA, tokenB) {
        const {account} = this.state;
        let self = this;
        let options = [{value: tokenA, label: tokenA}, {value: tokenB, label: tokenB}]
        let token = tokenA;
        let value;
        let decimal = 18;
        const rest = await abi.investAmount(account.mainPKr)
        if(rest[0]){
            decimal = await abi.getDecimalAsync(rest[0])
        }else{
            token = tokenB;
        }
        console.log(options,token,"options----token");
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
                                        <Flex.Item style={{flex: 3}}>
                                            {tokenB}
                                        </Flex.Item>
                                        <Flex.Item style={{flex: 7}}>
                                            {
                                                rest[0]?showValue(rest[1],decimal,3): <input style={{width: '95%', height: '25px'}} onChange={(e) => {value = e.target.value;}}/>
                                            }
                                        </Flex.Item>
                                    </Flex>
                                </div>
                            } />
                            <Step key={1} title="交易2" description={
                                <div>
                                    <Flex>
                                        <Flex.Item style={{flex: 3}}>
                                            {tokenA}
                                        </Flex.Item>
                                        <Flex.Item style={{flex: 7}}>
                                            <input style={{width: '95%', height: '25px'}} disabled={!rest[0]} onChange={(e) => { value = e.target.value; }}/>
                                        </Flex.Item>
                                    </Flex>
                                </div>
                            } />
                        </Steps>

                    </Flex.Item>
                </Flex>
            </div>,
            [
                {text: '取消', onPress: () => console.log('cancel'), style: 'default'},
                {
                    text: '确定', onPress: () => {
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

    divest(tokenA, tokenB) {
        let self = this;
        let sharesBurned;
        alert("销毁", <WingBlank>
                <Flex>
                    <Flex.Item style={{flex: 1}}>份数</Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '100%', height: '25px'}} onChange={(e) => {
                        sharesBurned = e.target.value;
                    }}/></Flex.Item>
                </Flex>
            </WingBlank>,
            [
                {text: '取消', onPress: () => console.log('cancel'), style: 'default'},
                {
                    text: '确定', onPress: () => {
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

    async initExchange() {
        let account = this.state.account;
        let self = this;
        let options = [];
        let option2 = [];
        const ops = ["SERO","SUSD"];
        // ops.forEach((val,i)=>{
        //     option2.push({value: val, label: val})
        // })
        let token;
        let amount;
        console.log("初始化资金池...");
        let decimal = 18;
        const rest = await abi.investAmount(account.mainPKr)
        if(rest[0]){
            decimal = await abi.getDecimalAsync(rest[0])
        }else{
            token = ops[0];
        }
        account.balances.forEach((val, key) => {
            if (!token) {
                token = key;
            }
            if (val > 0) {
                const decimal = abi.getDecimalLocal(key)
                if(ops.indexOf(key) == -1){
                    options.push({value: key, label: key + " " + showValue(val,decimal,2)})
                }else{
                    option2.push({value: key, label: key+ " " + showValue(val,decimal,2)})
                }
            }
        });

        Modal.alert("初始化资金池", <div>
                <Flex>
                    <Flex.Item>
                        1. 初始化资金需要分两次交易完成<br/>
                        2. 请等待第一笔交易完成后再发送第二笔交易
                        <Steps current={rest[0]?1:0}>
                            <Step key={0} title="交易1" description={
                                <div>
                                    <Flex>
                                        <Flex.Item style={{flex: 3}}>
                                            {
                                                rest[0]?rest[0]:<div>
                                                    <Select style={{marginTop: '22px'}} options={option2} onChange={option => {
                                                        token = option.value;
                                                    }}/>
                                                    <img width="13px" className="absolute1" src={require('../images/bottom.png')}/>
                                                </div>
                                            }
                                        </Flex.Item>
                                        <Flex.Item style={{flex: 7}}>
                                            {
                                                rest[0]?showValue(rest[1],decimal,3): <input style={{width: '95%', height: '25px'}} onChange={(e) => {amount = e.target.value;}}/>
                                            }
                                        </Flex.Item>
                                    </Flex>
                                </div>
                            } />
                            <Step key={1} title="交易2" description={
                                <div>
                                    <Flex>
                                        <Flex.Item style={{flex: 3}}>
                                            <Select style={{marginTop: '22px'}} options={options} onChange={option => {
                                                if(rest[0]){
                                                    token = option.value;
                                                }}}/>
                                            <img width="13px" className="absolute1" src={require('../images/bottom.png')}/>
                                        </Flex.Item>
                                        <Flex.Item style={{flex: 7}}>
                                            <input style={{width: '95%', height: '25px'}} disabled={!rest[0]} onChange={(e) => { amount = e.target.value; }}/>
                                        </Flex.Item>
                                    </Flex>
                                </div>
                            } />
                        </Steps>

                    </Flex.Item>
                </Flex>

            </div>,

            [
                {text: '取消', onPress: () => console.log('cancel'), style: 'default'},
                {
                    text: '确定', onPress: () => {
                        abi.getDecimal(token, function (decimals) {
                            let value = new BigNumber(amount).multipliedBy(Math.pow(10, decimals));
                            abi.initializePair(account.pk, account.mainPKr, token, value).then(rest=>{
                                Toast.loading("Pending...",60);
                                self.startGetTxReceipt(rest,function () {
                                    if(!rest[0]){
                                        self.initExchange().catch()
                                    }
                                });
                            }).catch(e=>{
                                Toast.fail(e)
                            });
                        })
                    }
                },
            ])
    }

    render() {
        let imgs = []
        let {account,pictures} = this.state;
        imgs.push(pictures);
        account.imgs = pictures;
        return (
            <Layout selectedTab="3" doUpdate={this.doUpdate}>


                <div className="pairlist">
                    <p className="flex" style={{color:"#00456b",fontSize:"12px"}} className="text-center">
                        <img width="14px" src={require('../images/horn.png')}/>
                        <span>通过为不同交易池提供流动性，获得CORAL</span>
                    </p>
                    <WhiteSpace/>
                    <WingBlank>
                        <Button type="primary" size="small" onClick={()=>{this.initExchange()}} className="btn-bg">+ 初始化资金池</Button>
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
                                                <img width="50%" src={pictures[0]}/>
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
                                                    <WingBlank style={{padding:'0 4px'}}><Button type="warning" size="small" disabled={pair.myShare*1 == 0} onClick={() => {this.divest(pair.tokenA, pair.tokenB);}}>销毁</Button></WingBlank>
                                                </Flex.Item>
                                                <Flex.Item>
                                                    <WingBlank style={{padding:'0 4px'}}><Button type="primary" size="small" onClick={() => {this.invest(pair.tokenA, pair.tokenB).catch();}}>提供流动性</Button></WingBlank>
                                                </Flex.Item>
                                                <Flex.Item>
                                                    <WingBlank style={{padding:'0 4px'}}><Button type="primary" size="small" disabled={pair.shareRreward*1 == 0} onClick={() => {this.withdrawCoral(pair)}}>提现</Button></WingBlank>
                                                </Flex.Item>
                                            </Flex>
                                        </div>
                                    </div>
                                    <WhiteSpace size="lg"/>
                                </div>
                            )
                        })
                    }
                </div>
            </Layout>
        )
    }
}