import React, {Component} from 'react';
import {Button, Card, Flex, InputItem, List,Tag, Modal, Tabs,TabBar, Toast, WhiteSpace, WingBlank,Popover,NavBar,Icon} from "antd-mobile";
import abi from "./abi";
import {Exchange} from "./exchange";
import {PairList} from "./pairlist";
import {Shares} from "./shares";
import {Select} from "./select";
import {OrderList} from "./orderlist"
import BigNumber from "bignumber.js";
import '../style/style.css'
import Layout from "./layout";

const operation = Modal.operation;
const alert = Modal.alert;
const Item = Popover.Item;
const tabs = [
    {title: '我要买', type: '1'},
    {title: '资金池', type: '2'},
    {title: '分红', type: '3'},
    {title: '我要卖', type: '4'},
];
export class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: {},
            visible:false,
            selected:'zh_CN',
            selectedTab: 'redTab',
            hidden: false,
            fullScreen: false,
            modal1:false,
        }
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
        console.log("初始化资金池...");
        account.balances.forEach((val, key) => {
            if(!token) {
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
          <div style={{ backgroundColor: '#e9f4f8', height: '100%', textAlign: 'center' }}>
          </div>
        );
    }
    goPage=(uri)=>{
        window.location.href=uri
        // window.open(uri)
    }
    showModal(){
      this.setState({
        modal1: true,
      });
    }
    onClose = key => () => {
      this.setState({
        [key]: false,
      });
    }
    render() {
        let s = [1,2,3,4]
        console.log(s.indexOf(1),"下表")
        return (

            <Layout selectedTab="1">
                <WingBlank>
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
                    <div className="shares text-right">
                        <img onClick={()=>this.goPage("https://t.me/coralswap")} width="8%" src={require("../images/icon1.png")}/>
                        <img onClick={()=>this.goPage("https://twitter.com/CoralDEX")} width="8%" src={require("../images/icon2.png")}/>
                        <img onClick={()=>this.goPage("https://github.com/coral-dex/corswap")} width="8%" src={require("../images/icon3.png")}/>
                        <img onClick={()=>this.goPage("https://discord.gg/QM4JEKK")} width="8%" src={require("../images/icon4.png")}/>
                        <img onClick={()=>this.goPage("https://medium.com/coraldex")} width="8%" src={require("../images/icon5.png")}/>
                        <img width="8%" src={require("../images/icon6.png")} onClick={()=>this.showModal()}/>
                    </div>
                    <Modal
                        visible={this.state.modal1}
                        transparent
                        maskClosable={false}
                        onClose={this.onClose('modal1')}
                        title=""
                        footer={[{ text: '我知道了', onPress: () => { console.log('ok'); this.onClose('modal1')(); } }]}
                    >
                        <div style={{ height: 100, width:"auto",textAlign:"center"}}>
                            <img width="40%" src={require('../images/wx.jpg')}/>
                        </div>
                    </Modal>
                    <div className="fishing">
                        <Flex>
                            <Flex.Item style={{flex: 3}}>
                                <div onClick={() => {
                                    this.changeAccount();
                                }}>{this.showAccount(this.state.account, 8)}</div>
                            </Flex.Item>
                        </Flex>
                    </div>
                </WingBlank>
            </Layout>
        )
    }
}

export default Home;