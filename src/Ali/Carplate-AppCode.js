// 优化后的第一个程序：API简单身份认证调用方法（APPCODE）

import ali from 'aliyun-api-gateway'

/**
 * 使用阿里云市场 API 网关进行车牌识别 (APPCODE 认证)
 * @param {object} para - 参数对象
 * @param {string} para.imageUrl - 图片的公网 URL
 * @param {string} [para.appCode] - 可选，APPCODE，优先从环境变量 ALIBABA_CLOUD_APPCODE 获取
 * @returns {Promise<object>} 包含识别结果的对象
 */
async function carplate(para) {
    // 1. **规范:** 优先从环境变量读取 APPCODE，提高安全性。
    const appCode = para.appCode || process.env.ALIBABA_CLOUD_APPCODE;

    if (!appCode) {
        return {
            code: 1,
            message: "APPCODE 缺失，请配置环境变量 ALIBABA_CLOUD_APPCODE 或传入！"
        };
    }

    const SimpleClient = ali.SimpleClient
    const client = new SimpleClient(appCode)

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