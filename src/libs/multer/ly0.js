import fs from 'fs'
import path from 'path'
const thisTime = new Date()

// 图片新增
function imageAppend (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.uploaded 已上传文件的URL

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.fieldIndex 数组类型字段的索引
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        if (!para.uploaded) {
            return resolve('')
        }

        // 数据库文件夹：数据单元ID + 表名 + 字段名 + 数组类型字段的索引 + 当年 + 当月
        const dbFolder = para.pathHead.dbFolder +
            '/' + (para.dataunitId ? para.dataunitId : '') +
            '/' + para.tblName +
            '/' + para.fieldName +
            '[' + ('fieldIndex' in para ? para.fieldIndex : 0) + "]" +
            '/' + thisTime.getFullYear() +
            '/' + (thisTime.getMonth() + 1)
        // 数据库文件名：数据单元ID + 表名 + 字段名 + 数组类型字段的索引 + 数据ID + 随机数 + 扩展名
        const dbFileName = (para.dataunitId ? para.dataunitId + '.' : '') +
            para.tblName + '.' +
            para.fieldName + '.' +
            ('fieldIndex' in para ? para.fieldIndex : 0) + '.' +
            para.dataId + '.' +
            Math.floor((999999 - 0) * Math.random() + 0) +
            path.parse(para.uploaded).ext

        // 上传文件路径：来自于 已上传文件的URL 头部置换
        const uploadFilePath = para.uploaded.replace(para.pathHead.uploadUrl, para.pathHead.uploadFolder)
        // 数据库文件路径
        const dbFilePath = dbFolder + '/' + dbFileName
        // 数据库URL：来自于 数据库文件夹中的文件路径 头部置换
        const dbUrl = dbFilePath.replace(para.pathHead.dbFolder, para.pathHead.dbUrl)
        new Promise(function (resolve0, reject0) {
            // 创建数据库文件夹
            fs.mkdir(dbFolder, {recursive: true}, (err) => {
                if (err) throw err
                resolve0()
            })
        }).then(function () { //
            new Promise(function (resolve1, reject1) {
                // 已上传文件转存至数据库文件夹
                fs.rename(uploadFilePath, dbFilePath, (err) => {
                    if (err) throw err
                    resolve1(dbUrl) // 返回数据库URL
                })
            }).then(function (result) {
                resolve(result)
            })
        })
    })
}

// 图片删除
function imageDelete (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.url 待删除文件的URL

    return new Promise(function (resolve, reject) {
        if (!para.url) {
            return resolve()
        }

        fs.unlink(para.url.replace(para.pathHead.dbUrl, para.pathHead.dbFolder), (err) => {
            if (err) throw err
            resolve()
        })
    })
}

// 图片更新
function imageUpdate (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.uploaded 已上传文件的URL
    // para.old 原文件的URL
    // para.delete 是否删除原文件

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.fieldIndex 数组类型字段的索引
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        if (!!para.uploaded || para.delete === true || para.delete === 'true') {
            imageDelete(para.old)
        }
        if (!para.uploaded) {
            return resolve(para.old)
        }
        imageAppend({
            pathHead: {
                dbFolder: para.pathHead.dbFolder,
                dbUrl: para.pathHead.dbUrl,
                uploadFolder: para.pathHead.uploadFolder,
                uploadUrl: para.pathHead.uploadUrl
            },
            uploaded: para.uploaded,

            dataunitId: para.dataunitId,
            tblName: para.tblName,
            fieldName: para.fieldName,
            fieldIndex: 'fieldIndex' in para ? para.fieldIndex : 0,
            dataId: para.dataId
        }).then(result=>{
            resolve(result)
        })
    })
}

// 图片新增 - 多文件处理
function imagesAppend (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.arrUploaded 已上传文件的URL

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        if(!para.uploaded || para.uploaded.length === 0){
            return resolve([])
        }
        let arrPromise = []
        para.arrUploaded.forEach((item, index)=>{
            arrPromise.push(imageAppend ({
                pathHead: {
                    dbFolder: para.pathHead.dbFolder,
                    dbUrl: para.pathHead.dbUrl,
                    uploadFolder: para.pathHead.uploadFolder,
                    uploadUrl: para.pathHead.uploadUrl
                },
                uploaded: item,

                dataunitId: para.dataunitId,
                tblName: para.tblName,
                fieldName: para.fieldName,
                fieldIndex: index,
                dataId: para.dataId
            }))
        })
        Promise.all(arrPromise).then(result=>{
            resolve(result)
        })
    })
}

