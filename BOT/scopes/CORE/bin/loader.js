"use strict";

const fs = require("fs");
const { dumpConfig, CONFIG } = require(process.env.CONFIG);
const { log, logLevel } = require(process.env.LOG);

module.exports = {
    // Init Modules
    initModules: async () => {
        const modulesBase = process.env.MODULES || `${process.cwd()}${process.env.SEP}modules`
        fs.readdirSync(`${modulesBase}`, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .forEach((module) => {
            // if(module === "logger") return;
            log(logLevel.INFO, "CORE-LOADER", `Found Module: ${module}`);
            const moduleconfig = require(`${modulesBase}${process.env.SEP}${module}${process.env.SEP}config.json`);
            CONFIG().modules[moduleconfig.name] ??= moduleconfig.config;
            const modFile = moduleconfig.file || "actions.js";
            process.env[moduleconfig.name.toUpperCase()] = `${modulesBase}${process.env.SEP}${module}${process.env.SEP}${modFile}`;
        });
        // dumpConfig();
        /*   
            .forEach(module => {
                log(logLevel.INFO, "CORE-Loader", `Loading Module ${module}`);
                const mod_path = `${process.env.SEP}modules${process.env.SEP}${module}${process.env.SEP}`;
                const mod_conf = require(`${process.cwd()}${mod_path}config.json`);
                // register module name and path to file HERE as process env best case :)
                process.env[mod_conf.name] = `${process.cwd()}${mod_path}${mod_conf.file ?? 'actions'}`;
                // Also, thinking here - replace process.env with a config access
                // CONFIG().paths.modules = mod_path;
                foundmodules.push(mod_conf.name);
            });
        */
            
        const loadedModules = [];
        while(loadedModules.length !== foundmodules.length){
            for (let i = 0; i < foundmodules.length; i++) {
                const module = require(process.env[foundmodules[i]]);
                if(loadedModules.includes(foundmodules[i])) continue;
                try {
                    const modInit = await module.init();
                    // process.env[modInit[0].name] = modInit[1];
                    CONFIG().modules.push({[modInit[0].name]: modInit[0]});
                    loadedModules.push(foundmodules[i]);
                    log(logLevel.INFO, "CORE-Loader", `Module ${modInit[0].name} loaded`);
                } catch (error) {
                    if(error.message.startsWith("Missing module")){
                        log(logLevel.DEBUG, "CORE-Loader", `Module ${foundmodules[i]} error: ${error.message}`);
                        continue;
                    }
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