"use strict";

const { log, logLevel } = require(process.env.LOG);

module.exports = class Webserver {

    #server;
    #app = require("express")();
    #router = new Map();

    constructor(config) {
        log(logLevel.INFO, "WEBSERVER", "Initializing Address");
        this.botPort = config.port || 2070;
        log(logLevel.FINE, "WEBSERVER", `Registered Port: ${this.botPort}`);
        this.botHost = config.host || "localhost";
        log(logLevel.FINE, "DWEBSERVER", `Registered Host: ${this.botHost}`);
    
        this.#app.get('*', (req, res, next) => {
            res.send('I am alive!');
            next();
        });
        log(logLevel.DEBUG, "WEBSERVER", "Set default route");
    }

    async startServer() {
        this.#server = this.#app.listen(this.botPort, this.botHost, () => {
            log(logLevel.STATUS, "WEBSERVER", `Server running at http://${this.botHost}:${this.botPort}/`);
            return this.#server;
        });
    }

    async addRouter(route, router) {
        return new Promise((resolve, reject) => {
            try {
                log(logLevel.INFO, "WEBSERVER", `Registering Routes`);
                this.#app.use(`/${route}`, router);
                this.#router.set(route, router);
                resolve();
            } catch (error) {
                log(logLevel.WARN, "WEBSERVER", `Failed to register Routes`);
                reject(error);
            }
        })
    }

    async removeRouter(router){
        return new Promise((resolve, reject) => {
            try {
                this.#app._router.stack = this.#app._router.stack.filter(r => r.name !== router);
                this.#router.delete(router);
                log(logLevel.INFO, "WEBSERVER", `Unregistered Module`);
                resolve();
            } catch (error) {
                log(logLevel.WARN, "WEBSERVER", `Failed to unregister Module`);
                reject(error);
            }
        })
    }
};