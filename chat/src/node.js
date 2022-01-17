const Server = require('./server')
const { v1 } = require('uuid');
const Client = require('./client')
const { errorLog, normalLog, getLogs } = require("./logger.js")

class Node {
    id = null
    name = ""
        /**
         *
         * @type {Server}
         */
    server = null
        /**
         *
         * @type {Client}
         */
    client = null
        /**
         * Port where node listen for new connections
         */
    port = null
    acceptToken = null

    leader = null;

    disconnectIds = [];

    election = {
        initiator: false,
        id: null,
        leaderId: null,
        stateP: false,
        acnp: null,
        q: null
    }

    constructor() {
        this.id = v1()
    }

    /**
     * Function to connect to another node using websocket
     * @param url String
     * @param token
     */
    connect(url, token = v1()) {
        this.acceptToken = token
        this.client = new Client(url, this);
    }

    /**
     * Function to set Name
     * @param name String
     */
    setName(name) {
        this.name = name;
    }

    /**
     * Function to disconnect from new the network
     * @param flag Boolean - shows if disconnection occurred purposely or not
     */
    disconnect(flag) {
        if (flag) {
            normalLog(`I am disconnecting from the network. Node ${this.name}: ${this.id} left the network.`)
            this.client.exit(this.id);
        } else {
            errorLog(`NODE ${this.name}: ${this.id} COULDN'T CONNECT TO THIS NODE.`)
        }
        this.client.client.disconnect(flag);
        this.server.server.disconnectSockets();
        this.server.server.close();
        this.client = null;
    }

    /**
     * Function to listen for new connections on given port
     * @param port Number
     */
    listen(port) {
        this.port = port
        this.server = new Server(port, this)
        normalLog(`Node : ${this.id} listening on Port: ${port}`)
    }


    /**
     * Function for sending message to server node
     * @param message
     */
    sendMessage(message) {
        let msg = {
            text: message,
            from: this.id,
            name: this.name,
            time: new Date().toISOString()
        }
        if (this.client) {
            this.client.send(msg)
        }
    }

    offline() {
        this.client.client.close();
        this.client = null;
    }

    /**
     * Function for showing status of node
     */
    status() {
        return `ID: ${this.id}
Name: ${(this.name)}
Left: ${(this.client || {}).clientId }
State: ${this.election.stateP}
acnp: ${this.election.acnp}
Leader: ${this.leader}`
    }

    /**
     * Function for 
     */
    logs() {
        return getLogs();
    }
}

module.exports = Node