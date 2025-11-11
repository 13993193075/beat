import axios from 'axios'
import Token from './Token.js'

/**
 * @function getMiniProgramCode
 * @description 获取微信小程序的不限制数量二维码（A 或 C 码）。
 * @param {object} para
 * @param {string} para.appid - 小程序 AppID
 * @param {string} para.secret - 小程序 AppSecret
 * @param {string} para.scene - 小程序码中可以附加的场景值（最大 32 个可见字符）
 * @param {string} [para.page] - 必须是已经发布的小程序页面路径，例如 pages/index/index，非必填。
 * @returns {Promise<object>} {code, message, data: {base64, scene}}
 */
async function getMiniProgramCode(para) {
    const { appid, secret, scene, page } = para;

    // 1. 获取全局接口调用凭证 access_token (这里假设 getGlobalAccessToken 已定义)
    // 注意：小程序和公众号共用这一个全局 access_token 接口
    const tokenResult = await Token.getGlobalAccessToken({ appid, secret });

    if (tokenResult.code !== 0) {
        return {
            code: 1,
            message: `获取接口令牌access_token失败: ${tokenResult.message}`
        };
    }
    const access_token = tokenResult.data.access_token;

    // 2. 构造请求参数和 URL
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${access_token}`;

    // 微信接口要求 POST 请求体是 JSON 格式
    const requestBody = {
        scene: scene,
        page: page || '', // 默认值，如果未提供
        // width: 430, // 默认宽度，可以根据需要添加
        // auto_color: false, // 默认不自动配置线条颜色，可以根据需要添加
    };

    try {
        // 使用 axios 发送 POST 请求
        const response = await axios.post(url, requestBody, {
            // 关键点：指定 responseType 为 arraybuffer，以正确处理二进制图片流
            responseType: 'arraybuffer',
            // 指定请求头为 JSON
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 3. 检查微信返回的数据是否为错误信息（错误信息是 JSON 格式）
        const contentType = response.headers['content-type'];

        // 微信接口返回图片成功时，contentType 是 image/jpeg；返回错误时，是 application/json
        if (contentType && contentType.includes('application/json')) {
            // 将 ArrayBuffer 转换为字符串，然后解析 JSON 错误信息
            const errorBuffer = Buffer.from(response.data);
            const errorData = JSON.parse(errorBuffer.toString('utf8'));

            return {
                code: 1,
                message: `获取微信小程序码失败: ${errorData.errmsg || '未知错误'}`,
                error_data: errorData
            };
        }

        // 4. 处理成功返回的图片流
        // response.data 是一个 Buffer 对象 (Node.js 环境下)
        const imageBuffer = Buffer.from(response.data);

        return {
            code: 0,
            message: '获取微信小程序码成功',
            data: {
                // 将二进制 Buffer 转换为 Base64 字符串，并去除 Base64 编码中可能存在的换行符
                base64: imageBuffer.toString('base64').replace(/[\r\n]/g, ''),
                scene: scene
            }
        };

    } catch (error) {
        // 处理网络请求等底层错误
        return {
            code: 2,
            message: `网络请求失败: ${error.message}`
        };
    }
}

export {getMiniProgramCode}
export default {getMiniProgramCode}