import {MongoClient} from 'mongodb'
import schema from './schema.js'

// 泛查询
async function GQuery(para) {
    // para.connectionUrl 连接字
    // para.dbName 数据库名
    // para.collection 集合名
    // para.schema 集合模型（表模型）
    // para.operator 操作符
    // para.query 查询对象

    if(!para.connectionUrl){
        return {code: 1, message: '连接字不存在'}
    }

    if(!para.dbName){
        return {code: 1, message: '数据库名不存在'}
    }

    if(!para.collection){
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

    const client = new MongoClient(para.connectionUrl);
    try {
        // 1. 建立连接
        await client.connect();

        // 2. 选择数据库
        const database = client.db(para.dbName);

        // 3. 选择集合 (Collection)
        const collection = database.collection(para.collection);

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