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
        let pic = "pic"
        account.imgs = pictures;
        console.log(account,"对象添加");
        // account.concat(this.state.pictures)
        // console.log(account,"acccount");
        // console.log(account.balances.pic,"value值");

        const pairs = this.state.pairs.map((pair, index) => {
            return (
                <Card key={index} style={{marginBottom: '10px'}}>
                    <Card.Header
                        title={<span>{pair.tokenA}-{pair.tokenB}</span>}
                    />
                    <Card.Body>
                        <div>
                            比例: {showValue(pair.reserveA, abi.getDecimalLocal(pair.tokenA,))}{pair.tokenA} = {showValue(pair.reserveB, abi.getDecimalLocal(pair.tokenB))}{pair.tokenB}
                        </div>
                        <WhiteSpace/>
                        <div>
                            总{pair.totalShares}份,销毁{pair.myShare}份
                        </div>
                        <WhiteSpace/>
                        {/*<div>*/}
                        {/*    {showValue(pair.totalVolume, 18)}-{showValue(pair.selfVolume, 18)}*/}
                        {/*</div>*/}
                    </Card.Body>
                    <Card.Footer content={
                        <div style={{padding:'0 12px'}}><Button type="warning" size="small" onClick={() => {this.divest(pair.tokenA, pair.tokenB);}}>销毁流动性</Button></div>
                        }
                                 extra={
                                     <div style={{padding:'0 12px'}}><Button type="primary" size="small" onClick={() => {this.invest(pair.tokenA, pair.tokenB);}}>提供流动性</Button></div>

                        }
                    />
                </Card>
            )
        });
        let card = [];
        let images = [];
        let that = this;
        let num = 0;
        account.balances.forEach((key,val)=>{
            card.push( <div className="am-card">
                <div className="flex" style={{borderBottom:"1px dotted #00456b",paddingBottom:"7px"}}>
                    <div>
                        <img width="50%" src={pictures[num]}/> 
                    </div>
                    <div style={{color:"#f75552"}}>
                        <div className="text-right"><img src={require("../images/user.png")} width="20%"/></div>
                        <div style={{color:"#f75552",marginRight:"30px",fontSize:"12px",whiteSpace:"nowrap"}}>我持有的比例:%</div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="font-weight" style={{margin:"10px 0",fontSize:"20px"}}>CORAL - {val}</div>
                    <div style={{fontSize:"12px"}}>存入{val}赚CORAL</div>
                </div>
            </div>)
        ++num;
        })

        return (
            <Layout selectedTab="3">
                <Flex className="flex">
                    <Flex.Item style={{flex:1}}>
                        <div>
                            <img src={require("../images/logo.png")} alt="" width="70%"/>
                        </div>
                    </Flex.Item>
                    <Flex.Item style={{flex:1}}>
                        <div className="text-right">
                            <div style={{color:"#f75552"}} onClick={()=>{this.initExchange()}}>初始化资金池</div>
                        </div>
                    </Flex.Item>
                </Flex>

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
                    {pairs}
                </div>
            </Layout>
        )
    }
}