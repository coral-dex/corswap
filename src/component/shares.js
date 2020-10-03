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

    doUpdate = ()=>{
        let self = this;
        let pk = localStorage.getItem("accountPK")
        if(pk){
            self.setState({pk:pk})
        }else{
            pk = self.state.pk;
        }
        abi.init
            .then(() => {
                abi.accountDetails(pk, function (account) {
                    self.setState({account: account});
                    self.init(account).catch();
                });
            });
    }

    componentDidMount() {
        this.doUpdate();
    }

    sub(){
        const self = this;
        const {account,amount} = this.state;
        const value = new BigNumber(amount).multipliedBy(10**18);
        if(value.comparedTo(account.balances.get(abi.coral))){

        }
        abi.exchange(account.pk,account.mainPKr,account.mainPKr, value ,function (rest) {
            if(rest){
                Toast.success("PENDING...")
                self.startGetTxReceipt(rest,()=>{
                    self.init()
                });
            }
        })
    }

    startGetTxReceipt = (hash,cb) =>{
        const that = this;
        abi.getTransactionReceipt(hash).then(res=>{
            if(res && res.result){
                Toast.success("SUCCESSFULLY")
                if(cb){
                    cb();
                }
            }else{
                setTimeout(function () {
                    that.startGetTxReceipt(hash,cb)
                },2000)
            }
        })
    }

    render() {
        const {totalSupply,myBalance,poolBalance,amount} = this.state;
        console.log("render>>>>> ",totalSupply,myBalance,poolBalance,amount);
        return (
            <Layout selectedTab="4">

                <WingBlank>
                    <WhiteSpace size="lg"/>
                    <InputItem placeholder="请输入您要销毁的数量" type="number"  clear onChange={(e)=>{this.calPoolBalance(e)}} className="input inputshare">
                        CORAL
                    </InputItem>
                    <WhiteSpace/>
                    <div className="totalSupply">
                        发行总量: <span>{showValue(totalSupply,18,6)} CORAL</span>
                    </div>
                    <WhiteSpace size="lg"/>
                    {amount?<div>
                        <div>
                            <div className="am-card card-border">
                                <div className="flex" style={{borderBottom:"1px dotted #00456b",paddingBottom:"7px"}}>
                                    <div>
                                        <img width="50%" src="./images/dividendselect.png"/>
                                    </div>
                                    <div style={{color:"#f75552"}}>
                                        我的分红
                                    </div>
                                </div>
                                <div className="text-center">
                                    <WhiteSpace/>
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
                                                    <Flex.Item style={{textAlign:"center"}}>{showValue(myBalance[1][i],18,4)}</Flex.Item>
                                                </Flex>
                                            </>
                                        }):<div className="nodata">
                                            暂无数据
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                        <WhiteSpace size="lg"/>
                        <div className="am-card card-border">
                            <div className="flex" style={{borderBottom:"1px dotted #00456b",paddingBottom:"7px"}}>
                                <div>
                                    <img width="50%" src="./images/dividendselect.png"/>
                                </div>
                                <div style={{color:"#f75552"}}>
                                    当前分红池
                                </div>
                            </div>
                            <div className="text-center">
                                <WhiteSpace/>
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
                                                <Flex.Item style={{textAlign:"center"}}>{showValue(poolBalance[1][i],18,4)}</Flex.Item>
                                            </Flex>
                                        </>
                                    }):<div className="nodata">
                                        暂无数据
                                    </div>
                                }
                            </div>
                        </div>
                    </div>:""}

                    <WhiteSpace/>
                    <Button type="primary" disabled={!amount || !(myBalance[0]&&myBalance[0].length>0)} onClick={()=>{
                        this.sub()
                    }}>分红</Button>

                </WingBlank>

            </Layout>
        )
    }
}
export default Shares;