import crypto from 'crypto';

// --- 常量定义 ---
const ALGORITHM = 'RSA-SHA256';
const INPUT_ENCODING = 'utf8';
const SIGNATURE_FORMAT = 'base64';

/**
 * 🔐 RSA 签名
 * 使用 'RSA-SHA256' 算法，将输入文本进行签名。
 *
 * @param {Object} params
 * @param {string} params.text - 要签名的明文数据。
 * @param {string} params.privateKey - PEM 格式的私钥。
 * @returns {string} Base64 格式的签名结果。
 * @throws {Error} 如果签名失败（如密钥无效或参数缺失）。
 */
function rsaSign({ text, privateKey }) {
    if (!text || !privateKey) {
        throw new Error("Missing required parameters for signing: text or privateKey.");
    }

    try {
        // 使用 const 声明，保持不变性
        const signer = crypto.createSign(ALGORITHM);

        // 优化：将数据直接传递给 update，无需再调用 end()
        signer.update(text, INPUT_ENCODING);

        // 签名，并指定私钥和输出格式
        // 'base64' 是默认格式，但显式指定更清晰
        const signature = signer.sign(privateKey, SIGNATURE_FORMAT);

        return signature;

    } catch (error) {
        // 捕获密钥格式错误、权限错误等
        console.error(`RSA Signing Error (${ALGORITHM}):`, error.message);
        throw new Error("RSA signing failed. Check private key format and validity.");
    }
}

/**
 * 🔓 RSA 验证签名
 * 使用 'RSA-SHA256' 算法验证签名是否有效。
 *
 * @param {Object} params
 * @param {string} params.text - 用于签名的原始明文数据。
 * @param {string} params.signature - Base64 格式的签名结果。
 * @param {string} params.publicKey - PEM 格式的公钥。
 * @returns {boolean} 签名是否有效。
 * @throws {Error} 如果验证过程发生致命错误。
 */
function rsaVerify({ text, signature, publicKey }) {
    if (!text || !signature || !publicKey) {
        // 参数缺失时，直接返回 false 或抛出错误，这里选择返回 false 兼容原逻辑，但推荐抛出错误
        console.warn("Missing required parameters for verification.");
        return false;
    }

    try {
        // 使用 const 声明
        const verifier = crypto.createVerify(ALGORITHM);

        // 优化：将数据直接传递给 update
        verifier.update(text, INPUT_ENCODING);

        // 验证签名
        // signature 已经是 Base64 格式的 Buffer，不需要再调用 Buffer.from() 转换
        // verifier.verify 会自动处理公钥和签名格式
        return verifier.verify(
            publicKey,
            signature,
            SIGNATURE_FORMAT // 指定签名的输入格式
        );

    } catch (error) {
        // 捕获公钥格式错误等
        console.error(`RSA Verification Error (${ALGORITHM}):`, error.message);
        // 验证过程失败通常意味着配置或密钥有误，应抛出错误而不是返回 false
        throw new Error("RSA verification failed due to internal error. Check public key format and validity.");
    }
}

export default {
    rsaSign,      // 优化后的函数名，更简洁
    rsaVerify
}