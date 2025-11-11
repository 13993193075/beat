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

export {
    extractAllSrc
}
export default {
    extractAllSrc
}