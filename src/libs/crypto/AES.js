import crypto from 'crypto';

// --- 安全常量定义 ---
const ALGORITHM = 'aes-128-cbc'; // 算法：AES-128-CBC
const IV_LENGTH = 16;          // IV 长度：16 字节 (128 位)
const KEY_LENGTH = 16;         // 密钥长度：16 字节 (128 位)
const INPUT_ENCODING = 'utf8'; // 明文输入编码
const OUTPUT_FORMAT = 'base64';// 密文输出格式 (通常用 Base64 或 Hex)

/**
 * 🔑 生成安全随机的 AES 密钥和 IV。
 * 密钥和 IV 应仅生成一次，并安全地存储（例如，作为环境变量或安全配置文件）。
 *
 * @returns {Object} 包含 base64 格式密钥和 IV 的对象
 */
function generateKeyAndIV() {
    // 使用 cryptographically secure pseudo-random number generator (CSPRNG)
    // Node.js 的 crypto.randomBytes 保证了生成的随机性。
    const key = crypto.randomBytes(KEY_LENGTH).toString(OUTPUT_FORMAT);
    const iv = crypto.randomBytes(IV_LENGTH).toString(OUTPUT_FORMAT);

    return {
        key: key, // Base64 格式的 16 字节密钥
        iv: iv    // Base64 格式的 16 字节 IV
    };
}
// 示例用法：
// const { key, iv } = generateKeyAndIV();
// console.log("Key:", key);
// console.log("IV:", iv);


/**
 * 检查密钥和初始化向量的长度是否符合 AES-128-CBC 规范。
 * @param {Buffer} keyBuffer 密钥 Buffer
 * @param {Buffer} ivBuffer 初始化向量 Buffer
 */
function checkKeyAndIV(keyBuffer, ivBuffer) {
    if (keyBuffer.length !== KEY_LENGTH) {
        throw new Error(`Invalid Key Length. Key must be ${KEY_LENGTH} bytes for ${ALGORITHM}.`);
    }
    if (ivBuffer.length !== IV_LENGTH) {
        throw new Error(`Invalid IV Length. IV must be ${IV_LENGTH} bytes for ${ALGORITHM}.`);
    }
}

/**
 * 🔐 AES-128-CBC 加密
 * 使用内置 crypto 模块，默认使用 PKCS7 自动补位。
 * @param {Object} params
 * @param {string} params.text - 明文
 * @param {string} params.key - 16字节的密钥字符串
 * @param {string} params.iv - 16字节的初始化向量字符串
 * @returns {string} Base64 格式的密文
 */
function aesEncrypt({ text, key, iv }) {
    try {
        const keyBuffer = Buffer.from(key, INPUT_ENCODING);
        const ivBuffer = Buffer.from(iv, INPUT_ENCODING);

        checkKeyAndIV(keyBuffer, ivBuffer);

        // 1. 创建加密器，默认自动 PKCS7 补位
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);

        // 2. 加密主体
        // textBuffer 是 Buffer，所以不需要第二个 'utf8' 参数，但为了清晰，使用 INPUT_ENCODING
        let encrypted = cipher.update(text, INPUT_ENCODING, 'hex');

        // 3. 完成加密，并应用最终补位
        encrypted += cipher.final('hex');

        // 4. 将 Hex 转换为 Base64 输出
        return Buffer.from(encrypted, 'hex').toString(OUTPUT_FORMAT);

    } catch (error) {
        console.error("AES Encryption Error:", error.message);
        throw new Error("Encryption failed.");
    }
}

/**
 * 🔓 AES-128-CBC 解密
 * 使用内置 crypto 模块，自动移除 PKCS7 补位。
 * @param {Object} params
 * @param {string} params.text - Base64 格式的密文
 * @param {string} params.key - 16字节的密钥字符串
 * @param {string} params.iv - 16字节的初始化向量字符串
 * @returns {string} 明文
 */
function aesDecrypt({ text, key, iv }) {
    try {
        const keyBuffer = Buffer.from(key, INPUT_ENCODING);
        const ivBuffer = Buffer.from(iv, INPUT_ENCODING);
        checkKeyAndIV(keyBuffer, ivBuffer);

        // 1. 将 Base64 密文转为 Buffer
        const encryptedBuffer = Buffer.from(text, OUTPUT_FORMAT);

        // 2. 创建解密器，默认自动移除补位 (Auto Padding: true)
        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);

        // 3. 解密主体
        // 因为输入是 Buffer，所以第二个参数可以省略或使用 'buffer'
        let decrypted = decipher.update(encryptedBuffer, 'buffer', INPUT_ENCODING);

        // 4. 完成解密，并移除补位
        decrypted += decipher.final(INPUT_ENCODING);

        return decrypted;
    } catch (error) {
        // 在解密失败（如密文被篡改）时，decipher.final() 会抛出错误
        console.error("AES Decryption Error:", error.message);
        throw new Error("Decryption failed. Ciphertext may be invalid or tampered with.");
    }
}

export default {
    // 推荐使用
    generateKeyAndIV,
    checkKeyAndIV,
    aesEncrypt,
    aesDecrypt
};