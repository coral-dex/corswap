import React, {useState,Context, Component } from 'react'
import Layout from './layout';
import abi from './abi'
import {showValue,toValue,fromValue} from "./utils/common";
import {Button,Radio, Flex,InputItem,TextareaItem,DatePicker,Picker,SegmentedControl,ListView,List, Modal, SearchBar, Toast, WhiteSpace, WingBlank} from "antd-mobile";
import BigNumber from 'bignumber.js';
import '../style/style.css'
// import { Statistic,Tabs,BackTop,Anchor} from 'antd';
// import { StickyContainer, Sticky } from 'react-sticky';
// import Item from 'antd/lib/list/Item';
// const {TabPane} = Tabs;
// const { Countdown } = Statistic;
class vothing extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            account:{},
            title:'',
            desc:'',
            proposals:[],
            modal1:false,  
            modal2:false,
            amount:0, //storage CORAL amount
            selectItem:null, // current proposal
            selectType:false, //select proposal type
            value:0,
            type:"请选择提案类型",
            typeIndex:0,
            types:[
                {index:0,text:"新增流动性挖坑交易对"},
                {index:1,text:"为其他交易对提供流动性"},
                {index:2,text:"提供流动性提出CORAL"},
            ],
            selectedIndex:0,
            detail:false,
            index:0,//点了哪个提案
            loading:0,
            loadingPage:true,
            show:false,
        };
    }
    async init (pkey) {
        let self = this;
        return new Promise((resolve, reject) => {
            abi.init.then(() => {
                let pk = localStorage.getItem("accountPK")
                if(pkey){
                    pk = pkey;
                }
                abi.accountList(function (accounts) {
                    if (pk) {
                        for (let act of accounts) {
                            if (pk === act.pk) {
                                self.setState({account: act});
                                break;
                            }
                        }
                    } else {
                        pk = accounts[0].pk;
                        localStorage.setItem("accountPK",pk);
                        self.setState({account: accounts[0]});
                    }
                    resolve();
                });
            });

        })
    }
    componentDidMount(){
        this.init().then(()=>{})
        this.switch(0);
    }
    createProposal(){
        let {account,type,desc,types,typeIndex,proposals,} = this.state;
        let self = this;
        console.log(typeIndex,"indexing");
        if(type!=="请选择提案类型"){
                // let propos = this.state.proposals;
            abi.create(account.pk,account.mainPKr,typeIndex,desc,function(hash){
                Toast.loading("loading....")
                console.log(hash,"hash");
                abi.getTransactionReceipt(hash).then((res)=>{
                    if(res){
                        Toast.hide();
                        self.setState({modal1:false,desc:"",type:"请选择提案类型"})
                    }
                    console.log("cuccess")
                })
            });
        }else{ 
            Toast.fail("请选择提案类型",1)
        }
    }   
    storeDesc(e){  this.setState({ desc:e }) }
    showFlag(n){
        if(!n){
            this.setState({ modal1:true })
        }
            else{this.setState({ modal1:false })
        }
    }
    storeCoral(e){console.log("您准备质押",e.target.value,"CORAL"); this.setState({ amount:e.target.value }) }
    loadingProposal(){ //
        let {account,loading,proposals,loadingPage} = this.state;
        let self = this;
        let arr = [];
        abi.queryAll(account.mainPKr,loading,loading+10,function(all){
            Toast.loading('Loading...',1, () => {
                if(all){
                    if(all[0].length<10){
                        loadingPage = false;
                    }
                    loading= loading+10;
                    all[0].forEach(item=>{
                        console.log(fromValue(item[0][7],18),"FromValue")
                        arr.push({
                            desc:item[0][1],
                            title:item[0][0],
                            success:item[0][3],
                            fail:item[0][4],
                            pledgeAmount:item[0][7],
                        })
                    })
                    proposals = proposals.concat(arr);
                    self.setState({proposals:proposals,loading:loading,loadingPage:loadingPage})

                }
            });       
        })
    }
    switch(v){  // all myvote mycreate
        let {account,type,loading} = this.state;
        let self = this;
        let arr = [];
        if(loading === 0){
            loading = 10;
        }
        if(v==0){
            abi.queryAll(account.mainPKr,0,loading,function(all){
                if(all){
                    all[0].forEach(item=>{
                        console.log(item)
                        arr.push({
                            desc:item[0][1],
                            title:item[0][0],
                            success:item[0][3],
                            startTime:item[0][2],
                            fail:item[0][4],
                            state:item[2][1],
                            vaild:item[1][6],
                            voteAmount:fromValue(Number(item[2][0]),18).c[0],
                            address:item.slice(item.length-1,item.length)[0],
                            pledgeAmount:fromValue(Number(item[0][7]),18).c[0],
                            title:"为其他交易对提供流动性"
                        })
                    })
                }
                self.setState({proposals:arr,selectedIndex:v,loading:loading})
                console.log(self.state.loading,"更新后")
            })
        }else if(v==1){
            abi.myVote(account.mainPKr,function(vote){
                vote[0].forEach(item=>{
                    console.log(item[0].slice(item.length-1,item.length),"MyVote")
                    arr.push({
                        desc:item[0][1],
                        title:item[0][0],
                        success:item[0][3],
                        startTime:item[0][2],
                        fail:item[0][4],
                        state:item[2][1],
                        vaild:item[1][6],
                        voteAmount:fromValue(Number(item[2][0]),18).c[0],
                        address:item.slice(item.length-1,item.length)[0],
                        pledgeAmount:fromValue(Number(item[0][7]),18).c[0],
                        title:"为其他交易对提供流动性"
                    })
                })
                // console.log(vote,"VOTE")
                self.setState({proposals:arr,selectedIndex:v})
            })
        }else if(v==2){
            abi.myCreate(account.mainPKr,function(create){
                create[0].forEach(item=>{
                    // console.log(item,"MyCreate")
                    arr.push({
                        desc:item[0][1],
                        title:item[0][0],
                        success:item[0][3],
                        startTime:item[0][2],
                        fail:item[0][4],
                        state:item[2][1],
                        vaild:item[1][6],
                        voteAmount:fromValue(Number(item[2][0]),18).c[0],
                        address:item.slice(item.length-1,item.length)[0],
                        pledgeAmount:fromValue(Number(item[0][7]),18).c[0],
                        title:"为其他交易对提供流动性"
                    })
                    console.log(item)
                })
                // console.log(create,"CREATE")
                self.setState({proposals:arr,selectedIndex:v})
            })
        }
    }
    over(){}
    close(){ this.setState({modal2:false}) }
    onChange(e){
        if(e==1){
            this.setState({ value: 1 });
        }else if(e==2){
            this.setState({ value:2 });
        }
      };
    selectType(){ this.setState({selectType:true}) }
    select(e,index){
        console.log(index,"选择了",e.target.dataset.text)
        this.setState({
            type:e.target.dataset.text,
            selectType:false,
            typeIndex:index,
        })
    }
    userVote(v,index){ //参与投票
        let {account} = this.state;
        let self = this;
        console.log("点击了第",index,"个")
        abi.isRepeatVote(account.pk,account.mainPKr,index,function(res){
            if(res){
                if(!res[0]){
                    self.setState({
                        modal2:true,
                        selectItem:v,
                        index:index
                    })
                }else{
                    Toast.fail("请勿重复参加提案",1)
                }
            }
        })
        
    }
    confirmVote(){
        let {account,selectItem,amount,value,proposals,index} = this.state;
        let self = this;
        let boolean = false;
        if(value==1){ boolean = true; }
        abi.confirmVote(account.pk,account.mainPKr,index,boolean,amount,function(res){
            if(res){ self.setState({modal2:false,value:3}) }
        })        
    }
    withDrawCoral(index){
        let {account} = this.state;
        abi.withDrawCoral(account.pk,account.mainPKr,index,function(res){ })
    }
    withDrawCreate(index){
        let {account} = this.state;
        abi.withDrawCreate(account.pk,account.mainPKr,index,function(res){ })
    }
    render() {
        let {selectItem,selectedIndex,proposals,value,account,show} = this.state;
        const style = {
            height: 40,
            width: 40,
            lineHeight: '40px',
            borderRadius: 4,
            backgroundColor: '#1088e9',
            color: '#fff',
            textAlign: 'center',
            fontSize: 14,
        };
        return (
            <Layout selectedTab="5" doUpdate={()=>this.init()}>       
                <div style={{padding:"0 16px",marginBottom:"70px"}}>
                    {/* <BackTop visibilityHeight="70">
                        <div style={style} type="primary">UP</div>
                    </BackTop>    */}
                    <WhiteSpace/>
                        <Button className="flex-center" type="warning" onClick={()=>this.showFlag()}>
                            <img width="7%" src={require("../images/create.png")}/>
                            &ensp;
                            发起提案
                        </Button>
                    <WhiteSpace/>
                    <div className="divs">
                        <SegmentedControl id="control" tintColor="#00456e" selectedIndex={selectedIndex} onChange={(e)=>this.switch(e.nativeEvent.selectedSegmentIndex)} values={['全部', '我参与的', '我创建的']} />
                    </div>
                    <WhiteSpace/>
                    <div>
                        <Modal
                        style={{height:"300px",backgroundColor:"#fff",borderRadius:"7px",position:"relative"}}
                        visible={this.state.modal1}
                        transparent
                        maskClosable={false}
                        closable={true}
                        onClose={()=>{this.showFlag(1)}}
                        title="提案类型"
                        >
                            <div style={{}}>
                                <Flex style={{border:"1px solid #ccc",height:"30px"}} onClick={()=>this.selectType()}>
                                    <Flex.Item>
                                        <div>{this.state.type}</div>
                                    </Flex.Item>
                                    <Flex.Item style={{textAlign:"right"}}>
                                        <img width="16px" src={require("../images/bottom.png")}/>
                                    </Flex.Item>
                                </Flex>
                                    <Modal
                                    style={{height:"300px"}}
                                    popup
                                    title="选择提案类型"
                                    maskClosable={true}
                                    visible={this.state.selectType}
                                    animationType="slide-up"
                                    >
                                        {this.state.types.map((item,index)=>{
                                            return(<div data-text={item.text} onClick={(e)=>this.select(e,index)}>
                                                    {item.text}
                                                <WhiteSpace/>
                                            </div>)
                                        })}
                                    </Modal>
                                <List>
                                    <TextareaItem
                                        style={{border:"1px solid #ccc"}}
                                        rows={3}
                                        onChange={(e)=>this.storeDesc(e)}
                                        placeholder="输入提案具体内容，如增加流动性挖矿交易对"
                                    />
                                </List>
                                <Button type="primary" onClick={()=>this.createProposal()}>确认发起</Button>
                            </div>
                        </Modal>
                    </div>
                    <div>
                        {this.state.proposals.map((v,index)=>{
                            let time = Number(v.startTime)*1000 + Number(v.vaild*1000);
                            let endTime = Number(v.startTime) + Number(v.vaild);
                          return (<div className="flex" style={{backgroundColor:"#f6fbfc",padding:"14px",marginBottom:"10px"}}>
                                <div style={{width:"60%"}}>
                                    <div>{v.title}</div>
                                    <WhiteSpace/>
                                    <div>{v.desc}</div>
                                    <p style={{borderBottom:"1px solid #ccc"}}></p>
                                    <Flex>
                                        <Flex.Item><img src={require("../images/countDown.png")} width="14px"/>&ensp;剩余投票时间:</Flex.Item>
                                        <Flex.Item style={{textAlign:"center"}}>
                                            {/*{*/}
                                            {/*    Date.now()/1000 > v.startTime && Date.now()/1000 < endTime*/}
                                            {/*    ?*/}
                                            {/*    <Countdown title="" value={time} format="D天H时m分s秒"/> : <div>0 天</div>*/}
                                            {/*}*/}
                                            
                                        </Flex.Item>
                                    </Flex>
                                    <WhiteSpace/>
                                    <Flex>
                                        <Flex.Item>同意:{v.success}票</Flex.Item>
                                        <Flex.Item style={{textAlign:"right"}}>反对:{v.fail}票</Flex.Item>
                                    </Flex> 
                                    <WhiteSpace/>
                                        {
                                            Date.now()/1000 - v.startTime > v.vaild && v.voteAmount>0 && v.state!=2?<Flex style={{width:"100%"}}>
                                                <Flex.Item>投票质押{v.voteAmount}CORAL</Flex.Item>
                                                <Flex.Item><Button onClick={()=>this.withDrawCoral(index)} className="withdraw" type="primary">提现</Button></Flex.Item>
                                            </Flex>:""
                                            //<Button style={{height:"22px",lineHeight:"22px"}} type="primary" disabled>提现</Button>
                                        }
                                    <WhiteSpace/>
                                        {
                                            Date.now()/1000 - v.startTime > v.vaild && v.pledgeAmount>0 &&v.state!=2? <Flex style={{width:"100%"}}>
                                                <Flex.Item>创建提案质押{v.pledgeAmount}CORAL</Flex.Item>
                                                <Flex.Item><Button onClick={()=>this.withDrawCreate(index)} className="withdraw" type="primary">提现</Button></Flex.Item>
                                            </Flex>:""
                                            //<Button style={{height:"22px",lineHeight:"22px"}} type="primary" disabled>提现</Button>
                                        }
                                    <WhiteSpace/>
                                </div>
                                <Flex style={{width:"38%",textAlign:"right"}}>
                                    <Flex.Item>
                                        {
                                            Date.now()/1000 > v.startTime && Date.now()/1000 < endTime ?
                                            <Button type="primary" style={{borderRadius:"30px",height:"35px",lineHeight:"35px"}} onClick={()=>this.userVote(v,index)}>参与投票</Button>
                                            : 
                                            v.success !== v.fail && v.success - v.fail >= 2? <img src={require("../images/success.png")} width="60px"/>
                                            : <img src={require("../images/fail.png")} width="60px"/>
                                        }
                                    </Flex.Item>
                                </Flex>
                          </div>)
                        })}
                        <WhiteSpace/>
                        {
                            this.state.loadingPage?<Button onClick={()=>this.loadingProposal()} type="primary">加载更多</Button>
                            : " "
                        }
                    </div>
                </div>

                <Modal
                visible={this.state.modal2}
                maskClosable={false}
                transparent
                style={{padding:"16px"}}
                animationType="slide-up"
                >
                <List renderHeader={() => <div>参加提案</div>} className="popup-list">
                    <div>
                        <input className="input" placeholder={"请输入您要质押的CORAL数量"}  onChange={(e)=>this.storeCoral(e)}/>
                        <WhiteSpace/>
                        <Flex>
                            <Flex.Item>
                                <Button className={value==1?'selectRadio':''} disabled={value==1} onClick={()=>this.onChange(1)} type="primary">同意</Button>
                            </Flex.Item>
                            <Flex.Item>
                                <Button className={value==2?'selectRadio':''} disabled={value==2} onClick={()=>this.onChange(2)} type="warning">否决</Button>
                            </Flex.Item>
                        </Flex>
                        <WhiteSpace/>
                        <Button type="primary" onClick={()=>this.confirmVote()}>确认</Button>
                        <Button type="warning" onClick={()=>this.close()}>取消</Button>
                    </div>
                </List>
                </Modal>
            </Layout>
        );
    }
}
export default vothing;