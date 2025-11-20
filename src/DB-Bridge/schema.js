// 数据类型一致性强制
// Data Type Consistency Enforcement

import {ObjectId} from 'mongodb'
import {unclassified as beanUnclass} from '@yoooloo42/bean'

/**
 * @return {null}
 */
function DTCE({data, TypeFromSchema, schema}){
    if(beanUnclass.deepClone.typeOfValue(data) === 'array'){
        let arr = []
        for (let i=0; i<data.length; i++) {
            arr.push(DTCE({data: data[i], TypeFromSchema, schema}))
        }
        return arr
    }

    if(beanUnclass.deepClone.typeOfValue(data) === 'object' && !(data instanceof ObjectId)){
        let obj = {}
        for (let i in data) {
            if (data.hasOwnProperty(i)) {
                // i 匹配表模型中的字段名
                if (Object.keys(schema).includes(i)) {

                    obj[i] = DTCE({data: data[i], TypeFromSchema: schema[i].type, schema})
                } else {
                    obj[i] = DTCE({data: data[i], TypeFromSchema, schema})
                }
            }
        }
        return Object.assign(data, obj)
    }

    if (data === null || data === undefined) {
        return null
    }

    if (TypeFromSchema === 'string') {
        return '' + data
    }

    if (TypeFromSchema === 'integer' || TypeFromSchema === 'long') {
        return parseInt('' + data)
    }
    if (TypeFromSchema === 'float' || TypeFromSchema === 'double') {
        return parseFloat('' + data)
    }
    if (TypeFromSchema === 'number') {
        return Number('' + data)
    }

    if (TypeFromSchema === 'date' || TypeFromSchema === 'time') {
        return new Date(new Date('' + data).toUTCString())
    }

    if (TypeFromSchema === 'boolean') {
        let bool = ('' + data).trim().toLowerCase()
        if (bool === 'true' || bool === '1') {
            return true
        }
        return false
    }

    if(data instanceof ObjectId){
        return data
    }

    if (TypeFromSchema === 'mongodb.id') {
        return new ObjectId('' + data)
    }

    return data
}

export {
    DTCE
}
export default {
    DTCE
}