import fs from 'fs'
import path from 'path'
import uploadPath from "../config/upload.js"
const thisTime = new Date()

// 图片新增
// 多文件处理
function imagesAppend (para) {
    // para.dataunitId 数据单元 ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据 ID
    // para.arrSrc 上传路径

    return new Promise(function (resolve, reject) {
        if(!para.arrSrc || para.arrSrc.length === 0){
            return resolve([])
        }
        let arrPromise = []
        para.arrSrc.forEach((item, index)=>{
            arrPromise.push(imageAppend ({
                dataunitId: para.dataunitId,
                tblName: para.tblName,
                fieldName: para.fieldName,
                fieldIndex: index,
                dataId: para.dataId,
                src: item
            }))
        })
        Promise.all(arrPromise).then(result=>{
            resolve(result)
        })
    })
}

// 图片新增
function imageAppend (para) {
    // para.dbFolderHead 数据库文件夹头部
    // para.dbUrlHead 数据库URL头部
    // para.uploadFolderHead 上传文件夹头部
    // para.uploadUrlHead 上传URL头部
    // para.uploaded 已上传文件的URL
    // para.dataunitId 数据单元 ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.fieldIndex 数组类型字段的索引
    // para.dataId 数据 ID

    return new Promise(function (resolve, reject) {
        if (!para.uploaded) {
            return resolve('')
        }

        // 数据库文件夹：数据库文件夹头部 + 数据单元ID + 表名 + 字段名 + 数组类型字段的索引 + 当年 + 当月
        const dbFolder = para.dbFolderHead +
            '/' + (para.dataunitId ? para.dataunitId : '') +
            '/' + para.tblName +
            '/' + para.fieldName + '[' + (!!para.fieldIndex ? para.fieldIndex : "0") + "]" +
            '/' + thisTime.getFullYear() +
            '/' + (thisTime.getMonth() + 1)
        // 数据库文件名：数据单元ID + 表名 + 字段名 + 数组类型字段的索引 + 数据ID + 随机数 + 扩展名
        const dbFilename = (para.dataunitId ? para.dataunitId + '.' : '') +
            para.tblName + '.' +
            para.fieldName + '.' + (!!para.fieldIndex ? para.fieldIndex : "0") + '.' +
            para.dataId + '.' +
            Math.floor((999999 - 0) * Math.random() + 0) +
            path.parse(para.uploaded).ext
        // 上传文件夹中的文件路径：来自于 已上传文件的URL 头部置换
        const filePath_uploadFolder = para.uploaded.replace(para.uploadUrlHead, para.uploadFolderHead)
        // 数据库文件夹中的文件路径
        const filePath_dbFolder = dbFolder + '/' + dbFilename
        // 数据库URL：来自于 数据库文件夹中的文件路径 头部置换
        const dbUrl = filePath_dbFolder.replace(para.dbFolderHead, para.dbUrlHead)
        new Promise(function (resolve0, reject0) { // 创建数据库文件夹
            fs.mkdir(dbFolder, {recursive: true}, (err) => {
                if (err) throw err
                resolve0()
            })
        }).then(function () { // 已上传文件转存
            new Promise(function (resolve1, reject1) {
                // 已上传文件移动至数据库文件夹
                fs.rename(filePath_uploadFolder, filePath_dbFolder, (err) => {
                    if (err) throw err
                    resolve1(dbUrl) //返回 数据库URL中的文件路径
                })
            }).then(function (result) {
                resolve(result)
            })
        })
    })
}

// 图片更新
// 多文件处理
function imagesUpdate (para) {
    // para.dataunitId 数据单元 ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据 ID
    // para.arrSrcOld 原文件路径
    // para.arrSrcDelete 删除文件路径
    // para.arrSrcNew 上传路径

    return new Promise(function (resolve, reject) {
        let arrSrcOld = !!para.arrSrcOld && para.arrSrcOld.length > 0 ? para.arrSrcOld : [],
            arrSrcDelete = !!para.arrSrcDelete && para.arrSrcDelete.length > 0 ? para.arrSrcDelete : [],
            arrSrcNew = !!para.arrSrcNew && para.arrSrcNew.length > 0 ? para.arrSrcNew : []

        imagesDelete(arrSrcDelete).then(()=>{
            imagesAppend ({
                dataunitId: para.dataunitId,
                tblName: para.tblName,
                fieldName: para.fieldName,
                dataId: para.dataId,
                arrSrc: arrSrcNew
            }).then(result=>{
                let arrHoldon = []
                arrSrcOld.forEach(i=>{
                    let holdon = true
                    arrSrcDelete.forEach(j=>{
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
// 单文件处理
function imageUpdate (para) {
    // para.dataunitId 数据单元 ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据 ID
    // para.srcOld 原文件路径
    // para.deleteOld 删除原文件
    // para.srcNew 上传路径

    return new Promise(function (resolve, reject) {
        let srcOld = !!para.srcOld ? para.srcOld : "",
            deleteOld = "deleteOld" in para && (para.deleteOld === true || para.deleteOld === "true"),
            srcNew = !!para.srcNew ? para.srcNew : ""

        let result = srcOld
        if (!!srcNew || !!deleteOld) {
            imageDelete(srcOld)
            result = ""
        }
        if (!srcNew) {
            return resolve(result)
        }
        imageAppend({
            dataunitId: para.dataunitId ? para.dataunitId : "",
            tblName: para.tblName,
            fieldName: para.fieldName,
            dataId: para.dataId,
            src: srcNew
        }).then(result=>{
            resolve(result)
        })
    })
}

// 图片删除
// 多文件处理
function imagesDelete(arrSrc){
    return new Promise(function (resolve, reject) {
        if(!arrSrc || arrSrc.length === 0){
            return resolve()
        }

        let arrPromise = []
        arrSrc.forEach(i=>{
            arrPromise.push(imageDelete(i))
        })
        Promise.all((arrPromise)).then(()=>{
            resolve()
        })
    })
}
// 单文件处理
function imageDelete (src) {
    return new Promise(function (resolve, reject) {
        if (!src) {
            return resolve()
        }

        let p = src.replace(uploadPath.imageUrlPath, uploadPath.imageFilePath)
        fs.unlink(p, (err) => {
            if (err) console.log(err)
            resolve()
        })
    })
}

// 内部模块：获取富文本中资源文件(图片等)的src
function richtextGetSrc (richtext) {
    let srcArr = []
    if (richtext) {
        srcArr = richtext.match(/src=[\"\'][^\"\']{0,}[\"\']/g)

        for (let i in srcArr) {
            let a = srcArr [i]
            srcArr [i] = a.slice(5, a.length - 1)
        }
    }

    return srcArr
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
