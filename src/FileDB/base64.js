import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http'; // 也可能需要处理 http 链接

/**
 * 从本地文件路径获取文件的 Base64 编码。
 * @param {string} filePath - 本地文件的绝对或相对路径。
 * @returns {Promise<string>} - 文件的 Base64 编码字符串。
 */
function getBase64FromLocalFile(filePath) {
    return new Promise((resolve, reject) => {
        // 确保路径是绝对路径
        const absolutePath = path.resolve(filePath);

        // 使用 { encoding: 'base64' } 直接读取为 Base64 字符串
        fs.readFile(absolutePath, { encoding: 'base64' }, (err, data) => {
            if (err) {
                console.error(`[本地文件错误] 读取本地文件失败: ${err.message}`);
                return reject(err);
            }
            resolve(data);
        });
    });
}

/**
 * 从远程文件 URL 获取文件的 Base64 编码，支持自动重定向跟随 (3xx 状态码)。
 * @param {string} fileUrl - 远程文件的完整 URL。
 * @param {number} [redirects=5] - 最大重定向次数限制。
 * @returns {Promise<string>} - 文件的 Base64 编码字符串。
 */
function getBase64FromURL(fileUrl, redirects = 5) {
    if (redirects === 0) {
        return Promise.reject(new Error(`[远程文件错误] 重定向次数过多 (${fileUrl})`));
    }

    // 根据 URL 协议选择合适的模块
    const client = fileUrl.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
        client.get(fileUrl, (res) => {
            const statusCode = res.statusCode;

            // --- 处理重定向 (3xx 状态码) ---
            if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                const newUrl = res.headers.location;
                console.log(`[重定向] 遇到状态码 ${statusCode}，重定向至: ${newUrl}`);
                // 递归调用自身，跟随重定向
                return getBase64FromURL(newUrl, redirects - 1)
                    .then(resolve)
                    .catch(reject);
            }

            // --- 处理请求失败 (4xx, 5xx) ---
            if (statusCode < 200 || statusCode >= 400) {
                return reject(new Error(`[远程文件错误] 请求失败，状态码: ${statusCode} (${fileUrl})`));
            }

            // --- 成功获取 (2xx) ---
            const chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                try {
                    // 合并所有 Buffer 块并转换为 Base64 字符串
                    const buffer = Buffer.concat(chunks);
                    const base64String = buffer.toString('base64');
                    resolve(base64String);
                } catch (e) {
                    reject(new Error(`[远程文件错误] 处理远程文件数据失败: ${e.message}`));
                }
            });

        }).on('error', (err) => {
            console.error(`[远程文件错误] 远程请求连接错误: ${err.message}`);
            reject(err);
        });
    });
}

/*
// ------------------------------------
//          示例执行
// ------------------------------------

// 1. 本地文件示例（请确保 'test.bmp' 存在于同一目录下）
// 注意：如果文件不存在，会捕获到错误。
getBase64FromLocalFile('Base64.js.test.png')
    .then(base64String => {
        console.log('\n--- 本地文件结果 ---');
        console.log(`本地文件的 Base64 编码长度: ${base64String.length}`);
        console.log(`本地文件的 Base64 编码 (前50字符): ${base64String.substring(0, 50)}...`);
    })
    .catch(error => {
        // 捕获本地文件不存在或权限不足的错误
        console.error('\n--- 本地文件错误 ---');
        console.error('获取本地文件 Base64 失败:', error.message);
    });

// 2. 远程 URL 示例（使用支持重定向的函数）
const remoteUrl = 'https://picsum.photos/200/300'; // 这个 URL 会导致 302 重定向
getBase64FromURL(remoteUrl)
    .then(base64String => {
        console.log('\n--- 远程文件结果 ---');
        console.log(`远程文件的 Base64 编码长度: ${base64String.length}`);
        console.log(`远程文件的 Base64 编码 (前50字符): ${base64String.substring(0, 50)}...`);
    })
    .catch(error => {
        // 捕获请求失败或重定向超时的错误
        console.error('\n--- 远程文件错误 ---');
        console.error('获取远程文件 Base64 失败:', error.message);
    });
*/

export {
    getBase64FromLocalFile,
    getBase64FromURL
}
export default {
    getBase64FromLocalFile,
    getBase64FromURL
}