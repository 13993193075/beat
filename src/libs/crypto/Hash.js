import crypto from 'src/libs/crypto/Crypto'

function md5(text){
    if(!text){
        return ''
    }
    return crypto.createHash('md5').update(text).digest('hex')
}

function sha1(text){
    if(!text){
        return ''
    }
    return crypto.createHash('sha1').update(text).digest('hex')
}

function sha256(text){
    if(!text){
        return ''
    }
    return crypto.createHash('sha256').update(text).digest('hex')
}

const beat = {
    md5,
    sha1,
    sha256
}
export default beat