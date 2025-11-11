import crypto from 'crypto';

// --- 常量定义 ---
const ALGORITHM = 'RSA-SHA256';
const INPUT_ENCODING = 'utf8';
const SIGNATURE_FORMAT = 'base64';

/**
 * 🔑 生成 RSA 密钥对 (公钥和私钥)。
 *
 * @returns {Object} 包含公钥和私钥的对象 (PEM 格式)
 */
function generateRSAKeyPair() {
    // 使用 generateKeyPairSync 同步生成 RSA 密钥对
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // 密钥长度，2048 位是目前推荐的最小安全长度
        publicKeyEncoding: {
            type: 'spki',       // SubjectPublicKeyInfo 格式
            format: 'pem'       // PEM 格式
        },
        privateKeyEncoding: {
            type: 'pkcs8',      // PKCS#8 格式
            format: 'pem'       // PEM 格式
            // 生产环境建议添加 cipher: 'aes-256-cbc' 和 passphrase 来加密私钥
        }
    });

    return { publicKey, privateKey };
}

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
        const signer = crypto.createSign(ALGORITHM);
        signer.update(text, INPUT_ENCODING);

        // 签名
        const signature = signer.sign(privateKey, SIGNATURE_FORMAT);

        return signature;

    } catch (error) {
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
        console.warn("Missing required parameters for verification.");
        return false;
    }

    try {
        const verifier = crypto.createVerify(ALGORITHM);
        verifier.update(text, INPUT_ENCODING);

        // 验证签名
        return verifier.verify(
            publicKey,
            signature,
            SIGNATURE_FORMAT // 指定签名的输入格式
        );

    } catch (error) {
        console.error(`RSA Verification Error (${ALGORITHM}):`, error.message);
        throw new Error("RSA verification failed due to internal error. Check public key format and validity.");
    }
}

/* --- 测试代码 ---
try {
    const dataToSign = "这是一段需要使用数字签名的重要数据。";

    // 1. 生成密钥对
    console.log("--- 1. 生成 RSA 密钥对 ---");
    const { publicKey, privateKey } = generateRSAKeyPair();
    // console.log("私钥 (PEM):", privateKey);
    // console.log("公钥 (PEM):", publicKey);

    // 2. 使用私钥签名
    console.log("\n--- 2. 进行签名 ---");
    const signature = rsaSign({ text: dataToSign, privateKey: privateKey });
    console.log("原始数据:", dataToSign);
    console.log("签名结果 (Base64):", signature);

    // 3. 使用公钥验证
    console.log("\n--- 3. 验证签名 ---");
    const isValid = rsaVerify({
        text: dataToSign,
        signature: signature,
        publicKey: publicKey
    });
    console.log("验证结果 (正确签名):", isValid ? "✅ 验证通过" : "❌ 验证失败");

    // 4. 验证失败场景 (数据篡改)
    console.log("\n--- 4. 验证失败测试 (数据篡改) ---");
    const tamperedData = "这是一段被篡改后的数据！";
    const isInvalid = rsaVerify({
        text: tamperedData, // 使用篡改后的数据
        signature: signature,
        publicKey: publicKey
    });
    console.log("验证结果 (篡改数据):", isInvalid ? "❌ 验证通过 (错误)" : "✅ 验证失败 (正确)");

} catch (error) {
    console.error("\n--- RSA 测试发生错误 ---");
    console.error(error.message);
}
*/

export {
    generateRSAKeyPair,
    rsaSign,
    rsaVerify
}
export default {
    generateRSAKeyPair,
    rsaSign,
    rsaVerify
}
