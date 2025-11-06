// v3客户付款码付款
// 同步接口，要求用户提供的 auth_code，立即返回支付结果

import axios from 'axios';
import config from './v3.config.js';
import { getAuthorization } from './v3.signer.js';

/**
 * 微信 V3 客户付款码支付 (Micropay)
 * @param {object} para - 支付参数
 * @returns {Promise<object>} 支付结果
 */
async function v3micropay(para) {
    // 1. 准备请求数据体（JSON 格式）
    const requestData = {
        appid: config.appid,
        mchid: config.mchid,
        // 商品描述
        description: para.body,
        // 商户订单号 (V3 要求不超过 32 个字符)
        out_trade_no: para.out_trade_no,
        // 付款码授权码（用户出示的付款码）
        auth_code: para.auth_code,
        // 发起支付的终端 IP
        scene_info: {
            payer_client_ip: para.spbill_create_ip
        },
        // 订单金额
        amount: {
            total: para.total_fee, // 单位：分
            currency: 'CNY'
        }
    };

    const requestBody = JSON.stringify(requestData);
    const relativeUrl = new URL(config.micropayUrl).pathname; // 获取相对路径 /v3/pay/transactions/micropay

    try {
        // 2. 生成 V3 Authorization Header
        const authorization = getAuthorization('POST', relativeUrl, requestBody);

        // 3. 使用 Axios 发送请求
        const response = await axios({
            url: config.micropayUrl,
            method: 'POST',
            data: requestData, // Axios 会自动序列化为 JSON
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 8000, // 扫码支付需要快，通常设置在 8 秒内
        });

        // 4. 处理 V3 响应 (V3 状态码 200/204 表示通信成功)
        const responseData = response.data;

        // 严格模式下，应验证响应头签名（这里为了简化未添加，实际项目必须验证）

        if (response.status === 200) {
            // 支付成功
            return {
                code: 0,
                message: '支付成功',
                trade_state: responseData.trade_state, // SUCCESS
                transaction_id: responseData.transaction_id,
                out_trade_no: responseData.out_trade_no,
                raw_data: responseData
            };
        }

        // 理论上其他状态码会被 catch 捕获，但以防万一
        throw new Error(`微信支付返回状态码异常: ${response.status}`);

    } catch (error) {
        // 5. 统一错误处理
        if (error.response && error.response.data) {
            // 业务错误（例如 400 证书错误、404 订单不存在等）
            const errorData = error.response.data;
            const message = errorData.message || errorData.code || '业务处理失败';

            // 返回失败状态
            return {
                code: 1,
                message: `支付业务失败: ${message}`,
                trade_state: errorData.code,
                http_status: error.response.status,
                raw_data: errorData
            };
        }

        // 网络或签名等技术错误
        let errorMessage = '网络或签名未知错误';
        if (axios.isAxiosError(error)) {
            errorMessage = error.code === 'ECONNABORTED' ? '请求超时' : `网络请求失败: ${error.message}`;
        }

        // 抛出技术异常，让上层捕获
        throw new Error(errorMessage);
    }
}

export {
    v3micropay
};