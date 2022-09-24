"use strict";
require("dotenv").config();
const { platform } = require("process");
console.log(`[init] This platform is ${platform}`);
process.env.SEP = platform === "win32" ? "\\" : "/";

const app = require("express")();
const fs = require('fs');
const { removeFolder } = require("../UTIL/actions");
const { eLog, utilInit, logLevel, style } = require(process.env.UTILS);

// -------------------------------------------------------------------------------------------------------------------
// Begin function segments
// Logo Printing function
function printLogo() {
    const LOGO = `
 _               _     _            _    ____ ___ 
| |__  _   _  __| | __| | ___ _ __ / \\  |  _ \\_ _|
| '_ \\| | | |/ _\` |/ _\` |/ _ \\ '__/ _ \\ | |_) | | 
| |_) | |_| | (_| | (_| |  __/ | / ___ \\|  __/| | 
|_.__/ \\__,_|\\__,_|\\__,_|\\___|_|/_/   \\_\\_|  |___|
                                                      
`
    eLog("budder", "CORE", `Printing Logo...${style.BOLD}${LOGO}${style.END}`, true);
}

// Custom Routes function
function initCroutes(scope) {
    eLog(logLevel.INFO, "CORE", `${scope} initializing croutes`)
    let changed = false
    Object.keys(CONFIG.scopes).filter(key => CONFIG.scopes[key] && scope !== key).forEach(key => {
        try {
            fs.readdirSync(`./scopes/${scope}/croutes`).filter(file => file.startsWith(key)).forEach(file => {
                eLog(logLevel.INFO, "CORE", `${scope} found extra croutes for ${key}`);
                app.use(`/${scope.toLowerCase()}/${key.toLowerCase}`, require(`./scopes/${scope}/croutes/${file}`));
                changed = true
            })
        } catch (error) {
            eLog(logLevel.INFO, "CORE", `${scope} did not find extra routes for ${key}`);
        }
    });
    eLog(logLevel.INFO, "CORE", changed ? `${scope} croutes initialized` : `${scope} did not need any croutes`);
}

// Init Modules (instant Scopes ig)
async function initScope(scope) {
    return new Promise((resolve, reject) => {
        eLog(logLevel.INFO, "CORE", `${scope} found`)
        //app.use(`/${scope.toLowerCase()}`, require(`./scopes/${scope}/routes`));
        //eLog(logLevel.INFO, "CORE", `${scope} Routes found and loaded`);
        let init = require(`${process.cwd()}${process.env.SEP}scopes${process.env.SEP}${scope}${process.env.SEP}actions`).init(scope, app);
        init.then(() => {
            eLog(logLevel.DEBUG, "CORE", `${scope} initialized`);
            initCroutes(scope);
            eLog(logLevel.STATUS, "CORE", `${scope} Fully loaded!`);
            resolve();
        }).catch((error) => {
            eLog(logLevel.WARN, "CORE", `${scope} failed to initialize`);
            reject(error);
        });
    });
}

function clearWorkdir() {
    eLog(logLevel.INFO, "CORE", "Clearing tmp workdir");
    removeFolder(`${process.env.WORKDIR}${process.env.SEP}tmp`);
}

async function dumpConfig() {
    return new Promise((resolve, reject) => {
        eLog(logLevel.INFO, "CORE", `Dumping Config`);
        fs.writeFile(process.env.CONFIG, JSON.stringify(CONFIG, null, 4), (err) => {
            if (err) {
                eLog(logLevel.WARN, "CORE", `Failed to dump Config`);
                reject(err);
            };
            eLog(logLevel.STATUS, "CORE", `Config dumped`);
            resolve();
        });
    });
}

// -------------------------------------------------------------------------------------------------------------------
// Begin core

const startTime = new Date();

eLog(logLevel.INFO, "CORE", "Initializing Utils");
utilInit();
eLog(logLevel.DEBUG, "CORE", `budder started at ${startTime}`);
eLog(logLevel.INFO, "CORE", "Initializing BOT...");
printLogo();

eLog(logLevel.INFO, "CORE", "Loading Config");
const CONFIG = require(`${process.env.CONFIG}`);
eLog(logLevel.DEBUG, "CORE", "Clearing deployments");
CONFIG.scopes = [];
dumpConfig();

eLog(logLevel.INFO, "CORE", "Initializing UTILS...");

