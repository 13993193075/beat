// 飞鹅票据打印机

import http from 'http'
import qs from 'querystring'
import Hash from './crypto/Hash.js'
const host = 'api.feieyun.cn',
    port = '80',
    path = '/Api/Open/'

// 添加打印机（支持批量）
function Open_printerAddlist (para) {
    // para.user
    // para.ukey
    // para.snList 打印机列表

    // ---------- 参数 snList 示例 ----------
    // 格式说明：打印机编号(必填)#打印机识别码(必填)#备注名称(选填)#流量卡号码(选填)，多台打印机请换行（\n），每次最多100行(台)
    // var snList = "sn1#key1#note1#carnum1\nsn2#key2#note2#carnum2"
    // addprinter ( snList ) ;

    // ---------- 返回值示例 ----------
    // 正确的例子：{"msg":"ok","ret":0,"data":{"ok":["sn#key#note#carnum","316500011#abcdefgh#快餐前台"],"no":["316500012#abcdefgh#快餐前台#13688889999
    // （错误：识别码不正确）"]},"serverExecutedTime":3} 错误：{"msg":"参数错误 : 该帐号未注册.","ret":-2,"data":null,"serverExecutedTime":37}

    return new Promise(function (resolve, reject) {
        let stime = Math.floor(new Date().getTime() / 1000) //时间戳
        let sig = Hash.sha1(para.user + para.ukey + stime) //签名

        let post_data = {
            user: para.user,
            stime,
            sig,
            apiname: 'Open_printerAddlist',
            printerContent: para.snList
        }
        let content = qs.stringify(post_data)
        let options = {
            hostname: host,
            port,
            path,
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }

        //发起请求
        let req = http.request(options, function (res) {
            res.setEncoding('utf-8')
            res.on('data', function (response) {
                let response0 = JSON.parse(response)

                if (response0.msg === 'ok' || response0.ret === 0) {
                    resolve({code: 0, message: '增加打印机成功'})
                } else {
                    resolve({code: 1, message: '增加打印机失败：' + response0.msg})
                }
            })
        })
        req.on('error', function (err) {
            resolve({code: 1, message: '请求失败：' + err})
        })
        req.write(content)
        req.end()
    })
}

// 打印
function Open_printMsg(para){
    // para.user
    // para.ukey
    // para.sn 打印机编号（9 位数字）
    // para.note 打印机备注名称
    // para.orderInfo 打印内容

    // 提示：调用打印接口之前，必须登录后台在该账号下添加打印机，或者通过 API 接口，把打印机添加到该账号下面

    // ---------- 返回值示例 ----------
    // 正确的例子：{"msg":"ok","ret":0,"data":"xxxx_xxxx_xxxxxxxxx","serverExecutedTime":6}
    // 错误：{"msg":"错误信息.","ret":非零错误码,"data":null,"serverExecutedTime":5}

    /*
        标签说明：
        单标签:
        "<BR>"为换行,"<CUT>"为切刀指令(主动切纸,仅限切刀打印机使用才有效果)
        "<LOGO>"为打印LOGO指令(前提是预先在机器内置LOGO图片),"<PLUGIN>"为钱箱或者外置音响指令
        成对标签：
        "<CB></CB>"为居中放大一倍,"<B></B>"为放大一倍,"<C></C>"为居中,<L></L>字体变高一倍
        <W></W>字体变宽一倍,"<QR></QR>"为二维码,"<BOLD></BOLD>"为字体加粗,"<RIGHT></RIGHT>"为右对齐

        拼凑订单内容时，可参考下面的示例
        根据打印纸张的宽度，自行调整内容的格式，可参考下面的示例
        var orderInfo ;
        orderInfo = "<CB>测试打印</CB><BR>" ; //标题字体如需居中放大,就需要用标签套上
        orderInfo += "名称　　　　　 单价  数量 金额<BR>" ;
        orderInfo += "--------------------------------<BR>" ;
        orderInfo += "番　　　　　　 1.0    1   1.0<BR>" ;
        orderInfo += "番茄　　　　　 10.0   10  10.0<BR>" ;
        orderInfo += "番茄炒　　　　 10.0   100 100.0<BR>" ;
        orderInfo += "番茄炒粉　　　 100.0  100 100.0<BR>" ;
        orderInfo += "番茄炒粉粉　　 1000.0 1   100.0<BR>" ;
        orderInfo += "番茄炒粉粉粉粉 100.0  100 100.0<BR>" ;
        orderInfo += "番茄炒粉粉粉粉 15.0   1   15.0<BR>" ;
        orderInfo += "备注：快点送到xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx<BR>" ;
        orderInfo += "--------------------------------<BR>" ;
        orderInfo += "合计：xx.0元<BR>" ;
        orderInfo += "送货地点：xxxxxxxxxxxxxxxxx<BR>" ;
        orderInfo += "联系电话：138000000000<BR>" ;
        orderInfo += "订餐时间：2011-01-06 19:30:10<BR><BR>" ;
        orderInfo += "----------请扫描二维码----------" ;
        orderInfo += "<QR>http://www.dzist.com</QR>" ; //把二维码字符串用标签套上即可自动生成二维码
    */

    return new Promise(function (resolve, reject) {
        let stime = Math.floor(new Date().getTime() / 1000) //时间戳
        let sig = Hash.sha1(para.user + para.ukey + stime) //签名

        let post_data = {
            user: para.user,
            stime,
            sig,
            apiname: 'Open_printMsg',
            sn: para.sn,
            content: para.orderInfo,
            times: '1' //打印联数,默认为1
        }
        let content = qs.stringify(post_data)
        let options = {
            hostname: host,
            port,
            path,
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }

        let req = http.request(options, function (res) {
            res.setEncoding('utf-8')
            res.on('data', function (response) {
                let response0 = JSON.parse(response)

                if (response0.msg === 'ok' || response0.ret === 0) {
                    resolve({
                        code: 0,
                        message: para.sn + ' ' + para.note + ' 打印成功'
                    })
                } else {
                    resolve({
                        code: 1,
                        message: para.sn + ' ' + para.note + ' 打印失败：' + response0.msg
                    })
                }
            })
        })
        req.on('error', function (err) {
            resolve({
                code: 1,
                message: para.sn + ' ' + para.note + ' 请求失败：' + err
            })
        })
        req.write(content)
        req.end()
    })
}

export default {
    Open_printerAddlist,
    Open_printMsg
}