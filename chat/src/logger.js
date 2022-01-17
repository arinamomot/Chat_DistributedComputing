const { Console } = require("console");
// get fs module for creating write streams
const fs = require("fs");

const logs = [];

const addLog = (log) => {
    logs.push(log);
}

const getLogs = () => {
    return logs.join('\n');
}

// make a new logger
const myLogger = new Console({
    stdout: fs.createWriteStream("normalLogs.txt"),
    stderr: fs.createWriteStream("errorLogs.txt"),
});

const normalLog = async(text) => {
    console.log(`${(new Date).toUTCString()} : LOG: ${text}`);
    addLog(`${(new Date).toUTCString()} : LOG: ${text}`);
    myLogger.log(`${(new Date).toUTCString()} : LOG: ${text}`);
}

const infoLog = async(text) => {
    console.info(`${(new Date).toLocaleString()} : INFO LOG: ${text}`)
    addLog(`${(new Date).toLocaleString()} : INFO LOG: ${text}`);
    myLogger.info(`${(new Date).toLocaleString()} : INFO LOG: ${text}`);
}

const errorLog = async(text) => {
    console.error(`${(new Date).toLocaleString()} : ERROR LOG: ${text}`)
    addLog(`${(new Date).toLocaleString()} : ERROR LOG: ${text}`);
    myLogger.error(`${(new Date).toLocaleString()} : ERROR LOG: ${text}`);
}

const exportLogs = async() => {
    const name = `logs_${new Date().toISOString()}.txt`
    let logs = getLogs();
    if (logs.length === 0) return;
    fs.writeFileSync(name, logs)
    console.log(`Logs exported to: ${name}`)
}

module.exports = { myLogger, normalLog, infoLog, errorLog, addLog, getLogs, exportLogs }