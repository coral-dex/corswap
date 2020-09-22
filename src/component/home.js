import React, {Component} from 'react';
import {Button, Card, Flex, InputItem, List,Tag, Modal, Tabs,TabBar, Toast, WhiteSpace, WingBlank,Popover,NavBar,Icon} from "antd-mobile";
import abi from "./abi";
import {Exchange} from "./exchange";
import {PairList} from "./pairList";
import {Shares} from "./Shares";
import {Select} from "./select";
import {OrderList} from "./orderList"
import BigNumber from "bignumber.js";
import '../style/style.css'
import {HashRouter as Router,Switch,Route} from 'react-router-dom'
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
          <Router>
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
                <WhiteSpace size="lg"/>
                <div>
                    <div className='text-center'>
                        <img width="50%" src={require('../images/fishing.png')}/>
                        <Tabs tabBarActiveTextColor="#00456b" tabBarActiveTextColor="#f75552" tabBarBackgroundColor=""  tabs={tabs} initialPage={0}>
                            <div>
                                <Exchange pk={this.state.account.pk}/>
                            </div>
                            <div>
                                <PairList pk={this.state.account.pk}/>
                            </div>
                            <div>
                                <Shares pk={this.state.account.pk}/>
                            </div>
                            <div>
                                <OrderList pk={this.state.account.pk}/>
                            </div>
                        </Tabs>
                    </div>
                </div>
    <div style={this.state.fullScreen ? { position: 'fixed', height: '100%', width: '100%', top: 0 } : { height: 400 }}>
        <TabBar
          unselectedTintColor="#fff"
          tintColor="#f75552"
          barTintColor="#17567c"
          hidden={this.state.hidden}
        >
          
          <TabBar.Item
            title="我要买"
            key="Life"
            icon={<div style={{
              width: '22px',
              height: '22px',
              background: 'url(./images/buy.png) center center /  21px 21px no-repeat' }}
            />
            }
            selectedIcon={<div style={{
              width: '22px',
              height: '22px',
              background: 'url(./images/buysel.png) center center /  21px 21px no-repeat' }}
            />
            }
            selected={this.state.selectedTab === 'blueTab'}
            onPress={() => {
                this.goPage("#/exchange")
            }}
            data-seed="logId"
          >
            {this.renderContent('Life')}
          </TabBar.Item>
          
          <TabBar.Item
            icon={
              <div style={{
                width: '22px',
                height: '22px',
                background: 'url(./images/sell.png) center center /  21px 21px no-repeat' }}
              />
            }
            selectedIcon={
              <div style={{
                width: '22px',
                height: '22px',
                background: 'url(./images/sellsel.png) center center /  21px 21px no-repeat' }}
              />
            }
            title="我要卖"
            key="Koubei"
            selected={this.state.selectedTab === 'redTab'}
            onPress={() => {
                this.goPage("#/orderlist")
            }}
            data-seed="logId1"
          >
            {this.renderContent('Koubei')}
          </TabBar.Item>
          <TabBar.Item
            icon={
              <div style={{
                width: '22px',
                height: '22px',
                background: 'url(./images/fund.png) center center /  21px 21px no-repeat' }}
              />
            }
            selectedIcon={
              <div style={{
                width: '22px',
                height: '22px',
                background: 'url(./images/fundsel.png) center center /  21px 21px no-repeat' }}
              />
            }
            title="资金池"
            key="Friend"
            selected={this.state.selectedTab === 'greenTab'}
            onPress={() => {
              this.goPage("#/pairlist")
            }}
          >
            {this.renderContent('Friend')}
          </TabBar.Item>
          <TabBar.Item
            icon={{ uri: './images/dividend.png' }}
            selectedIcon={{ uri: './images/dividendsel.png' }}
            title="分红"
            key="my"
            selected={this.state.selectedTab === 'yellowTab'}
            onPress={() => {
                this.goPage("#/orderList")
            }}
          >
            {this.renderContent('My')}
          </TabBar.Item>
        </TabBar>
      </div>
    </WingBlank>
    <Switch>
      <Route path="/orderList" component={OrderList}/>
      <Route path="/pairlist" component={PairList}/>
    </Switch>
    </Router>
        )
    }
}

export default Home;