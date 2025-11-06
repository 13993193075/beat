// config.js

import fs from 'fs';
import path from 'path';

const config = {
    // 您的应用ID，例如小程序或公众号ID
    appid: 'YOUR_APP_ID',
    // 您的微信支付商户号
    mchid: 'YOUR_MCH_ID',
    // V3 接口密钥（用于回调加密/解密，32位字符串）
    apiv3Key: 'YOUR_API_V3_KEY',

    // API 私钥路径（用于请求签名）
    // 假设您的私钥文件名为 apiclient_key.pem
    privateKeyPath: path.resolve(__dirname, './certs/apiclient_key.pem'),

    // 您的证书序列号（对应于私钥的那个证书）
    // 您可以在商户平台或证书文件中找到
    serialNo: 'YOUR_CERTIFICATE_SERIAL_NO',

    // 付款码支付接口地址
    // micropayUrl: 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', // V3 接口文档中，付款码支付已合并到 Native Pay 接口中，这里使用通用支付接口

    // 付款码支付的 V3 接口实际上是专门的 Micropay API:
    // https://api.mch.weixin.qq.com/v3/pay/partner/transactions/micropay
    // 我们使用 V3 的即时付款接口：
    micropayUrl: 'https://api.mch.weixin.qq.com/v3/pay/transactions/micropay',

    // 【Native 支付下单接口】POST /v3/pay/transactions/native
    nativeUrl: 'https://api.mch.weixin.qq.com/v3/pay/transactions/native',

    // 【支付结果通知地址】 必须是 HTTPS 且公网可访问
    notifyUrl: 'https://yourdomain.com/wechatpay/v3/notify',
};

// 读取私钥文件内容，用于签名
// 生产环境中，私钥应该通过更安全的方式加载
try {
    config.privateKey = fs.readFileSync(config.privateKeyPath, 'utf8');
} catch (error) {
    console.error(`🔴 致命错误：无法读取私钥文件：${config.privateKeyPath}`);
    // 建议此处抛出异常或退出进程
}

export default config;