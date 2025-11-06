import {getAuthorization} from "./v3.signer";
import axios from "axios";

/**
 * 封装 V3 API 请求，处理 Authorization Header
 * 实际项目中，您应将此函数放在单独的 HTTP 客户端模块中
 */
async function v3ApiRequest(method, url, requestData) {
    const requestBody = JSON.stringify(requestData);
    const relativeUrl = new URL(url).pathname;

    const authorization = getAuthorization(method, relativeUrl, requestBody);

    return axios({
        url: url,
        method: method,
        data: requestData,
        headers: {
            'Authorization': authorization,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        timeout: 5000,
    });
}

export default {
    v3ApiRequest
}