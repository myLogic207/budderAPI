"use strict";

const fs = require("fs");
const { dumpConfig, CONFIG } = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.LOG);

module.exports = {
    // Init Modules
    initModules: async () => {
        const foundmodules = [];
        const modulesBase = process.env.MODULES || `${process.cwd()}${process.env.SEP}modules`
        fs.readdirSync(`${modulesBase}`, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .forEach((module) => {
            // if(module === "logger") return;
            log(logLevel.INFO, "CORE-LOADER", `Found Module: ${module}`);
            const moduleconfig = require(`${modulesBase}${process.env.SEP}${module}${process.env.SEP}config.json`);
            CONFIG().modules[moduleconfig.name.toUpperCase()] ??= moduleconfig.config;
            // CONFIG().paths.modules.push(`${modulesBase}${process.env.SEP}${module}`);
            const modFile = moduleconfig.file || "actions.js";
            // Also, thinking here - replace process.env with a config access
            process.env[moduleconfig.name.toUpperCase()] = `${modulesBase}${process.env.SEP}${module}${process.env.SEP}${modFile}`;
            foundmodules.push(moduleconfig.name.toUpperCase());
            log(logLevel.INFO, "CORE-LOADER", `Loaded Module: ${module.name}, version ${module.version}`);
            log(logLevel.FINE, "CORE-LOADER", `desc.: ${moduleconfig.description}`);
        });
        // dumpConfig();
            
        const loadedModules = [];
        while(loadedModules.length !== foundmodules.length){
            for (let i = 0; i < foundmodules.length; i++) {
                const module = require(process.env[foundmodules[i]]);
                if(loadedModules.includes(foundmodules[i])) continue;
                try {
                    await module.init(foundmodules[i]);
                    // process.env[modInit[0].name] = modInit[1];
                    loadedModules.push(foundmodules[i]);
                    log(logLevel.INFO, "CORE-Loader", `Module ${foundmodules[i]} loaded`);
                } catch (error) {
                    // if(error.message.startsWith("Missing module")){
                    //     log(logLevel.DEBUG, "CORE-Loader", `Module ${foundmodules[i]} error: ${error.message}`);
                    //     continue;
                    // }
                    log(logLevel.WARN, "CORE-Loader", `Failed to load Module ${foundmodules[i]}`);
                    throw error;
                }
            }
        }

        dumpConfig();
        log(logLevel.STATUS, "CORE-Loader", "All modules loaded and config dumped");
    },
    start: async () => {
        // Start Modules
        // const { CONFIG } = require(process.env.CONFIG);
        Object.entries(CONFIG("modules")).forEach(async ([module, config]) => {
            log(logLevel.INFO, "CORE", `Starting ${module} Module`);
            try {
                require(process.env[module]).start().catch((err) => {
                    throw err;
                });
            } catch (error) {
                if(error.message === "require(...).start is not a function"){
                    log(logLevel.WARN, "CORE", `Module ${module} has no start function`);
                } else {
                    log(logLevel.WARN, "CORE", `Error starting module ${module}`);
                    log(logLevel.ERROR, "CORE", error);
                }
            }
        });
    }
}