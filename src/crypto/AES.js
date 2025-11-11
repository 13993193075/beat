import crypto from 'crypto';

// --- 安全常量定义 ---
const ALGORITHM = 'aes-128-cbc'; // 算法：AES-128-CBC
const IV_LENGTH = 16;          // IV 长度：16 字节 (128 位)
const KEY_LENGTH = 16;         // 密钥长度：16 字节 (128 位)
const PLAINTEXT_ENCODING = 'utf8'; // 明文输入编码
const CIPHER_OUTPUT_FORMAT = 'base64';// 密文输出格式 (Base64)
const KEY_IV_FORMAT = 'base64'; // 密钥和 IV 的传输/存储格式 (Base64)

/**
 * 🔑 生成安全随机的 AES 密钥和 IV。
 * @returns {Object} 包含 Base64 格式密钥和 IV 的对象
 */
function generateKeyAndIV() {
    // 使用 KEY_IV_FORMAT (Base64) 输出，以便于存储和传输
    const key = crypto.randomBytes(KEY_LENGTH).toString(KEY_IV_FORMAT);
    const iv = crypto.randomBytes(IV_LENGTH).toString(KEY_IV_FORMAT);

    return {
        key: key, // Base64 格式的 16 字节密钥（长度为 24 的字符串）
        iv: iv    // Base64 格式的 16 字节 IV（长度为 24 的字符串）
    };
}

/**
 * 检查密钥和初始化向量的长度是否符合 AES-128-CBC 规范。
 * 注意：这里的 Buffer 长度必须是 KEY_LENGTH/IV_LENGTH (16 字节)
 * @param {Buffer} keyBuffer 密钥 Buffer
 * @param {Buffer} ivBuffer 初始化向量 Buffer
 */
function checkKeyAndIV(keyBuffer, ivBuffer) {
    if (keyBuffer.length !== KEY_LENGTH) {
        throw new Error(`Invalid Key Length. Key must be ${KEY_LENGTH} bytes for ${ALGORITHM}. Current buffer size: ${keyBuffer.length}`);
    }
    if (ivBuffer.length !== IV_LENGTH) {
        throw new Error(`Invalid IV Length. IV must be ${IV_LENGTH} bytes for ${ALGORITHM}. Current buffer size: ${ivBuffer.length}`);
    }
}

/**
 * 🔐 AES-128-CBC 加密
 * @param {Object} params
 * @param {string} params.text - 明文
 * @param {string} params.key - Base64 格式的密钥字符串
 * @param {string} params.iv - Base64 格式的初始化向量字符串
 * @returns {string} Base64 格式的密文
 */
function aesEncrypt({ text, key, iv }) {
    try {
        // 关键修复：使用 KEY_IV_FORMAT (Base64) 来解析输入的 Key 和 IV 字符串
        const keyBuffer = Buffer.from(key, KEY_IV_FORMAT);
        const ivBuffer = Buffer.from(iv, KEY_IV_FORMAT);

        checkKeyAndIV(keyBuffer, ivBuffer);

        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);

        // 加密主体：输入是明文 (PLAINTEXT_ENCODING)，输出为 Hex
        let encrypted = cipher.update(text, PLAINTEXT_ENCODING, 'hex');

        // 完成加密，并应用最终补位
        encrypted += cipher.final('hex');

        // 将 Hex 转换为 Base64 输出
        return Buffer.from(encrypted, 'hex').toString(CIPHER_OUTPUT_FORMAT);

    } catch (error) {
        console.error("AES Encryption Error:", error.message);
        throw new Error("Encryption failed.");
    }
}

/**
 * 🔓 AES-128-CBC 解密
 * @param {Object} params
 * @param {string} params.text - Base64 格式的密文
 * @param {string} params.key - Base64 格式的密钥字符串
 * @param {string} params.iv - Base64 格式的初始化向量字符串
 * @returns {string} 明文
 */
function aesDecrypt({ text, key, iv }) {
    try {
        // 关键修复：使用 KEY_IV_FORMAT (Base64) 来解析输入的 Key 和 IV 字符串
        const keyBuffer = Buffer.from(key, KEY_IV_FORMAT);
        const ivBuffer = Buffer.from(iv, KEY_IV_FORMAT);

        checkKeyAndIV(keyBuffer, ivBuffer);

        // 1. 将 Base64 密文转为 Buffer
        const encryptedBuffer = Buffer.from(text, CIPHER_OUTPUT_FORMAT);

        // 2. 创建解密器
        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);

        // 3. 解密主体：输入是 Buffer，输出为明文编码
        let decrypted = decipher.update(encryptedBuffer, 'buffer', PLAINTEXT_ENCODING);

        // 4. 完成解密，并移除补位
        decrypted += decipher.final(PLAINTEXT_ENCODING);

        return decrypted;
    } catch (error) {
        // 在解密失败（如密文被篡改）时，decipher.final() 会抛出错误
        console.error("AES Decryption Error:", error.message);
        throw new Error("Decryption failed. Ciphertext may be invalid or tampered with.");
    }
}

// --- 测试和导出 ---

// 测试代码部分（请在文件外部执行时使用，或在 Node.js 环境中移除 export default 后测试）
/*
const { key, iv } = generateKeyAndIV()
console.log("Key:", key);
console.log(key.length); // 应该是 Base64 字符串长度 24
console.log("IV:", iv);
console.log(iv.length);   // 应该是 Base64 字符串长度 24
const text = 'Hello Gemini'
try {
    const ciphertext = aesEncrypt({text: text, key, iv})
    console.log('加密测试：', ciphertext)
    const decryptedText = aesDecrypt({text: ciphertext, key, iv})
    console.log('解密测试：', decryptedText)
} catch (e) {
    console.error('测试失败:', e.message)
}
*/

export {
    generateKeyAndIV,
    checkKeyAndIV,
    aesEncrypt,
    aesDecrypt
};
export default {
    generateKeyAndIV,
    checkKeyAndIV,
    aesEncrypt,
    aesDecrypt
};