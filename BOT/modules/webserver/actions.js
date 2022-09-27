"use strict";

const { CONFIG } = require(process.env.CONFIG);
const { startServer, addRouter } = require("./bin/webserver");

const { log, logLevel } = require(process.env.LOG);

let server;

module.exports = {
    init: async () => {
        log(logLevel.INFO, "DEPLOYCONTROL-WEB", `Initializing Webserver`);
        const fileconfig = require("./config.json");
        server = await startServer(CONFIG().modules[fileconfig.name] || fileconfig.config);
        log(logLevel.INFO, "DEPLOYCONTROL-WEB", `Webserver started`);
        
        app.get('*', (req, res, next) => {
            res.send('I am alive!');
            next();
        });
        log(logLevel.DEBUG, "DEPLOYCONTROL-WEB", "Set default route");
    },
    shutdown: async () => {
        return new Promise((resolve, reject) => {
            server.close(() => {
                log(logLevel.STATUS, "DEPLOYCONTROL", "Server closed");
                resolve();
            });
        });
    },
    addRouter: async (route, router) => {
        log(logLevel.INFO, "DEPLOYCONTROL-WEB", `Registering Routes`);
        return addRouter(route, router);
    },
    removeRouter: async (router) => {
        log(logLevel.INFO, "DEPLOYCONTROL-WEB", `Unregistering Routes`);
        return removeRouter(router);
    }
}