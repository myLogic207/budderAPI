import fs from "fs/promises";
import { env, cwd } from 'process'
import { Module } from "../types";
const { dumpConfig, CONFIG } = require(env.CONFIG ?? '');
const { log, logLevel } = require(env.LOG ?? '');

    // Init Modules
export async function initModules(){
    const foundmodules: Map<string, string[]> = new Map();
    const modulesBase = env.MODULES || `${cwd()}${env.SEP}modules`
    const moduleDir = await fs.readdir(`${modulesBase}`, { withFileTypes: true })
    
    moduleDir.filter(dirent => dirent.isDirectory())
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
        foundmodules.set(moduleName, moduleconfig.dependencies);
        log(logLevel.INFO, "CORE-LOADER", `Found Module: ${moduleName}, version ${moduleconfig.version}`);
        log(logLevel.FINE, "CORE-LOADER", `desc: ${moduleconfig.description}`);
    });
    // dumpConfig();
        
    const loadedModules:string[] = [];
    while(loadedModules.length !== foundmodules.keys.length){
        for (let [moduleName, dependencies] of foundmodules) {
            if(loadedModules.includes(moduleName)) continue;
            if(!loadedModules.every((loaded) => dependencies.includes(loaded))) continue;

            await fs.access(env[moduleName]!, fs.constants.R_OK).catch((err) => {
                log(logLevel.WARN, "CORE-LOADER", `Cannot access ${moduleName}'s entry file!`);
                log(logLevel.ERROR, "CORE-LOADER", err);
                foundmodules.delete(moduleName);   
            });
            
            const module = require(env[moduleName]!);
            await module.init(moduleName).catch((error: any) => {
                log(logLevel.WARN, "CORE-LOADER", `Failed to init Module ${moduleName}`);
                log(logLevel.ERROR, "CORE-LOADER", error);
                foundmodules.delete(moduleName);
            });

            log(logLevel.INFO, "CORE-LOADER", `Module ${moduleName} loaded`);
            loadedModules.push(moduleName);
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