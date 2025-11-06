// V3 版本的 **JSAPI 支付（公众号/小程序支付）**流程的第一步：获取 prepay_id（预支付交易会话标识）。

import axios from 'axios';
import random from '@yoooloo42/bean/utils/random'
import RSA from '../crypto/RSA.js'
import v3ApiClient from './v3.api.client.js'

// V3 JSAPI 接口地址
const JSAPI_URL = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';


/**
 * 微信 V3 JSAPI 支付下单，并返回前端调起支付所需参数
 * @param {object} para - 支付参数
 * @returns {Promise<object>} 包含前端调起参数的对象
 */
async function v3getPrepayId(para) {

    // --- 1. 准备下单请求参数 ---
    const orderParams = {
        appid: para.appid,
        mchid: para.mchid,
        out_trade_no: para.out_trade_no,
        description: para.description,
        notify_url: para.notify_url,

        // 金额必须是嵌套对象，单位：分
        amount: {
            total: para.amount,
            currency: 'CNY'
        },
        // 付款人信息，openid 必须
        payer: {
            openid: para.openid
        }
    };

    // 生成随机字符串（用于调起支付参数）
    // ⚠️ 建议使用更健壮的随机数生成器，如 crypto.randomBytes().toString('hex')
    const nonce_str = random.random(16, '0123456789abcdefghijklmnopqrstuvwxyz').toString('hex');
    const timestamp_seconds = Math.floor(Date.now() / 1000); // 秒级时间戳


    try {
        // --- 2. 调用 V3 下单 API 获取 prepay_id ---
        const response = await v3ApiClient.v3ApiRequest('POST', JSAPI_URL, orderParams);

        const responseData = response.data;

        if (response.status !== 200 || !responseData.prepay_id) {
            // 理论上非 200 状态会被 catch 捕获，这里主要检查业务结果
            return {
                code: 1,
                message: '获取 prepay_id 失败：' + (responseData.message || '未知错误'),
                raw_data: responseData
            };
        }

        const prepay_id = responseData.prepay_id;

        // --- 3. 计算前端调起支付的 PaySign ---

        // 构造签名字符串：按照 appid\n timestamp\n nonceStr\n package\n 格式拼接
        const packageValue = `prepay_id=${prepay_id}`;

        const signText = `${para.appid}\n` +
            `${timestamp_seconds}\n` +
            `${nonce_str}\n` +
            `${packageValue}\n`;

        // 使用商户私钥对调起参数进行签名
        // ⚠️ 这里的 para.private_key 应该来自 config 模块的安全加载
        const paySign = RSA.rsaSign({text: signText, privateKey: para.private_key});

        // --- 4. 组装前端调起参数并返回 ---
        return {
            code: 0,
            message: '预支付订单生成成功，返回调起参数',
            data: {
                appId: para.appid,          // 注意：前端字段是 appId
                timeStamp: String(timestamp_seconds), // V3 规范要求 timeStamp 为字符串
                nonceStr: nonce_str,
                package: packageValue,      // 调起参数字段名为 package
                signType: 'RSA',            // 签名类型
                paySign: paySign
            },
            prepay_id: prepay_id
        };

    } catch (error) {
        // 统一处理网络、签名或微信返回的业务错误
        let errorMessage = 'V3 下单接口调用失败';
        let errorData = {};

        if (axios.isAxiosError(error) && error.response) {
            errorData = error.response.data || {};
            errorMessage = errorData.message || `HTTP 错误: ${error.response.status}`;
        } else {
            errorMessage = error.message;
        }

        return {
            code: 1,
            message: `下单失败: ${errorMessage}`,
            raw_data: errorData
        };
    }
}

export {
    v3getPrepayId
}