import * as React from 'react';
import {TabBar} from "antd-mobile";



class Layout extends React.Component{

    goPage=(uri)=>{
        window.location.href=uri
        // window.open(uri)
    }

    render() {
        return (
            <div>
                {this.props.children}
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