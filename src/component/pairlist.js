import React, {Component} from 'react';
import {Button, Card, Flex, InputItem, List, Modal, SearchBar, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {Select} from "./select";
import {showValue} from "./utils/common";

const alert = Modal.alert;

export class PairList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pk: props.pk,
            account: {balances: new Map()},
            pairs: [],
            pair: null,
            orderList: [],
            showType: props.showType
        }
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
            self.setState({pairs: pairs});
        });
    }

    componentDidMount() {
        let self = this;
        abi.init
            .then(() => {
                abi.accountDetails(self.state.pk, function (account) {
                    self.setState({account: account});
                    self.init(account);
                    self.timer = setInterval(function () {
                        self.init();
                    }, 10000)
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

    render() {

        let pairs = this.state.pairs.map((pair, index) => {
            return (
                <Card key={index} style={{marginBottom: '10px'}}>
                    <Card.Header
                        title={<span>{pair.tokenA}-{pair.tokenB}</span>}
                    />
                    <Card.Body>
                        <div>
                            {showValue(pair.reserveA, abi.getDecimalLocal(pair.tokenA,))}{pair.tokenA} - {showValue(pair.reserveB, abi.getDecimalLocal(pair.tokenB))}{pair.tokenB}
                        </div>
                        {/*<div>*/}
                        {/*    {showValue(pair.totalVolume, 18)}-{showValue(pair.selfVolume, 18)}*/}
                        {/*</div>*/}
                    </Card.Body>
                    <Card.Footer content={<span><a onClick={() => {
                        this.invest(pair.tokenA, pair.tokenB);
                    }
                    }>提供流动性,(总{pair.totalShares}份)</a></span>} extra={<span><a onClick={() => {
                        this.divest(pair.tokenA, pair.tokenB);
                    }
                    }>销毁流动性({pair.myShare}份)</a></span>}/>
                </Card>
            )
        });
        return (
            <div>
                <WhiteSpace size="lg"/>
                <SearchBar maxLength={6}
                           onSubmit={(value) => {
                               this.setState({search: value}, function () {
                                   this.init(this.state.account, value);
                               });
                           }}

                           onCancel={() => {
                               this.setState({search: null}, function () {
                                   this.init(this.state.account, null);
                               });
                           }}
                />
                <WhiteSpace size="lg"/>
                <div>
                    {pairs}
                </div>
            </div>
        )
    }
}