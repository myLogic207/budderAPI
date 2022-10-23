import fs from "fs/promises";
import { env, cwd } from 'process'
import { Module } from "../types";
import { CONFIG, dumpConfig } from "./config";

const { log, logLevel } = require(env.LOG!);

    // Init Modules
export async function initModules(){
    log(logLevel.INFO, "CORE-LOADER", "Loading Modules");
    
    const foundModules = await findModules();
    log(logLevel.DEBUG, "CORE-LOADER", "All modules found, loading modules");
    
    await loadModules(foundModules);
    log(logLevel.STATUS, "CORE-Loader", "All modules loaded, dumping config");
    
    await dumpConfig();
}

async function loadModules(modules: Map<string, string[]>) {
    const loadedModules:string[] = [];
    while(loadedModules.length < modules.size) {
        for (let [moduleName, dependencies] of modules) {
            if(loadedModules.includes(moduleName)) continue;
            if(!loadedModules.every((loaded) => loaded.split(':')[0] === "optional" ? dependencies.includes(loaded) : true)) continue;

            try {
                // await fs.access(env[moduleName]!, fs.constants.R_OK);
                const module = await loadEntry(moduleName);
                log(logLevel.DEBUG, "CORE-LOADER", `Init Module ${moduleName}`);
                await module.init(moduleName);
            } catch (error: any) {
                log(logLevel.WARN, "CORE-LOADER", `Error loading module ${moduleName}`);
                if(error.cause === "NoEntryFile") {
                    log(logLevel.WARN, "CORE-LOADER", `Module entry file not found: ${env[moduleName]}`);
                } else {
                    log(logLevel.ERROR, "CORE-LOADER", error);
                }
                modules.delete(moduleName);
            }

            log(logLevel.INFO, "CORE-LOADER", `Module ${moduleName} loaded`);
            loadedModules.push(moduleName);
        }
    }
}

async function findModules(): Promise<Map<string, string[]>> {
    const foundModules: Map<string, string[]> = new Map();
    const modulesBase = env.MODULES || `${cwd()}${env.SEP}modules`
    const moduleDir = await fs.readdir(`${modulesBase}`, { withFileTypes: true })
    await moduleDir.filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .forEach(async (module) => {
        // if(module === "logger") return;
        log(logLevel.DEBUG, "CORE-LOADER", `Found Module: ${module}`);
        const moduleconfig = require(`${modulesBase}${env.SEP}${module}${env.SEP}config.json`);
        const moduleName = moduleconfig.name.toUpperCase();
        log(logLevel.DEBUG, "CORE-LOADER", `Module Name: ${moduleName}`);
        CONFIG("modules")[moduleName] ??= moduleconfig.config;
        // CONFIG().paths.modules.push(`${modulesBase}${env.SEP}${module}`);
        const modFile = moduleconfig.file ?? "actions";
        // Also, thinking here - replace process.env with a config access
        env[moduleName] = `${modulesBase}${env.SEP}${module}${env.SEP}${modFile}`;
        foundModules.set(moduleName, moduleconfig.dependencies);
        log(logLevel.INFO, "CORE-LOADER", `Found Module: ${moduleName}, version ${moduleconfig.version}`);
        log(logLevel.FINE, "CORE-LOADER", `desc: ${moduleconfig.description}`);
    });
    return foundModules;
}

async function loadEntry(moduleName: string) {
    log(logLevel.DEBUG, "CORE-LOADER", `Access Module: ${moduleName}`);
    if(!env[moduleName]) throw new Error(`Module ${moduleName} not found`);
    let files = await fs.readdir(env[moduleName]!.split(env.SEP!).slice(0, -1).join(env.SEP!), { withFileTypes: true });
    files = files.filter(dirent => {
        if(!dirent.isFile()) return false;
        if(dirent.name.startsWith(env[moduleName]!.split(env.SEP!).pop()!)) return true;
        return false;
    });
    if (files.length === 0) {
        const err = new Error(`Module ${moduleName} has no entry file`);
        err.name = "ModuleError";
        err.cause = "NoEntryFile";
        throw err;
    }
    log(logLevel.DEBUG, "CORE-LOADER", `Found Module entry file: ${env[moduleName]}`);
    // return await require(env[moduleName]!);
    return await import(env[moduleName]!);
}

export async function start() {
    // Start Modules
    // const { CONFIG } = require(env.CONFIG);
    Object.entries(CONFIG("modules")).forEach(async (module: Module) => {
        log(logLevel.INFO, "CORE", `Starting Module ${module[0]}`);
        
        try {
            await require(env[module[0]]!).start(module[1].start).catch((error: any) => {
                throw error;
            });
        } catch (error: any) {
            if(error.code === "MODULE_NOT_FOUND"){
                log(logLevel.WARN, "CORE", `Module ${module[0]} has no entry file`);
            } else if(error.message === "require(...).start is not a function"){
                log(logLevel.WARN, "CORE", `Module ${module[0]} has no start function`);
            } else {
                log(logLevel.WARN, "CORE-LOADER", `Cannot start module ${module[0]}`);
                log(logLevel.ERROR, "CORE-LOADER", error);    
            }
        }
    });
}