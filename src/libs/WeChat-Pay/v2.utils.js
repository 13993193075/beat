// v2.utils.js

import xml2js from 'xml2js';
import Hash from '../crypto/Hash.js'
import random from '@yoooloo42/bean/utils/random'
export const API_MICROPAY_URL = 'https://api.mch.weixin.qq.com/pay/micropay';

/**
 * 微信V2 API 签名生成
 * @param {object} params - 请求参数对象
 * @param {string} apiKey - V2 接口密钥
 * @returns {string} 大写MD5签名
 */
export function createSign(params, apiKey) {
    // 1. 筛选并排序参数名（按 ASCII 升序）
    const keys = Object.keys(params).sort();

    // 2. 拼接成 key=value&... 格式的字符串A
    const stringA = keys.map(key => `${key}=${params[key]}`).join('&');

    // 3. 拼接 API 密钥
    const stringSignTemp = `${stringA}&key=${apiKey}`;

    // 4. MD5 加密并转大写
    return Hash.md5(stringSignTemp).toUpperCase();
}

/**
 * 将对象转换成 V2 XML 格式
 */
export function jsonToXml(params) {
    let xml = '<xml>';
    for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            const value = String(params[key]);
            // V2 规范中，部分字段可能需要 CDATA 包裹，但此处先遵循您原有的简单拼接
            xml += `<${key}>${value}</${key}>`;
        }
    }
    xml += '</xml>';
    return xml;
}

/**
 * XML解析器 (返回 Promise，方便 async/await 使用)
 */
export function parseXmlPromise(xml) {
    return new Promise((resolve, reject) => {
        // explicitArray: false 将单个子节点解析为对象而不是数组
        (new xml2js.Parser({ explicitArray: false, ignoreAttrs: true }))
            .parseString(xml, (err, result) => {
                if (err) return reject(new Error("XML解析失败"));
                // 微信 XML 响应的根节点是 <xml>
                resolve(result.xml);
            });
    });
}

// 假设这是您原有生成随机字符串的函数
export const randStr = (len, set) => random.random(len, set);