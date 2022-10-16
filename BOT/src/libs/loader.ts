import fs from "fs";
import { env, cwd } from 'process'
import { Module } from "../types";
const { dumpConfig, CONFIG } = require(env.CONFIG ?? '');
const { log, logLevel } = require(env.LOG ?? '');

    // Init Modules
export async function initModules(){
    const foundmodules:string[] = [];
    const modulesBase = env.MODULES || `${cwd()}${env.SEP}modules`
    fs.readdirSync(`${modulesBase}`, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .forEach((module) => {
        // if(module === "logger") return;
        log(logLevel.INFO, "CORE-LOADER", `Found Module: ${module}`);
        const moduleconfig = require(`${modulesBase}${env.SEP}${module}${env.SEP}config.json`);
        const moduleName = moduleconfig.name.toUpperCase();
        CONFIG().modules[moduleName] ??= moduleconfig.config;
        // CONFIG().paths.modules.push(`${modulesBase}${env.SEP}${module}`);
        const modFile = moduleconfig.file ?? "actions.js";
        // Also, thinking here - replace process.env with a config access
        env[moduleName] = `${modulesBase}${env.SEP}${module}${env.SEP}${modFile.replace(".js", "")}`;
        foundmodules.push(moduleName);
        log(logLevel.INFO, "CORE-LOADER", `Loaded Module: ${moduleName}, version ${moduleconfig.version}`);
        log(logLevel.FINE, "CORE-LOADER", `desc.: ${moduleconfig.description}`);
    });
    // dumpConfig();
        
    const loadedModules:string[] = [];
    while(loadedModules.length !== foundmodules.length){
        for (let i = 0; i < foundmodules.length; i++) {
            const moduleName = foundmodules[i];
            if(!env[moduleName]) continue;
            const module = require(env[moduleName]!);
            if(loadedModules.includes(moduleName)) continue;
            try {
                await module.init(moduleName);
                // process.env[modInit[0].name] = modInit[1];
                loadedModules.push(moduleName);
                log(logLevel.INFO, "CORE-Loader", `Module ${moduleName} loaded`);
            } catch (error) {
                // if(error.message.startsWith("Missing module")){
                //     log(logLevel.DEBUG, "CORE-Loader", `Module ${moduleName} error: ${error.message}`);
                //     continue;
                // }
                log(logLevel.WARN, "CORE-Loader", `Failed to load Module ${moduleName}`);
                throw error;
            }
        }
    }

    dumpConfig();
    log(logLevel.STATUS, "CORE-Loader", "All modules loaded and config dumped");
}

export async function start() {
    // Start Modules
    // const { CONFIG } = require(env.CONFIG);
    Object.entries(CONFIG("modules")).forEach(async (module: Module) => {
        log(logLevel.INFO, "CORE", `Starting ${module} Module`);
        try {
            require(env[module[0]] ?? '').start(module[1].start).catch((err: any) => {
                throw err;
            });
        } catch (error: any) {
            if(error.message === "require(...).start is not a function"){
                log(logLevel.WARN, "CORE", `Module ${module} has no start function`);
            } else {
                log(logLevel.WARN, "CORE", `Error starting module ${module}`);
                log(logLevel.ERROR, "CORE", error);
            }
        }
    });
}