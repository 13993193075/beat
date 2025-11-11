import path from 'path'

/**
 * 将本地文件系统路径转换为可访问的Web URL。
 * * @param filePath - 待转换的本地文件系统绝对路径或相对路径。
 * @param fileRootPath - 文件在服务器上的根存储目录，对应URL中的基础路径之前的部分。
 * 例如: "/Users/user/project/uploads" 或 "D:\\project\\uploads"
 * @param baseUrl - Web访问的基础URL，对应文件路径中的根存储目录。
 * 例如: "https://api.example.com/files"
 * @returns 转换后的Web URL字符串。
 */
function pathToUrl(filePath, fileRootPath, baseUrl) {
    // 1. 统一路径分隔符 (解决 Windows/Linux 路径分隔符差异)
    //    将所有 \ 替换为 /
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedRootPath = fileRootPath.replace(/\\/g, '/');

    // 2. 确保 baseUrl 以 / 结尾 (方便拼接)
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // 3. 检查文件路径是否包含文件存储根目录
    if (!normalizedPath.startsWith(normalizedRootPath)) {
        // 如果文件路径不在根目录下，可能需要抛出错误或返回空
        console.error(`文件路径不在指定的根目录中：${filePath}`);
        return null;
    }

    // 4. 提取相对路径部分 (这是路径和URL的"第二部分")
    //    从文件路径中移除根存储目录
    let relativePath = normalizedPath.substring(normalizedRootPath.length);

    // 5. 确保相对路径以 / 开头，方便拼接
    if (!relativePath.startsWith('/')) {
        relativePath = '/' + relativePath;
    }

    // 6. 组合 Web URL
    //    Web URL = ${Web访问基础URL} + ${相对路径部分}
    const webUrl = normalizedBaseUrl + relativePath;

    return webUrl;
}

/**
 * 将Web URL转换回本地文件系统路径。
 * * @param webUrl - 待转换的Web URL。
 * @param fileRootPath - 文件在服务器上的根存储目录。
 * @param baseUrl - Web访问的基础URL。
 * @returns string
 */
function urlToPath(webUrl, baseUrl, fileRootPath) {
    // 1. 确保 baseUrl 以 / 结尾 (方便统一处理)
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // 2. 检查URL是否包含Web访问的基础URL
    if (!webUrl.startsWith(normalizedBaseUrl)) {
        console.error(`URL不包含指定的Web基础路径：${webUrl}`);
        return null;
    }

    // 3. 提取相对路径部分
    let relativePath = webUrl.substring(normalizedBaseUrl.length);

    // 4. 确保文件根目录不以 / 结尾 (Node.js的path模块更倾向于不以斜杠结尾)
    const normalizedRootPath = fileRootPath.endsWith('/') ? fileRootPath.slice(0, -1) : fileRootPath;

    // 5. 组合文件路径
    // 注意：在组合路径时，最好使用 Node.js 内置的 path 模块，以确保跨平台兼容性

    // path.join 会自动处理多余的斜杠，并使用当前系统的分隔符（Windows下会使用\）
    // 如果您确定只需要 / 分隔符（例如在容器或Linux环境中），可以直接使用字符串拼接
    // return normalizedRootPath + relativePath;

    // 使用 path 模块（推荐）
    return path.join(normalizedRootPath, relativePath);
}

export default {
    pathToUrl,
    urlToPath
}