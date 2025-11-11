// v3客户微信号付款
// 获取prepay_id(预支付交易会话标识)

import random from '@yoooloo42/bean/unclassified/random'
import RSA from '../crypto/RSA.js'
import v3sign from "./v3sign.js"

function v3jsapi(para){
    // para.appid 微信开放平台或微信公众平台应用id（APPID）
    // para.mchid 商户号
    // para.serial_no 证书序列号
    // para.private_key 证书私钥
    // para.openid 微信用户在某一应用（APPID）中的唯一标识
    // para.amount 金额（人民币分）
    // para.description 商品描述
    // para.out_trade_no 订单号（支付记录ID）
    // para.notify_url 异步接收支付结果通知的回调地址


    return new Promise(function (resolve, reject) {
        let nonce_str = random.random(32, '0123456789abcdefghijklmnopqrstuvwxyz'), // 32位的随机字符串
            timestamp_seconds = Math.floor(new Date().getTime() / 1000) // 秒级的时间戳

        v3sign.v3sign({
            host: 'https://api.mch.weixin.qq.com',
            url: '/v3/pay/transactions/jsapi',
            method: 'POST',
            body: {
                appid: para.appid,
                mchid: para.mchid,
                out_trade_no: para.out_trade_no,
                amount: {total: para.amount},
                description: para.description,
                notify_url: para.notify_url,
                payer: {openid: para.openid}
            },
            mchid: para.mchid,
            serial_no: para.serial_no,
            private_key: para.private_key
        }).then(function (result) {
            if (!result.objV3Result || !result.objV3Result.prepay_id) {
                return resolve({
                    code: 1,
                    message: '获取 prepay_id 失败：' + result.objV3Result.message
                })
            }

            // RSA-SHA256 签名
            let packageText = 'prepay_id=' + result.objV3Result.prepay_id
            let text = appid + '\n' +
                timestamp_seconds + '\n' +
                nonce_str + '\n' +
                packageText + '\n'
            let paySign = RSA.rsaSign({text, privateKey: para.private_key})

            resolve({code: 0, message: '获取 prepay_id 成功',
                data: {
                    appid: para.appid,
                    timeStamp: timestamp_seconds,
                    nonceStr: nonce_str,
                    package: packageText,
                    signType: 'RSA',
                    paySign
                }
            })
        })
    })
}

export {
    v3jsapi
}
export default {
    v3jsapi
}