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
                    poolBalance:[tokens1,balances1]
                })
            })
        })
    }


    calPoolBalance(e){
        const self = this;
        if(e){
            const {account} = this.state;
            const amount = new BigNumber(e).multipliedBy(10**18);
            abi.showExchange(account.mainPKr,"0x"+amount.toString(16),function (tokens,balances) {
                self.setState({
                    myBalance:[tokens,balances],
                    amount:e
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
        abi.exchange(account.pk,account.mainPKr,account.mainPKr, new BigNumber(amount).multipliedBy(10**18),function (rest) {
            console.log("exchange>>>>>",rest);
        })
    }

    render() {
        const {totalSupply,myBalance,poolBalance,amount} = this.state;

        console.log("render>>>>> ",totalSupply,myBalance,poolBalance,amount);

        return (
            <Layout selectedTab="4">

                <WingBlank>
                    <WhiteSpace size="lg"/>
                    <InputItem placeholder="请输入CORAL的数量" type="number"  clear onChange={(e)=>{this.calPoolBalance(e)}} className="input inputshare">
                        CORAL
                    </InputItem>
                    <WhiteSpace/>
                    <div className="totalSupply">
                        发行总量: <span>{showValue(totalSupply,18,6)} CORAL</span>
                    </div>
                    <WhiteSpace size="lg"/>
                    <div>
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
                                                <Flex.Item style={{textAlign:"center"}}>{showValue(myBalance[1][i],18,6)}</Flex.Item>
                                            </Flex>
                                        </>
                                    }):<div className="nodata">
                                        暂无数据
                                    </div>
                                }
                            </Card.Body>
                        </Card>
                    </div>
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
                                            <Flex.Item style={{textAlign:"center"}}>{showValue(poolBalance[1][i],18,6)}</Flex.Item>
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

                </WingBlank>

            </Layout>
        )
    }
}
export default Shares;