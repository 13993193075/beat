// v3查询订单

import v3sign from "./v3sign.js"
function v3outTradeNo(para){
    // para.mchid 商户号
    // para.serial_no 证书序列号
    // para.private_key 证书私钥
    // para.out_trade_no 订单号（支付记录ID）

    return new Promise(function (resolve, reject) {
        v3sign.v3sign({
            host: 'https://api.mch.weixin.qq.com',
            url: '/v3/pay/transactions/out-trade-no/' + para.out_trade_no + '?mchid=' + para.mchid,
            method: 'GET',
            mchid: para.mchid,
            serial_no: para.serial_no,
            private_key: para.private_key
        }).then(function (result) {
            resolve({code: 0, message: '订单查询成功',
                transaction: result.objV3Result
            })
        })
    })
}

export {
    v3outTradeNo
}
export default {
    v3outTradeNo
}