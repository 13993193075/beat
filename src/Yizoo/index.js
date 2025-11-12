// 驿町管家智能门锁
// http://www.yizoo.net/

import axios from 'axios'

// 获取令牌
function openSmartLogin(para){
    // para.url 接口请求地址
    // para.accountName 登录账号
    // para.password 密码

    return new Promise((resolve, reject) => {
        axios.post(
            para.url,
            {
                method: 'openSmartLogin', // 接口方法
                data: {
                    accountName: para.accountName,
                    password: para.password
                }
            },
            {
                headers: {
                    'Content-Type': 'text/json;charset=utf-8',
                    'Content-Version': '1.0' // 接口版本，不填则默认获取1.0版本
                }
            }
        ).then(response=>{
            let msgId = response.data.msgId,
                resultCode = response.data.resultCode,
                reason = response.data.reason,
                method = response.data.method,
                data = response.data.data

            if (resultCode !== 0) {
                return resolve({code: 1, message: '获取 tokenid 失败：' + reason})
            }

            resolve({code: 0, message: '获取 tokenid 成功',
                data: {
                    tokenId: data.tokenId, // 令牌
                    expireTime: data.expireTime // 有效时长（单位：秒）
                }
            })
        }).catch(err=>{
            throw err
        })
    })
}

// 获取门锁信息
function openSmartRoomList(para){
    // para.requestUrl 接口请求地址
    // para.tokenId 访问令牌

    return new Promise((resolve, reject) => {
        let startNum = 0, // 开始下标，默认：0
            pageSize = 10, // 分页大小，默认：10
            pageSizeMax = 50 // 分页大小，最大：50

        // 第一次请求
        Request({
            url: para.requestUrl,
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'text/json;charset=utf-8',
                'Content-Version': '1.0' // 接口版本，不填则默认获取1.0版本
            },
            body: {
                method: 'openSmartRoomList', // 接口方法
                tokenId: para.tokenId,
                data: {
                    startNum,
                    pageSize: pageSizeMax
                }
            }
        }, function (error, response, body) {
            if (error) throw error

            let resultCode = body.resultCode,
                reason = body.reason,
                roomList = body.data.roomList, // 门锁信息
                listSum = body.listSum // 总记录数

            if (resultCode !== 0) {
                return resolve({code: 1, message: '获取门锁信息失败：' + reason})
            }

            let roomListAll = [], // 门锁信息转义、累加
                arrPromiseReq = []

            for (let i = 0; i < roomList.length; i++) {
                roomListAll.push({
                    roomName: roomList [i].roomName, // 房号
                    buildingCode: roomList [i].buildingCode, // 楼栋编码
                    floorCode: roomList [i].floorCode, // 楼层
                    roomCode: roomList [i].roomCode, // 房间编码
                    lockCode: roomList [i].lockCode, // 门锁编码
                    lockMac: roomList [i].lockMac, // 门锁Mac
                    aesKey: roomList [i].aesKey // 门锁AES128密钥
                })
            }

            //剩余请求次数
            let reqCount = Math.floor(listSum / pageSizeMax)
            reqCount = listSum % pageSizeMax > 0 ? reqCount + 1 : reqCount
            reqCount = reqCount > 0 ? reqCount - 1 : 0

            //继续发送请求
            for (let iReq = 0; iReq < reqCount; iReq++) {
                arrPromiseReq.push(new Promise((resolve0, reject0) => {
                    Request({
                        url: para.requestUrl,
                        method: 'POST',
                        json: true,
                        headers: {
                            'Content-Type': 'text/json;charset=utf-8',
                            'Content-Version': '1.0' // 接口版本，不填则默认获取1.0版本
                        },
                        body: {
                            method: 'openSmartRoomList', // 接口方法
                            tokenId: para.tokenId,
                            data: {
                                startNum: (iReq + 1) * pageSizeMax + 1,
                                pageSize: pageSizeMax
                            }
                        }
                    }, function (error, response, body) {
                        if (error) throw error

                        let resultCode = body.resultCode,
                            reason = body.reason,
                            roomList = body.data.roomList // 门锁信息

                        if (resultCode !== 0) {
                            return resolve({code: 1, message: '获取门锁信息失败：' + reason})
                        }

                        //门锁信息转义、累加
                        for (let i = 0; i < roomList.length; i++) {
                            roomListAll.push({
                                roomName: roomList [i].roomName, // 房号
                                buildingCode: roomList [i].buildingCode, // 楼栋编码
                                floorCode: roomList [i].floorCode, // 楼层
                                roomCode: roomList [i].roomCode, // 房间编码
                                lockCode: roomList [i].lockCode, // 门锁编码
                                lockMac: roomList [i].lockMac, // 门锁Mac
                                aesKey: roomList [i].aesKey // 门锁AES128密钥
                            })
                        }

                        resolve0()
                    })
                }))
            }

            Promise.all(arrPromiseReq).then(() => {
                resolve({code: 0, message: '获取门锁信息成功',
                    data: roomListAll
                })
            })
        })
    })
}

export {
    openSmartLogin,
    openSmartRoomList
}
export default {
    openSmartLogin,
    openSmartRoomList
}