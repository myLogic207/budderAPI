"use strict";

const { log, logLevel } = require(process.env.LOG);

let webServer;

module.exports = {
    init: async (name) => {
        log(logLevel.INFO, "WEBSERVER", `Initializing Webserver`);
        const { CONFIG } = require(process.env.CONFIG);
        const Webserver = require("./libs/webserver");
        webServer = new Webserver(CONFIG().modules[name]);
        await webServer.startServer();
        log(logLevel.STATUS, "WEBSERVER", `Webserver initialized`);
    },
    // so there is the option to start the webserver with an extra start instead
    // but tbh I think you should not use an extra start bc I might deprecate it (don't like the two calls)
    shutdown: async () => {
        log(logLevel.INFO, "WEBSERVER", `Shutting down Webserver`);
        return webServer.shutdown();
    },
    addRouter: async (route, router, routerName) => {
        log(logLevel.INFO, "WEBSERVER", `Registering Routes`);
        return webServer.addRouter(route, router, routerName);
    },
    removeRouter: async (router) => {
        log(logLevel.INFO, "WEBSERVER", `Unregister Router`);
        return webServer.removeRouter(router);
    }
}