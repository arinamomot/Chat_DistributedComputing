const io = require('socket.io-client')
const { getIP } = require("./utils");
const { errorLog, normalLog } = require("./logger.js")

module.exports = class Client {
    /**
     * @type {Socket}
     */
    client = null;

    /**
     * @type {Node}
     */
    node = null;
    clientId = null;
    clientName = '';
    clientUrl = null;

    constructor(url, node) {
        this.node = node;
        this.client = io(url, { reconnection: false })
        this.client.on('connect_error', (error) => {
            this.node.disconnect(false);
        });
        this.client.on('connect', () => this.onConnect(this.client))
        this.client.on('disconnect', (flag) => this.onDisconnect(flag))
    }

    onConnect(client) {
        client.emit('hello', {
            id: this.node.id,
            url: 'http://' + getIP() + ':' + this.node.port,
            token: this.node.acceptToken
        })
        client.on('hello_back', (message) => {
            this.clientUrl = message.url;
            this.clientId = message.id;
            this.clientName = message.name;
            this.node.leader = message.leader;
            normalLog(`Node ${this.node.name}:  ${this.node.id} connected to Node: ${this.clientId}`);
        })
    }

    onDisconnect(flag) {
        if (!flag) errorLog("NODE: " + this.node.id + " DISCONNECTED.");
        this.node.offline();
    }


    wait(id) {
        this.client.emit('wait', id)
    }

    send(message) {
        this.client.emit('message', message)
    }

    prepare(id, force = false) {
        this.client.emit('prepare', { id, force });
    }

    elect(id) {
        this.client.emit('election', { id })
    }

    continue () {
        this.client.emit('continue');
    }

    exit(id) {
        this.client.emit('exit', id);
    }

    elected(id) {
        this.client.emit('elected', { id });
    }

    repair(message) {
        this.client.emit('repair', message)
    }
}