"use strict";

const { CONFIG } = require(process.env.CONFIG);

const { log, logLevel } = require(process.env.LOG);

let server;

module.exports = {
    init: async () => {
        log(logLevel.INFO, "WEBSERVER", `Initializing Webserver`);
        const Webserver = require("./bin/webserver");
        const fileconfig = require("./config.json");
        const app = new Webserver(CONFIG().modules[fileconfig.name] || fileconfig.config);
        server = await app.startServer();
        log(logLevel.STATUS, "WEBSERVER", `Webserver initialized`);
        return [fileconfig, __filename];
    },
    // so there is the option to start the webserver with an extra start instead
    // but tbh I think you should not use an extra start bc I might deprecate it (don't like the two calls)
    shutdown: async () => {
        return new Promise((resolve, reject) => {
            server.close(() => {
                log(logLevel.STATUS, "WEBSERVER", "Server closed");
                resolve();
            });
        });
    },
    addRouter: async (route, router) => {
        log(logLevel.INFO, "WEBSERVER", `Registering Routes`);
        return addRouter(route, router);
    },
    removeRouter: async (router) => {
        log(logLevel.INFO, "WEBSERVER", `Unregistering Routes`);
        return removeRouter(router);
    }
}