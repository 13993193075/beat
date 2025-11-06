// v3.signer.js

import config from './v3.config.js';
import random from '@yoooloo42/bean/utils/random'
import RSA from '../crypto/RSA.js'

/**
 * 构建 V3 请求的 Authorization Header
 * 详情参考：https://wechatpay-api.gitbook.io/wechatpay-api-v3/qian-ming-zhi-nan-1/qian-ming-sheng-cheng
 * * @param {string} method - HTTP 方法 (POST/GET)
 * @param {string} url - 请求的相对路径，例如 /v3/pay/transactions/micropay
 * @param {string} body - 请求体 (POST 时为 JSON 字符串，GET 时为空字符串)
 * @returns {string} Authorization Header 值
 */
function getAuthorization(method, url, body) {
    const timestamp = Math.floor(Date.now() / 1000); // Unix 时间戳（秒）
    const nonce_str = random.random(16, '0123456789abcdefghijklmnopqrstuvwxyz').toString('hex'); // 随机字符串（16字节）

    // 1. 构造签名字符串
    const signatureBase = `${method}\n${url}\n${timestamp}\n${nonce_str}\n${body}\n`;
    // 2. 使用 API 私钥进行 SHA256-RSA 签名
    const signature = RSA.rsaSign({text: signatureBase, privateKey: config.privateKey})
    // 3. 构建 Authorization Header
    const token = `mchid="${config.mchid}",nonce_str="${nonce_str}",timestamp="${timestamp}",serial_no="${config.serialNo}",signature="${signature}"`;

    return `WECHATPAY2-SHA256-RSA-APISIGN ${token}`;
}

export {
    getAuthorization
};