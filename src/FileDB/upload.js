import multer from 'multer';
import path from 'path';
import { access, mkdir, constants } from 'fs/promises';

/**
 * 运行 Multer 中间件的辅助函数。
 * Multer 中间件需要 (req, res, next) 参数，此函数将其封装为 Promise。
 * @param {Function} uploadMiddleware - Multer 返回的中间件函数 (如 upload.single('file'))
 * @param {object} req - Express 请求对象
 * @param {object} res - Express 响应对象
 * @returns {Promise<{request: object, response: object}>} - 包含 req/res 对象的 Promise
 */
function runMulterMiddleware(uploadMiddleware, req, res) {
    return new Promise((resolve, reject) => {
        // 执行 Multer 中间件
        uploadMiddleware(req, res, (err) => {
            if (err) {
                // 如果 Multer 发生错误 (如文件类型、大小限制)，reject Promise
                return reject(err);
            }
            // 成功后，req 对象中会包含 file/files 属性
            resolve({ request: req, response: res });
        });
    });
}

/**
 * 检查并创建目录（如果不存在）
 * @param {string} dirPath - 目录路径
 */
async function ensureDirectoryExists(dirPath) {
    try {
        // 尝试访问目录，检查它是否存在
        await access(dirPath, constants.F_OK);
    } catch (error) {
        // 如果目录不存在 (ENOENT)
        if (error.code === 'ENOENT') {
            console.log(`上传目录不存在，正在创建: ${dirPath}`);
            try {
                // 递归创建目录
                await mkdir(dirPath, { recursive: true });
                console.log(`目录创建成功: ${dirPath}`);
            } catch (mkdirError) {
                // 如果创建失败，抛出错误
                throw new Error(`无法创建上传目录 ${dirPath}: ${mkdirError.message}`);
            }
        } else {
            // 其他访问错误 (例如权限问题)
            throw new Error(`访问目录 ${dirPath} 时发生错误: ${error.message}`);
        }
    }
}

/**
 * 初始化 Multer 配置
 * @param {object} options
 * @param {string} options.destination - 目标存储目录
 * @param {number} options.fileSize - 文件大小限制
 * @param {string[]} options.fileMimetype - 允许的文件 MimeType 列表
 */
async function init({destination, fileSize, fileMimetype}){
    // 1. 确保目标目录在 Multer 初始化前就存在
    await ensureDirectoryExists(destination);

    // 2. 配置 DiskStorage
    const storage = multer.diskStorage({
        // destination 确定文件存储的目录
        destination: function (req, file, cb) {
            // 目录检查已在 init() 中提前完成，这里直接返回目标路径
            cb(null, destination);
        },
        // filename 确定文件的名称
        filename: function (req, file, cb) {
            // 拼接原始文件名和时间戳，确保文件名的唯一性
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // 使用 path.extname 获取文件扩展名
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    // 3. 初始化 Multer 实例
    return multer({
        storage: storage,
        // 文件大小限制
        limits: { fileSize },
        // 文件过滤
        fileFilter: (req, file, cb) => {
            if (!fileMimetype || fileMimetype.length === 0 || fileMimetype.includes(file.mimetype)) {
                cb(null, true); // 接受文件
            } else {
                // 拒绝文件，并返回一个错误 (已本地化为中文)
                cb(new Error('文件类型无效，只允许 ' + fileMimetype.join(', ') + ' 格式！'), false);
            }
        }
    })
}

/**
 * 处理单个文件上传
 * @param {object} request - Express 请求对象
 * @param {object} response - Express 响应对象
 * @param {object} options - 配置选项
 */
async function holdSingle(request, response, {
    destination = 'uploads', // 默认项目执行的相对路径
    fileSize = 1024 * 1024 * 1, // 默认 1MB
    fileMimetype = [],
    fieldName = 'file' // 字段名
}){
    const upload = await init({destination, fileSize, fileMimetype});
    // 获取 Multer 中间件
    const uploadMiddleware = upload.single(fieldName);

    try {
        // 使用 Promise 运行中间件，并等待结果
        const result = await runMulterMiddleware(uploadMiddleware, request, response);

        // 成功，检查文件信息是否在请求对象中
        if(result.request.file && result.request.file.filename){
            return {code: 0, message: '上传成功',
                file: result.request.file,
                data: result.request.body
                /* file中的关键信息
                * destination: 文件在服务器上存储的文件夹路径
                * filename: 文件在服务器上存储时的新名称（通常是 Multer 自动生成的随机字符串或在 storage 配置中定义的名称）
                * path: 文件的完整路径（destination + filename）
                * */
            };
        } else {
            // 这通常发生在未选择文件但 Multer 成功处理请求时
            return {code: 1, message: '上传失败或未选择文件'};
        }
    } catch (err) {
        // 捕获并拒绝 Multer 产生的错误 (如大小限制、文件类型错误等)
        // 这样外部调用者就可以使用 try...catch 来捕获这些错误
        return Promise.reject(err);
    }
}

/**
 * 处理多个文件上传 (数组)
 * @param {object} request - Express 请求对象
 * @param {object} response - Express 响应对象
 * @param {object} options - 配置选项
 */
async function holdArray(request, response, {
    destination = 'uploads',
    fileSize = 1024 * 1024 * 1, // 默认 1MB
    fileMimetype = [],
    fieldName = 'files',
    maxCount = 10
}){
    const upload = await init({destination, fileSize, fileMimetype});
    // 获取 Multer 中间件
    const uploadMiddleware = upload.array(fieldName, maxCount);

    try {
        // 使用 Promise 运行中间件，并等待结果
        const result = await runMulterMiddleware(uploadMiddleware, request, response);

        // 成功，检查文件列表是否在请求对象中
        if(result.request.files && result.request.files.length > 0){
            return {code: 0, message: '上传成功',
                files: result.request.files,
                data: result.request.body
            };
        } else {
            return {code: 1, message: '上传失败或未选择文件'};
        }
    } catch (err) {
        // 捕获并拒绝 Multer 产生的错误
        return Promise.reject(err);
    }
}

export {
    holdSingle,
    holdArray
}
export default {
    holdSingle,
    holdArray
}