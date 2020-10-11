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

            showModal:false
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
        if(!amount){
            Toast.fail("Please Input Coral Amount",2)
            return
        }
        const value = new BigNumber(amount).multipliedBy(10**18);
        if(!account.balances.has(abi.coral) || value.comparedTo(new BigNumber(account.balances.get(abi.coral))) >=0){
            Toast.fail("Insufficient balance",2)
            return
        }
        abi.exchange(account.pk,account.mainPKr,account.mainPKr, value ,function (rest) {
            if(rest){
                self.setState({amount:""})
                Toast.loading("PENDING...",60)
                self.startGetTxReceipt(rest,()=>{
                    self.init()
                    self.setShowModal(false)
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

    setShowModal = (f)=>{
        this.setState({
            amount:"",
            showModal:f
        })
    }
    render() {
        const {totalSupply,myBalance,poolBalance,amount,showModal} = this.state;
        return (
            <Layout selectedTab="4">

                <WingBlank>
                    <WhiteSpace size="lg"/>
                    <div className="totalSupply">
                        已发行: <span>{showValue(totalSupply,18,6)} CORAL</span>
                    </div>
                    <WhiteSpace size="lg"/>
                    <div>
                        <div className="am-card card-border">
                            <div className="flex-only" style={{borderBottom:"1px dotted #00456b",paddingBottom:"7px"}}>
                                <div>
                                    <img width="50%" src="./images/dividendselect.png"/>
                                </div>
                                <div style={{color:"#f75552"}}>
                                    分红池
                                </div>
                            </div>
                            <div className="text-center">
                                <WhiteSpace/>
                                <Flex>
                                    <Flex.Item style={{textAlign:"center"}}>TOKEN</Flex.Item>
                                    <Flex.Item style={{textAlign:"center"}}>数量</Flex.Item>
                                </Flex>
                                <div style={{maxHeight:document.documentElement.clientHeight * 0.3,overflowY:"scroll"}}>
                                    {
                                        poolBalance[0]&&poolBalance[0].length>0?poolBalance[0].map((v,i)=>{
                                            return <>
                                                <WhiteSpace size="lg"/>
                                                <Flex>
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
                        </div>
                    </div>

                    <WhiteSpace size="lg"/>
                    <Button type="primary" onClick={()=>{
                        this.setShowModal(true)
                    }}>兑换分红池(销毁)</Button>

                </WingBlank>

                <Modal visible={showModal}
                       transparent
                       title="兑换分红池(销毁)"
                       footer={[
                           {
                               text:"取消",
                               onPress:()=>{
                                   this.setShowModal(false)
                                   //    this.setInputValue("")
                               }
                           },
                           {
                               text:"确定",
                               onPress:()=>{
                                   this.sub()
                               }
                           }
                       ]}

                >
                    <InputItem placeholder="请输入您要销毁的数量" type="digit" autoFocus  clear onChange={(e)=>{this.calPoolBalance(parseFloat(e))}}>
                        CORAL
                    </InputItem>
                    <div>
                        {
                            amount && amount > 0 ? <div>
                                {
                                    myBalance[0] && myBalance[0].length > 0 && myBalance[0].map((v, i) => {
                                        return <>
                                            <WhiteSpace/>
                                            <Flex>
                                                <Flex.Item  style={{textAlign:'left',color:'rgb(247, 85, 82)'}}>Estimated: {showValue(myBalance[1][i], 18, 4)} {v}</Flex.Item>
                                            </Flex>
                                        </>
                                    })
                                }
                            </div> : <>
                                <WhiteSpace/>
                                <Flex>
                                    <Flex.Item  style={{textAlign:'left',color:'rgb(247, 85, 82)'}}>Estimated: 0.000</Flex.Item>
                                </Flex>
                            </>
                        }
                    </div>

                </Modal>

            </Layout>
        )
    }
}
export default Shares;