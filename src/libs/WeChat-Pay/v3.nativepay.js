// v3商户二维码收款
// 异步接口，返回 code_url，需依赖 支付回调通知 或 订单查询 来确定最终结果
/*
商户二维码收款在微信支付 V3 中对应的是 Native 支付（Native Pay）。
Native 支付流程是：商户系统调用 Native 下单 API → 微信返回一个 code_url → 商户将 code_url 转换为二维码展示给用户 → 用户扫码支付
*/
import axios from 'axios';
import config from './v3.config.js';
import { getAuthorization } from './v3.signer.js';

/**
 * 微信 V3 Native 支付下单 (生成二维码链接)
 * @param {object} para - 订单参数
 * @param {string} para.body - 商品描述
 * @param {number} para.total_fee - 订单总金额（单位：分）
 * @param {string} para.out_trade_no - 商户订单号 (唯一)
 * @param {string} para.spbill_create_ip - 终端设备IP
 * @param {string} [para.time_expire] - 订单失效时间（rfc3339格式）
 * @returns {Promise<object>} 包含 code_url 的支付结果
 */
async function v3nativePay(para) {
    // 1. 构建 V3 请求数据体 (Native 下单)
    const requestData = {
        appid: config.appid,
        mchid: config.mchid,
        description: para.body,
        out_trade_no: para.out_trade_no,
        notify_url: config.notifyUrl, // 必须携带回调地址

        // 订单金额
        amount: {
            total: para.total_fee,
            currency: 'CNY'
        },

        // 场景信息（V3 要求，包含终端IP）
        scene_info: {
            payer_client_ip: para.spbill_create_ip
        },

        // 【可选参数】订单失效时间
        // time_expire: para.time_expire ? para.time_expire : calculateExpireAt(),
    };

    const requestBody = JSON.stringify(requestData);
    const relativeUrl = new URL(config.nativeUrl).pathname; // /v3/pay/transactions/native

    try {
        // 2. 生成 V3 Authorization Header
        const authorization = getAuthorization('POST', relativeUrl, requestBody);

        // 3. 使用 Axios 发送下单请求
        const response = await axios({
            url: config.nativeUrl,
            method: 'POST',
            data: requestData,
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 5000, // 下单接口不需要太长
        });

        // 4. 处理 V3 响应
        // V3 Native 下单成功状态码为 200
        if (response.status === 200) {
            const responseData = response.data;

            // 成功返回包含二维码链接 code_url
            return {
                code: 0,
                message: '下单成功，请生成二维码',
                // V3 Native 支付返回的二维码链接
                code_url: responseData.code_url,
                out_trade_no: para.out_trade_no,
                raw_data: responseData
            };
        }

        // 理论上其他状态码会被 catch 捕获
        throw new Error(`微信支付返回状态码异常: ${response.status}`);

    } catch (error) {
        // 5. 统一错误处理
        if (error.response && error.response.data) {
            // 业务错误 (例如参数校验失败等)
            const errorData = error.response.data;
            const message = errorData.message || '业务处理失败';

            return {
                code: 1,
                message: `下单业务失败: ${message}`,
                error_code: errorData.code,
                http_status: error.response.status,
                raw_data: errorData
            };
        }

        // 网络或技术异常
        let errorMessage = '网络或签名未知错误';
        if (axios.isAxiosError(error)) {
            errorMessage = error.code === 'ECONNABORTED' ? '请求超时' : `网络请求失败: ${error.message}`;
        }

        // 抛出技术异常
        throw new Error(`Native 支付下单异常: ${errorMessage}`);
    }
}

export {
    v3nativePay
};