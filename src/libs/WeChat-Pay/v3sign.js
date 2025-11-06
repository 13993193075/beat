// v3签名：所有的v3请求都由这里向微信支付接口的后台发出

import req from 'request'
import random from '@yoooloo42/bean/utils/random'
import RSA from '../crypto/RSA.js'
const para_global = {
    nonce_str32: random.random(32, '0123456789abcdefghijklmnopqrstuvwxyz') // 32位的随机字符串
}

function v3sign(para){
    // para.host 接口域名
    // para.url 接口地址
    // para.method 请求方式
    // para.body 签名内容
    // para.mchid 商户号
    // para.serial_no 证书序列号
    // para.private_key 证书私钥
    // para.nonce_str 32位的随机字符串
    let method = para.method ? para.method : "POST"

    return new Promise(function (resolve, reject) {
        let nonce_str = para.nonce_str ? para.nonce_str : para_global.nonce_str32,
            timestamp_seconds = Math.floor(new Date().getTime() / 1000) // 秒级的时间戳

        let strBody = para.body ? JSON.stringify(para.body) : ""

        // '\n' === String.fromCharCode(0x0A)
        let text = method + String.fromCharCode(0x0A) +
            para.url + '\n' +
            timestamp_seconds + '\n' +
            nonce_str + '\n' +
            strBody + '\n'

        // RSA-SHA256签名
        let signature = RSA.rsaSign({text, privateKey: para.private_key})
        req({
            url: para.host + para.url,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Chrome/17.0.963.56',
                'Authorization': 'WECHATPAY2-SHA256-RSA2048' + ' ' +
                    'serial_no="' + para.serial_no + '",' +
                    'mchid="' + para.mchid + '",' +
                    'nonce_str="' + nonce_str + '",' +
                    'timestamp="' + timestamp_seconds + '",' +
                    'signature="' + signature + '"'
            },
            method,
            body: strBody
        }, function (err, res, body) {
            if(!body){
                return resolve({code: 1, message: "v3签名失败"})
            }

            let objV3Result = JSON.parse(body)
            resolve({code: 0, message: "v3签名完成",
                objV3Result
            })
        })
    })
}

export default {
    v3sign
}