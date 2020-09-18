import React, {Component} from 'react';
import {Button, Card, Flex, InputItem, List, Modal, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import {Exchange} from "./exchange";
import {PairList} from "./pairlist";
import {Shares} from "./shares";
import {Select} from "./select";
import BigNumber from "bignumber.js";

const operation = Modal.operation;
const alert = Modal.alert;

const tabs = [
    {title: '我要兑换', type: '1'},
    {title: '资金池', type: '2'},
    {title: '分红', type: '3'},
];

export class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {account: {}}
    }

    componentDidMount() {
        let self = this;
        abi.init
            .then(() => {
                abi.accountList(function (accounts) {
                    self.setState({account: accounts[0]});
                });
            });
    }


    showAccount(account, len) {
        if (!account || !account.mainPKr) {
            return "";
        }
        if (!len) {
            len = 8;
        }
        return account.name + " " + account.mainPKr.slice(0, len) + "..." + account.mainPKr.slice(-len)
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
        account.balances.forEach((val, key) => {
            if(!token) {
                token = key;
            }
            if (val > 0) {
                options.push({value: key, label: key})
            }
        });

        alert("初化资金池", <div>
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

        return (
            <WingBlank>
                <Flex>
                    <Flex.Item style={{flex: 3}}>
                        <div onClick={() => {
                            this.changeAccount();
                        }}>{this.showAccount(this.state.account, 8)}</div>
                    </Flex.Item>
                    <Flex.Item style={{flex: 1}}>
                        <span>
                            <a onClick={() => {
                                this.initExchange();
                            }}>初化资金池</a>
                        </span>
                    </Flex.Item>
                </Flex>

                <WhiteSpace size="lg"/>
                <Tabs tabs={tabs} initialPage={0}>
                    <div>
                        <Exchange pk={this.state.account.pk}/>
                    </div>
                    <div>
                        <PairList pk={this.state.account.pk}/>
                    </div>
                    <div>
                        <Shares pk={this.state.account.pk}/>
                    </div>
                </Tabs>
            </WingBlank>
        )
    }
}