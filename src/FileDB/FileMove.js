import fs from 'node:fs/promises'
import path from 'node:path'

// 文件转移
async function fileMove({folderOld, folderNew}){
    try {
        await fs.rename(folderOld, folderNew)
    } catch (err) {
        console.log(err)
    }
}

// 文件删除
async function fileDelete({folder}){
    try {
        await fs.unlink(folder)
    } catch (err) {
        console.log(err)
    }
}

// 创建文件夹
async function create({folder}){
    try{
        await fs.mkdir(folder, { recursive: true })
    }catch(err){
        console.log(err)
    }
}

// 文件路径解析
function pathParse({folder}){
    return path.parse(folder)
    /*
    属性名 | 描述 | 示例值 (针对 /home/user/dir/file.ext)
        root | 路径的根目录 | /
        dir | 文件所在的完整目录路径 | /home/user/dir
        base | 文件名和扩展名的完整部分（basename） | file.ext
        ext | 文件的扩展名（包括点 .） | .ext
        name | 文件名（不包括扩展名） | file
    */
}

/**
 * 将本地文件夹路径转换为可访问的Web URL
 * @param folder - 待转换的本地文件夹路径
 * @param folderPrefix - 文件夹前缀
 * 例如: "/Users/user/project/uploads" 或 "D:\project\uploads"
 * @param urlPrefix - Web URL前缀
 * 例如: "https://api.example.com/files"
 * @returns 转换后的Web URL
 */
function folderToUrl({folder, folderPrefix, urlPrefix}) {
    // 1. 统一文件夹分隔符 (解决 Windows/Linux 文件夹分隔符差异)
    // 将所有 \ 替换为 /
    const folderNormalized = folder.replace(/\\/g, '/');
    const folderPrefixNormalized = folderPrefix.replace(/\\/g, '/');

    // 2. 确保 urlPrefix 以 / 结尾 (方便拼接)
    const urlPrefixNormalized = urlPrefix.endsWith('/') ? urlPrefix.slice(0, -1) : urlPrefix;

    // 3. 检查文件夹路径是否包含文件夹前缀
    if (!folderNormalized.startsWith(folderPrefixNormalized)) {
        // 如果文件路径不在根目录下，可能需要抛出错误或返回空
        console.error(`文件夹路径不在指定的根目录中：${folder}`);
        return null;
    }

    // 4. 提取文件夹相对路径部分 (这是文件夹路径和URL共同的"第二部分")
    // 从文件夹路径中移除前缀
    let pathRelative = folderNormalized.substring(folderPrefixNormalized.length);

    // 5. 确保相对路径以 / 开头，方便拼接
    if (!pathRelative.startsWith('/')) {
        pathRelative = '/' + pathRelative;
    }

    // 6. 组合 Web URL
    // Web URL = ${Web访问基础URL} + ${相对路径部分}
    const url = urlPrefixNormalized + pathRelative;

    return url;
}

/**
 * 将Web URL转换为本地文件夹路径
 * @param url - 待转换的Web URL
 * @param urlPrefix - URL前缀（Web访问的基础URL）
 * @param folderPrefix - 文件夹前缀
 * @returns string
 */
function urlToFolder({url, urlPrefix, folderPrefix}) {
    // 1. 确保 urlPrefix 以 / 结尾 (方便统一处理)
    const urlPrefixNormalized = urlPrefix.endsWith('/') ? urlPrefix.slice(0, -1) : urlPrefix;

    // 2. 检查URL是否包含Web访问的基础URL
    if (!url.startsWith(urlPrefixNormalized)) {
        console.error(`URL不包含指定的Web基础路径：${url}`);
        return null;
    }

    // 3. 提取相对路径部分
    let pathRelative = url.substring(urlPrefixNormalized.length);

    // 4. 确保文件夹前缀不以 / 结尾 (Node.js的path模块更倾向于不以斜杠结尾)
    const folderPrefixNormalized = folderPrefix.endsWith('/') ? folderPrefix.slice(0, -1) : folderPrefix;

    // 5. 组合文件夹路径
    // 注意：在组合路径时，最好使用 Node.js 内置的 path 模块，以确保跨平台兼容性
    // path.join 会自动处理多余的斜杠，并使用当前系统的分隔符（Windows下会使用\）
    // 如果您确定只需要 / 分隔符（例如在容器或Linux环境中），可以直接使用字符串拼接
    // const folder folderPrefixNormalized + pathRelative;

    const folder = path.join(folderPrefixNormalized, pathRelative);

    // 使用 path 模块（推荐）
    return folder
}

export {
    folderToUrl,
    urlToFolder
}
export default {
    fileMove,
    fileDelete,
    create,
    pathParse,
    folderToUrl,
    urlToFolder,
}