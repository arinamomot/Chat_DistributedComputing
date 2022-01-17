const prompt = require('prompt')
prompt.start()

const getListenPort = () => new Promise(((resolve, reject) => {
    prompt.get({ name: 'port', type: 'number' }, function(err, result) {
        if (err) {
            console.log(err)
            return
        }
        resolve(result.port)
    })
}))
const getName = () => new Promise(((resolve, reject) => {
    prompt.get({ name: 'name' }, function(err, result) {
        if (err) reject(err)
        resolve(result.name)
    })
}))
const getCommand = () => new Promise(((resolve, reject) => {
    prompt.get({ name: 'command' }, function(err, result) {
        if (err) reject(err)
        resolve(result.command)
    })
}))
const getUrl = () => new Promise(((resolve, reject) => {
    prompt.get({ name: 'url' }, function(err, result) {
        if (err) reject(err)
        resolve(result.url)
    })
}))
const getMessage = () => new Promise(((resolve, reject) => {
    prompt.get({ name: 'message' }, function(err, result) {
        if (err) reject(err)
        resolve(result.message)
    })
}))


module.exports = { getListenPort, getCommand, getMessage, getUrl, getName }