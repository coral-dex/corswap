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
            pk: localStorage.getItem("accountPK"),
            account: {balances: new Map()},
            pairs: [],

            totalSupply: 0,
            myBalance: [[],[]],
            poolBalance: [[],[]],
            amount:0,
        }

    }

    async init(account){
        let self = this;
        if (!account) {
            account = this.state.account;
        }

        abi.balanceOf(account.mainPKr,function (tokens1,balances1) {
            abi.totalSupply(account.mainPKr,function (rest) {
                self.setState({
                    totalSupply:rest,
                    myBalance:[tokens1,balances1]
                })
            })
        })
    }


    calPoolBalance(e){
        const self = this;
        if(e){
            const {account} = this.state;
            const amount = "0x"+new BigNumber(e).multipliedBy(10**18).toString(16);
            abi.showExchange(account.mainPKr,amount,function (tokens,balances) {
                self.setState({
                    poolBalance:[tokens,balances],
                    amount:amount
                })
            })
        }else{
            this.setState({
                amount:e
            })
        }

    }

    componentDidMount() {
        let self = this;
        abi.init
            .then(() => {
                abi.accountDetails(self.state.pk, function (account) {
                    self.setState({account: account});
                    self.init(account).catch();
                });
            });
    }

    sub(){
        const {account,amount} = this.state;
        abi.exchange(account.pk,account.mainPKr,account.mainPKr,amount,function (rest) {
            console.log("exchange>>>>>",rest);
        })
    }

    render() {
        const {totalSupply,myBalance,poolBalance,amount} = this.state;

        return (
            <Layout selectedTab="4">

                <WingBlank>
                    <WhiteSpace size="lg"/>
                    <InputItem placeholder="请输入销毁的CORAL数量" type="number"  clear onChange={(e)=>{this.calPoolBalance(e)}} className="input inputshare">
                        CORAL
                    </InputItem>
                    <WhiteSpace size="lg"/>
                    <Card>
                        <Card.Header title="当前分红池"
                                     thumb="./images/dividendselect.png"
                                     />
                        <Card.Body style={{maxHeight:document.documentElement.clientHeight * 0.3}}>
                            <Flex>
                                <Flex.Item style={{textAlign:"center"}}>序号</Flex.Item>
                                <Flex.Item style={{textAlign:"center"}}>TOKEN</Flex.Item>
                                <Flex.Item style={{textAlign:"center"}}>数量</Flex.Item>
                            </Flex>
                            {
                                poolBalance[0]&&poolBalance[0].length>0?poolBalance[0].map((v,i)=>{
                                    return <>
                                        <WhiteSpace size="lg"/>
                                        <Flex>
                                            <Flex.Item style={{textAlign:"center"}}>{i+1}</Flex.Item>
                                            <Flex.Item style={{textAlign:"center"}}>{v}</Flex.Item>
                                            <Flex.Item style={{textAlign:"center"}}>{myBalance[1][i]}</Flex.Item>
                                        </Flex>
                                    </>
                                }):<div className="nodata">
                                    暂无数据
                                </div>
                            }
                        </Card.Body>
                    </Card>
                    {
                        amount && amount>0? <div>
                            <WhiteSpace size="lg"/>
                            <Card>
                                <Card.Header title="我的分红"
                                             thumb="./images/dividendselect.png"
                                />
                                <Card.Body style={{maxHeight:document.documentElement.clientHeight * 0.3}}>
                                    <Flex>
                                        <Flex.Item style={{textAlign:"center"}}>序号</Flex.Item>
                                        <Flex.Item style={{textAlign:"center"}}>TOKEN</Flex.Item>
                                        <Flex.Item style={{textAlign:"center"}}>数量</Flex.Item>
                                    </Flex>
                                    {
                                        myBalance[0]&&myBalance[0].length>0?myBalance[0].map((v,i)=>{
                                            return <>
                                                <WhiteSpace size="lg"/>
                                                <Flex>
                                                    <Flex.Item style={{textAlign:"center"}}>{i+1}</Flex.Item>
                                                    <Flex.Item style={{textAlign:"center"}}>{v}</Flex.Item>
                                                    <Flex.Item style={{textAlign:"center"}}>{myBalance[1][i]}</Flex.Item>
                                                </Flex>
                                            </>
                                        }):<div className="nodata">
                                            暂无数据
                                        </div>
                                    }
                                </Card.Body>
                            </Card>
                            <WhiteSpace/>
                            <Button type="primary" disabled={!amount || !(myBalance[0]&&myBalance[0].length>0)} onClick={()=>{
                                this.sub()
                            }}>提交</Button>
                        </div>:""
                    }

                </WingBlank>

            </Layout>
        )
    }
}
export default Shares;