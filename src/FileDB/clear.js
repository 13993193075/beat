import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 🚀 删除指定的文件夹及其包含的所有文件和子文件夹。
 *
 * @param {string} folderPath - 要删除的文件夹的绝对或相对路径。
 * @returns {Promise<void>} 一个在删除成功时解析的 Promise。
 */
async function deleteFolder(folderPath) {
    // 检查路径是否存在，避免不必要的错误日志 (可选，fs.rm在路径不存在时会报错)
    try {
        await fs.access(folderPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`文件夹 ${folderPath} 不存在，无需删除。`);
            return;
        }
        throw error; // 抛出其他类型的文件系统错误
    }

    try {
        console.log(`正在删除文件夹及其内容: ${folderPath}`);
        // 使用 { recursive: true, force: true } 来递归地强制删除。
        // force: true 忽略路径不存在时的错误。
        await fs.rm(folderPath, { recursive: true, force: true });
        console.log(`✅ 文件夹及其内容删除成功: ${folderPath}`);
    } catch (error) {
        console.error(`❌ 删除文件夹 ${folderPath} 失败:`, error);
        throw error;
    }
}

/**
 * ✨ 清空指定的文件夹，但保留文件夹本身。
 *
 * @param {string} folderPath - 要清空的文件夹的绝对或相对路径。
 * @returns {Promise<void>} 一个在清空成功时解析的 Promise。
 */
async function clearFolder(folderPath) {
    try {
        // 1. 读取文件夹中的所有文件和子目录名
        const files = await fs.readdir(folderPath);

        if (files.length === 0) {
            console.log(`文件夹 ${folderPath} 已经是空的。`);
            return;
        }

        console.log(`正在清空文件夹内容: ${folderPath}`);

        // 2. 使用 Promise.all 并行删除所有内容
        const deletePromises = files.map(file => {
            const fullPath = path.join(folderPath, file);
            // 对于每个项目，我们使用 fs.rm 配合 { recursive: true, force: true }。
            // 这样无论是文件还是子文件夹，都可以被正确删除。
            return fs.rm(fullPath, { recursive: true, force: true })
                .then(() => console.log(`   - 已删除: ${file}`))
                .catch(err => {
                    console.error(`   - ❌ 无法删除 ${file}: ${err.message}`);
                    // 决定是否抛出错误，这里我们选择记录错误但不中断整个清空过程。
                });
        });

        await Promise.all(deletePromises);

        console.log(`✅ 文件夹 ${folderPath} 内容清空成功。`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`❌ 文件夹 ${folderPath} 不存在，无法清空。`);
        } else {
            console.error(`❌ 清空文件夹 ${folderPath} 失败:`, error);
        }
        throw error;
    }
}

export {
    deleteFolder,
    clearFolder
}
export default {
    deleteFolder,
    clearFolder
}