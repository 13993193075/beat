import {MongoClient} from 'mongodb'
import schema from './schema.js'

// 泛查询
async function GQuery({para, db}) {
    // para.tblName 表名（集合名）
    // para.schema 表模型（集合模型）
    // para.operator 操作符
    // para.query 查询对象
    // para.limit 页记录数
    // para.skip 跳过记录数
    // para.sort 排序
        // 语法示例：{_id: -1, name: 1}
    // para.reference 关联查询
        /* 语法示例：
            [
                {fldName: "field0", ref_tblName: "table0", ref_fldName: "_id"},
                {fldName: "field1", ref_tblName: "table1", ref_fldName: "_id"}
            ]
        */
    // para.populate 另一种形式的关联查询（需要用到表模型）
        // 语法示例：["field0", "field1"]
    // para.showFields 输出字段
        // 语法示例：["_id", "name"]
    // para.update 数据更新对象
    // para.upsert updateMany, updateOne 未查中：插入新记录
    // paraExec.aggregate 聚合管道参数

    try {
        if(!para.tblName){
            return {code: 1, message: '表名不存在'}
        }

        // 执行参数
        let paraExec = {}

        // 表名
        if(!para.tblName){
            return {code: 1, message: '表名不存在'}
        }
        paraExec.tblName = para.tblName

        // 操作符
        if(!para.operator || ![
            "find",
            "findOne",
            "countDocuments",
            "insertMany",
            "insertOne",
            "updateMany",
            "updateOne",
            "deleteMany",
            "deleteOne",
            "aggregate",
        ].includes(para.operator)){
            return {code: 1, message: '操作符不存在或非法'}
        }
        paraExec.operator = para.operator

        // 查询对象
        if(!para.query && [
            "find",
            "findOne",
            "countDocuments",
            "updateMany",
            "updateOne",
            "deleteMany",
            "deleteOne"
        ].includes(para.operator)){
            return {code: 1, message: '查询对象不存在'}
        }

        paraExec.query = para.query ? para.query : null
        if(paraExec.query && para.schema){

            console.log("测试 - beat - 000", paraExec.query);

            // 数据类型一致性强制
            paraExec.query = schema.DTCE({data: paraExec.query, schema: para.schema})

            console.log("测试 - beat - 111", paraExec.query);

        }

        paraExec.limit = para.limit ? para.limit : 0 // 页记录数
        paraExec.skip = para.skip ? para.skip : 0 // 跳过记录数
        paraExec.sort = para.sort ? para.sort : null // 排序

        // 关联查询
        paraExec.reference = para.reference ? para.reference : null
        if(para.populate && para.schema){
            let populate = []
            para.populate.forEach(i => {
                if (Object.keys(para.schema).includes(i) && para.schema[i].ref_tblName) {
                    populate.push({
                        fldName: i,
                        ref_tblName: para.schema[i].ref_tblName,
                        ref_fldName: para.schema[i].ref_fldName
                    })
                }
            })
            if(populate.length > 0){
                paraExec.reference = paraExec.reference ? paraExec.reference : []
                paraExec.reference = paraExec.reference.concat(populate) // 并入paraExec.reference
            }
        }

        // 输出字段
        paraExec.outFields = para.outFields ? {} : null
        if(para.outFields){
            // mongodb语法转义示例：{"_id": 1, "name": 1}
            for (let i = 0; i < para.outFields.length; i++) {
                paraExec.outFields[para.outFields[i]] = 1
            }
        }

        // 数据更新对象
        paraExec.update = para.update ? para.update : null

        if(paraExec.update && para.schema){

            console.log("测试 - beat - 222", paraExec.update);

            // 数据类型一致性强制
            paraExec.update = schema.DTCE({data: paraExec.update, schema: para.schema})

            console.log("测试 - beat - 333", paraExec.update);

        }
        if (paraExec.operator === 'updateMany' || paraExec.operator === 'updateOne') {
            // 附加原子操作符：$set
            if (!Object.keys(paraExec.update).length > 0 || Object.keys(paraExec.update)[0].toLowerCase() !== '$set') {
                paraExec.update = {$set: paraExec.update}
            }
        }

        console.log("测试 - beat - 444", paraExec.update);

        // updateMany, updateOne 未查中：插入新记录
        paraExec.upsert = !!para.upsert

        // 聚合管道参数
        paraExec.aggregate = para.aggregate ? para.aggregate : null

        return await exec({para: paraExec, db})
    } catch (error) {
        return {code: 1, message: "执行泛查询错误：" + error}
    }
}

