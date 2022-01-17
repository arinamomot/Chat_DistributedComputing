const fs = require("fs");

const messages = [];

const addMessage = (message) => {
    messages.push(message)
}

const getMessages = () => {
    return messages;
}

const exportMessages = async(nodeName) => {
    const name = `messages_${nodeName}_${new Date().toISOString()}.txt`
    let messages = getMessages();
    if (messages.length === 0) return;
    messages.sort((a, b) => (new Date(a.time) > new Date(b.time)) ? 1 : -1)
    messages = messages.map(message => `Time: ${new Date(message.time).toUTCString()} - From ${message.name}: (${message.from}) - Text: ${message.text}`)
    messages = messages.join('\n')
    fs.writeFileSync(name, messages)
    console.log(`Messages exported to: ${name}`)
}

module.exports = { addMessage, getMessages, exportMessages }