// Init Adress
eLog(logLevel.INFO, "CORE", "Initializing Address");
const botPort = process.env.APP_PORT || 2070;
eLog(logLevel.FINE, "CORE", `Registered Port: ${botPort}`);
const botHost = process.env.APP_HOST || "localhost";
eLog(logLevel.FINE, "CORE", `Registered Host: ${botHost}`);

// Init "Frontend"
eLog(logLevel.INFO, "CORE", "Initializing Frontend");
app.use(require("./frontend/client"))
eLog(logLevel.STATUS, "CORE", "Frontend loaded");

// Start Server
const server = app.listen(botPort, botHost, () => {
    eLog(logLevel.STATUS, "CORE", `Server running at http://${botHost}:${botPort}/`);
});

eLog(logLevel.INFO, "CORE", "Clearing working directory");
clearWorkdir();

// Init Scopes
// foreach scope, app.use the scope's router
const modules = []
for (const scope in CONFIG.modules) {
    eLog(logLevel.INFO, "CORE", `${scope} initializing`)
    if (process.env[scope.toUpperCase() + "_ENABLED"] && CONFIG.modules[scope]) {
        modules.push(initScope(scope))
    } else if (process.env[scope.toUpperCase() + "_ENABLED"] == null && CONFIG.modules[scope]) {
        eLog(logLevel.INFO, "CORE", `Custom scope ${scope} found`);
        modules.push(initScope(scope));
    } else {
        eLog(logLevel.WARN, "CORE", `${scope} not loaded`);
        eLog(logLevel.WARN, "CORE", `${scope} either not enabled or not found`);
    }
}

Promise.allSettled(modules).then((results) => {
    results.forEach((result) => {
        if (result.status == "rejected") {
            eLog(logLevel.WARN, "CORE", `Failed to load module with reason:`);
            eLog(logLevel.ERROR, "CORE", result.reason);
        }
    });
    eLog(logLevel.STATUS, "CORE", "All (other) Modules loaded");
    eLog(logLevel.INFO, "CORE", "Budder Completely loaded! Starting...");
    const startUpTime = new Date().getTime() - startTime.getTime();
    eLog(logLevel.INFO, "CORE", `BOT started in ${startUpTime}ms`);
});

// -------------------------------------------------------------------------------------------------------------------

module.exports = {
    CONFIG,
    serverShutdown: () => {
        eLog(logLevel.WARN, "CORE", "Shutting down Server");
        server.close();
        eLog(logLevel.STATUS, "CORE", "Server Connection Closed");
    },
    registerRoute: async (route, router) => {
        return new Promise((resolve, reject) => {
            try {
                eLog(logLevel.INFO, "CORE", `Registering Routes`);
                app.use(`/${route}`, router);
                resolve();
            } catch (error) {
                eLog(logLevel.WARN, "CORE", `Failed to register Routes`);
                reject(error);
            }
        })
    },
    unregisterModule: async (scope) => {
        return new Promise((resolve, reject) => {
            try {
                app._router.stack = app._router.stack.filter(r => r.name !== scope);
                eLog(logLevel.INFO, "CORE", `Unregistered Module`);
                resolve();
            } catch (error) {
                eLog(logLevel.WARN, "CORE", `Failed to unregister Module`);
                reject(error);
            }
        })
    },
    reloadConfig: async () => {
        return new Promise((resolve, reject) => {
            try {
                eLog(logLevel.INFO, "CORE", `Reloading Config`);
                delete require.cache[require.resolve(process.env.CONFIG)];
                CONFIG = require(process.env.CONFIG);
                resolve();
            } catch (error) {
                eLog(logLevel.WARN, "CORE", `Failed to reload Config`);
                reject(error);
            }
        })
    },
    dumpConfig: dumpConfig,
    /*
    updateConfig: async (newConfig) => {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, "CORE", `Updating Config`);            
            fs.writeFile(process.env.CONFIG, JSON.stringify(newConfig, null, 4), (err) => {
                if (err){
                    eLog(logLevel.ERROR, "CORE", `Failed to update Config`);
                    reject(err);
                };
                eLog(logLevel.INFO, "CORE", `Config updated`);
            }).then(() => {
                this.reloadConfig().then(() => {
                    eLog(logLevel.INFO, "CORE", `Config reloaded`);
                    resolve();
                }).catch((error) => {
                    eLog(logLevel.ERROR, "CORE", `Failed to update Config`);
                    reject(error);
                })
            })
        });
    }
    */
}