import * as React from 'react';
import {Flex, Modal, Tag, TabBar, WingBlank, WhiteSpace, Button,Toast} from "antd-mobile";
import abi from './abi'
import BigNumber from "bignumber.js";
import i18n from '../i18n'
import copy from 'copy-text-to-clipboard'
class Layout extends React.Component{
    constructor(props){
        super(props)
        this.state={
            modal1:false,
            modal2:false,
            account: {balances: new Map()},
        }
    }
    componentDidMount(){
        let self = this;
        abi.init
            .then(() => {
                let pk = localStorage.getItem("accountPK");
                abi.accountList(function (accounts) {
                    if(!pk){
                        pk = accounts[0].pk;
                        self.setState({account: accounts[0]});

                    }else{
                        for(let account of accounts){
                            if(pk == account.pk){
                                self.setState({account: account});
                                break
                            }
                        }
                    }


                });
        });
    }
    goPage=(uri)=>{
        console.log(uri);
        window.location.href=uri
        // window.open(uri)
    }

    showModal(){
        this.setState({
            modal1: true,
        });
    }
    showModal2(){
        this.setState({
            modal2: true,
        });
    }
    onClose = key => () => {
        this.setState({
            [key]: false,
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
                                    window.localStorage.setItem("accountPK", account.pk)
                                    if(self.props.doUpdate){
                                        self.props.doUpdate(account.pk)
                                    }
                                    self.setState({account: account});
                                }
                            }
                        );
                    });
                    Modal.operation(actions);
                });
            })
    }

    getBalance = (k) =>{
        const balance = this.state.account.balances.get(k);
        if(balance){
            return new BigNumber(balance).dividedBy(10**18).toFixed(3,1)
        }else{
            return "0.000";
        }
    }

    render() {
        return (
            <div style={{maxHeight:document.documentElement.clientHeight,overflowY:"scroll"}}>
                <Flex className="flex showtais">
                    <Flex.Item style={{flex:1}}>
                        <div>
                            <img src={require("../images/logo.png")} alt="" width="80%"/>
                        </div>
                    </Flex.Item>
                    <Flex.Item style={{flex:1}}>
                        <div className="text-right shares">
                            {/*{this.props.selectedTab == "3"?<div style={{color:"#f75552"}} >初始化资金池</div>:""}*/}
                            <img width="16%" src={require("../images/icon2.png")} onClick={()=>this.showModal2()}/>
                            <img width="16%" src={require("../images/icon6.png")} onClick={()=>this.showModal()}/>
                        </div>
                    </Flex.Item>
                </Flex>
                <WhiteSpace size="lg"/>
                <WingBlank>
                    {/*<div className="shares text-right padding">*/}
                    {/*    /!*<img onClick={()=>this.goPage("https://t.me/coralswap")} width="8%" src={require("../images/icon1.png")}/>*!/*/}
                    {/*    <img onClick={()=>this.goPage("https://twitter.com/CoralDEX")} width="8%" src={require("../images/icon2.png")}/>*/}
                    {/*    /!*<img onClick={()=>this.goPage("https://github.com/coral-dex/corswap")} width="8%" src={require("../images/icon3.png")}/>*!/*/}
                    {/*    /!*<img onClick={()=>this.goPage("https://discord.gg/QM4JEKK")} width="8%" src={require("../images/icon4.png")}/>*!/*/}
                    {/*    /!*<img onClick={()=>this.goPage("https://medium.com/coraldex")} width="8%" src={require("../images/icon5.png")}/>*!/*/}
                    {/*    <img width="8%" src={require("../images/icon6.png")} onClick={()=>this.showModal()}/>*/}
                    {/*</div>*/}
                    <div className="fishing">
                        <Flex style={{width:"100%"}} onClick={() => {
                            this.changeAccount();
                        }}>
                            <Flex.Item style={{overflow:"hidden"}}>
                                {this.showAccount(this.state.account, 5)}
                            </Flex.Item>
                            <Flex.Item style={{textAlign:"right"}}>
                                {this.getBalance(["3","4"].indexOf(this.props.selectedTab)>-1?abi.coral:"SERO")} {["3","4"].indexOf(this.props.selectedTab)>-1?abi.coral:"sero"}
                            </Flex.Item>
                        </Flex>
                    </div>
                    {/*{*/}
                    {/*    ["3"].indexOf(this.props.selectedTab) === -1?<div className="text-center fishing_div">*/}
                    {/*            <img style={{position:"relative",bottom:"0",}} width="60%" src={require("../images/fishing.png")} alt=" "/>*/}
                    {/*        </div>:""*/}
                    {/*}*/}

                    <Modal
                        visible={this.state.modal1}
                        transparent
                        maskClosable={false}
                        onClose={this.onClose('modal1')}
                        title=""
                        footer={[{ text: 'OK', onPress: () => { console.log('ok'); this.onClose('modal1')(); } }]}
                    >
                        <div style={{ minHeight: 150, width:"auto",textAlign:"center"}}>
                            <img width="40%" src={require('../images/wx.jpg')}/>
                        </div>
                    </Modal>

                    <Modal
                        visible={this.state.modal2}
                        transparent
                        maskClosable={false}
                        onClose={()=>{
                            this.onClose('modal2')}}
                        title=""
                        footer={[{ text: 'COPY', onPress: () => {
                                copy('https://twitter.com/CoralDEX');
                                Toast.info(i18n.t('Copied!'),1.5)
                                this.onClose('modal2')(); } }]
                        }
                    >
                        <div style={{ textAlign:"center"}}>
                            <p>https://twitter.com/CoralDEX </p>
                        </div>
                    </Modal>


                </WingBlank>

                {this.props.children}

                <TabBar
                    unselectedTintColor="#fff"
                    tintColor="#f75552"
                    barTintColor="#17567c"
                    // hidden={this.state.hidden}
                    // style={{ position: 'fixed',width: '100%', bottom:"0"}}
                    tabBarPosition="bottom"
                    swipeable={false}
                >

                    <TabBar.Item
                        title={i18n.t("swap")}
                        key="Life"
                        icon={<div style={{
                            width: '22px',
                            height: '22px',
                            background: 'url(./images/buy.png) center center /  22px 22px no-repeat' }}
                        />
                        }
                        selectedIcon={<div style={{
                            width: '22px',
                            height: '22px',
                            background: 'url(./images/buyselect.png) center center /  22px 22px no-repeat' }}
                        />
                        }
                        selected={this.props.selectedTab === '1'}
                        onPress={() => {
                            this.goPage("#/swap")
                        }}
                        data-seed="logId"
                    >
                    </TabBar.Item>
                    <TabBar.Item
                        icon={
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'url(./images/fund.png) center center /  22px 22px no-repeat' }}
                            />
                        }
                        selectedIcon={
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'url(./images/fundselect.png) center center /  22px 22px no-repeat' }}
                            />
                        }
                        title={i18n.t("assetsPool")}
                        key="Friend"
                        selected={this.props.selectedTab === '3'}
                        onPress={() => {
                            this.goPage("#/pairlist")
                        }}
                    >

                    </TabBar.Item>
                    <TabBar.Item
                        icon={
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'url(./images/dividend.png) center center /  22px 22px no-repeat' }}
                            />
                        }
                        selectedIcon={
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'url(./images/dividendselect.png) center center /  22px 22px no-repeat' }}
                            />
                        }
                        title={i18n.t("dividendPool")}
                        key="my"
                        selected={this.props.selectedTab === '4'}
                        onPress={() => {
                            this.goPage("#/shares")
                        }}
                    >
                    </TabBar.Item>
                    <TabBar.Item
                        icon={
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'url(./images/govern.png) center center /  22px 22px no-repeat' }}
                            />
                        }
                        selectedIcon={
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'url(./images/governsel.png) center center /  22px 22px no-repeat' }}
                            />
                        }
                        title={i18n.t("Governance")}
                        key="my"
                        selected={this.props.selectedTab === '5'}
                        onPress={() => {
                            this.goPage("#/vothing")
                        }}
                    >
                    </TabBar.Item>
                </TabBar>
            </div>
        );
    }
}

export default Layout