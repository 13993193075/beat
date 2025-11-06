// 关闭订单

import config from './config.js'; // 假设配置已导入
// 假设 v3ApiRequest 函数已在外部定义或导入
import { v3ApiRequest } from './v3.api.client.js'; // 假设这是您的统一客户端模块

const HOST = 'https://api.mch.weixin.qq.com';
const BASE_PATH = '/v3/pay/transactions/out-trade-no/';

/**
 * 微信 V3 关闭订单 (通过商户订单号)
 * @param {object} para - 关闭订单参数
 * @param {string} para.out_trade_no - 商户订单号
 * @returns {Promise<object>} 包含操作结果的对象
 */
async function v3close(para) {
    // 1. 构造请求 URL 和路径
    const fullUrl = `${HOST}${BASE_PATH}${para.out_trade_no}/close`;

    // 2. 构造 POST 请求体
    // V3 关闭订单接口要求请求体中包含 mchid
    const requestData = {
        mchid: config.mchid,
    };

    try {
        // 3. 发起 POST 请求
        const response = await v3ApiRequest('POST', fullUrl, requestData);

        // 4. 处理 V3 成功响应
        // 关闭订单成功返回 HTTP 204 No Content，且响应体为空
        if (response.status === 204) {
            return {
                code: 0,
                message: `订单 ${para.out_trade_no} 关闭成功。`,
                http_status: 204
            };
        }

        // 理论上其他状态码会被 catch 捕获
        throw new Error(`Unexpected HTTP Status: ${response.status}`);

    } catch (error) {
        // 5. 统一错误处理
        let errorMessage = '关闭订单接口调用失败';
        let errorData = {};

        if (error.response && error.response.data) {
            // 微信业务错误
            errorData = error.response.data;
            errorMessage = errorData.message || `业务错误: ${error.response.status}`;
        } else if (error.message) {
            // 网络、签名或超时错误
            errorMessage = `技术错误: ${error.message}`;
        }

        return {
            code: 1,
            message: `订单关闭操作失败: ${errorMessage}`,
            raw_data: errorData
        };
    }
}

export {
    v3close
}