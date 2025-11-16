// 优化后的第二个程序：API签名认证调用方法（AppKey & AppSecret）

import ali from 'aliyun-api-gateway'

/**
 * 使用阿里云市场 API 网关进行车牌识别 (AppKey & AppSecret 签名认证)
 * @param {object} para - 参数对象
 * @param {string} para.imageUrl - 图片的公网 URL
 * @param {string} [para.appKey] - 可选，AppKey，优先从环境变量 ALIBABA_CLOUD_APP_KEY 获取
 * @param {string} [para.appSecret] - 可选，AppSecret，优先从环境变量 ALIBABA_CLOUD_APP_SECRET 获取
 * @returns {Promise<object>} 包含识别结果的对象
 */
async function carplate(para) {
    // 1. **规范:** 优先从环境变量读取 AppKey 和 AppSecret，提高安全性。
    const appKey = para.appKey || process.env.ALIBABA_CLOUD_APP_KEY;
    const appSecret = para.appSecret || process.env.ALIBABA_CLOUD_APP_SECRET;

    if (!appKey || !appSecret) {
        return {
            code: 1,
            message: "AppKey 或 AppSecret 缺失，请配置或传入！"
        };
    }

    const Client = ali.Client
    const client = new Client(appKey, appSecret)

    try {
        const requestUrl = 'https://ocrcp.market.alicloudapi.com/rest/160601/ocr/ocr_vehicle_plate.json'

        // 发起 POST 请求
        const result = await client.post(requestUrl, {
            data: {
                'image': para.imageUrl,
                'configure': '{"multi_crop":false}'
            },
            headers: {
                accept: 'application/json'
            }
        })

        // 2. 检查返回结构，确保结果有效
        if (result && result.plates && result.plates.length > 0) {
            return {
                code: 0,
                message: "车牌识别成功",
                result: result.plates[0]
            }
        } else {
            return {
                code: 1,
                message: "车牌识别成功，但未检测到有效车牌。",
                result: null
            };
        }

    } catch (err) {
        // 3. **规范:** 使用 try...catch 捕获错误，并返回非零 code
        const errorMessage = err.message || err.stack || "未知错误";

        return {
            code: 1,
            message: "车牌识别失败：" + errorMessage
        }
    }
}

export {
    carplate
}
export default {
    carplate
}