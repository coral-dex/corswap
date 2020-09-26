import React, {Component} from 'react';
import {Button, Card,NoticeBar,Icon, Flex, InputItem, List, Modal, SearchBar, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {Select} from "./select";
import {showValue} from "./utils/common";
import Layout from "./layout";

const alert = Modal.alert;

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
            inputValue:""
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

    invest(tokenA, tokenB) {
        let self = this;
        let options = [{value: tokenA, label: tokenA}, {value: tokenB, label: tokenB}]
        let token = tokenA;
        let value;
        let minShare;
        console.log(options,token,"options----token");
        alert("", <div>
                <Flex>
                    <Flex.Item style={{flex: 1}}>最小份额:</Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '95%', height: '25px'}} onChange={(e) => {
                        minShare = e.target.value;
                    }}/></Flex.Item>
                </Flex>
                <WhiteSpace size="lg"/>
                <Flex>
                    <Flex.Item style={{flex: 1}}><Select style={{marginTop: '22px'}} options={options} onChange={option => {
                        token = option.value;
                    }}/></Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '95%', height: '25px'}}
                                                        onChange={(e) => {
                                                            value = e.target.value;
                                                        }}/></Flex.Item>
                </Flex>
            </div>,
            [
                {text: '取消', onPress: () => console.log('cancel'), style: 'default'},
                {
                    text: '确定', onPress: () => {
                        abi.getDecimal(token, function (decimals) {
                            let amount = new BigNumber(value).multipliedBy(Math.pow(10, decimals))
                            abi.investLiquidity(self.state.account.pk, self.state.account.mainPKr, minShare, token, amount)
                        })
                    }
                },
            ])
    }

    divest(tokenA, tokenB) {
        let self = this;
        let minTokenA;
        let minTokenB;
        let sharesBurned;
        alert("", <div>
                <Flex>
                    <Flex.Item style={{flex: 1}}>销毁:</Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '95%', height: '25px'}} onChange={(e) => {
                        sharesBurned = e.target.value;
                    }}/></Flex.Item>
                </Flex>
                <WhiteSpace size="lg"/>
                <Flex>
                    <Flex.Item style={{flex: 1}}>{tokenA}:</Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '95%', height: '25px'}} onChange={(e) => {
                        minTokenA = e.target.value;
                    }}/></Flex.Item>
                </Flex>
                <WhiteSpace size="lg"/>
                <Flex>
                    <Flex.Item style={{flex: 1}}>{tokenB}:</Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '95%', height: '25px'}}
                                                        onChange={(e) => {
                                                            minTokenB = e.target.value;
                                                        }}/></Flex.Item>
                </Flex>
            </div>,
            [
                {text: '取消', onPress: () => console.log('cancel'), style: 'default'},
                {
                    text: '确定', onPress: () => {
                        abi.getDecimal(tokenA, function (decimals) {
                            minTokenA = new BigNumber(minTokenA).multipliedBy(Math.pow(10, decimals)).toString(10);
                            abi.getDecimal(tokenB, function (decimals) {
                                minTokenB = new BigNumber(minTokenB).multipliedBy(Math.pow(10, decimals)).toString(10);
                                abi.divestLiquidity(self.state.account.pk, self.state.account.mainPKr, tokenA, tokenB, sharesBurned, minTokenA, minTokenB)
                            })
                        })
                    }
                },
            ])
    }

    withdrawCoral = (pair) => {
        abi.withdrawShareReward(this.state.account.pk, this.state.account.mainPKr, pair.tokenA, pair.tokenB);
    }

    searchcoral=(e)=>{
        const {pairs,pairsOrigin} = this.state;
        console.log(e.target.value,"Eeeeee");
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

    initExchange() {
        let account = this.state.account;
        let self = this;
        let options = [];
        let token;
        let amount;
        console.log("初始化资金池...");
        account.balances.forEach((val, key) => {
            if (!token) {
                token = key;
            }
            if (val > 0) {
                options.push({value: key, label: key})
            }
        });

        alert("初始化资金池", <div>
                <Flex>
                    <Flex.Item style={{flex: 1}}><Select style={{marginTop: '22px'}} options={options} onChange={option => {
                        token = option.value;
                    }}/></Flex.Item>
                    <Flex.Item style={{flex: 2}}><input style={{width: '95%', height: '25px'}}
                                                        onChange={(e) => {
                                                            amount = e.target.value;
                                                        }}/></Flex.Item>
                </Flex>
            </div>,
            [
                {text: '取消', onPress: () => console.log('cancel'), style: 'default'},
                {
                    text: '确定', onPress: () => {
                        abi.getDecimal(token, function (decimals) {
                            let value = new BigNumber(amount).multipliedBy(Math.pow(10, decimals));
                            abi.initializePair(account.pk, account.mainPKr, token, value);
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
                    <div>
                        <input type="text" onChange={(e)=>this.searchcoral(e)} onBlur={(e)=>this.searchcoral(e)} placeholder="搜索CoralSwap对和令牌" className="input search"/>
                    </div>
                    <div className="text-right ">
                        <span style={{color:"#00456b",fontSize:"12px"}} className="flex-direction"><input style={{borderRadius:"50%",marginTop:"5px"}} type="checkbox" />只看我的质押</span>
                    </div>
                    {
                        this.state.pairs.map((pair, index) => {
                            return (
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
                                                <WingBlank style={{padding:'0 12px'}}><Button type="warning" size="small" disabled={pair.myShare*1 == 0} onClick={() => {this.divest(pair.tokenA, pair.tokenB);}}>销毁流动性</Button></WingBlank>
                                            </Flex.Item>
                                            <Flex.Item>
                                                <WingBlank style={{padding:'0 12px'}}><Button type="primary" size="small" onClick={() => {this.invest(pair.tokenA, pair.tokenB);}}>提供流动性</Button></WingBlank>
                                            </Flex.Item>
                                            <Flex.Item>
                                                <WingBlank style={{padding:'0 12px'}}><Button type="primary" size="small" disabled={pair.shareRreward*1 == 0} onClick={() => {this.withdrawCoral(pair)}}>提现CORAL</Button></WingBlank>
                                            </Flex.Item>
                                        </Flex>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </Layout>
        )
    }
}