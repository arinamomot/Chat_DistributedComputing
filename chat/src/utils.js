const os = require('os')
const time = require('uuid-time')

function getIP() {
    const ifaces = os.networkInterfaces()
    let address = '127.0.0.1'
    Object.keys(ifaces).forEach(dev => {
        ifaces[dev].filter((details) => {
            if (details.family === 'IPv4' && details.internal === false) {
                address = details.address
            }
        })
    })
    return address
}

function extractTime(uuid) {
    return time.v1(uuid)
}

module.exports = { getIP, extractTime }