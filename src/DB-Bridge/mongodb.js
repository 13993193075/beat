import {MongoClient} from 'mongodb'
import schema from './schema.js'

// 泛查询
async function GQuery(para) {
    // para.connectionUrl 连接字
    // para.dbName 数据库名
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

    if(!para.connectionUrl){
        return {code: 1, message: '连接字不存在'}
    }

    if(!para.dbName){
        return {code: 1, message: '数据库名不存在'}
    }

    if(!para.tblName){
        return {code: 1, message: '表名不存在'}
    }

    // 执行参数
    let paraExec = {}

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
    if(!para.query || [
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
        // 数据类型一致性强制
        paraExec.query = schema.DTCE({data: para.query, schema: para.schema})
    }

    paraExec.limit = para.limit ? para.limit : 0 // 页记录数
    paraExec.skip = para.skip ? para.skip : 0 // 跳过记录数
    paraExec.sort = para.sort ? para.sort : null // 排序

    // 关联查询
    paraExec.reference = para.reference ? para.reference : null
    if(para.populate && para.schema){
        let populate = []
        para.populate.forEach(i => {
            if (Object.keys(para.schema).includes(i) && para.schema[i].ref_collection) {
                populate.push({
                    key: i,
                    ref_collection: para.schema[i].ref_collection,
                    ref_key: para.schema[i].ref_key
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
        // 数据类型一致性强制
        paraExec.update = schema.DTCE({data: para.update, schema: para.schema})
    }
    if (paraExec.operator === 'updateMany' || paraExec.operator === 'updateOne') {
        // 附加原子操作符：$set
        if (!Object.keys(paraExec.update).length > 0 || Object.keys(paraExec.update)[0].toLowerCase() !== '$set') {
            paraExec.update = {$set: paraExec.update}
        }
    }

    // updateMany, updateOne 未查中：插入新记录
    paraExec.upsert = !!para.upsert

    // 聚合管道参数
    paraExec.aggregate = para.aggregate ? para.aggregate : null

    const client = new MongoClient(para.connectionUrl);
    try {
        // 1. 建立连接
        await client.connect();

        // 2. 选择数据库
        const database = client.db(para.dbName);

        // 3. 选择集合 (Collection)
        const collection = database.collection(para.tblName);

        // 4. 执行操作 (例如：插入一条数据)
        const result = await exec({para: paraExec, database, collection});
    } catch (error) {
        console.error("数据库 " + para.dbName + " 连接或操作出错：", error);
    } finally {
        // 5. 确保连接最终被关闭
        await client.close();
        console.log("数据库 " + para.dbName +" 连接已关闭");
    }
}

// 泛查询 - 执行
async function exec({para, database, collection}) {
    // para.operator
    // para.query
    // para.limit
    // para.skip
    // para.sort
    // para.reference
    // para.showFields
    // para.update
    // para.upsert

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
                        const collectionRef = database.collection(iRef.ref_tblName)
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
                    const collectionRef = database.collection(iRef.ref_tblName)
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
            const result = await collection.insertMany(para.update)
            return ({code: 0, message: '插入多条记录成功',
                data: Object.values(result.insertedIds) // _id数组
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
            const result = await collection.insertOne(para.update)
            return ({code: 0, message: '插入一条记录成功',
                data: result.insertedId // _id数组
            })
        }catch (err) {
            // throw err
            return ({code: 1, message: '插入一条记录失败',
                err
            })
        }
    }

    // 计数
    if (para.operator === 'countDocuments') {
        try {
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

    // 计数
    if (para.operator === 'countDocuments') {
        try {
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

    // 计数
    if (para.operator === 'countDocuments') {
        try {
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

    // 计数
    if (para.operator === 'countDocuments') {
        try {
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
}