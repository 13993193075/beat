import axios from 'axios'

/**
 * @function getGlobalAccessToken
 * @description 获取微信公众号/开放平台全局接口调用凭证 access_token。
 * 此 token 需缓存，用于调用绝大多数基础 API。
 * @param {object} para
 * @param {string} para.appid - 微信 AppID
 * @param {string} para.secret - 微信 AppSecret
 * @returns {Promise<object>} {code, message, data: {access_token, expires_in}}
 */

/*使用环境与说明
使用环境： Node.js 服务器后端
适用场景：
    1. 需要调用微信公众号/开放平台基础 API 时（如发送模板消息、自定义菜单、上传素材等）。
    2. 此 access_token 与用户无关，代表应用本身的权限。
重要提示：
微信限制了获取频率，请务必将其缓存起来（例如，在 Redis 或数据库中），并在 2 小时有效期内复用。
*/

async function getGlobalAccessToken(para) {
    const { appid, secret } = para;
    const url = 'https://api.weixin.qq.com/cgi-bin/token';

    try {
        const response = await axios.get(url, {
            params: {
                grant_type: 'client_credential',
                appid: appid,
                secret: secret
            }
        });

        const data = response.data;

        // 检查微信接口返回的错误码（通常是 errcode 字段）
        if (data.errcode) {
            return {
                code: 1,
                message: `获取 access_token 失败: ${data.errmsg || '未知错误'}`,
                error_data: data
            };
        }

        return {
            code: 0,
            message: '获取 access_token 成功',
            data: {
                access_token: data.access_token,
                expires_in: data.expires_in // 建议一并返回有效期，方便缓存
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

/**
 * @function getMiniProgramSession
 * @description 获取小程序用户的 openid 和 session_key。
 * @param {object} para
 * @param {string} para.appid - 小程序 AppID
 * @param {string} para.secret - 小程序 AppSecret
 * @param {string} para.js_code - 小程序端 wx.login() 获得的登录凭证 code
 * @returns {Promise<object>} {code, message, data: {openid, session_key, unionid}}
 */

/*使用环境与说明
使用环境： Node.js 服务器后端（接收小程序前端传来的 js_code）
适用场景：
    1. 小程序登录/注册：通过 openid 识别并建立或关联您的系统用户。
    2. 解密数据：使用 session_key 解密小程序加密的用户敏感数据（如手机号、完整用户信息）。
重要提示：
    程序中将您的参数 grant_type=programmerization_code 修正为微信官方文档中的 grant_type=authorization_code。
*/

async function getMiniProgramSession(para) {
    const { appid, secret, js_code } = para;
    const url = 'https://api.weixin.qq.com/sns/jscode2session';

    try {
        const response = await axios.get(url, {
            params: {
                appid: appid,
                secret: secret,
                js_code: js_code,
                grant_type: 'authorization_code' // 微信官方文档中这个字段是 'authorization_code'
            }
        });

        const data = response.data;

        // 检查微信接口返回的错误码
        if (data.errcode) {
            return {
                code: 1,
                message: `获取用户会话失败: ${data.errmsg || '未知错误'}`,
                error_data: data
            };
        }

        // 成功时返回 openid 和 session_key
        return {
            code: 0,
            message: '获取用户会话成功',
            data: {
                openid: data.openid,
                session_key: data.session_key,
                unionid: data.unionid // 可能会有 unionid
            }
        };

    } catch (error) {
        return {
            code: 2,
            message: `网络请求失败: ${error.message}`
        };
    }
}

/**
 * @function getWebOAuthToken
 * @description 通过用户授权 code 获取网页授权 access_token 和 openid。
 * @param {object} para
 * @param {string} para.appid - 微信 AppID
 * @param {string} para.secret - 微信 AppSecret
 * @param {string} para.code - 网页授权后重定向回来的 code
 * @returns {Promise<object>} {code, message, data: {openid, access_token, scope, refresh_token}}
 */

/*使用环境与说明
使用环境： Node.js 服务器后端（接收公众号/开放平台网页重定向传来的 code）
适用场景：
    1. 公众号网页授权登录：获取用户身份 openid。
    2. 获取用户基本信息：使用返回的 access_token（用户级别）去调用 /sns/userinfo 接口获取用户的昵称、头像等。
重要提示：
    此处的 access_token 不能用于调用基础 API（如发模板消息），它只用于获取该用户的信息。
*/

async function getWebOAuth2Token(para) {
    const { appid, secret, code } = para;
    const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';

    try {
        const response = await axios.get(url, {
            params: {
                appid: appid,
                secret: secret,
                code: code,
                grant_type: 'authorization_code'
            }
        });

        const data = response.data;

        // 检查微信接口返回的错误码
        if (data.errcode) {
            return {
                code: 1,
                message: `获取网页授权信息失败: ${data.errmsg || '未知错误'}`,
                error_data: data
            };
        }

        // 成功时返回 openid 和网页授权 access_token
        return {
            code: 0,
            message: '获取网页授权信息成功',
            data: {
                openid: data.openid,
                access_token: data.access_token,
                expires_in: data.expires_in,
                scope: data.scope,
                refresh_token: data.refresh_token // 网页授权 token 可刷新
            }
        };

    } catch (error) {
        return {
            code: 2,
            message: `网络请求失败: ${error.message}`
        };
    }
}

/**
 * @function getUserInfo
 * @description 通过网页授权 access_token 和 openid 获取用户的基本信息（昵称、头像等）。
 * 此接口要求用户在网页授权时 scope 必须为 snsapi_userinfo。
 * @param {object} para
 * @param {string} para.access_token - 网页授权 access_token (由 /sns/oauth2/access_token 接口获取)
 * @param {string} para.openid - 微信用户在公众号/应用中的唯一标识
 * @param {string} [para.lang='zh_CN'] - 返回国家地区语言版本，可选值：zh_CN, zh_TW, en，默认为 zh_CN
 * @returns {Promise<object>} {code, message, data: object}
 */
async function getUserInfo(para) {
    const { access_token, openid, lang = 'zh_CN' } = para;
    const url = 'https://api.weixin.qq.com/sns/userinfo';

    // 检查必需参数是否存在
    if (!access_token || !openid) {
        return {
            code: 3,
            message: '缺少必要的 access_token 或 openid 参数'
        };
    }

    try {
        // 使用 axios 发起 GET 请求，参数通过 params 传递，更安全规范
        const response = await axios.get(url, {
            params: {
                access_token: access_token,
                openid: openid,
                lang: lang
            }
        });

        const data = response.data;

        // 规范错误处理：检查微信接口返回的 errcode 字段（网页授权接口错误时会返回）
        if (data.errcode) {
            return {
                code: 1,
                message: `获取微信用户信息失败: ${data.errmsg || '未知错误'}`,
                error_data: data // 包含微信返回的错误码和信息
            };
        }

        // 成功时，微信返回的数据对象中会包含 openid, nickname 等字段
        if (!data.nickname) {
            // 尽管没有 errcode，但如果返回数据不完整，也视为失败
            return {
                code: 1,
                message: '获取微信用户信息失败: 返回数据不完整 (缺少昵称)'
            };
        }

        // 成功返回用户信息对象
        return {
            code: 0,
            message: '获取微信用户信息成功',
            data: data // data 中包含了 openid, nickname, sex, province, city, country, headimgurl, unionid 等信息
        };

    } catch (error) {
        // 处理网络请求等底层错误（如 DNS 解析失败、连接超时等）
        return {
            code: 2,
            message: `网络请求失败: ${error.message}`
        };
    }
}

export {
    getGlobalAccessToken,
    getMiniProgramSession,
    getWebOAuth2Token,
    getUserInfo
}
export default {
    getGlobalAccessToken,
    getMiniProgramSession,
    getWebOAuth2Token,
    getUserInfo
}