// 图片删除 - 多文件处理
function imagesDelete(para){
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.arrUrl 待删除文件的URL

    return new Promise(function (resolve, reject) {
        if(!para.arrUrl || para.arrUrl.length === 0){
            return resolve()
        }

        let arrPromise = []
        para.arrUrl.forEach(i=>{
            arrPromise.push(imageDelete({
                pathHead: {
                    dbFolder:  para.pathHead.dbFolder,
                    dbUrl: para.pathHead.dbUrl
                },
                url: i
            }))
        })
        Promise.all((arrPromise)).then(()=>{
            resolve()
        })
    })
}

// 图片更新 - 多文件处理
function imagesUpdate (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.arrUploaded 已上传文件的URL
    // para.arrOld 原文件的URL
    // para.arrDelete 待删除文件的URL

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        imagesDelete({
            pathHead: {
                dbFolder: para.pathHead.dbFolder,
                dbUrl: para.pathHead.dbUrl
            },
            arrUrl: para.arrDelete
        }).then(()=>{
            imagesAppend ({
                pathHead: {
                    dbFolder: para.pathHead.dbFolder,
                    dbUrl: para.pathHead.dbUrl,
                    uploadFolder: para.pathHead.uploadFolder,
                    uploadUrl: para.pathHead.uploadUrl
                },
                arrUploaded: para.arrUploaded,

                dataunitId: para.dataunitId,
                tblName: para.tblName,
                fieldName: para.fieldName,
                dataId: para.dataId
            }).then(result=>{
                let arrHoldon = []
                para.arrOld.forEach(i=>{
                    let holdon = true
                    para.arrDelete.forEach(j=>{
                        if(i === j){
                            holdon = false
                        }
                    })
                    if(!!holdon){
                        arrHoldon.push(i)
                    }
                })
                resolve(arrHoldon.concat(result))
            })
        })
    })
}

