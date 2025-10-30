import nodemailer from 'nodemailer';
import random from '@yoooloo42/bean/utils/random';

/**
 * Node.js 项目中发送电子邮件的函数
 * @param {string} to - 收件人邮箱地址
 * @param {string} subject - 邮件主题
 * @param {string} htmlContent - 邮件的 HTML 内容（正文）
 * @param {string} [textContent] - 邮件的纯文本内容（可选，作为 HTML 无法显示的备用）
 */
async function sendEmail(to, subject, htmlContent, textContent = '') {
    // ⚠️ 1. 配置 Transporter (SMTP 服务器设置)
    // 
    // 如果使用 Gmail：
    // - 您需要启用“两步验证”并生成一个“应用专用密码”（App Password），而不是使用您的主账户密码。
    // - 否则，Google 可能会阻止登录。
    const transporter = nodemailer.createTransport({
        // host: 'smtp.exmail.qq.com', // 替换为你的 SMTP 服务器地址 (例如: 'smtp.gmail.com', 'smtp-mail.outlook.com')
        // port: 465, // 常用端口: 465 (安全连接) 或 587 (TLS)
        // secure: true, // true 为 465 端口, false 为其它端口
        service: '126',
        auth: {
            // user: 'your_email@example.com', // 替换为你的发件箱地址
            user: 'lyxdrwhy000@126.com',
            // pass: 'your_app_password' // 替换为你的邮箱密码或“应用专用密码”
            pass: 'JSQNIEMQCCPCVSJW'
        }
    });

    // 2. 构造邮件内容对象
    const mailOptions = {
        // from: '"Your Name" <your_email@example.com>', // 发件人信息 (会显示在收件箱中)
        from: `"Stellarium - 企业应用集成平台" <lyxdrwhy000@126.com>`,
        to: to, // 收件人地址
        subject: subject,  // 邮件主题
        html: htmlContent, // 邮件 HTML 正文
        text: textContent  // 邮件纯文本正文 (可选)
        // 附件可以在这里添加:
        /* attachments: [
            {
                filename: 'report.pdf',
                path: '/path/to/your/report.pdf' 
            }
        ] */
    };

    try {
        // 3. 发送邮件
        let info = await transporter.sendMail(mailOptions);

        console.log('邮件发送成功:');
        console.log('  收件人:', to);
        console.log('  主题:', subject);
        console.log('  Message ID:', info.messageId);
        
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('邮件发送失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 发送包含验证码的邮件
 * * @param {string} recipientEmail - 收件人邮箱地址
 * @param {number} [codeLength=6] - 验证码长度
 * @param {number} [expirationMinutes=5] - 验证码有效时间（分钟）
 * @returns {Promise<{success: boolean, code?: string, error?: string}>} - 包含发送结果和生成的验证码
 */
async function sendVercode(recipientEmail, codeLength = 6, expirationMinutes = 5) {
    // 1. 生成验证码
    const verificationCode = random.vercode6(codeLength);

    // 2. 构造邮件内容
    const subject = `您的验证码：${verificationCode}，请注意妥善保管，切勿泄露`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
            <h2 style="color: #333;">验证码通知</h2>
            <p>您正在进行Email验证码操作，请在页面中输入以下验证码：</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <span style="font-size: 30px; font-weight: bold; color: #007bff;">${verificationCode}</span>
            </div>
            <p style="color: #e44d26;">请注意：该验证码将在 ${expirationMinutes} 分钟内失效。</p>
            <p style="font-size: 12px; color: #999;">如果不是您本人操作，请忽略此邮件。</p>
        </div>
    `;

    // 3. 调用核心发送函数
    const sendResult = await sendEmail(recipientEmail, subject, htmlContent);

    // 4. 返回结果和验证码
    if (sendResult.success) {
        return { 
            success: true, 
            vercode: verificationCode 
        };
    } else {
        return { 
            success: false, 
            error: sendResult.error || '邮件发送失败' 
        };
    }
}

const beat = {
    sendEmail,
    sendVercode
}
export default beat