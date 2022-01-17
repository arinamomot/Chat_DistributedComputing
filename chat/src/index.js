const Node = require("./node")
const { exportMessages, getMessages } = require('./message')
const { getListenPort, getCommand, getMessage, getUrl, getName } = require('./cli')
const { getLogs, errorLog, infoLog, exportLogs } = require('./logger')

let node = new Node();
let isNamed = false;

if (process.env.LISTEN_PORT) {
    node.listen(parseInt(process.env.LISTEN_PORT))
}

async function main() {

    if (node.name === '' && !isNamed) {
        let name = await getName()
        if (name === '') return main()
        node.setName(name)
        isNamed = true;
    }

    let command = await getCommand()

    if (command === 'listen') {
        let port = await getListenPort()
        node.listen(port)
    }

    if (command === 'name') {
        let name = await getName()
        node.setName(name)
    }

    if (command === 'message') {
        let message = await getMessage();
        if (message === '') return main();
        node.sendMessage(message);
    }

    if (command === 'messages') {
        let messages = getMessages();
        if (messages.length === 0) {
            infoLog("There are no messages.")
            return main();
        }
        console.log(getMessages())
    }

    if (command === 'export messages') {
        let messages = getMessages();
        if (messages.length === 0) {
            infoLog("There are no messages.")
            return main();
        }
        await exportMessages(node.name);
    }

    if (command === 'status') {
        console.log(node.status());
    }

    if (command === 'connect') {
        if (node.client != null) {
            errorLog(`NODE: ${node.id} IS ALREADY CONNECTED.`)
            return main();
        }
        let url = await getUrl()
        node.connect(url)
    }

    if (command === 'exit') {
        node.disconnect(true);
        node = new Node();
        if (process.env.LISTEN_PORT) {
            node.listen(parseInt(process.env.LISTEN_PORT))
        }
    }

    if (command === 'logs') {
        let logs = getLogs();
        if (logs.length === 0) {
            infoLog("There are no logs.")
            return main();
        }
        console.log(logs)
    }

    if (command === 'export logs') {
        let logs = getLogs();
        if (logs.length === 0) {
            infoLog("There are no logs.")
            return main();
        }
        await exportLogs();
    }

    // end
    return main()
}

main()