// v2micropay.js

import axios from 'axios';
import {
    API_MICROPAY_URL,
    createSign,
    jsonToXml,
    parseXmlPromise,
    randStr
} from './v2.utils.js'; // 引入辅助函数

// 定义默认的随机字符串集
const DEFAULT_RAND_SET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * V2 客户付款码支付 (micropay)
 * @param {object} para - 支付参数
 * @returns {Promise<object>} 包含支付结果的 Promise
 */
async function v2micropay(para) {
    // 使用 async/await 避免 Promise 嵌套

    // 1. 准备请求参数
    const nonce_str = para.nonce_str || randStr(32, DEFAULT_RAND_SET);

    const requestParams = {
        appid: para.appid,
        mch_id: para.mchid,
        nonce_str: nonce_str,
        auth_code: para.auth_code,
        body: para.body,
        out_trade_no: para.out_trade_no,
        spbill_create_ip: para.spbill_create_ip,
        total_fee: para.total_fee, // 注意：金额单位为分
    };

    // 2. 生成签名并组合最终参数
    const sign = createSign(requestParams, para.apikey);
    const finalParams = { ...requestParams, sign };

    // 3. 转换成 XML 请求体
    const requestXml = jsonToXml(finalParams);

    try {
        // 4. 使用 Axios 发送 POST 请求
        const response = await axios({
            url: API_MICROPAY_URL,
            method: 'POST',
            data: requestXml, // Axios 使用 data 字段发送 POST 请求体
            headers: {
                // 明确指定发送的 XML 内容类型
                'Content-Type': 'text/xml; charset=utf-8'
            },
            timeout: 10000, // 付款码支付要求高时效性，设置合理的超时时间（例如 10 秒）
            // 微信支付 V2 接口返回的状态码都是 200，需要在响应体中判断成功/失败
            // 默认情况下 Axios 遇到 4xx/5xx 会抛异常，但这里我们预期 200，
            // 所以无需特殊配置 validateStatus
        });

        // 5. 解析 XML 响应体
        const rtn_bodyJson = await parseXmlPromise(response.data);
        console.log("支付回调结果：", rtn_bodyJson);

        // 6. 处理微信返回的业务结果
        if (rtn_bodyJson.return_code === 'SUCCESS') {
            // 系统通信成功 (但业务不一定成功)
            if (rtn_bodyJson.result_code === 'SUCCESS') {
                // 业务成功：已付款
                return {
                    code: 0,
                    message: '支付成功',
                    trade_state: 'SUCCESS',
                    transaction_id: rtn_bodyJson.transaction_id,
                    out_trade_no: rtn_bodyJson.out_trade_no,
                    raw_data: rtn_bodyJson
                };
            } else {
                // 业务失败 (如余额不足、用户取消等)
                const msg = rtn_bodyJson.err_code_des || '业务处理失败';
                return {
                    code: 1,
                    message: `支付业务失败: ${msg}`,
                    trade_state: 'FAIL',
                    error_code: rtn_bodyJson.err_code,
                    raw_data: rtn_bodyJson
                };
            }
        } else {
            // 系统通信失败
            return {
                code: 2,
                message: `通信失败: ${rtn_bodyJson.return_msg || '未知通信错误'}`,
                trade_state: 'SYSTEM_ERROR',
                raw_data: rtn_bodyJson
            };
        }

    } catch (error) {
        // 7. 统一处理网络、超时、XML解析等技术异常

        let errorMessage = '未知错误';
        if (axios.isAxiosError(error)) {
            // Axios 自身的网络或HTTP错误 (如超时、404/500等)
            errorMessage = error.code === 'ECONNABORTED' ? '请求超时' : `网络请求失败: ${error.message}`;
        } else if (error.message.includes("XML解析失败")) {
            // XML 解析错误
            errorMessage = `响应数据解析失败: ${error.message}`;
        } else {
            errorMessage = `程序运行异常: ${error.message}`;
        }

        throw new Error(errorMessage); // 向上抛出明确的技术异常
    }
}

export {
    v2micropay
};