// 泛查询 - 执行
async function exec({para, db}) {
    const collection = db.collection(para.tblName)

    // 查询多条记录
    if (para.operator === 'find') {
        try {
            // 同步返回游标
            const cursor = collection.find(para.query)
            if (para.limit > 0) {
                cursor.limit(para.limit)
            }
            if (para.skip > 0) {
                cursor.skip(para.skip)
            }
            if (para.sort) {
                cursor.sort(para.sort)
            }
            if (para.showFields) {
                cursor.project(para.showFields)
            }
            let data = await cursor.toArray()

            // 关联查询
            if(data.length > 0 && para.reference){
                data.forEach(iData=>{
                    para.reference.forEach(async iRef=>{
                        const collectionRef = db.collection(iRef.ref_tblName)
                        let q = {} // query
                        q[iRef.ref_fldName] = iData[iRef.fldName]
                        iData[iRef.fldName] = await collectionRef.findOne(q)
                    })
                })
            }

            return ({code: 0, message: '查询多条记录成功',
                data
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '查询多条记录失败',
                err
            })
        }
    }

    // 查询一条记录
    if (para.operator === 'findOne') {
        try {
            // 异步返回数据
            let data = null
            if(para.showFields){
                data = await collection.findOne(para.query, {projection: para.showFields})
            }else{
                data = await collection.findOne(para.query)
            }

            // 关联查询
            if(data && para.reference){
                para.reference.forEach(async iRef=>{
                    const collectionRef = db.collection(iRef.ref_tblName)
                    let q = {} // query
                    q[iRef.ref_fldName] = data[iRef.fldName]
                    data[iRef.fldName] = await collectionRef.findOne(q)
                })
            }

            return ({code: 0, message: '查询一条记录成功',
                data
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '查询一条记录失败',
                err
            })
        }
    }

    // 计数
    if (para.operator === 'countDocuments') {
        try {
            let count = await collection.countDocuments(para.query)

            return ({code: 0, message: '计数成功',
                count
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '计数失败',
                err
            })
        }
    }

    // 插入多条记录
    if (para.operator === 'insertMany') {
        try {
            // 插入新数据
            const result = await collection.insertMany(para.update)

            // 查询新数据
            const arrId = Object.values(result.insertedIds)
            const cursor = collection.find({_id: {$in: arrId}})
            const dataNew = await cursor.toArray()

            return ({code: 0, message: '插入多条记录成功',
                dataNew // 返回新数据
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '插入多条记录失败',
                err
            })
        }
    }

    // 插入一条记录
    if (para.operator === 'insertOne') {
        try {
            // 插入新数据
            const result = await collection.insertOne(para.update)

            // 查询新数据
            const dataNew = await collection.findOne({_id: result.insertedId})

            return ({code: 0, message: '插入一条记录成功',
                dataNew // 返回新数据
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '插入一条记录失败',
                err
            })
        }
    }

    // 更新多条记录
    if (para.operator === 'updateMany') {
        try {
            // 首先查询待更新的数据
            const cursorOld = collection.find(para.query)
            const dataOld = await cursorOld.toArray()
            // 记录新数据的ID（数组）
            let arrNewId = []
            dataOld.forEach(i=>{
                arrNewId.push(i._id)
            })
            if(arrNewId.length === 0 && para.upsert){
                // 查询无果，强制插入一条新记录
                const result = await collection.updateMany(para.query, para.update, {upsert: true})
                arrNewId = [result.upsertedId['0']] // result.upsertedId的内容示例：{'0': new ObjectId('60c72b2f9b1d8e001f3f4e5b')}
            }else if(arrNewId.length > 0){
                // 更新数据
                await collection.updateMany({_id: {$in: arrNewId}}, para.update, {upsert: false})
            }
            // 查询新数据
            const cursorNew = collection.find({_id: {$in: arrNewId}})
            const dataNew = await cursorNew.toArray()

            return ({code: 0, message: '更新多条记录成功',
                dataNew, dataOld // 返回新、旧数据
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '更新多条记录失败',
                err
            })
        }
    }

    // 更新一条记录
    if (para.operator === 'updateOne') {
        try {
            // 首先查询待更新的数据
            const dataOld = await collection.findOne(para.query)
            // 记录新数据的ID
            let newId = null
            if(!dataOld && para.upsert){
                // 查询无果，强制插入一条新记录
                const result = await collection.updateOne(para.query, para.update, {upsert: true})
                newId = result.upsertedId // 这里注意一下和 updateMany 的区别
            }else if(dataOld){
                newId = dataOld._id
                // 更新数据
                await collection.updateOne({_id: newId}, para.update, {upsert: false})
            }
            // 查询新数据
            const dataNew = await collection.findOne({_id: newId})

            return ({code: 0, message: '更新一条记录成功',
                dataNew, dataOld // 返回新、旧数据
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '更新一条记录失败',
                err
            })
        }
    }

    // 删除多条记录
    if (para.operator === 'deleteMany') {
        try {
            // 首先查询待删除的数据
            const cursorOld = collection.find(para.query)
            const dataOld = await cursorOld.toArray()
            // 记录旧数据的ID（数组）
            let arrOldId = []
            dataOld.forEach(i=>{
                arrOldId.push(i._id)
            })
            if(arrOldId.length > 0){
                // 删除数据
                await collection.deleteMany({_id: {$in: arrOldId}})
            }

            return ({code: 0, message: '删除多条记录成功',
                dataOld // 返回旧数据
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '删除多条记录失败',
                err
            })
        }
    }

    // 删除一条记录
    if (para.operator === 'deleteOne') {
        try {
            // 首先查询待删除的数据
            const dataOld = await collection.findOne(para.query)
            if(dataOld){
                // 删除数据
                await collection.deleteOne({_id: dataOld._id})
            }

            return ({code: 0, message: '删除一条记录成功',
                dataOld // 返回旧数据
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '删除一条记录失败',
                err
            })
        }
    }

    // 聚合查询
    if (para.operator === 'aggregate') {
        try {
            const cursor = collection(para.aggregate)
            let data = await cursor.toArray()

            return ({code: 1, message: '聚合查询成功',
                data
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '聚合查询失败',
                err
            })
        }
    }
}

export {
    GQuery
}
export default {
    GQuery
}