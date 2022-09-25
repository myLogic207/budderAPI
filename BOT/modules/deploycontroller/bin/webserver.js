"use strict";

const { eLog, logLevel } = require(process.env.LOG);

const app = require("express")();

function startWebserver() {
    return new Promise((resolve, reject) => {
        eLog(logLevel.INFO, "DEPLOYCONTROL-WEB", "Initializing Address");
        const botPort = process.env.APP_PORT || 2070;
        eLog(logLevel.FINE, "DEPLOYCONTROL-WEB", `Registered Port: ${botPort}`);
        const botHost = process.env.APP_HOST || "localhost";
        eLog(logLevel.FINE, "DEPLOYCONTROL-WEB", `Registered Host: ${botHost}`);
        
        // Start Server
        const server = app.listen(botPort, botHost, () => {
            eLog(logLevel.STATUS, "DEPLOYCONTROL-WEB", `Server running at http://${botHost}:${botPort}/`);
            resolve(server);
        });
    });
}

let server;

module.exports = {
    init: async () => {
        eLog(logLevel.INFO, "DEPLOYCONTROL-WEB", `Initializing Webserver`);
        startWebserver().then((serv) => {
            eLog(logLevel.INFO, "DEPLOYCONTROL-WEB", `Webserver started`);
            server = serv;
            eLog(logLevel.DEBUG, "DEPLOYCONTROL-WEB", "Setting default route");
            app.get('*', (req, res, next) => {
                res.send('I am alive!');
                next();
            });
        }).catch((err) => {
            eLog(logLevel.WARN, "DEPLOYCONTROL-WEB", `Error starting Webserver`);
            throw err;
        });
    },
    addRouter: async (route, router) => {
        return new Promise((resolve, reject) => {
            try {
                eLog(logLevel.INFO, "DEPLOYCONTROL-WEB", `Registering Routes`);
                app.use(`/${route}`, router);
                resolve();
            } catch (error) {
                eLog(logLevel.WARN, "DEPLOYCONTROL-WEB", `Failed to register Routes`);
                reject(error);
            }
        })
    },
    shutdown: async () => {
        return new Promise((resolve, reject) => {
            server.close(() => {
                eLog(logLevel.STATUS, "DEPLOYCONTROL", "Server closed");
                resolve();
            });
        });
    },
    removeRouter: async (router) => {
        return new Promise((resolve, reject) => {
            try {
                app._router.stack = app._router.stack.filter(r => r.name !== router);
                eLog(logLevel.INFO, "DEPLOYCONTROL", `Unregistered Module`);
                resolve();
            } catch (error) {
                eLog(logLevel.WARN, "DEPLOYCONTROL", `Failed to unregister Module`);
                reject(error);
            }
        })
    }
};