import fs from 'fs';

// 异步读取
async function readFileAsync(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return {code: 0, message: '读取文件内容成功', data}
    } catch (err) {
        return {code: 1, message: '读取文件内容失败', err}
    }
}

// 同步读取
function readFileSync(filePath){
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return {code: 0, message: '读取文件内容成功', data}
    } catch (err) {
        return {code: 1, message: '读取文件内容失败', err}
    }
}

export {
    readFileAsync,
    readFileSync
}
export default {
    readFileAsync,
    readFileSync
}