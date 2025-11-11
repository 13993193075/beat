// v3关闭订单

import v3sign from "./v3sign.js"
function v3close(para){
    // para.mchid
    // para.serial_no
    // para.private_key
    // para.out_trade_no

    return new Promise(function (resolve, reject) {
        v3sign.v3sign({
            host: 'https://api.mch.weixin.qq.com',
            url: '/v3/pay/transactions/out-trade-no/' + para.out_trade_no + '/close',
            method: "POST",
            mchid: para.mchid,
            serial_no: para.serial_no,
            private_key: para.private_key
        }).then(function () {
            resolve({code: 0, message: ''})
        })
    })
}

export {
    v3close
}
export default {
    v3close
}