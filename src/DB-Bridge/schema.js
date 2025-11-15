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
        for (let i in data) {
            arr.push(DTCE({data: i, TypeFromSchema: TypeFromSchema ? TypeFromSchema : null, schema}))
        }
        return arr
    }

    if(beanUnclass.deepClone.typeOfValue(data) === 'object'){
        let obj = {}
        for (let i in obj) {
            if (Object.keys(schema).includes(i)) {
                // i 匹配表模型中的字段名
                obj[i] = DTCE({data: i, TypeFromSchema: schema[i].type, schema})
            } else {
                obj[i] = DTCE({data: i, TypeFromSchema: TypeFromSchema ? TypeFromSchema : null, schema})
            }
        }
        return obj
    }

    if (data === undefined) {
        return null
    }

    if (TypeFromSchema === 'mongodb.id') {
        return new ObjectId('' + data)
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

    return data
}

export {
    DTCE
}
export default {
    DTCE
}