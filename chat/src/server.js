const io = require('socket.io');
const { getIP, extractTime } = require("./utils");
const { normalLog } = require("./logger.js")
const { addMessage } = require("./message.js")
module.exports = class Server {

    /**
     *
     * @type {Node}
     */
    node = null

    /**
     *
     * @type {io.Server}
     */
    server = null

    sockets = {};

    /**
     *
     * @param {Number}port
     * @param {Node}node
     */
    constructor(port, node) {
        this.node = node;
        this.server = new io.Server(port);
        this.server.on('connection', (socket) => {
            this.onConnection(socket);
        })
    }

    /**
     * @param {io.Socket} socket
     */
    onConnection(socket) {
        socket.on("disconnect", () => {
            normalLog("Node: " + this.node.id + " disconnected from network.")
            if (this.node.disconnectIds.includes(this.sockets[socket.id])) {
                this.node.disconnectIds = this.node.disconnectIds.filter((id) => id !== this.sockets[socket.id])
                return;
            }
            if (this.node.client !== null) {
                this.node.client.repair({ to: 'http://' + getIP() + ":" + this.node.port, token: this.node.acceptToken })
            }
        });
        socket.on('hello', (message) => {
            if (message.id === this.node.id) {
                return;
            }
            this.sockets[socket.id] = message.id
            socket.emit('hello_back', { id: this.node.id, name: this.node.name, url: 'http://' + getIP() + ':' + this.node.port, leader: this.node.leader })
            if (this.node.client) {
                if (message.token === this.node.acceptToken) {
                    normalLog("The network has been repaired.")
                    if (this.node.leader === null && !this.node.election.initiator) {
                        normalLog('A new Node has joined the network.')
                        this.node.election.stateP = true;
                        this.node.election.id = this.node.id;
                        this.node.election.initiator = true;
                        this.node.client.prepare(this.node.id);
                    }
                    return;
                }
                if (this.node.client.clientId !== message.id) {
                    let msg = {
                        from: this.node.id,
                        to: message.url,
                        token: message.token
                    }
                    this.node.client.repair(msg)
                }
            } else {
                this.node.connect(message.url)
                normalLog('Start of election.')
                this.node.election.stateP = true;
                this.node.election.id = this.node.id;
                this.node.election.initiator = true;
                this.node.client.prepare(this.node.id);
            }
        })
        socket.on('wait', (id) => {
            normalLog("Node " + id + " is waiting.")
            this.node.disconnectIds.push(id)
        })
        socket.on('repair', (message) => {
            if (this.node.client === null || !this.node.client.client.connected) {
                this.node.connect(message.to, message.token);
            } else if (this.node.client.clientId === message.from) {
                this.node.client.wait(this.node.id);
                this.node.client.client.disconnect();
                this.node.client = null;
                this.node.connect(message.to, message.token)
            } else {
                this.node.client.repair(message)
            }
        })
        socket.on('message', (message) => {
            if (this.node.leader === this.node.id) {
                if (!message.approved) {
                    message.approved = true;
                    message.approvedTime = new Date().toISOString();
                    normalLog(`Message approved by Leader`)
                    console.log(message);
                    addMessage(message);
                    this.node.client.send(message);
                }
            } else {
                if (message.approved) {
                    console.log(message);
                }
                this.node.client.send(message);
            }

            if (!message.approved && message.from === this.node.id) {
                normalLog('Leader exit. Start election.')
                this.node.election.initiator = true;
                this.node.election.id = this.node.id;
                this.node.election.acnp = null;
                this.node.election.stateP = true;
                this.node.election.leaderId = null;
                this.node.leader = null;
                this.node.client.prepare(this.node.id, true);

                return;
            }
        })
        socket.on('prepare', ({ id, force }) => {
            if (this.node.election.leaderId === null || force) {
                if (this.node.election.id === id) {
                    normalLog("End of election.")
                    this.node.client.elected(this.node.id);
                }
                if (this.node.election.acnp === null) {
                    this.node.election.id = this.node.id;
                    this.node.election.acnp = id;
                    this.node.election.stateP = true;
                    this.node.election.leaderId = null;
                    this.node.leader = null;
                    normalLog(`Start of election. Initiator: ${id}`)
                }
                if (this.node.election.initiator) {
                    normalLog("Each node received the First message. The beginning of sending the Second message.")
                    this.node.client.elect(this.node.election.acnp);
                    return;
                }
                this.node.client.prepare((this.node.election.stateP) ? this.node.election.id : id);
                if (this.node.election.stateP) {
                    normalLog(`Node ${this.node.name}: ${this.node.election.id} is Passive now. Passing the message to the next Node: 
                        ${this.node.client.clientId}`)
                    this.node.election.acnp = id;
                }
            }
        })
        socket.on('exit', (id) => {
            this.node.client.repair({ to: 'http://' + getIP() + ":" + this.node.port, token: this.node.acceptToken });
        })
        socket.on('election', ({ id }) => {
            if (this.node.election.leaderId === null) {
                normalLog("Sending the Second message.")
                let acnp = this.node.election.acnp || this.node.election.id;
                this.node.election.q = id;
                if (this.node.election.stateP === true) {
                    normalLog("Start of data comparison.")
                    normalLog(this.node.election.acnp)
                    normalLog(this.node.election.id)
                    normalLog(this.node.election.q)
                    if ((extractTime(acnp) <= extractTime(this.node.election.id)) &&
                        (extractTime(acnp) <= extractTime(this.node.election.q))) {
                        this.node.election.id = acnp;
                    } else {
                        normalLog(`The comparison of data from the Second message is over. Now Node ${this.node.election.id} is Passive.`)
                        this.node.election.stateP = false;
                    }
                } else {
                    acnp = id;
                }
                if (this.node.election.initiator) {
                    normalLog("Node " + this.node.election.id + " is initiator")
                    if (!this.node.election.stateP) {
                        this.node.election.initiator = false;
                        normalLog(`Node ${this.node.election.id} is passive and is no longer the initiator. Continue election`)
                        if (this.node.election.leaderId === null) {
                            this.node.client.continue();
                        } else {
                            normalLog("The Leader has already been found.")
                        }
                    } else {
                        this.node.client.prepare(this.node.election.id);
                    }
                } else {
                    this.node.client.elect(acnp);
                }
            }
        })
        socket.on('continue', () => {
            if (this.node.election.leaderId === null) {
                normalLog("Continue election.")
                if (!this.node.election.stateP) {
                    this.node.client.continue();
                } else {
                    this.node.election.initiator = true;
                    normalLog("Start election")
                    this.node.client.prepare(this.node.election.id);
                }
            }
        })
        socket.on('elected', ({ id }) => {
            if (this.node.id !== id) {
                this.node.client.elected(id)
            }
            this.node.election.leaderId = id;
            this.node.leader = this.node.election.leaderId;
            this.node.election.acnp = null;
            this.node.election.id = null;
            this.node.election.q = null;
            this.node.election.stateP = false;
            normalLog("The Leader has been found. Leader ID: " + id);
        })
    }
}