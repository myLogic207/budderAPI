"use strict";

const { log, logLevel } = require(process.env.LOG);

module.exports = new class Webserver {

    #app = require("express")();

    constructor(config) {
        return new Promise((resolve, reject) => {
            log(logLevel.INFO, "DEPLOYCONTROL-WEB", "Initializing Address");
            const botPort = config.port || 2070;
            log(logLevel.FINE, "DEPLOYCONTROL-WEB", `Registered Port: ${botPort}`);
            const botHost = config.host || "localhost";
            log(logLevel.FINE, "DEPLOYCONTROL-WEB", `Registered Host: ${botHost}`);
        });
    }

    async startServer() {
        const server = app.listen(botPort, botHost, () => {
            log(logLevel.STATUS, "DEPLOYCONTROL-WEB", `Server running at http://${botHost}:${botPort}/`);
            return server;
        });
    }

    async addRouter(route, router) {
        return new Promise((resolve, reject) => {
            try {
                log(logLevel.INFO, "DEPLOYCONTROL-WEB", `Registering Routes`);
                app.use(`/${route}`, router);
                resolve();
            } catch (error) {
                log(logLevel.WARN, "DEPLOYCONTROL-WEB", `Failed to register Routes`);
                reject(error);
            }
        })
    }

    async removeRouter(router){
        return new Promise((resolve, reject) => {
            try {
                app._router.stack = app._router.stack.filter(r => r.name !== router);
                log(logLevel.INFO, "DEPLOYCONTROL", `Unregistered Module`);
                resolve();
            } catch (error) {
                log(logLevel.WARN, "DEPLOYCONTROL", `Failed to unregister Module`);
                reject(error);
            }
        })
    }
}();