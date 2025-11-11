// v3商户二维码收款
// 获取code_url

import v3sign from "./v3sign.js"
function v3native(para){
    // para.appid 微信开放平台或微信公众平台应用id（APPID）
    // para.mchid 商户号
    // para.serial_no 证书序列号
    // para.private_key 证书私钥
    // para.amount 金额（人民币分）
    // para.description 商品描述
    // para.out_trade_no 订单号（支付记录ID）
    // para.notify_url 异步接收支付结果通知的回调地址

    return new Promise(function (resolve, reject) {
        v3sign.v3sign({
            host: "https://api.mch.weixin.qq.com",
            url: "/v3/pay/transactions/native",
            method: "POST",
            body: {
                appid: para.appid,
                mchid: para.mchid,
                amount: {total: Number(para.amount)},
                description: para.description,
                out_trade_no: para.out_trade_no,
                notify_url: para.notify_url
            },
            mchid: para.mchid,
            serial_no: para.serial_no,
            private_key: para.private_key,
        }).then(function (result) {
            // 获取 code_url 失败
            if (!result.objV3Result || !result.objV3Result.code_url) {
                return resolve({code: 1, message: result.message})
            }

            let code_url = result.objV3Result.code_url
            resolve({code: 0, message: '获取 code_url 成功',
                code_url
            })
        })
    })
}

export {
    v3native
}
export default {
    v3native
}