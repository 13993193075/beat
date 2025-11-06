// v2客户付款码付款

import req from 'request'
import xml2js from 'xml2js'
import Hash from '../crypto/Hash.js'
import random from '@yoooloo42/bean/utils/random'
const xmlToJson = (new xml2js.Parser()).parseString // xml to json
const para_global = {
    nonce_str32: random.random(32, '0123456789abcdefghijklmnopqrstuvwxyz') // 32位的随机字符串
}

function v2micropay(para){
    // para.appid 微信开放平台或微信公众平台应用id（APPID）
    // para.mchid 商户号
    // para.apikey V2接口密钥
    // para.auth_code 付款码
    // para.total_fee 金额（人民币分）
    // para.body 商品描述
    // para.out_trade_no 订单号（支付记录ID）
    // para.spbill_create_ip 发起支付的终端设备IP地址
    // sign_type: 签名类型，默认：MD5
    // para.nonce_str 32位的随机字符串

    return new Promise((resolve, reject) => {
        let nonce_str = para.nonce_str ? para.nonce_str : para_global.nonce_str32

        // Md5签名：参数名按ASCII升序排列拼接
        let textBody = '<appid>' + para.appid + '</appid>' +
            '<auth_code>' + para.auth_code + '</auth_code>' +
            '<body>' + para.body + '</body>' +
            '<mch_id>' + para.mchid + '</mch_id>' +
            '<nonce_str>' + nonce_str + '</nonce_str>' +
            '<out_trade_no>' + para.out_trade_no + '</out_trade_no>' +
            // '<sign_type>MD5</sign_type>' +
            '<spbill_create_ip>' + para.spbill_create_ip + '</spbill_create_ip>' +
            '<total_fee>' + para.total_fee + '</total_fee>',
        textSign = 'appid=' + para.appid +
            '&auth_code=' + para.auth_code +
            '&body=' + para.body +
            '&mch_id=' + para.mchid +
            '&nonce_str=' + nonce_str +
            '&out_trade_no=' + para.out_trade_no +
            // '&sign_type=MD5' +
            '&spbill_create_ip=' + para.spbill_create_ip +
            '&total_fee=' + para.total_fee +
            '&key=' + para.apikey
        let sign = Hash.md5(textSign).toUpperCase()
        textBody = '<xml>' + textBody + '<sign>' + sign + '</sign>' + '</xml>'

        req({
            url: "https://api.mch.weixin.qq.com/pay/micropay",
            method: "POST",
            body: textBody
        }, function (err, response, rtn_body) {
            if (err) throw err

            xmlToJson(rtn_body, function (err, result) {
                let rtn_bodyJson = result.xml
                console.log("支付回调结果：", rtn_bodyJson);

                if (rtn_bodyJson.return_code[0] === 'SUCCESS'){
                    resolve({code: 0, message: '支付成功',
                        rtn_bodyJson
                    })
                } else {
                    resolve({code: 1, message: rtn_bodyJson.return_msg[0],
                        rtn_bodyJson
                    })
                }
            })
        })
    })
}

export {
    v2micropay
}