import React, {Component} from 'react';
import {Button, Card, Flex, InputItem, List, Modal, SearchBar, Tabs, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import abi from "./abi";
import BigNumber from 'bignumber.js'
import {Select} from "./select";
import {showValue} from "./utils/common";
import Layout from "./layout";

const alert = Modal.alert;

export class Shares extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pk: props.pk,
            account: {balances: new Map()},
            pairs: []
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
            self.setState({pairs: pairs, search: search});
        });
    }

    componentDidMount() {
        let self = this;
        abi.init
            .then(() => {
                abi.accountDetails(self.props.pk, function (account) {
                    self.setState({account: account});
                    self.init(account, self.state.search);
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
    
    render() {
        let pairs = this.state.pairs.map((pair, index) => {
            return (
                <List.Item key={index} style={{marginBottom: '10px'}}>
                    <Flex>
                        <Flex.Item style={{flex: 2}}><span>{pair.tokenA}-{pair.tokenB}</span></Flex.Item>
                        <Flex.Item style={{flex: 1}}>{showValue(pair.shareRreward)} CORE</Flex.Item>
                        <Flex.Item style={{flex: 1, textAlign: 'right'}}><span><a onClick={() => {
                            if (pair.shareRreward > 0) {
                                abi.withdrawShareReward(this.state.account.pk, this.state.account.mainPKr, pair.tokenA, pair.tokenB);
                            }
                        }}>提取</a></span></Flex.Item>
                    </Flex>
                </List.Item>
            )
        });

        return (
            <Layout selectedTab="4">
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

                    <List>
                        <List.Item>
                            <Flex>
                                <Flex.Item style={{flex: 2}}>资金池</Flex.Item>
                                <Flex.Item style={{flex: 1}}>分红</Flex.Item>
                                <Flex.Item style={{flex: 1}}></Flex.Item>
                            </Flex>
                        </List.Item>
                        {pairs}
                    </List>

                </div>
            </div>
            </Layout>
        )
    }
}
export default Shares;