import React, { Component } from 'react'
import Layout from './layout';
import abi from './abi'
import i18n from "../i18n";
import { fromValue } from "./utils/common";
import { Button, TextareaItem, SegmentedControl, Modal, Toast, WhiteSpace, WingBlank  } from "antd-mobile";
import { Statistic,Select,message} from 'antd'
import BigNumber from 'bignumber.js';
import '../style/style.css'
import '../style/vote.css'
const { Countdown } = Statistic;
const { Option } = Select;

const selectTypeLabel = ['下拉菜单', '为其他交易对提供流动性', '提供流动性提出CORAL', '设置提案信息']

class vothing extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startPageNum: 0,
            endPageNum: 10,
            dataList: [],
            creatProposalsVisible: false,
            chooseProposalsVisible: false,
            account: {},
            desc: '',
            chooseImg: true,
            successNum: 0,
            failNum: 0,
            selectList: [],
            selectTypes: [
            ],
            proposalDescription: {
                value: 0,
                cy: "CORAL",
                label: "",
                moreThan: 0,
                fee: 0,
                pledgeAmount: 0,
                pledgeCoralAmount: 0
            },
            proposalDescriptionIndex: -1,
            spend: 0,
            selectedIndex: 0,
            storageAmount: 0,
            votIndex: 0,
            votBoolean: true,
            time: 300,
            cycletime: 300,
            loadingmore: false
        };
    }
    componentDidMount() {
        this.doUpdate()
    }
    doUpdate = () => {
        this.setState({
            dataList: []
        })
        this.init().then(() => {
            this.item();
            this.setState({
                endPageNum: 10
            })
            this.tabChoose(this.state.selectedIndex)
        });
    }

    tabChoose(v) {
        let that = this;
        if (v === 0) {
            that.getAllQuery();
        } else if (v === 1) {
            that.myVote();
            that.setState({
                loadingmore: false
            })
        } else {
            that.myCreate();
            that.setState({
                loadingmore: false
            })
        }
    }

    async getAllQuery() {
        let that = this;
        await abi.queryAll(that.state.account.mainPKr, that.state.startPageNum, that.state.endPageNum, function (res) {
            let loadingbool = false;
            if (res[0].length === 10) {
                loadingbool = true;
            }
            that.setState({
                endPageNum: that.state.endPageNum + res[0].length,
                loadingmore: loadingbool
            })
            that.getdateList(res[0])
        })
    }

    async myCreate() {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>myCreate")
        let that = this;
        await abi.myCreate(that.state.account.mainPKr, function (res) {
            that.getdateList(res[0])
        })
    }

    async myVote() {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>myVote")
        let that = this;
        await abi.myVote(that.state.account.mainPKr, function (res) {
            that.getdateList(res[0])
        })
    }

    getdateList(v) {
        const that = this;
        let arrList = [];
        v.forEach((item, index) => {
            let obj = {
                title: 0,
                titleText: '',
                desc: '',
                startime: 0,
                success: 0,
                fail: 0,
                state: 0,
                vaild: 0,
                voteAmount: 0,
                address: false,
                pledgeAmount: 0,
                pledgeCoralAmount: 0,
                votIndex: 0,
                isMy: true,
                moreThan: 0

            }
            obj.title = item[0][0];
            obj.titleText = selectTypeLabel[obj.title];
            obj.desc = item[0][1];
            obj.startime = item[0][2];
            obj.success = item[0][3];
            obj.fail = item[0][4];
            obj.voteState = item[2][1];
            obj.vaild = item[1][6];
            obj.moreThan = item[1][4];
            obj.isMy = item.isMy;
            obj.voteAmount = fromValue(Number(item[2][0]), 18).c[0];
            obj.address = item.slice(item.length - 1, item.length)[0];
            obj.pledgeAmount = fromValue(Number(item[0][7]), 18).c[0];
            obj.pledgeCoralAmount = fromValue(Number(item[0][8]), 18).c[0];
            obj.votIndex = item.infoIdex
            arrList.push(obj);
        });
        console.log(arrList);
        that.setState({
            dataList: arrList
        })
    }

    item() {
        const that = this;
        const { account } = this.state;
        abi.items(account.mainPKr, function (res) {
            let selectlist = [];
            for (let i = 0; i < res[0].length; i++) {
                if (res[0][i][7] === "1") {
                    res[0][i][8] = i;
                    selectlist.push(res[0][i]);
                }
            }
            let selecttype = [];
            for (let j = 0; j < selectlist.length; j++) {
                let selectobj = {
                    value: 0,
                    cy: "",
                    label: "",
                    moreThan: 0,
                    fee: 0,
                    pledgeAmount: 0,
                    pledgeCoralAmount: 0,
                    index: 0,
                }
                selectobj.value = j;
                selectobj.cy = selectlist[j][0];
                selectobj.index = selectlist[j][8];
                selectobj.label = selectTypeLabel[j];
                selectobj.moreThan = selectlist[j][4];
                selectobj.fee = selectlist[j][5];
                selectobj.pledgeAmount = selectlist[j][1];
                selectobj.pledgeCoralAmount = selectlist[j][2];
                selecttype.push(selectobj);
            }
            that.setState({
                selectList: selectlist,
                selectTypes: selecttype
            })

        })
    }
    showCreatModal() {
        const that = this;
        that.setState({
            creatProposalsVisible: true
        })
    }
    closeCreatModal() {
        const that = this;
        that.setState({
            creatProposalsVisible: false
        })
    }
    showChooseModal(e, index) {
        const that = this;
        that.setState({
            chooseProposalsVisible: true,
            votIndex: index
        })
    }
    withdrawVote(e, index) {
        const that = this;
        console.log(index)
        abi.withdrawVote(that.state.account.pk, that.state.account.mainPKr, index, function (hash) {
            if (hash) {
                Toast.loading(i18n.t("pending"), 60)
                that.startGetTxReceipt(hash, () => {
                    Toast.success(i18n.t("success"))
                    that.init().then(() => {
                        that.item();
                        that.tabChoose(that.state.selectedIndex)
                    }).catch();
                })
            }
        })
    }

    withdrawPledgeAmount(e, index) {
        const that = this;
        console.log(index)
        abi.withdrawPledgeAmount(that.state.account.pk, that.state.account.mainPKr, index, function (hash) {
            if (hash) {
                Toast.loading(i18n.t("pending"), 60)
                that.startGetTxReceipt(hash, () => {
                    Toast.success(i18n.t("success"))
                    that.init().then(() => {
                        that.item();
                        that.tabChoose(that.state.selectedIndex)
                    }).catch();
                })
            }
        })
    }

    withdrawPledgeCoralAmount(e, index) {
        const that = this;
        abi.withdrawPledgeCoralAmount(that.state.account.pk, that.state.account.mainPKr, index, function (hash) {
            if (hash) {
                Toast.loading(i18n.t("pending"), 60)
                that.startGetTxReceipt(hash, () => {
                    Toast.success(i18n.t("success"))
                    that.init().then(() => {
                        that.item();
                        that.tabChoose(that.state.selectedIndex)
                    }).catch();
                })
            }
        })
    }

    closeChooseModal() {
        const that = this;
        that.setState({
            chooseProposalsVisible: false
        })
    }
    chooseProposal() {
        const that = this;
        abi.chooseProposal(that.state.account.pk, that.state.account.mainPKr, that.state.votIndex, that.state.votBoolean, that.state.storageAmount, function (hash) {
            if (hash) {
                Toast.loading(i18n.t("pending"), 60)
                that.startGetTxReceipt(hash, () => {
                    Toast.success(i18n.t("success"))
                    that.tabChoose(that.state.selectedIndex)
                })
                that.setState({
                    chooseProposalsVisible: false,
                })
            }
        })
    }

    chooseBtn() {
        const that = this;
        that.setState({
            chooseImg: !that.state.chooseImg,
            votBoolean: !that.state.votBoolean
        })
    }
    storeDesc(e) { this.setState({ desc: e }) }
    sendCoralNum(e) {
        let that = this;
        that.setState({
            storageAmount: e.target.value
        })
    }


    loadingmore() {
        const that = this;
        that.setState({
            dataList: [],
            endPageNum: that.state.endPageNum + 10
        })
        that.getAllQuery();
    }

    async init(pkey) {
        const that = this;
        console.log(pkey, "<<<<<<pkey")
        return new Promise((resolve, reject) => {
            abi.init.then(() => {
                let pk = localStorage.getItem("accountPK")
                if (pkey) {
                    pk = pkey;
                }
                abi.accountList(function (accounts) {
                    if (pk) {
                        for (let act of accounts) {
                            if (pk === act.pk) {
                                that.setState({ account: act });
                                break;
                            }
                        }
                    } else {
                        pk = accounts[0].pk;
                        localStorage.setItem("accountPK", pk);

                        that.setState({ account: accounts[0] });
                    }
                    resolve();
                });

            });

        })
    }

    creatType(e) {
        const that = this;
        console.log(e)
        let arr = that.state.selectTypes
        let obj = arr.find(function (item) {
            return item.value = e;
        })

        that.setState({
            selectIndex: e,
            proposalDescription: obj,
            proposalDescriptionIndex: obj.index,
            spend: new BigNumber(obj.pledgeAmount).plus(obj.pledgeCoralAmount).toNumber()
        })
    }

    createProposal() {
        const that = this;
        let { account } = that.state;
        if(that.state.proposalDescriptionIndex!==-1){
            abi.create(account.pk, account.mainPKr, that.state.proposalDescriptionIndex, that.state.desc, that.state.spend, function (hash) {
                if (hash) {
                    Toast.loading(i18n.t("pending"), 60)
                    that.startGetTxReceipt(hash, () => {
                        Toast.success(i18n.t("success"))
                        that.init().then(() => {
                            that.item();
                            that.setState({
                                endPageNum: that.state.endPageNum + 1,
                                selectIndex:-1,
                                proposalDescriptionIndex:-1
                            })
                            that.tabChoose(that.state.selectedIndex)
                        }).catch();
                    })
                    that.setState({
                        creatProposalsVisible: false
                    })
                }
            });
        }else{
            message.error('请选择提案类型');
        }
    }


    startGetTxReceipt = (hash, cb) => {
        const that = this;
        abi.getTransactionReceipt(hash).then(res => {
            if (res && res.result) {
                if (cb) {
                    cb();
                }
            } else {
                setTimeout(function () {
                    that.startGetTxReceipt(hash, cb)
                }, 2000)
            }
        })
    }

    selectedIndex(e) {
        const that = this;
        that.setState({
            dataList: [],
            selectedIndex: e.nativeEvent.selectedSegmentIndex
        })
        that.tabChoose(e.nativeEvent.selectedSegmentIndex)
    }

    showFlag(n) {
        if (!n) {
            this.setState({ modal1: true })
        }
        else {
            this.setState({ modal1: false })
        }
    }
    render() {
        console.log(this.state, "state>>>>>");
        return (
            <Layout selectedTab="5" doUpdate={() => this.doUpdate()}>
                <div className="vote">
                    <div className="votesend">
                        <WhiteSpace />
                        <Button className="sendbtn" type="warning" >
                            <img src={require('../images/create.png')} alt="" />
                            <span onClick={() => this.showCreatModal()}> 发起提案</span>
                        </Button>
                        <Modal
                            className="creatbox"
                            visible={this.state.creatProposalsVisible}
                            transparent
                            closable={true}
                            maskClosable={false}
                            onClose={() => this.closeCreatModal()}
                            title="提案类型"
                            wrapProps={{ onTouchStart: this.onWrapTouchStart }}
                        >
                            <div className="creatbox-content">
                                <div className="selectbox">
                                    <Select placeholder="选择提案类型" onChange={(e) => this.creatType(e)}>
                                        {this.state.selectTypes.map((item, index) => {
                                            return (<Option value={item.value}>{item.label}</Option>)
                                        })}
                                    </Select>
                                </div>
                                <div className="descbox">
                                    <TextareaItem
                                        placeholder="输入提案具体内容，如增加流动性挖矿交易对"
                                        data-seed="logId"
                                        autoHeight
                                        rows="4"
                                        onChange={(e) => this.storeDesc(e)}
                                        ref={el => this.customFocusInst = el}
                                    />
                                </div>
                                <div className="btnbox">
                                    <Button className="creatbtn" onClick={() => this.createProposal()}>确认发起</Button>
                                </div>
                                <div className="messagebox">
                                    <p>提案发起规则：</p>
                                    <p>1.发起提案需要只要{new BigNumber(this.state.proposalDescription.pledgeAmount).dividedBy(10 ** 18).toString()}{this.state.proposalDescription.cy}(从当前账户扣除);</p>
                                    <p>2.提案成功后，需其中{this.state.proposalDescription.fee}%的CORAL 、DAO具体执行提案的成本费用，其余在提案发起后即时退还，提案失败将全部返还。</p>
                                    <p>3.挖矿系提供{new BigNumber(this.state.proposalDescription.pledgeCoralAmount).dividedBy(10 ** 18).toString()}{this.state.proposalDescription.cy}</p>
                                </div>
                            </div>
                        </Modal>
                        <WhiteSpace />
                    </div>
                    <div className="votebtn">
                        <WingBlank size="lg" className="sc-example">
                            <SegmentedControl selectedIndex={this.state.selectedIndex} onChange={(e) => this.selectedIndex(e)} values={['全部', '我参与的', '我创建的']} />
                        </WingBlank>
                    </div>
                    <div className="votelist">
                        {
                            this.state.dataList.map((item, index) => {
                                let nowTime = new Date().getTime();
                                let endTime = item.startime * 1000 + this.state.time * 1000;
                                let endcycleTime = item.startime * 1000 + this.state.cycletime * 1000;
                                let votIndex = item.votIndex;
                                return (<div className="listbox">
                                    <div className="box">
                                        <div className="left">
                                            <div className="title">
                                                <p>
                                                    {item.titleText}
                                                </p>
                                            </div>
                                            <div className="sendCY">
                                                <p>{item.desc}</p>
                                            </div>
                                            <div className="timebox">
                                                <div className="timebox-left">
                                                    <img src={require('../images/countDown.png')} alt="" />
                                                    <p>剩余投票时间： </p>
                                                </div>
                                                <div className="timebox-right">
                                                    <Countdown value={endTime} format="D 天 H 时 m 分 s 秒" />
                                                </div>
                                            </div>
                                            <div className="choosebox">
                                                <div className="chooseboxleft">
                                                    <p>同意：{item.success}票</p>
                                                </div>
                                                <div className="chooseboxright">
                                                    <p>不同意：{item.fail}票</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="right">
                                            {
                                                nowTime < endTime ?
                                                    <div>
                                                        {
                                                            item.voteState === '0' ? <Button className="participate" onClick={(e) => this.showChooseModal(e, votIndex)}>参与投票</Button> : <Button className="participateafter">已经投票</Button>
                                                        }

                                                    </div> : <div className="imgtype">
                                                        {
                                                            item.success - item.moreThan > item.fail ? <img src={require("../images/success.png")} alt="" /> : <img src={require("../images/fail.png")} alt="" />
                                                        }
                                                    </div>
                                            }
                                        </div>
                                    </div>
                                    {
                                        nowTime > endTime ?
                                            <div className="withdrawbox">
                                                {
                                                    item.voteAmount !== 0 ? <div className="withdrawvot">
                                                        <div className="left">
                                                            <p>提现投票质押CORAL：{item.voteAmount}</p>
                                                        </div>
                                                        <div className="right">
                                                            {
                                                                item.voteState === '1' ? <button className="btnyes" onClick={(e) => this.withdrawVote(e, votIndex)}>提现</button> : <button className="btnno">已提现</button>
                                                            }
                                                        </div>
                                                    </div> : <div></div>
                                                }
                                                {
                                                    item.isMy ? <div className="mybox">
                                                        <div className="withdrawpledge">
                                                            <div className="left">
                                                                <p>提现创建提案质押CORAL：{item.pledgeAmount}</p>
                                                            </div>
                                                            <div className="right">
                                                                {
                                                                    item.pledgeAmount !== 0 ? <button className="btnyes" onClick={(e) => this.withdrawPledgeAmount(e, votIndex)}>提现</button> : <button className="btnno">已提现</button>
                                                                }
                                                            </div>
                                                        </div>
                                                        {
                                                            nowTime > endcycleTime ? <div className="withdrawpledgecoral">
                                                                <div className="left">
                                                                    <p>提现创建提案挖矿CORAL：{item.pledgeCoralAmount}</p>
                                                                </div>
                                                                <div className="right">
                                                                    {
                                                                        item.pledgeCoralAmount !== 0 ? <button className="btnyes" onClick={(e) => this.withdrawPledgeCoralAmount(e, votIndex)}>提现</button> : <button className="btnno">已提现</button>
                                                                    }
                                                                </div>
                                                            </div> : <div></div>
                                                        }
                                                    </div> : <div></div>
                                                }
                                            </div> : <div></div>
                                    }
                                </div>
                                )
                            })
                        }

                        <Modal
                            className="choosebox"
                            visible={this.state.chooseProposalsVisible}
                            transparent
                            closable={true}
                            maskClosable={false}
                            onClose={() => this.closeChooseModal()}
                            title="选择投票结果"
                            wrapProps={{ onTouchStart: this.onWrapTouchStart }}
                        >
                            <div className="choosebox">
                                <div className="choosebtnList">
                                    <div>
                                        <div className="img" onClick={() => this.chooseBtn()}>
                                            {
                                                this.state.chooseImg ? <img src={require("../images/redhook.png")} alt="" /> : <img src={require("../images/grayhook.png")} alt="" />
                                            }
                                        </div>
                                        <div className="title">
                                            <p>同意</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="img" onClick={() => this.chooseBtn()}>
                                            {
                                                this.state.chooseImg ? <img src={require("../images/grayhook.png")} alt="" /> : <img src={require("../images/redhook.png")} alt="" />
                                            }
                                        </div>
                                        <div className="title">
                                            <p>不同意</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="sendnum">
                                    <input placeholder="请输入质押CORAL数量" type="text" onChange={(e) => this.sendCoralNum(e)} />
                                </div>
                                <div className="btnbox">
                                    <Button className="choosebtn" onClick={() => this.chooseProposal()}>确认投票</Button>
                                </div>
                                <div className="messagebox">
                                    <p>投票规则：</p>
                                    <p>1.投票需要质押对应的CORAL数量;</p>
                                    <p>2.票数计算方式为投入CORAL数量的平方根，投票结束返还到投票账户。</p>
                                </div>
                            </div>
                        </Modal>

                        {
                            this.state.loadingmore ? <div className="loadingmore">
                                <Button onClick={() => this.loadingmore()}>加载更多.....</Button>
                            </div> : <div></div>

                        }

                    </div>
                </div>
            </Layout>
        );
    }
}
export default vothing;