import {MongoClient} from 'mongodb'

// 导出一个连接函数
async function connectMongoDB({connectionUrl, options = {
    maxPoolSize: 10, // 默认100
    minPoolSize: 2, // 根据并发量调整
    serverSelectionTimeoutMS: 5000, // 5秒后停止尝试连接
}}) {
    try {
        const client = new MongoClient(connectionUrl, options);
        // 实际建立连接，并初始化连接池
        await client.connect();
        console.log('MongoDB 连接池已初始化并连接成功：', connectionUrl);
        return client;
    } catch (error) {
        console.error('MongoDB 连接失败:', error);
        throw error;
    }
}

// 导出一个获取数据库实例的函数
function getDB(clientInstance, dbName) {
    if (!clientInstance) {
        throw new Error('未连接到 MongoDB，请先调用 connect()');
    }
    // 返回数据库实例，不需要每次都调用 client.db()
    if(dbName){
        return clientInstance.db(dbName);
    }else{
        return clientInstance.db();
    }
}

// 导出一个关闭连接的函数 (用于应用退出时)
async function closeConnection(clientInstance) {
    if (clientInstance) {
        await clientInstance.close();
        console.log('MongoDB 连接池已关闭');
        process.exit(0)
    }
}

export {
    connectMongoDB,
    getDB,
    closeConnection,
};
export default {
    connectMongoDB,
    getDB,
    closeConnection,
};