// 内部模块：获取富文本中资源文件(图片等)的src
function richtextGetSrc (richtext) {
    let arrSrc = []
    if (richtext) {
        arrSrc = richtext.match(/src=[\"\'][^\"\']{0,}[\"\']/g)
        for (let i in arrSrc) {
            let a = arrSrc [i]
            arrSrc [i] = a.slice(5, a.length - 1)
        }
    }
    return arrSrc
}

// 富文本新增
function richtextAppend (para) {
    // para.dataunitId 数据单元 ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据 ID
    // para.richtext 富文本


    return new Promise(function (resolve, reject) {
        let vRichtextUpdate = para.richtext,
            srcArr = richtextGetSrc(para.richtext);

        // 数据文件存储路径：pathStorageDataFolder，pathStorageDataFile
        // 数据文件路由：pathSrcData
        // 上传文件存储路径：pathStorageUploadFolder，pathStorageUploadFile

        let pathStorageDataFolder = uploadPath.imageFilePath + '/' +
            (para.dataunitId ? para.dataunitId + '/' : '') +
            para.tblName + '/' +
            para.fieldName + '/' +
            thisTime.getFullYear() + '/' +
            (thisTime.getMonth() + 1);

        new Promise(function (resolve, reject) { //设置(新建)数据文件存储路径
            fs.mkdir(pathStorageDataFolder, {recursive: true}, (err) => {
                if (err) console.log(err)

                resolve()
            })
        }).then(function () { //上传文件转存，富文本处理
            let arrPrm = []

            for (let i in srcArr) {
                let
                    pathStorageUploadFile = srcArr [i].replace(uploadPath.uploadUrlPath, uploadPath.uploadFilePath),
                    pathStorageDataFile = pathStorageDataFolder + '/' +
                        (para.dataunitId ? para.dataunitId + '.' : '') +
                        para.tblName + '.' +
                        para.fieldName + '.' +
                        para.dataId + '.' +
                        Math.floor((999999 - 0) * Math.random() + 0) +
                        path.parse(srcArr [i]).ext,
                    pathSrcData = pathStorageDataFile.replace(uploadPath.imageFilePath, uploadPath.imageUrlPath)

                arrPrm [i] = new Promise(function (resolve, reject) {
                    fs.rename(pathStorageUploadFile, pathStorageDataFile, (err) => { //上传文件移动至数据文件存储路径
                        if (err) console.log(err) //阻止抛出异常

                        vRichtextUpdate = vRichtextUpdate.replace(srcArr [i], pathSrcData)
                        //重置富文本内相应的路由

                        resolve()
                    })
                })
            }

            Promise.all(arrPrm).then(function () {
                resolve(vRichtextUpdate)
            })
        })
    })
}

// 富文本更新
function richtextUpdate (para) {
    // para.dataunitId 数据单元 ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据 ID
    // para.richtextNew 新富文本
    // para.richtextOld 原富文本

    return new Promise(function (resolve, reject) {
        let vRichtextUpdate = para.richtextNew,
            srcArrNew = richtextGetSrc(para.richtextNew),
            srcArrOld = richtextGetSrc(para.richtextOld)

        // 数据文件存储路径：pathStorageDataFolder，pathStorageDataFile
        // 数据文件路由：pathSrcData
        // 上传文件存储路径：pathStorageUploadFolder，pathStorageUploadFile

        let pathStorageDataFolder = uploadPath.imageFilePath + '/' +
            (para.dataunitId ? para.dataunitId + '/' : '') +
            para.tblName + '/' +
            para.fieldName + '/' +
            thisTime.getFullYear() + '/' +
            (thisTime.getMonth() + 1)

        new Promise(function (resolve, reject) { //设置(新建)数据文件存储路径
            fs.mkdir(pathStorageDataFolder, {recursive: true}, (err) => {
                if (err) console.log(err)
                resolve()
            })
        }).then(function () { //上传文件转存，富文本处理
            return new Promise(function (resolve, reject) {
                let arrPrm = []

                for (let i in srcArrNew) {
                    if (srcArrNew [i].startsWith('/ly0/db-mongo/upload')) { //处理富文本 richtextNew 内的新增路由
                        let
                            pathStorageUploadFile = srcArrNew [i].replace(uploadPath.uploadUrlPath, uploadPath.uploadFilePath),
                            pathStorageDataFile = pathStorageDataFolder + '/' +
                                (para.dataunitId ? para.dataunitId + '.' : '') +
                                para.tblName + '.' +
                                para.fieldName + '.' +
                                para.dataId + '.' +
                                Math.floor((999999 - 0) * Math.random() + 0) +
                                path.parse(srcArrNew [i]).ext,
                            pathSrcData = pathStorageDataFile.replace(uploadPath.imageFilePath, uploadPath.imageUrlPath)

                        arrPrm [i] = new Promise(function (resolve, reject) {
                            fs.rename(pathStorageUploadFile, pathStorageDataFile, (err) => { //上传文件转存至数据文件存储路径
                                if (err) console.log(err)

                                vRichtextUpdate = vRichtextUpdate.replace(srcArrNew [i], pathSrcData)
                                //重置富文本内相应的路由

                                resolve()
                            })
                        })
                    } else { //处理富文本 richtextNew 内的原路由，原文件保留
                        for (let j in srcArrOld) {
                            if (srcArrOld [j] === srcArrNew [i]) {
                                srcArrOld [j] = ''
                            }
                        }
                    }
                }

                Promise.all(arrPrm).then(function () {
                    resolve()
                })
            })
        }).then(function () { //删除垃圾文件
            let arrPrm = []

            for (let i in srcArrOld) {
                if (srcArrOld [i]) {
                    arrPrm [i] = new Promise(function (resolve, reject) {
                        let p = srcArrOld [i].replace(uploadPath.imageUrlPath, uploadPath.imageFilePath)
                        fs.unlink(p, (err) => {
                            if (err) console.log(err)

                            resolve()
                        })
                    })
                }
            }

            Promise.all(arrPrm).then(function () {
                resolve(vRichtextUpdate)
            })
        })
    })
}

// 富文本删除
function richtextDelete (richtext) {
    return new Promise(function (resolve, reject) {
        let srcArr = richtextGetSrc(richtext),
            arrPrm = []

        for (let i in srcArr) {
            arrPrm [i] = new Promise(function (resolve, reject) {
                let p = srcArr [i].replace(uploadPath.imageUrlPath, uploadPath.imageFilePath)
                fs.unlink(p, (err) => {
                    if (err) console.log(err)
                    resolve()
                })
            })
        }

        Promise.all(arrPrm).then(function () {
            resolve({
                code: 0,
                message: '删除成功'
            })
        })
    })
}

export default {
    imagesAppend,
    imageAppend,
    imagesUpdate,
    imageUpdate,
    imagesDelete,
    imageDelete,
    richtextAppend,
    richtextUpdate,
    richtextDelete
}
