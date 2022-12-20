
import { env, cwd } from 'process'
import { Module } from "../types";
import { CONFIG, dumpConfig } from "./config";
import { readEntry } from "./files";
import { checkJson } from './utils';

const { log, logLevel } = require(env.LOG!);

// Init Modules
export async function initModules() {
    log(logLevel.INFO, "CORE-LOADER", "Loading Modules");

    const foundModules = await findModules();
    log(logLevel.DEBUG, "CORE-LOADER", "All modules found, loading modules");

    await loadModules(foundModules);
    log(logLevel.STATUS, "CORE-Loader", "All modules loaded, dumping config");

    dumpConfig();
}

async function loadModules(modules: Map<string, string[]>) {
    const loadedModules: string[] = [];
    while (loadedModules.length < modules.size) {
        for (let [moduleName, dependencies] of modules) {
            if (loadedModules.includes(moduleName)) continue;
            log(logLevel.DEBUG, "CORE-LOADER", `Checking Module: ${moduleName}`);
            if (dependencies) log(logLevel.DEBUG, "CORE-LOADER", `Module ${moduleName} has dependencies: ${dependencies}`);
            // TODO: Check if dependencies are loaded
            if (dependencies && !allDependenciesLoaded(loadedModules, dependencies)) {
                log(logLevel.DEBUG, "CORE-LOADER", `Module ${moduleName} has unmet dependencies, skipping`);
                continue;
            }

            try {
                // await fs.access(env[moduleName]!, fs.constants.R_OK);
                const module = await loadEntry(moduleName);
                log(logLevel.DEBUG, "CORE-LOADER", `Init Module ${moduleName}`);
                await module.init(moduleName);
            } catch (error: any) {
                log(logLevel.WARN, "CORE-LOADER", `Error loading module ${moduleName}`);
                if (error.cause === "NoEntryFile") {
                    log(logLevel.WARN, "CORE-LOADER", `Module entry file not found: ${env[moduleName]}`);
                } else {
                    log(logLevel.ERROR, "CORE-LOADER", error);
                }
                modules.delete(moduleName);
                continue;
            }

            log(logLevel.INFO, "CORE-LOADER", `Module ${moduleName} loaded`);
            loadedModules.push(moduleName);
        }
    }
}

function allDependenciesLoaded(loaded: string[], dependencies: string[], optional: boolean = false): boolean {
    // @ts-ignore ts(7030) - This is intentional
    return dependencies.every((dep) => (dep.startsWith("optional:") && optional && !loaded.includes(dep)) || loaded.includes(dep));
    // dependencies.forEach((dependency: string) => {
    //     if((dependency.startsWith("optional:") && optional && !loaded.includes(dependency)) || !loaded.includes(dependency))
    //         return false;
    // });
    // return true;
}

async function findModules(): Promise<Map<string, string[]>> {
    const foundModules: Map<string, string[]> = new Map();
    const modulesBase = env.MODULES || `${cwd()}${env.SEP}modules`
    const moduleDir = await readEntry(`${modulesBase}`);
    if (typeof moduleDir === 'string') throw new Error(`Module directory not found: ${modulesBase}`);
    await Promise.all(moduleDir
        .filter(dirent => dirent.isDirectory())
        .map(folder => folder.name)
        .map(async (module) => {
            // if(module === "logger") return;
            log(logLevel.DEBUG, "CORE-LOADER", `Found Module: ${module}`);
            const configfile = await readEntry(`${modulesBase}${env.SEP}${module}${env.SEP}config.json`);
            if (typeof configfile !== 'string') {
                console.log(typeof configfile);
                log(logLevel.WARN, "CORE-LOADER", `Module ${module} has no config file`);
                return;
            }
            if (!checkJson(configfile)) {
                log(logLevel.WARN, "CORE-LOADER", `Module ${module} has invalid config file`);
                return;
            }
            const moduleConfig = await JSON.parse(configfile);
            const moduleName = moduleConfig.name.toUpperCase();
            log(logLevel.DEBUG, "CORE-LOADER", `Module Name: ${moduleName}`);
            CONFIG("modules")[moduleName] ??= moduleConfig.config;
            // CONFIG().paths.modules.push(`${modulesBase}${env.SEP}${module}`);
            const modFile = moduleConfig.file ?? "actions";
            // Also, thinking here - replace process.env with a config access
            env[moduleName] = `${modulesBase}${env.SEP}${module}${env.SEP}${modFile}`;
            foundModules.set(moduleName, moduleConfig.dependencies);
            log(logLevel.INFO, "CORE-LOADER", `Found Module: ${moduleName}, version ${moduleConfig.version}`);
            log(logLevel.FINE, "CORE-LOADER", `desc: ${moduleConfig.description}`);
        }));
    return foundModules;
}

async function loadEntry(moduleName: string) {
    log(logLevel.DEBUG, "CORE-LOADER", `Access Module: ${moduleName}`);
    if (!env[moduleName]) throw new Error(`Module ${moduleName} not found`);
    const moduleDir = env[moduleName]!.split(env.SEP!).slice(0, -1).join(env.SEP!);
    let files = await readEntry(moduleDir);
    if (typeof files === 'string') throw new Error(`Module directory not found: ${moduleDir}`);
    files = files.filter(dirent => {
        if (!dirent.isFile()) return false;
        if (dirent.name.startsWith(env[moduleName]!.split(env.SEP!).pop()!)) return true;
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
            const mod = await import(env[module[0]]!);
            mod.start(module[1].start);
        } catch (error: any) {
            if (error.code === "MODULE_NOT_FOUND") {
                log(logLevel.WARN, "CORE", `Module ${module[0]} has no start file`);
            } else if (error.message === "mod.start is not a function") {
                log(logLevel.WARN, "CORE", `Module ${module[0]} has no start function`);
            } else {
                log(logLevel.WARN, "CORE-LOADER", `Cannot start module ${module[0]}`);
                log(logLevel.ERROR, "CORE-LOADER", error);
            }
        }
    });
}