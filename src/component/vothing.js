import React, { Component } from 'react'
import Layout from './layout';
import abi from './abi'
import i18n from "../i18n";
import { fromValue } from "./utils/common";
import { Button, TextareaItem, SegmentedControl, Modal, Toast, WhiteSpace, WingBlank } from "antd-mobile";
import { Statistic, Select, message } from 'antd'
import BigNumber from 'bignumber.js';
import '../style/style.css'
import '../style/vote.css'
const { Countdown } = Statistic;
const { Option } = Select;
const selectTypeLabel = [`${i18n.t("tothemainboard")}`, `${i18n.t("governanceproposals")}`]

const oneDay = 60*60*24;
const Delay = 15000;

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
                pledgeCoralAmount: 0,
                moreThanPercent: 0,
            },
            proposalDescriptionIndex: -1,
            spend: 0,
            selectedIndex: 0,
            storageAmount: 0,
            votIndex: 0,
            votBoolean: true,
            time: 300,
            cycletime: 300,
            loadingmore: false,
            creatTypeText: `${i18n.t("Selectproposaltype")}`,
            creatTypeTextVisible: false,
            selectItem: null,
            estimatedvotes: 0
        };
    }
    componentDidMount() {
        let that = this;
        that.doUpdate()
    }
    doUpdate = () => {
        let that = this;

        that.setState({
            dataList: []
        })
        that.init().then(() => {
            that.item();
            that.setState({
                endPageNum: 10
            })
            that.tabChoose(that.state.selectedIndex)
        });
    }
    tabChoose(v) {
        let that = this;
        if (v === 0) {
            that.getAllQuery();
            that.setState({
                estimatedvotes: 0,
                storageAmount: 0,
            })
        } else if (v === 1) {
            that.myVote();
            that.setState({
                estimatedvotes: 0,
                storageAmount: 0,
                loadingmore: false
            })
        } else {
            that.myCreate();
            that.setState({
                estimatedvotes: 0,
                storageAmount: 0,
                loadingmore: false
            })
        }
    }

    Refresh() {
        const that = this;
        setTimeout(() => {
            that.setState({
                dataList: []
            })
            that.init().then(() => {
                that.item();
                that.tabChoose(that.state.selectedIndex)
            });
        }, 10000);
    }
    opentypebox() {
        const that = this;
        that.setState({
            creatTypeTextVisible: true
        })
    }
    closecreatTypeModal() {
        const that = this;
        that.setState({
            creatTypeTextVisible: false
        })
    }
    async getAllQuery() {
        const that = this;
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
        let that = this;
        await abi.myCreate(that.state.account.mainPKr, function (res) {
            that.getdateList(res[0])
        })
    }

    async myVote() {
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
                pledgeAmountState: false,
                pledgeCoralAmount: 0,
                pledgeCoralAmountState: false,
                votIndex: 0,
                isMy: true,
                moreThan: 0,
                pledgeCoralPeriod: 0,
                period: 0,
                fee: 0
            }
            obj.fee = item[1].fee;
            obj.title = item[0][0];
            obj.titleText = selectTypeLabel[obj.title];
            obj.desc = item[0][1];
            obj.startime = item[0][2];
            obj.success = item[0][3];
            obj.fail = item[0][4];
            obj.voteState = item[2].state;
            obj.vaild = item[1][6];
            obj.moreThan = item[1][4];
            obj.moreThanPercent = item[1][8];
            obj.period = item[1][6];
            obj.pledgeCoralPeriod = item[1][3];
            obj.isMy = item.isMy;
            obj.voteAmount = fromValue(Number(item[2][0]), 18).c[0];
            obj.address = item.slice(item.length - 1, item.length)[0];
            obj.pledgeAmount = fromValue(Number(item[1].pledgeAmount), 18).c[0];
            obj.pledgeAmountState = item[0].pledgeAmountState;
            obj.pledgeCoralAmount = fromValue(Number(item[1].pledgeCoralAmount), 18).c[0];
            obj.pledgeCoralAmountState = item[0].pledgeCoralAmountState;
            obj.votIndex = item.infoIdex
            arrList.push(obj);
        });
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
                if (res[0][i][7]) {
                    res[0][i][9] = i;
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
                    period: 0,
                    pledgeCoralPeriod: 0

                }
                selectobj.value = j;
                selectobj.cy = selectlist[j][0];
                selectobj.index = selectlist[j][9];
                selectobj.label = selectTypeLabel[j];
                selectobj.moreThan = selectlist[j][4];
                selectobj.fee = selectlist[j][5];
                selectobj.pledgeAmount = selectlist[j][1];
                selectobj.pledgeCoralAmount = selectlist[j][2];
                selectobj.moreThanPercent = selectlist[j][8];
                selectobj.pledgeCoralPeriod = selectlist[j][3];
                selectobj.period = selectlist[j][6];
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
    showChooseModal(e, item) {
        const that = this;
        that.setState({
            chooseProposalsVisible: true,
            votIndex: item.votIndex,
            selectItem: item
        })
    }
    withdrawVote(e, index) {
        const that = this;
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
            chooseProposalsVisible: false,
            estimatedvotes: 0,
            storageAmount: 0
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
                    that.setState({
                        chooseProposalsVisible: false,
                    })
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

    isNumber(value) {
        var patrn = /^(-)?\d+(\.\d+)?$/;
        if (patrn.exec(value) == null || value == "") {
            return false
        } else {
            return true
        }
    }
    sendCoralNum(e) {
        let that = this;
        let isNumt = that.isNumber(e.target.value)
        if (e.target.value.length > 0) {
            if (isNumt) {
                that.setState({
                    estimatedvotes: Math.floor(Math.sqrt(e.target.value)),
                    storageAmount: e.target.value
                })
            } else {
                that.setState({
                    storageAmount: 0
                })
                message.warn(`${i18n.t("Pleasekeyinnumbers")}`)
            }
        } else {
            that.setState({
                estimatedvotes: 0,
                storageAmount: 0
            })
        }
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
        let arr = that.state.selectTypes;
        let obj = arr[e.target.dataset.index]
        that.setState({
            creatTypeText: e.target.dataset.label,
            creatTypeTextVisible: false,
            proposalDescription: obj,
            proposalDescriptionIndex: obj.index,
            spend: new BigNumber(obj.pledgeAmount).plus(obj.pledgeCoralAmount).toNumber()
        })
    }

    createProposal() {
        const that = this;
        let { account } = that.state;
        if (that.state.proposalDescriptionIndex !== -1) {
            abi.create(account.pk, account.mainPKr, that.state.proposalDescriptionIndex, that.state.desc, that.state.spend, function (hash) {
                if (hash) {
                    Toast.loading(i18n.t("pending"), 60)
                    that.startGetTxReceipt(hash, () => {
                        Toast.success(i18n.t("success"))
                        that.init().then(() => {
                            that.item();
                            that.setState({
                                creatProposalsVisible: false,
                                endPageNum: that.state.endPageNum + 1,
                                proposalDescriptionIndex: -1,
                                creatTypeText: `${i18n.t("Selectproposaltype")}`,
                            })
                            that.tabChoose(that.state.selectedIndex)
                        }).catch();
                    })

                }
            });
        } else {
            message.error(`${i18n.t("Pleaseselectproposaltype")}`);
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
        const timeText = "D " + `${i18n.t("day")}` + " H " + `${i18n.t("hour")}` + " m " + `${i18n.t("Minute")}` + " s " + `${i18n.t("second")}`;
        return (
            <Layout selectedTab="5" doUpdate={() => this.doUpdate()}>
                <div className="vote">
                    <div className="votesend">
                        <WhiteSpace />
                        <Button className="sendbtn" type="warning" onClick={() => this.showCreatModal()} >
                            <img src={require('../images/create.png')} alt="" />
                            <span > {i18n.t("Initiateaproposal")}</span>
                        </Button>
                        <Modal
                            className="typebox"
                            visible={this.state.creatTypeTextVisible}
                            transparent
                            maskClosable={false}
                            closable={true}
                            title={`${i18n.t("Selectproposaltype")}`}
                            onClose={() => this.closecreatTypeModal()}
                        >
                            {
                                this.state.selectTypes.map((item) => {
                                    return (
                                        <div className="itemtypebox" data-label={item.label} data-index={item.value} onClick={(e) => this.creatType(e)}>{item.label}</div>
                                    )
                                })
                            }
                        </Modal>
                        <Modal
                            className="creatbox"
                            visible={this.state.creatProposalsVisible}
                            transparent
                            closable={true}
                            maskClosable={false}
                            onClose={() => this.closeCreatModal()}
                            title={`${i18n.t("Proposaltype")}`}
                            wrapProps={{ onTouchStart: this.onWrapTouchStart }}
                        >
                            <div className="creatbox-content">
                                <div className="selectbox">
                                    <div className="creatTypebox">
                                        <div className="left">
                                            {this.state.creatTypeText}
                                        </div>
                                        <div className="right" onClick={() => this.opentypebox()}>
                                            <img src={require('../images/bottom.png')} alt="" />
                                        </div>
                                    </div>
                                </div>
                                <div className="descbox">
                                    <TextareaItem
                                        placeholder={`${i18n.t("Enterthespecificcontent")}`}
                                        data-seed="logId"
                                        autoHeight
                                        rows="4"
                                        onChange={(e) => this.storeDesc(e)}
                                        ref={el => this.customFocusInst = el}
                                    />
                                </div>
                                <div className="btnbox">
                                    <Button className="creatbtn" onClick={() => this.createProposal()}>{i18n.t("Confirmtoinitiate")}</Button>
                                </div>
                                <div className="messagebox">
                                    <p>{i18n.t("Proposalinitiationrules")}：</p>
                                    <p>
                                        1.{i18n.t("Pledgeisrequiredtoinitiateaproposal")}{new BigNumber(this.state.proposalDescription.pledgeAmount).dividedBy(10 ** 18).toString()}{this.state.proposalDescription.cy}
                                        {i18n.t("Deductedfromthecurrentaccount")}
                                        {this.state.proposalDescription.fee}%{i18n.t("Cost")}。
                                    </p>
                                    <p>2.{i18n.t("exceed")}{this.state.proposalDescription.moreThan}{i18n.t("successfulvotesexceeds")}{this.state.proposalDescription.moreThanPercent}%。</p>
                                    {
                                        new BigNumber(this.state.proposalDescription.pledgeCoralAmount).dividedBy(10 ** 18).toString() === "0" ? <p></p> : <p>3.{i18n.t("defaultvalidityperiodis")}{this.state.proposalDescription.pledgeCoralPeriod / oneDay}{i18n.t("currenAdditionalpledgetRatio")}{new BigNumber(this.state.proposalDescription.pledgeCoralAmount).dividedBy(10 ** 18).toString()}{this.state.proposalDescription.cy} {i18n.t("Willreturn")} 。</p>
                                    }
                                </div>
                            </div>
                        </Modal>
                        <WhiteSpace />
                    </div>
                    <div className="votebtn">
                        <WingBlank size="lg" className="sc-example">
                            <SegmentedControl selectedIndex={this.state.selectedIndex} onChange={(e) => this.selectedIndex(e)} values={[`${i18n.t("All")}`, `${i18n.t("Iparticipated")}`, `${i18n.t("Icreated")}`]} />
                        </WingBlank>
                    </div>
                    <div className="votelist">
                        {
                            this.state.dataList.map((item, index) => {
                                let nowTime = new Date().getTime();
                                let endTime = item.startime * 1000 + item.period * 1000 + Delay;
                                let endcycleTime = item.startime * 1000 + item.pledgeCoralPeriod * 1000 + Delay;
                                let votIndex = item.votIndex;
                                let success = item.success * 1;
                                let fail = item.fail * 1;
                                let moreThan = item.moreThan * 1;
                                let moreThanPercent = item.moreThanPercent * 1;
                                return (<div className="listbox">
                                    <div className="box">
                                        <div className="left">
                                            <div className="title">
                                                <p>
                                                    {item.titleText}
                                                </p>
                                            </div>
                                            <div className="sendCY">
                                                {/* <p>{item.desc}</p> */}
                                                <pre>{item.desc}</pre>
                                            </div>
                                            <div className="timebox">
                                                <div className="timebox-left">
                                                    <img src={require('../images/countDown.png')} alt="" />
                                                    <p>&nbsp;{i18n.t("Remainingvotingtime")}： </p>
                                                </div>

                                                <div className="timebox-right">
                                                    <Countdown value={endTime}
                                                        format={timeText}
                                                        onFinish={() => this.Refresh()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="choosebox">
                                                <div className="chooseboxleft">
                                                    <p>{i18n.t("agree")}：{item.success}{i18n.t("ticket")}</p>
                                                </div>
                                                <div className="chooseboxright">
                                                    <p>{i18n.t("disagree")}：{item.fail}{i18n.t("ticket")}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="right">
                                            {
                                                nowTime < endTime ?
                                                    <div>
                                                        {
                                                            item.voteState ? <Button className="participateafter">{i18n.t("Voted")}</Button> : <Button className="participate" onClick={(e) => this.showChooseModal(e, item)}>{i18n.t("Vote")}</Button>
                                                        }
                                                    </div> : <div className="imgtype">
                                                        {
                                                            (success + fail >= moreThan) && success * 100 / (success + fail) >= moreThanPercent ? <img src={require("../images/success.png")} alt="" /> : <img src={require("../images/fail.png")} alt="" />
                                                        }
                                                    </div>
                                            }
                                        </div>
                                    </div>
                                    {
                                        nowTime > endTime ?
                                            <div className="withdrawbox">
                                                {
                                                    item.voteAmount ? <div className="withdrawvot">
                                                        <div className="left">
                                                            <p>{i18n.t("Pledgeofwithdrawalvoting")}：{item.voteAmount}&nbsp;CORAL</p>
                                                        </div>
                                                        <div className="right">
                                                            {
                                                                item.voteState ? <button className="btnyes" onClick={(e) => this.withdrawVote(e, votIndex)}>{i18n.t("withdrawnew")}</button> : <button className="btnno">{i18n.t("Withdrawn")}</button>
                                                            }
                                                        </div>
                                                    </div> : <div></div>
                                                }
                                                {
                                                    item.isMy ? <div className="mybox">
                                                        <div className="withdrawpledge">
                                                            <div className="left">
                                                                <p>{i18n.t("Withdrawandcreate")}
                                                                ：
                                                                    {item.pledgeAmount}&nbsp;CORAL，{i18n.t("cost")}：<span>{
                                                                        (success + fail >= moreThan) && success * 100 / (success + fail) >= moreThanPercent ? <span>{item.pledgeAmount * item.fee / 100}</span> : <span>0</span>
                                                                    }</span>&nbsp;CORAL
                                                                </p>
                                                            </div>
                                                            <div className="right">
                                                                {
                                                                    item.pledgeAmountState ? <button className="btnyes" onClick={(e) => this.withdrawPledgeAmount(e, votIndex)}>{i18n.t("withdrawnew")}</button> : <button className="btnno">{i18n.t("Withdrawn")}</button>
                                                                }
                                                            </div>
                                                        </div>
                                                        {
                                                            item.pledgeCoralAmount === 0 ? <span></span> : <div className="withdrawpledgecoral">
                                                                <div className="left">
                                                                    <p>{i18n.t("Withdrawalcreate")}：{item.pledgeCoralAmount}&nbsp;CORAL</p>
                                                                </div>
                                                                <div className="right">
                                                                    {
                                                                        nowTime > endcycleTime ? <div>{
                                                                            item.pledgeCoralAmountState ? <button className="btnyes" onClick={(e) => this.withdrawPledgeCoralAmount(e, votIndex)}>{i18n.t("withdrawnew")}</button> : <button className="btnno">{i18n.t("Withdrawn")}</button>
                                                                        }</div> : <Countdown value={endcycleTime}
                                                                            format={timeText} onFinish={() => this.Refresh()}
                                                                            />
                                                                    }
                                                                </div>
                                                            </div>
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
                            title={`${i18n.t("Selectvotingresult")}`}
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
                                            <p>{i18n.t("agree")}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="img" onClick={() => this.chooseBtn()}>
                                            {
                                                this.state.chooseImg ? <img src={require("../images/grayhook.png")} alt="" /> : <img src={require("../images/redhook.png")} alt="" />
                                            }
                                        </div>
                                        <div className="title">
                                            <p>{i18n.t("disagree")}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="sendnum">
                                    <input placeholder={`${i18n.t("PleaseentertheamountofpledgedCORAL")}`} type="text" onChange={(e) => this.sendCoralNum(e)} />
                                    {
                                        this.state.storageAmount > 0 ? <p>{i18n.t("Numberofredemptiontickets")}：{this.state.estimatedvotes}</p> : <p></p>
                                    }
                                </div>
                                <div className="btnbox">
                                    <Button className="choosebtn" onClick={() => this.chooseProposal()}>
                                        {i18n.t("Confirmvote")}</Button>
                                </div>
                                <div className="messagebox">
                                    <p>{i18n.t("Votingrules")}：</p>
                                    <p>1.{i18n.t("VotingneedstopledgethecorrespondingamountofCORAL")}。</p>
                                    <p>2.{i18n.t("Squareroot")}。</p>
                                    <p>3.{i18n.t("exceed")}{this.state.selectItem && this.state.selectItem.moreThan} {i18n.t("successfulvotesexceeds")}{this.state.selectItem && this.state.selectItem.moreThanPercent}%。</p>
                                </div>
                            </div>
                        </Modal>
                        {
                            this.state.loadingmore ? <div className="loadingmore">
                                <Button onClick={() => this.loadingmore()}>{i18n.t("loadmore")}.....</Button>
                            </div> : <div></div>
                        }
                    </div>
                </div>
            </Layout>
        );
    }
}
export default vothing;