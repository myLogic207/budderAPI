"use strict";

const fs = require("fs");
const { dumpConfig, CONFIG } = require(process.env.CONFIG);
const { eLog, logLevel } = require(process.env.LOG);

module.exports = {
    // Init Modules
    initModules: async () => {
        const modules = []
        fs.readdirSync(`${process.cwd()}${process.env.SEP}modules`, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .forEach(module => {
                if(module === "logger") return;
                log(logLevel.INFO, "CORE-Loader", `Loading Module ${module}`);
                modules.push(require(`${process.cwd()}${process.env.SEP}modules${process.env.SEP}${module}${process.env.SEP}actions`).init());
            });

        await Promise.allSettled(modules).then((results) => {
            results.forEach((result) => {
                if (result.status == "rejected") {
                    log(logLevel.WARN, "CORE-Loader", `Error loading module`);
                    log(logLevel.ERROR, "CORE-Loader", result.reason);
                } else {
                    log(logLevel.INFO, "CORE-Loader", `Module ${result.value[0].name} loaded`);
                    process.env[result.value[0].name] = result.value[1];
                    CONFIG().modules.push(result.value[0]);
                }
            });
            dumpConfig();
            log(logLevel.STATUS, "CORE-Loader", "All modules loaded and config dumped");
        });
    },
    start: async () => {
        // Start Modules
        // const { CONFIG } = require(process.env.CONFIG);
        CONFIG().modules.forEach(module => {
            log(logLevel.INFO, "CORE", `Starting ${module.name} Module`);
            try {
                require(process.env[module.name.toUpperCase()]).start().catch((err) => {
                    throw err;
                });
            } catch (error) {
                if(error.message === "require(...).start is not a function"){
                    log(logLevel.WARN, "CORE", `Module ${module.name} has no start function`);
                } else {
                    log(logLevel.WARN, "CORE", `Error starting module ${module.name}`);
                    log(logLevel.ERROR, "CORE", error);
                }
            }
        });
    }
}