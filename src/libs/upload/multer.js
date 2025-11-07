import multer from 'multer'
import path from 'path'

function init({destination, fileSize, fileMimetype}){
    // 1. 配置 DiskStorage
    const storage = multer.diskStorage({
        // destination 确定文件存储的目录
        destination: function (req, file, cb) {
            // 'uploads/' 是一个相对于项目根目录的文件夹，请确保它已存在
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

    // 2. 初始化 Multer
    const upload = multer({
        storage: storage,
        // 可选：文件大小限制 (例如：限制最大 1MB)
        limits: { fileSize },
        // 可选：文件过滤
        fileFilter: (req, file, cb) => {
            // 允许的文件类型 (例如：只允许 jpg, jpeg, png)
            if (fileMimetype.includes(file.mimetype)) {
                cb(null, true); // 接受文件
            } else {
                // 拒绝文件，并返回一个错误
                // 注意：Multer 会自动捕获并传递这个错误
                cb(new Error('Invalid file type, only JPEG and PNG are allowed!'), false);
            }
        }
    });
    return upload
}

// 上传单个文件
function uploadSingle(request, response, {
    destination = 'uploads/',
    fileSize = 1024 * 1024 * 1, // 1兆
    fileMimetype = [
        'image/jpeg',
        'image/png'
    ],
    fieldName = 'file'
}){
    return new Promise((resolve, reject) => {
        init({destination, fileSize, fileMimetype}).single(fieldName)(request, response, err => {
            if (err) {
                // 捕获 Multer 错误，并使用 reject 传递给 Promise 链
                return reject(err)
            }
            if(request.file && request.file.filename){
                resolve({code: 0, message: '上传成功',
                    file: request.file
                })
            }else{
                resolve({code: 1, message: '上传失败或未选择文件'})
            }
        })
    })
}

// 上传多个文件
function uploadArray(request, response, {
    destination = 'uploads/',
    fileSize = 1024 * 1024 * 1, // 1兆
    fileMimetype = [
        'image/jpeg',
        'image/png'
    ],
    fieldName = 'files',
    maxCount = 10
}){
    return new Promise((resolve, reject) => {
        init({destination, fileSize, fileMimetype}).array(fieldName, maxCount)(request, response, err => {
            if (err) {
                // 捕获 Multer 错误，并使用 reject 传递给 Promise 链
                return reject(err)
            }
            if(request.files && request.files.length > 0){
                resolve({code: 0, message: '上传成功',
                    files: request.files
                })
            }else{
                resolve({code: 1, message: '上传失败或未选择文件'})
            }
        })
    })
}

export default {
    uploadSingle,
    uploadArray
}