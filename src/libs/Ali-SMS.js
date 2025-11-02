import random from '@yoooloo42/bean/utils/random';
// 从 Node.js 内置模块导入工具
import { createRequire } from 'node:module';
// 创建一个 require 函数
const require = createRequire(import.meta.url);
// 引入阿里云 SDK 核心依赖
const Core = require('@alicloud/pop-core')

/**
 * 向指定手机号发送短信
 * @param {string} cellphone 接收短信的手机号（例如: '13800000000'）
 * @param {object} shortMessageCode 短信模板中的变量对象中code的值（短信有效内容）
 * @param {object} clientBox 客户端参数
 * @returns {Promise<object>} 返回阿里云 API 的响应对象
 */
const clientBoxInit = {
    action: 'SendSms',
    apiVersion: '2017-05-25',
    regionId: 'cn-hangzhou', // 短信服务 API 的区域，通常使用杭州(cn-hangzhou)
    endpoint: 'https://dysmsapi.aliyuncs.com', // 短信服务的 Endpoint
    // accessKeyId: ' ',
    // accessKeySecret: ' ',
    // signName: ' ',
    // templateCode: ' '
}

function sms(cellphone, shortMessageCode, clientBox) {
    clientBox = Object.assign(clientBoxInit, clientBox)
    return new Promise(function (resolve, reject) {
        const client = new Core({
            accessKeyId: clientBox.accessKeyId,
            accessKeySecret: clientBox.accessKeySecret,
            endpoint: clientBox.endpoint,
            apiVersion: clientBox.apiVersion
        })

        const params = {
            'RegionId': clientBox.regionId,
            'PhoneNumbers': cellphone,
            'SignName': clientBox.signName,
            'TemplateCode': clientBox.templateCode,
            'TemplateParam': JSON.stringify({code: shortMessageCode})
        }

        const requestOption = {
            method: 'POST'
        }

        client.request(clientBox.action, params, requestOption).then(
            result => {
                console.log('发送短信成功：', result)
                resolve({code: 0, message: '发送短信成功',
                    result
                })
                /*
                如果手机没有收到短信，那通常是以下原因之一（与您的代码逻辑无关）：
                短信额度/欠费：检查您的阿里云账户是否有足够的短信余额；
                短信模板或签名审核：确认您的签名(litafire)和模板(SMS_182679443)在阿里云控制台中已审核通过且启用；
                频率限制：同一手机号在短时间内频繁发送可能会被阿里云限制。
                */
            },
            err => {
                console.log('发送短信失败：', err)
                resolve({code: 1, message: '发送短信失败',
                    err
                })
            }
        )
    })
}

// 发送验证码
function sendVercode(cellphone, codeLength = 6, clientBox){
    return new Promise(function (resolve, reject) {
        const vercode = random.vercode6N(codeLength);
        sms(cellphone, vercode, clientBox).then(result=>{
            resolve(Object.assign(result, {vercode}))
        })
    })
}

const beat = {
    sms,
    sendVercode
}
export default beat