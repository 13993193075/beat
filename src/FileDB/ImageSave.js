import Richtext from './richtext.js'
import FileMove from "./FileMove.js";
const thisTime = new Date()

// 图片新增
async function imageAppend (para) {
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

    if (!para.uploaded) {
        return ('')
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
        FileMove.pathParse({folder: para.uploaded}).ext

    // 上传文件路径
    const uploadFilePath = para.uploaded.replace(para.pathHead.uploadUrl, para.pathHead.uploadFolder)
    // 数据库文件路径
    const dbFilePath = dbFolder + '/' + dbFileName
    // 数据库URL
    const dbUrl = dbFilePath.replace(para.pathHead.dbFolder, para.pathHead.dbUrl)
    // 创建数据库文件夹
    await FileMove.create({folder: dbFolder})
    // 已上传文件转存至数据库文件夹
    await FileMove.fileMove({folderOld: uploadFilePath, folderNew: dbFilePath})

    // 返回数据库url
    return dbUrl
}

// 图片删除
async function imageDelete (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.url 待删除文件的URL

    if (!para.url) {
        return
    }
    await FileMove.fileDelete({
        folder: FileMove.urlToFolder({
            url: para.url,
            urlPrefix: para.pathHead.dbUrl,
            folderPrefix: para.pathHead.dbFolder
        })
    })
}

// 图片更新
async function imageUpdate (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.pathHead.uploadFolder 上传文件夹
    // para.pathHead.uploadUrl 上传URL
    // para.uploaded 已上传文件的URL
    // para.old 原文件的URL

    // para.dataunitId 数据单元ID
    // para.tblName 表名
    // para.fieldName 字段名
    // para.fieldIndex 多文件索引
    // para.dataId 数据ID

    if (para.uploaded === para.old) {
        return (para.old)
    }

    if(para.old){
        await imageDelete({
            pathHead: {
                dbFolder: para.pathHead.dbFolder,
                dbUrl: para.pathHead.dbUrl
            },
            url: para.old
        })
    }
    if (!para.uploaded) {
        return ''
    }

    return await imageAppend({
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
    })
}

// 图片新增 - 多文件处理
async function imagesAppend (para) {
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

    if(!para.arrUploaded || para.arrUploaded.length === 0){
        return []
    }
    let arrResult = []
    for (const item of para.arrUploaded) {
        const index = para.arrUploaded.indexOf(item);
        arrResult.push(await imageAppend ({
            pathHead: para.pathHead,
            uploaded: item,

            dataunitId: para.dataunitId,
            tblName: para.tblName,
            fieldName: para.fieldName,
            fieldIndex: index,
            dataId: para.dataId
        }))
    }
    return (arrResult)
}

// 图片删除 - 多文件处理
async function imagesDelete(para){
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.arrUrl 待删除文件的URL

        if(!para.arrUrl || para.arrUrl.length === 0){
            return
        }

        for (const i of para.arrUrl) {
            await imageDelete({
                pathHead: para.pathHead,
                url: i
            })
        }
}

// 图片更新 - 多文件处理
async function imagesUpdate (para) {
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

    await imagesDelete({
        pathHead: {
            dbFolder: para.pathHead.dbFolder,
            dbUrl: para.pathHead.dbUrl
        },
        arrUrl: para.arrDelete
    })

    const resultAppend = imagesAppend ({
        pathHead: para.pathHead,
        arrUploaded: para.arrUploaded,

        dataunitId: para.dataunitId,
        tblName: para.tblName,
        fieldName: para.fieldName,
        dataId: para.dataId
    })

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
    return arrHoldon.concat(resultAppend)
}

// 富文本新增
async function richtextAppend (para) {
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

    let richtextReturn = para.richtext,
        arrSrc = Richtext.extractAllSrc(para.richtext);

    let dbFolder = para.pathHead.dbFolder +
        (para.dataunitId ? '/' + para.dataunitId : '') +
        '/' + para.tblName +
        '/' + para.fieldName +
        '/' + thisTime.getFullYear() +
        '/' + (thisTime.getMonth() + 1);

    // 创建数据库文件夹
    await FileMove.create({folder: dbFolder})
    for (let i in arrSrc) {
        let uploadFilePath = FileMove.urlToFolder({
            url: arrSrc[i],
            urlPrefix: para.pathHead.uploadUrl,
            folderPrefix: para.pathHead.uploadFolder,
        }),
        dbFilePath = dbFolder + '/' +
            (para.dataunitId ? para.dataunitId + '.' : '') +
            para.tblName + '.' +
            para.fieldName + '.' +
            para.dataId + '.' +
            Math.floor((999999 - 0) * Math.random() + 0) +
            FileMove.pathParse({folder: arrSrc [i]}).ext,
        dbUrl = dbFilePath.replace(para.pathHead.dbFolder, para.pathHead.dbUrl)

        // 已上传文件转存至数据库文件夹
        await FileMove.fileMove({folderOld: uploadFilePath, folderNew: dbFilePath})
        // 重置富文本内的src
        richtextReturn = richtextReturn.replace(arrSrc[i], dbUrl)
    }

    return richtextReturn
}

// 富文本删除
async function richtextDelete (para) {
    // para.pathHead 路径头部
    // para.pathHead.dbFolder 数据库文件夹
    // para.pathHead.dbUrl 数据库URL
    // para.richtext 富文本

    let arrSrc = Richtext.extractAllSrc(para.richtext)
    for (let i in arrSrc) {
        await FileMove.fileDelete({
            folder: FileMove.urlToFolder({
                url: arrSrc[i],
                urlPrefix: para.pathHead.dbUrl,
                folderPrefix: para.pathHead.dbFolder
            })
        })
    }
}

// 富文本更新
async function richtextUpdate (para) {
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

    let richtextReturn = para.richtextNew,
        arrSrcNew = Richtext.extractAllSrc(para.richtextNew),
        arrSrcOld = Richtext.extractAllSrc(para.richtextOld)

    let dbFolder = para.pathHead.dbFolder +
        (para.dataunitId ? '/' + para.dataunitId : '') +
        '/' + para.tblName +
        '/' + para.fieldName +
        '/' + thisTime.getFullYear() +
        '/' + (thisTime.getMonth() + 1)

    // 创建数据库文件夹
    await FileMove.create({folder: dbFolder})
    for (let i in arrSrcNew) {
        // 处理富文本 richtextNew 内的新增src
        if (arrSrcNew [i].startsWith(para.pathHead.uploadUrl)) {
            let uploadFilePath = FileMove.urlToFolder({
                url: arrSrcNew[i],
                urlPrefix: para.pathHead.uploadUrl,
                folderPrefix: para.pathHead.uploadFolder,
            }),
            dbFilePath = dbFolder + '/' +
                (para.dataunitId ? para.dataunitId + '.' : '') +
                para.tblName + '.' +
                para.fieldName + '.' +
                para.dataId + '.' +
                Math.floor((999999 - 0) * Math.random() + 0) +
                FileMove.pathParse({folder: arrSrcNew [i]}).ext,
            dbUrl = FileMove.folderToUrl({
                folder: dbFilePath,
                folderPrefix: para.pathHead.dbFolder,
                urlPrefix: para.pathHead.dbUrl
            })

            // 已上传文件转存至数据库文件夹
            await FileMove.fileMove({folderOld: uploadFilePath, folderNew: dbFilePath})
            // 重置富文本内新增的src
            richtextReturn = richtextReturn.replace(arrSrcNew [i], dbUrl)
        } else {
            // 新src与原src重复处理：不能删除
            for (let j in arrSrcOld) {
                if (arrSrcOld [j] === arrSrcNew [i]) {
                    arrSrcOld [j] = ''
                }
            }
        }
    }

    for (let i in arrSrcOld) {
        if (arrSrcOld [i]) {
            // 删除垃圾文件
            await FileMove.fileDelete({
                folder: FileMove.urlToFolder({
                    url: arrSrcOld [i],
                    urlPrefix: para.pathHead.dbUrl,
                    folderPrefix: para.pathHead.dbFolder
                })
            })
        }
    }

    return richtextReturn
}

export {
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
