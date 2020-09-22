import * as React from 'react';
import {Flex, Modal, TabBar, WingBlank} from "antd-mobile";



class Layout extends React.Component{

    goPage=(uri)=>{
        window.location.href=uri
        // window.open(uri)
    }

    render() {
        return (
            <div>
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
                    {this.props.children}
                </WingBlank>

                <div style={{ position: 'fixed',width: '100%', bottom:0 }}>
                    <TabBar
                        unselectedTintColor="#fff"
                        tintColor="#f75552"
                        barTintColor="#17567c"
                        // hidden={this.state.hidden}
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
                            selected={this.props.selectedTab === '1'}
                            onPress={() => {
                                this.goPage("#/buy")
                            }}
                            data-seed="logId"
                        >
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
                            selected={this.props.selectedTab === '2'}
                            onPress={() => {
                                this.goPage("#/sell")
                            }}
                            data-seed="logId1"
                        >
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
                            selected={this.props.selectedTab === '3'}
                            onPress={() => {
                                this.goPage("#/pairlist")
                            }}
                        >

                        </TabBar.Item>
                        <TabBar.Item
                            icon={{ uri: './images/dividend.png' }}
                            selectedIcon={{ uri: './images/dividendsel.png' }}
                            title="分红"
                            key="my"
                            selected={this.props.selectedTab === '4'}
                            onPress={() => {
                                this.goPage("#/shares")
                            }}
                        >
                        </TabBar.Item>
                    </TabBar>
                </div>
            </div>
        );
    }
}

export default Layout