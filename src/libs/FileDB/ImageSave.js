import fs from 'fs'
import path from 'path'
import Richtext from './richtext.js'
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
    // para.fieldIndex 多文件索引
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        if (!para.uploaded) {
            return resolve('')
        }

        // 数据库文件夹：数据单元ID + 表名 + 字段名 + 多文件索引 + 当年 + 当月
        const dbFolder = para.pathHead.dbFolder +
            (para.dataunitId ? '/' + para.dataunitId : '') +
            '/' + para.tblName +
            '/' + para.fieldName +
            '[' + ('fieldIndex' in para ? para.fieldIndex : 0) + "]" +
            '/' + thisTime.getFullYear() +
            '/' + (thisTime.getMonth() + 1)
        // 数据库文件名：数据单元ID + 表名 + 字段名 + 多文件索引 + 数据ID + 随机数 + 扩展名
        const dbFileName = (para.dataunitId ? para.dataunitId + '.' : '') +
            para.tblName + '.' +
            para.fieldName + '.' +
            ('fieldIndex' in para ? para.fieldIndex : 0) + '.' +
            para.dataId + '.' +
            Math.floor((999999 - 0) * Math.random() + 0) +
            path.parse(para.uploaded).ext

        // 上传文件路径
        const uploadFilePath = para.uploaded.replace(para.pathHead.uploadUrl, para.pathHead.uploadFolder)
        // 数据库文件路径
        const dbFilePath = dbFolder + '/' + dbFileName
        // 数据库URL
        const dbUrl = dbFilePath.replace(para.pathHead.dbFolder, para.pathHead.dbUrl)
        new Promise(function (resolve, reject) {
            // 创建数据库文件夹
            fs.mkdir(dbFolder, {recursive: true}, err => {
                if (err) throw err
                resolve()
            })
        }).then(function () {
            new Promise(function (resolve, reject) {
                // 已上传文件转存至数据库文件夹
                fs.rename(uploadFilePath, dbFilePath, err => {
                    if (err) throw err
                    resolve(dbUrl) // 返回数据库URL
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
        fs.unlink(para.url.replace(para.pathHead.dbUrl, para.pathHead.dbFolder), err => {
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
    // para.delete 如果没有上传新文件，是否删除原文件

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.fieldIndex 多文件索引
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        if (!!para.uploaded || para.delete === true || para.delete === 'true') {
            imageDelete({
                pathHead: {
                    dbFolder: para.pathHead.dbFolder,
                    dbUrl: para.pathHead.dbUrl
                },
                url: para.old
            })
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
        if(!para.arrUploaded || para.arrUploaded.length === 0){
            return resolve([])
        }
        let arrPrm = []
        para.arrUploaded.forEach((item, index)=>{
            arrPrm.push(imageAppend ({
                pathHead: para.pathHead,
                uploaded: item,

                dataunitId: para.dataunitId,
                tblName: para.tblName,
                fieldName: para.fieldName,
                fieldIndex: index,
                dataId: para.dataId
            }))
        })
        Promise.all(arrPrm).then(result=>{
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

        let arrPrm = []
        para.arrUrl.forEach(i=>{
            arrPrm.push(imageDelete({
                pathHead: para.pathHead,
                url: i
            }))
        })
        Promise.all((arrPrm)).then(()=>{
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
                pathHead: para.pathHead,
                arrUploaded: para.arrUploaded,

                dataunitId: para.dataunitId,
                tblName: para.tblName,
                fieldName: para.fieldName,
                dataId: para.dataId
            }).then(result=>{
                // 原文件中未删除的并入返回结果
                let arrHoldon = []
                para.arrOld.forEach(i=>{
                    let holdon = true
                    para.arrDelete.forEach(j=>{
                        if(i === j){
                            holdon = false
                        }
                    })
                    if(holdon){
                        arrHoldon.push(i)
                    }
                })
                resolve(arrHoldon.concat(result))
            })
        })
    })
}

// 富文本新增
function richtextAppend (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.richtext 富文本

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        let richtextReturn = para.richtext,
            arrSrc = Richtext.extractAllSrc(para.richtext);

        let dbFolder = para.pathHead.dbFolder +
            (para.dataunitId ? '/' + para.dataunitId : '') +
            '/' + para.tblName +
            '/' + para.fieldName +
            '/' + thisTime.getFullYear() +
            '/' + (thisTime.getMonth() + 1);

        new Promise(function (resolve, reject) {
            // 创建数据库文件夹
            fs.mkdir(dbFolder, {recursive: true}, err => {
                if (err) throw err
                resolve()
            })
        }).then(function () {
            let arrPrm = []
            for (let i in arrSrc) {
                let uploadFilePath = arrSrc[i].replace(para.pathHead.uploadUrl, para.pathHead.uploadFolder),
                    dbFilePath = dbFolder + '/' +
                        (para.dataunitId ? para.dataunitId + '.' : '') +
                        para.tblName + '.' +
                        para.fieldName + '.' +
                        para.dataId + '.' +
                        Math.floor((999999 - 0) * Math.random() + 0) +
                        path.parse(arrSrc [i]).ext,
                    dbUrl = dbFilePath.replace(para.pathHead.dbFolder, para.pathHead.dbUrl)

                arrPrm.push(new Promise(function (resolve, reject) {
                    // 已上传文件转存至数据库文件夹
                    fs.rename(uploadFilePath, dbFilePath, err => {
                        if (err) throw err

                        // 重置富文本内的src
                        richtextReturn = richtextReturn.replace(arrSrc[i], dbUrl)
                        resolve()
                    })
                }))
            }

            Promise.all(arrPrm).then(function () {
                resolve(richtextReturn)
            })
        })
    })
}

// 富文本删除
function richtextDelete (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.richtext 富文本

    return new Promise(function (resolve, reject) {
        let arrSrc = Richtext.extractAllSrc(para.richtext),
            arrPrm = []
        for (let i in arrSrc) {
            arrPrm[i] = new Promise(function (resolve, reject) {
                fs.unlink(arrSrc[i].replace(para.pathHead.dbUrl, para.pathHead.dbFolder), err => {
                    if (err) throw err
                    resolve()
                })
            })
        }

        Promise.all(arrPrm).then(function () {
            resolve({code: 0, message: '删除成功'})
        })
    })
}

// 富文本更新
function richtextUpdate (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.richtextNew 新富文本
    // para.richtextOld 原富文本
    
    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.dataId 数据ID

    return new Promise(function (resolve, reject) {
        let richtextReturn = para.richtextNew,
            arrSrcNew = Richtext.extractAllSrc(para.richtextNew),
            arrSrcOld = Richtext.extractAllSrc(para.richtextOld)

        let dbFolder = para.pathHead.dbFolder + 
            (para.dataunitId ? '/' + para.dataunitId : '') +
            '/' + para.tblName + 
            '/' + para.fieldName + 
            '/' + thisTime.getFullYear() + 
            '/' + (thisTime.getMonth() + 1)

        new Promise(function (resolve, reject) {
            // 创建数据库文件夹
            fs.mkdir(dbFolder, {recursive: true}, err => {
                if (err) console.log(err)
                resolve()
            })
        }).then(function () {
            new Promise(function (resolve, reject) {
                let arrPrm = []
                for (let i in arrSrcNew) {
                    // 处理富文本 richtextNew 内的新增src
                    if (arrSrcNew [i].startsWith(para.pathHead.uploadUrl)) {
                        let uploadFilePath = arrSrcNew[i].replace(para.pathHead.uploadUrl, para.pathHead.uploadFolder),
                            dbFilePath = dbFolder + '/' +
                                (para.dataunitId ? para.dataunitId + '.' : '') +
                                para.tblName + '.' +
                                para.fieldName + '.' +
                                para.dataId + '.' +
                                Math.floor((999999 - 0) * Math.random() + 0) +
                                path.parse(arrSrcNew [i]).ext,
                            dbUrl = dbFilePath.replace(para.pathHead.dbFolder, para.pathHead.dbUrl)
    
                        arrPrm.push(new Promise(function (resolve, reject) {
                            // 已上传文件转存至数据库文件夹
                            fs.rename(uploadFilePath, dbFilePath, err => {
                                if (err) throw err
    
                                // 重置富文本内新增的src
                                richtextReturn = richtextReturn.replace(arrSrcNew [i], dbUrl)
                                resolve()
                            })
                        }))
                    } else {
                        // 新src与原src重复处理：不能删除
                        for (let j in arrSrcOld) {
                            if (arrSrcOld [j] === arrSrcNew [i]) {
                                arrSrcOld [j] = ''
                            }
                        }
                    }
                }
    
                Promise.all(arrPrm).then(function () {
                    resolve()
                })
            }).then(function () {
                let arrPrm = []
                for (let i in arrSrcOld) {
                    if (arrSrcOld [i]) {
                        arrPrm.push(new Promise(function (resolve, reject) {
                            // 删除垃圾文件
                            fs.unlink(arrSrcOld [i].replace(para.pathHead.dbUrl, para.pathHead.dbFolder), err => {
                                if (err) throw err
                                resolve()
                            })
                        }))
                    }
                }
    
                Promise.all(arrPrm).then(function () {
                    resolve(richtextReturn)
                })
            })
        })
    })
}

export default {
    imageAppend,
    imageDelete,
    imageUpdate,
    imagesAppend,
    imagesDelete,
    imagesUpdate,
    richtextAppend,
    richtextDelete,
    richtextUpdate
}
