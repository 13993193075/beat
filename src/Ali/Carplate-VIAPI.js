// 规范优化后的车牌识别程序 (基于 VIAPI 官方 SDK)

import OcrClient from '@alicloud/ocr20191230'
import OpenapiClient from '@alicloud/openapi-client'
import TeaUtil from '@alicloud/tea-util'

/**
 * 使用阿里云 VIAPI 官方 SDK 进行车牌识别 (AccessKey 认证)
 * @param {object} para - 参数对象
 * @param {string} para.imageUrl - 图片的公网 URL
 * @param {string} [para.accessKeyId] - 可选，AccessKey ID，优先从环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID 获取
 * @param {string} [para.accessKeySecret] - 可选，AccessKey Secret，优先从环境变量 ALIBABA_CLOUD_ACCESS_KEY_SECRET 获取
 * @returns {Promise<object>} 包含识别结果的对象
 */
async function carplate(para) {
    // 1. **规范:** 优先从环境变量读取密钥，提高安全性。
    const accessKeyId = para.accessKeyId || process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || 'YOUR_DEFAULT_ACCESS_KEY_ID';
    const accessKeySecret = para.accessKeySecret || process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || 'YOUR_DEFAULT_ACCESS_KEY_SECRET';

    // **注意：生产环境中必须配置环境变量，并移除默认硬编码值！**

    if (!accessKeyId || !accessKeySecret) {
        throw new Error("AccessKeyId 和 AccessKeySecret 缺失，请配置或传入！");
    }

    const config = new OpenapiClient.Config({
        accessKeyId: accessKeyId,
        accessKeySecret: accessKeySecret
    });

    // 访问的域名
    config.endpoint = `ocr.cn-shanghai.aliyuncs.com`;
    const client = new OcrClient.default(config);

    try {
        // 2. **规范:** 使用 RecognizeLicensePlateRequest，直接传入 ImageURL 字符串，简化调用
        let recognizeLicensePlateRequest = new OcrClient.RecognizeLicensePlateRequest({
            imageURL: para.imageUrl, // 直接传入 URL 字符串
        });

        let runtime = new TeaUtil.RuntimeOptions({
            // 可以配置网络超时等参数
            connectTimeout: 5000,
            readTimeout: 10000,
        });

        const response = await client.recognizeLicensePlateWithOptions(recognizeLicensePlateRequest, runtime);

        // 确保结果有效
        if (response.body && response.body.data && response.body.data.plates && response.body.data.plates.length > 0) {
            return {
                code: 0,
                message: "车牌识别成功",
                result: response.body.data.plates[0]
            };
        } else {
            return {
                code: 1,
                message: "车牌识别成功，但未检测到有效车牌。",
                result: null
            };
        }

    } catch (error) {
        // 3. **规范:** 使用 try...catch 捕获错误，并 reject 或 throw Error，而不是返回 code: 0。

        // 提取阿里云的错误码和信息
        const errorCode = error.data ? error.data.Code : 'UNKNOWN_ERROR';
        const errorMessage = error.message || '未知错误';

        // 统一返回失败信息
        return {
            code: 1, // 使用 -1 或其他负值表示系统级/网络级错误
            message: `车牌识别失败: [${errorCode}] ${errorMessage}`,
            error: error
        };

        // 另一种规范是直接 throw Error，让调用方处理
        // throw new Error(`车牌识别失败: [${errorCode}] ${errorMessage}`);
    }
}

export {
    carplate
}
export default {
    carplate
}