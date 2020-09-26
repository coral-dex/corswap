import React, {Component} from 'react';
import {
    Button,
    Card,
    Flex,
    InputItem,
    List,
    Tag,
    Modal,
    Tabs,
    TabBar,
    Toast,
    WhiteSpace,
    WingBlank,
    Popover,
    NavBar,
    Icon
} from "antd-mobile";
import abi from "./abi";
import {dateFormat, showValue} from './utils/common'
// import {Exchange} from "./exchange";
import {PairList} from "./pairlist";
import {Shares} from "./shares";
import {Select} from "./select";
import {OrderList} from "./orderlist"
import BigNumber from "bignumber.js";
import '../style/style.css'
import Layout from "./layout";
import {bnToHex} from './utils/common'

const operation = Modal.operation;
const alert = Modal.alert;
const Item = Popover.Item;
const tabs = [
    {title: '我要买', type: '1'},
    {title: '资金池', type: '2'},
    {title: '分红', type: '3'},
    {title: '我要卖', type: '4'},
];

export class Exchange extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            selected: 'zh_CN',
            selectedTab: 'redTab',
            hidden: false,
            fullScreen: false,
            modal1: false,
            pk: localStorage.getItem("accountPK"),
            account: {balances: new Map()},
            tokens: [],
            amount: [],
            tokenToTokens: new Map(),
            tokenInAmount: 0,
            tokenOutAmount: 0,
            orderType: 0,
            modal: false,
            flag: false,
            put1: 0, // from
            put2: 0,  // to
            option1: '',
            option2: '',
            inputStyle:null
        }
    }

    init(account) {
        let self = this;
        // let tokens = [];
        let amount = [];
        account.balances.forEach((val, key) => {
            abi.getDecimal(key,function (d) {
            })
            // tokens.push(key);
            amount.push(val)
        });
        // if (tokens.length === 0) {
        //     return;
        // }

        // let tokenToTokens = new Map();
        abi.getGroupTokensEx(account.mainPKr,true, function (tokens, tokenToTokens) {
           
            if (tokens.length > 0) {
                abi.getDecimal(tokens[0],function (d) {
                    console.log(tokens[0],d);
                })
                abi.getDecimal(tokenToTokens.get(tokens[0])[0],function (d) {
                })
                // console.log(tokenToTokens,amount,"tokentotokens");
                self.initPair(tokens[0], tokenToTokens.get(tokens[0])[0], function (pair) {
                    console.log(pair,"pairrrr");
                    self.setState({
                        tokenIn: tokens[0],
                        tokenIn2: tokens[1],
                        tokenOut: tokenToTokens.get(tokens[0])[0],
                        tokens: tokens,
                        amount: amount,
                        tokenToTokens: tokenToTokens,
                        pair: pair
                    })
                    // console.log(self.state.tokens,"this is state tokens");
                });
            }
        });
    }

    doUpdate = ()=>{
        let self = this;
        abi.init
            .then(() => {
                let pk = localStorage.getItem("accountPK")
                abi.accountList(function (accounts) {
                    console.log("accounts", accounts);
                    if (pk) {
                        for (let act of accounts) {
                            if (pk == act.pk) {
                                self.setState({account: act});
                                break;
                            }
                        }
                    } else {
                        pk = accounts[0].pk;
                        self.setState({account: accounts[0]});
                    }
                    console.log("pk", pk);
                    abi.accountDetails(pk, function (account) {
                        self.setState({account: account}, function () {
                            self.init(account)
                        })
                    })
                });

            });
    }

    initPair(tokenA, tokenB, callback) {
        let self = this;
        abi.pairInfoWithOrders(this.state.account.mainPKr, tokenA, tokenB, function (pair) {
            callback(pair);
        })
    }

    componentDidMount() {
        this.doUpdate();
    }

    compoonentWillReceiveProps(nextPorps, nextContxt) {
        // let self = this;
        // abi.accountDetails(nextPorps.pk,function(account){
        //   self.setState({account:account},function(){
        //     self.init(account)
        //   })
        // })
    }

    showRate(amountIn) {
        this.setState({
            inputStyle:amountIn
        })
        if (!amountIn || !this.state.pair || Number(amountIn) == 0) {
            this.setState({tokenInAmount: amountIn, tokenOutAmount: 0, price: 0});
            return;
        }

        let self = this;

        let amountOut;
        let pair = this.state.pair;

        // let reserveA = new BigNumber(pair.reserveA);
        // let reserveB = new BigNumber(pair.reserveB);
        // let invariant = reserveA.multipliedBy(reserveB);

        abi.estimateSwap(this.state.account.mainPKr, pair.tokenA, pair.tokenB, self.state.tokenOut, bnToHex(amountIn, parseInt(abi.getDecimalLocal(pair.tokenB))), function (out) {

            amountOut = new BigNumber(out).dividedBy(10**18)

            let price = new BigNumber(amountOut).dividedBy(amountIn).toFixed(6)
            self.setState({tokenInAmount: amountIn, tokenOutAmount: amountOut.toNumber(), price: price});
        });

    }

    exchange(tokenA, tokenB, amount, minTokensReceived) {
        abi.swap(this.state.account.pk, this.state.account.mainPKr, tokenA, tokenB, amount, minTokensReceived);
    }

    showAccount(account, len) {
        if (!account || !account.mainPKr) {
            return "";
        }
        if (!len) {
            len = 8;
        }

        window.localStorage.setItem("accountPK", account.pk)
        return account.name + " " + account.mainPKr.slice(0, len) + "..." + account.mainPKr.slice(-len)
    }

    showModal = (key) => {
        if (this.state.modal) {
            this.setState({
                [key]: false
            })
        } else {
            this.setState({
                [key]: true
            })
        }

    }

    renderOrders() {
        if (!this.state.pair) {
            return;
        }
        let orders;
        if (this.state.orderType == 0) {
            orders = this.state.pair.orders.sort((o1, o2) => {
                return o2.timestamp - o1.timestamp;
            });
        } else {
            orders = this.state.pair.selfOrders.sort((o1, o2) => {
                return o2.timestamp - o1.timestamp;
            });
        }

        let orderList = orders.map((order, index) => {
            let tokenIn = this.state.pair.tokenA;
            let tokenOut = this.state.pair.tokenB;
            if (order.orderType == 1) {
                tokenIn = this.state.pair.tokenB;
                tokenOut = this.state.pair.tokenA;
            }
            return (
                <List.Item key={index}>
                    <Flex style={{fontSize: '14px'}}>
                        <Flex.Item style={{flex: 3, textAlign: 'left'}}><span>
                          {dateFormat("mm-dd HH:MM", new Date(order.timestamp * 1000))}
                      </span></Flex.Item>
                        <Flex.Item style={{
                            flex: 3,
                            textAlign: 'left'
                        }}><span>{showValue(order.amountIn)} {tokenIn}</span></Flex.Item>
                        <Flex.Item style={{flex: 1, textAlign: 'center'}}><span>-</span></Flex.Item>
                        <Flex.Item style={{
                            flex: 3,
                            textAlign: 'right'
                        }}><span>{showValue(order.amountOut)} {tokenOut}</span></Flex.Item>
                    </Flex>
                </List.Item>
            )
        });
        return orderList;

    }

    showModal = (key) => {
        if (this.state.modal) {
            this.setState({
                [key]: false
            })
        } else {
            this.setState({
                [key]: true
            })
        }

    }

    changeAccount() {
        let self = this;

        abi.init
            .then(() => {
                abi.accountList(function (accounts) {
                    let actions = [];
                    accounts.forEach(function (account, index) {
                        actions.push(
                            {
                                text: <span>{self.showAccount(account)}</span>, onPress: () => {
                                    self.setState({account: account});
                                }
                            }
                        );
                    });
                    operation(actions);
                });
            })
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

    numberMax(balance) {
        let num = showValue(balance, abi.getDecimalLocal(this.state.tokenIn))
        console.log(showValue(balance, abi.getDecimalLocal(this.state.tokenIn)), "111")
        this.setState({
            put1: num
        })
    }

    onSelect = (opt) => {
        // console.log(opt.props.value);
        this.setState({
            visible: false,
            selected: opt.props.value,
        });
    };
    handleVisibleChange = (visible) => {
        this.setState({
            visible,
        });
    };

    renderContent(pageText) {
        return (
            <div style={{backgroundColor: '#e9f4f8', height: '100%', textAlign: 'center'}}>
            </div>
        );
    }

    goPage = (uri) => {
        window.location.href = uri
        // window.open(uri)
    }

    render() {
        let self = this;
        let options_1 = [];
        let options_2 = [];
        console.log(this.state.tokens,"tokenss");
        console.log(this.state.tokenToTokens,"tokenToTokens");
        this.state.tokens.forEach(each => {
            options_1.push({value: each, label: each});

        });
        let tokens = this.state.tokenToTokens.get(this.state.tokenIn);
        if (tokens) {
            tokens.forEach(each => {
                options_2.push({value: each, label: each});
            });
        }
        let currency = [[], []];
        this.state.tokens.map(val => {
            currency[0].push(val);
        })
        this.state.amount.map(val => {
            currency[1].push(val)
        })
        let balance = 0;
        let usable = 0;
        if (this.state.account.balances.has(this.state.tokenIn)) {
            balance = this.state.account.balances.get(this.state.tokenIn);
           
        }
        if (this.state.account.balances.has(this.state.tokenOut)) {
            usable = this.state.account.balances.get(this.state.tokenOut);
           
        }
        // let froms = <div className="flex max_sero">

        //     <div className="flex">
        //         {/* <Tag small className="tag" selected="true" onClick={()=>this.numberMax(balance2)}>MAX</Tag> */}
        //         <div className="flex modal" onClick={() => this.showModal('')}>
        //             {/* <img width="20%" src={require("../images/sero (1).png")}/>
        //                                 <span>{this.state.topOption}</span>
        //                                 <Icon type="down"/> */}
        //             <Select
        //                 options={options_1}
        //                 className="select"
        //                 selectedOption={{value: this.state.tokenIn}}
        //                 onChange={(option) => {
        //                     this.setState({option1: option})
        //                     let tokenOut = this.state.tokenToTokens.get(option.value)[0];
        //                     this.initPair(option.value, tokenOut, function (pair) {
        //                         self.setState({pair: pair, tokenIn: option.value, tokenOut: tokenOut});
        //                         self.showRate(self.state.tokenInAmount);
        //                     })
        //                 }}/>
        //         </div>
        //     </div>
        //     <div>
        //         <List>
        //             <input value={this.state.tokenOutAmount} disabled={true} type="text" className="inputItem"/>
        //         </List>
        //     </div>
        // </div>
        // let tos = <div className="space-between max_sero">

        //     <div className="end">
        //         <div className="flex modal" onClick={() => this.showModal("")}>
        //             {/* <span>{this.state.bottomOption}</span>
        //             <Icon type="down"/> */}
        //             <Select
        //                 className="select"
        //                 style={{height: "20px"}}
        //                 options={options_2}
        //                 onChange={(option) => {
        //                     this.setState({option2: option})
        //                     this.initPair(this.state.tokenIn, option.value, function (pair) {
        //                         self.setState({pair: pair, tokenOut: option.value});
        //                         self.showRate(self.state.tokenInAmount);
        //                     })
        //                 }}/>
        //         </div>
        //     </div>
        //     <div>
        //         <List>
        //             <input style={{borderBottom:"1px solid #5a87a2"}} value={this.state.tokenInAmount}  onChange={(e) => {
        //                 this.showRate(e.target.value)
        //             }} type="text" className="inputItem"/>
        //         </List>
        //     </div>
        // </div>
        
        let froms = <div className="flex max_sero">
                <div className="align-item inputmany  paddingleft">
                    <div className="color2">From</div>
                    <div>
                        <List>
                        <input  value={this.state.tokenInAmount} placeholder="请输入" onChange={(e) => {
                            this.showRate(e.target.value)
                        }} type="text" className="inputItem"/>
                        </List>
                    </div>
                    
                </div>
                <div className="flex modal paddingright" onClick={() => this.showModal('')}>
                    <img width="13px" className="absolute" src={require('../images/bottom.png')}/>
                    <Select
                        options={options_1}
                        className="select"
                        selectedOption={{value: this.state.tokenIn}}
                        onChange={(option) => {
                            this.setState({option1: option})
                            let tokenOut = this.state.tokenToTokens.get(option.value)[0];
                            this.initPair(option.value, tokenOut, function (pair) {
                                self.setState({pair: pair, tokenIn: option.value, tokenOut: tokenOut});
                                self.showRate(self.state.tokenInAmount);
                            })
                        }}/>
                </div>      
        </div>
        let tos = <div className="space-between max_sero">
               <div className="align-item inputmany paddingleft">
                   <div className="color2">
                       To
                   </div>
                    <List>
                        <input style={{marginLeft:"27px",width:"100%",backgroundColor:"#b1b1b1"}} disabled value={this.state.tokenOutAmount} onChange={(e) => {
                        }} type="text" className="inputItem"/>
                    </List>
                </div>
                <div className="flex modal paddingright" onClick={() => this.showModal("")}>
                    <img width="13px" className="absolute" src={require('../images/bottom.png')}/>  
                    <Select
                        className="select"
                        style={{height: "20px"}}
                        options={options_2}
                        onChange={(option) => {
                            this.setState({option2: option})
                            this.initPair(this.state.tokenIn, option.value, function (pair) {
                                self.setState({pair: pair, tokenOut: option.value});
                                self.showRate(self.state.tokenInAmount);
                            })
                        }}/>
                </div>     
        </div>
        return (

            <Layout selectedTab="2" doUpdate={this.doUpdate}>
                <div className="flex-center" style={{padding:"10px"}}>
                    <div className="header">
                        <div className="cash color text-center">兑 换</div>

                        <div className="from" style={{marginTop:"20px"}}>
                            <div className="fontSize text-right color2">可用{this.state.tokenIn}:{showValue(balance, abi.getDecimalLocal(this.state.tokenIn))}</div>
 
                           {froms }
                        </div>
                        <div style={{margin:"20px 0 0 10px"}} className="text-center">
                            <img width="24px" src={require("../images/sells.png")}/>
                        </div>
                        
                        
                        <div className="from">
                            <div>
                            <div className="fontSize text-right color2">已有{this.state.tokenOut}:{showValue(usable, abi.getDecimalLocal(this.state.tokenOut))}</div>
                                
                                {tos}
                            </div>
                        </div>
                        <div className="flex color fontSize">
                            <div style={{textAlign: "", margin: "10px 0", height: "20px",padding:"0 5px"}}>
                                当前兑换比例:
                                {
                                    this.state.price > 0 &&
                                    <span>1{this.state.tokenIn} : {this.state.price}{this.state.tokenOut}</span>
                                }
                            </div>
                            <div>
                                {/* 10SUSD per 1 PFID <img width="12px" src={require('../images/flush.png')}/> */}
                            </div>
                        </div>
                        <div className="text-center">
                            <input style={{}} type="submit" disabled={!this.state.inputStyle} className={this.state.inputStyle>0?'inputs':'nothing'} value="确 认 卖 出" 
                                onClick={() => {
                                let amount = new BigNumber(self.state.tokenInAmount).multipliedBy(Math.pow(10, abi.getDecimalLocal(self.state.tokenIn)));
                                let minTokensReceived = new BigNumber(self.state.tokenOutAmount).multipliedBy(Math.pow(10, abi.getDecimalLocal(self.state.tokenOut))).toString(10);
                                self.exchange(self.state.tokenIn,self.state.tokenOut, amount, minTokensReceived);
                            
                            }}/>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }
}

export default Exchange;