// v3查询订单状态

import config from './config.js'; // 假设配置已导入
// 假设 v3ApiRequest 函数已在外部定义或导入
import { v3ApiRequest } from './v3.api.client.js'; // 假设这是您的统一客户端模块

const HOST = 'https://api.mch.weixin.qq.com';
const BASE_PATH = '/v3/pay/transactions/out-trade-no/';

/**
 * 微信 V3 订单查询 (通过商户订单号)
 * @param {object} para - 查询参数
 * @param {string} para.out_trade_no - 商户订单号
 * @returns {Promise<object>} 包含订单详情的对象
 */
async function v3outTradeNo(para) {
    // 1. 构造完整的查询 URL
    // V3 要求将 mchid 作为查询参数
    const fullUrl = `${HOST}${BASE_PATH}${para.out_trade_no}?mchid=${config.mchid}`;

    // 2. 发起 GET 请求
    try {
        const response = await v3ApiRequest('GET', fullUrl);

        // V3 订单查询成功状态码为 200
        if (response.status === 200) {
            const transaction = response.data;

            // 返回包含订单交易状态的规范结果
            return {
                code: 0,
                message: '订单查询成功',
                trade_state: transaction.trade_state, // 交易状态：SUCCESS, REFUND, NOTPAY, CLOSED, REVOKED, USERPAYING, PAYERROR
                transaction: transaction
            };
        }

        // 理论上非 200 会被 catch 捕获
        throw new Error(`Unexpected HTTP Status: ${response.status}`);

    } catch (error) {
        // 3. 统一错误处理
        let errorMessage = '查询接口调用失败';
        let errorData = {};

        if (error.response && error.response.data) {
            // 微信业务错误（例如 404 订单不存在）
            errorData = error.response.data;
            errorMessage = errorData.message || `业务错误: ${error.response.status}`;

            // 区分订单不存在的常见错误（例如 404）
            if (error.response.status === 404) {
                errorMessage = '订单不存在或商户号不匹配';
            }
        } else if (error.message) {
            // 网络、签名或超时错误
            errorMessage = `技术错误: ${error.message}`;
        }

        return {
            code: 1,
            message: `订单查询失败: ${errorMessage}`,
            raw_data: errorData
        };
    }
}

export {
    v3outTradeNo
}