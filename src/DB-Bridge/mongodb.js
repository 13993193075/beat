import {MongoClient} from 'mongodb'
import schema from './schema.js'

// 泛查询
async function GQuery(para) {
    // para.connectionUrl 连接字
    // para.dbName 数据库名
    // para.tblname 集合名（表名）
    // para.schema 集合模型（表模型）
    // para.operator 操作符
    // para.query 查询对象
    // para.sort 排序
    // para.skip 跳过记录数
    // para.limit 页记录数
    // gqueryBody.reference 关联查询
    /* 语法示例：
        [
            {key: "field0", ref_collection: "table0", ref_key: "_id"},
            {key: "field1", ref_collection: "table1", ref_key: "_id"}
        ]
    */
    // gqueryBody.populate 另一种形式的关联查询（需要用到表模型）
    // 语法示例：["field0", "field1"]

    if(!para.connectionUrl){
        return {code: 1, message: '连接字不存在'}
    }

    if(!para.dbName){
        return {code: 1, message: '数据库名不存在'}
    }

    if(!para.tblname){
        return {code: 1, message: '集合名或表名不存在'}
    }

    if(!para.operator || ![
        "find",
        "findOne",
        "countDocuments",
        "insertMany",
        "insertOne",
        "create",
        "updateMany",
        "updateOne",
        "findOneAndUpdate",
        "deleteMany",
        "deleteOne",
        "aggregate",
    ].includes(para.operator)){
        return {code: 1, message: '操作符不存在或非法'}
    }

    if(!para.query || [
        "find",
        "findOne",
        "countDocuments",
        "updateMany",
        "updateOne",
        "findOneAndUpdate",
        "deleteMany",
        "deleteOne"
    ].includes(para.operator)){
        return {code: 1, message: '查询对象不存在'}
    }
    let paraQuery = para.query ? para.query : null
    if(paraQuery && para.schema){
        paraQuery = schema.DTCE({data: para.query, schema: para.schema})
    }

    let paraSort = para.sort ? para.sort : null // 排序
    let paraSkip = para.skip ? para.skip : 0 // 跳过记录数
    let paraLimit = para.limit ? para.limit : 0 // 页记录数

    // 关联查询
    let paraReference = para.reference ? para.reference : null
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
            paraReference = paraReference ? paraReference : []
            paraReference = paraReference.concat(populate) // 并入paraReference
        }
    }

    const client = new MongoClient(para.connectionUrl);
    try {
        // 1. 建立连接
        await client.connect();

        // 2. 选择数据库
        const database = client.db(para.dbName);

        // 3. 选择集合 (Collection)
        const collection = database.collection(para.tblname);

        // 4. 执行操作 (例如：插入一条数据)
        const result = await exec({para, collection});
    } catch (error) {
        console.error("数据库 " + para.dbName + " 连接或操作出错：", error);
    } finally {
        // 5. 确保连接最终被关闭
        await client.close();
        console.log("数据库 " + para.dbName +" 连接已关闭");
    }
}

// 泛查询 - 执行
async function exec({para, collection}) {

}