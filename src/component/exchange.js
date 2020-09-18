import React, {Component} from 'react';
import {Button, Card, Flex, InputItem, List, Modal, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import {Select} from "./select";
import BigNumber from 'bignumber.js'
import {dateFormat, showValue} from "./utils/common";

export class Exchange extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pk: props.pk,
            account: {balances: new Map()},
            tokens: [],
            tokenToTokens: new Map(),
            tokenInAmount: 0,
            tokenOutAmount: 0,
            orderType: 0
        }
    }

    init(account) {

        let self = this;
        let tokens = []
        account.balances.forEach((val, key) => {
            tokens.push(key);
        });
        if (tokens.length == 0) {
            return;
        }

        let tokenToTokens = new Map();
        abi.getGroupTokens(account.mainPKr, tokens, function (tokens, tokenToTokens) {
            if (tokens.length > 0) {
                self.initPair(tokens[0], tokenToTokens.get(tokens[0])[0], function (pair) {
                    self.setState({
                        tokenIn: tokens[0],
                        tokenOut: tokenToTokens.get(tokens[0])[0],
                        tokens: tokens,
                        tokenToTokens: tokenToTokens,
                        pair: pair
                    })
                });
            }
        });
    }

    initPair(tokenA, tokenB, callback) {
        let self = this;
        console.log("initPair", tokenA, tokenB);
        abi.pairInfoWithOrders(this.state.account.mainPKr, tokenA, tokenB, function (pair) {
            callback(pair);
        })
    }

    componentDidMount() {
        let self = this;
        abi.init
            .then(() => {
                abi.accountDetails(self.state.pk, function (account) {
                    self.setState({account: account}, function () {
                        self.init(account);
                    });
                });
            });
    }

    componentWillReceiveProps(nextProps, nextContext) {
        let self = this;
        console.log("change account", nextProps.pk);
        abi.accountDetails(nextProps.pk, function (account) {
            self.setState({account: account}, function () {
                self.init(account);
            });
        });
    }

    showRate(amountIn) {
        if (!amountIn || !this.state.pair || Number(amountIn) == 0) {
            this.setState({tokenInAmount: amountIn, tokenOutAmount: 0, price: 0});
            return;
        }

        let self = this;

        let amountOut;
        let pair = this.state.pair;

        let reserveA = new BigNumber(pair.reserveA);
        let reserveB = new BigNumber(pair.reserveB);
        let invariant = reserveA.multipliedBy(reserveB);

        abi.feeRate(this.state.account.mainPKr, pair.tokenA, pair.tokenB, function (feeRate) {

            let rate = 10000 - feeRate;
            if (self.state.tokenIn == pair.tokenA) {
                reserveA = reserveA.plus(new BigNumber(amountIn).multipliedBy(Math.pow(10, abi.getDecimalLocal(pair.tokenA))));
                amountOut = reserveB.minus(invariant.dividedBy(reserveA));
                amountOut = amountOut.multipliedBy(rate).div(10000);
                amountOut = amountOut.dividedBy(Math.pow(10, abi.getDecimalLocal(pair.tokenA)));
            } else {
                reserveB = reserveB.plus(new BigNumber(amountIn * rate / (10000)).multipliedBy(Math.pow(10, abi.getDecimalLocal(pair.tokenB))));
                amountOut = reserveA.minus(invariant.dividedBy(reserveB));
                amountOut = amountOut.dividedBy(Math.pow(10, abi.getDecimalLocal(pair.tokenA)));
            }

            let price = amountOut.dividedBy(amountIn).toFixed(3)
            self.setState({tokenInAmount: amountIn, tokenOutAmount: amountOut.toNumber(), price: price});
        });

    }

    exchange(tokenA, tokenB, amount, minTokensReceived) {
        abi.swap(this.state.account.pk, this.state.account.mainPKr, tokenA, tokenB, amount, minTokensReceived);
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
                        <Flex.Item style={{flex: 1, textAlign: 'center'}}><span>-></span></Flex.Item>
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

    render() {
        let self = this;
        let options_1 = [];
        let options_2 = [];

        this.state.tokens.forEach(each => {
            options_1.push({value: each, label: each});
        });

        let tokens = this.state.tokenToTokens.get(this.state.tokenIn);
        if (tokens) {
            tokens.forEach(each => {
                options_2.push({value: each, label: each});
            });
        }

        let balance = 0;
        if (this.state.account.balances.has(this.state.tokenIn)) {
            balance = this.state.account.balances.get(this.state.tokenIn);
        }
        return (


            <div>
                <WhiteSpace size="lg"/>
                <Card>
                    <Card.Body>
                        <div>
                            <Flex style={{textAlign: 'center'}}>
                                <Flex.Item>兑换</Flex.Item>
                                <Flex.Item>数量</Flex.Item>
                                <Flex.Item>余额:{showValue(balance, abi.getDecimalLocal(this.state.tokenIn))}</Flex.Item>
                            </Flex>
                            <WhiteSpace size="lg"/>
                            <Flex>
                                <Flex.Item style={{flex: 1}}>
                                    <Select
                                        options={options_1}
                                        selectedOption={{value: this.state.tokenIn}}
                                        onChange={(option) => {
                                            let tokenOut = this.state.tokenToTokens.get(option.value)[0];
                                            this.initPair(option.value, tokenOut, function (pair) {
                                                self.setState({pair: pair, tokenIn: option.value, tokenOut: tokenOut});
                                                self.showRate(self.state.tokenInAmount);
                                            })
                                        }}/>

                                </Flex.Item>
                                <Flex.Item style={{flex: 2}}>
                                    <input type="text" defaultValue={this.state.tokenInAmount}
                                           style={{width: '100%', height: '33px'}} onChange={(e) => {
                                        this.showRate(e.target.value);
                                    }}/>
                                </Flex.Item>
                            </Flex>
                            <WhiteSpace size="lg"/>
                            <Flex>
                                <Flex.Item style={{flex: 1}}>
                                    <div>获取币种</div>
                                </Flex.Item>
                            </Flex>

                            <WhiteSpace size="lg"/>
                            <Flex>
                                <Flex.Item style={{flex: 1}}>
                                    <Select
                                        options={options_2}
                                        onChange={(option) => {
                                            this.initPair(this.state.tokenIn, option.value, function (pair) {
                                                self.setState({pair: pair, tokenOut: option.value});
                                                self.showRate(self.state.tokenInAmount);
                                            })
                                        }}/>
                                </Flex.Item>
                                <Flex.Item style={{flex: 2}}>
                                    <input type="text" value={0} value={this.state.tokenOutAmount}
                                           style={{width: '100%', height: '33px'}} onChange={(e) => {
                                    }}/>
                                </Flex.Item>
                            </Flex>
                            <WhiteSpace size="lg"/>
                            <Flex>
                                <Flex.Item>
                                    {
                                        this.state.price > 0 &&
                                        <span>当前预估价: 1{this.state.tokenIn} = {this.state.price}{this.state.tokenOut}</span>
                                    }
                                </Flex.Item>
                            </Flex>

                            <WhiteSpace size="lg"/>
                            <div>
                                <Button type="primary" onClick={() => {
                                    let amount = new BigNumber(self.state.tokenInAmount).multipliedBy(Math.pow(10,  abi.getDecimalLocal(self.state.tokenIn)));
                                    let minTokensReceived  = new BigNumber(self.state.tokenOutAmount).multipliedBy(Math.pow(10,  abi.getDecimalLocal(self.state.tokenOut))).toString(10);
                                    self.exchange(self.state.tokenIn, self.state.tokenOut, amount, minTokensReceived);
                                }}>兑换</Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
                <WhiteSpace size="lg"/>
                <Tabs tabs={[{title: "历史订单"}, {title: "我的订单"}]}
                      initialPage={0}
                      onChange={(tab, index) => {
                          this.setState({orderType: index})
                      }}>
                    <List>
                        {this.renderOrders()}
                    </List>
                </Tabs>
            </div>
        )
    }
}