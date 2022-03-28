module.exports = {
    logMessage : function (msg) {
        console.log(`SEVERITY: ${msg[0]}, SCOPE: ${msg[1]}, MESSAGE: ${msg[2]}`);
    }
}