// 导入 cheerio
import * as cheerio from 'cheerio';

/**
 * 从 HTML 字符串中提取所有具有 src 属性的标签的 src 值。
 * @param {string} htmlString 富文本 HTML 字符串
 * @returns {string[]} 包含所有 src 属性值的数组
 */
function extractAllSrc(htmlString) {
    // 注意：cheerio v1.0.0-rc.10 及更高版本需要使用 .load() 的方式来初始化
    const $ = cheerio.load(htmlString);
    const srcList = [];

    // 查找所有可能带有 src 属性的标签
    const elementsWithSrc = $('img, script[src], iframe, source, embed, track, audio, video');

    elementsWithSrc.each((index, element) => {
        const src = $(element).attr('src');
        if (src) {
            srcList.push(src);
        }
    });

    return srcList;
}

/**
 * 为富文本中所有以 "/" 开头的 "src" 属性值添加指定的 URL 前缀。
 *
 * @param {string} richText 包含 HTML/富文本的字符串。
 * @param {string} prefixUrl 要添加的 URL 前缀 (例如: "https://www.example.com")。
 * @returns {string} 替换了 src 属性值的富文本字符串。
 */
function addPrefixToRelativeSrc(richText, prefixUrl) {
    // 1. 确保 urlPrefix 以 "/" 结尾，方便路径拼接
    const standardizedPrefix = prefixUrl.endsWith('/') ? prefixUrl.slice(0, -1) : prefixUrl;

    // 2. 定义正则表达式
    const regex = /src\s*=\s*(["'])(\/)(?!\/)([^"'\r\n]+?)\1/g;
    /* 解释:
        /
        src\s*=\s*
            匹配 'src'，可能有空格，然后是等号，可能有空格
        (["'])
            捕获组 1: 匹配单引号 (') 或双引号 (")，这是路径的起始引号
        (\/)
            捕获组 2: 匹配第一个斜杠 (/)，确保是根相对路径
        (?!/)
            负向先行断言: 确保第二个字符不是斜杠 (排除 "//" 这种协议相对路径)
        ([^"'\r\n]+?)
            捕获组 3: 匹配路径的其余部分，直到遇到结束引号 (非贪婪匹配)
        \1
            匹配捕获组 1 中的结束引号
        /g
            全局匹配 (匹配所有出现的地方)
     */

    // 3. 使用 replace 方法进行替换
    // $1: 对应捕获组 1 (起始引号)
    // $2: 对应捕获组 2 (起始斜杠 "/")
    // $3: 对应捕获组 3 (路径的其余部分)
    // 替换逻辑: 'src=' + $1 + standardizedPrefix + $2 + $3 + $1
    const result = richText.replace(regex, (match, quote, slash, path) => {
        // 这里的 $1, $2, $3 对应 replace 函数回调参数中的 quote, slash, path
        return `src=${quote}${standardizedPrefix}${slash}${path}${quote}`;
    });

    return result;
}

export {
    extractAllSrc,
    addPrefixToRelativeSrc
}
export default {
    extractAllSrc,
    addPrefixToRelativeSrc
}