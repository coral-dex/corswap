import BigNumber from "bignumber.js";

const keccak256 = require("keccak256");

export function bytes32ToToken(data) {
    let index = data.indexOf("0", 2);
    let bytes = Buffer.from(data.substring(2, index), "hex");

    return String.fromCharCode.apply(String, bytes).trim();
}


export function tokenToBytes(token) {
    let bytes = Buffer.alloc(32);
    bytes.fill(token, 0, token.length);
    return "0x" + bytes.toString('hex');
}

export function dateFormat(fmt, date) {

    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

export function hashKey(token1, token2) {

    let _token1 = token1, _token2 = token2;
    if (token2 < token1) {
        _token1 = token2;
        _token2 = token1;
    }
    let data1 = Buffer.alloc(32);
    data1.fill(_token1, 0, token1.length);
    let data2 = Buffer.alloc(32);
    data2.fill(_token2, 0, token2.length);
    return "0x" + Buffer.from(keccak256(Buffer.concat([data1, data2]))).toString('hex')
}


export function showValue(val, decimals, decimalPlaces) {
    if (!decimals) {
        decimals = 18;
    }
    if (!decimalPlaces) {
        decimalPlaces = 2;
    }
    let num = new BigNumber(val).dividedBy(new BigNumber(10).pow(decimals));
    if (num.comparedTo(1000000) >= 0) {
        let text = num.dividedBy(1000000).toFixed(decimalPlaces, 1);
        return text + "M";
    } else if (num.comparedTo(1000) >= 0) {
        let text = num.dividedBy(1000).toFixed(decimalPlaces, 1);
        return text + "K";
    } else {
        return num.toFixed(decimalPlaces, 1);
    }
}

export function bnToHex(value,decimal) {
    if(value){
        return "0x"+ new BigNumber(value).multipliedBy(10**decimal).toString(16)
    }else{
        return "0x0"
    }
}