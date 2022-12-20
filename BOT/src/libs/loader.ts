import { env, cwd } from 'process'
import { Module } from "../types";
import { CONFIG, dumpConfig } from "./config";
import { checkEntry, readEntry } from "./files";

const { log, logLevel } = require(env.LOG!);

// Init Modules
export async function initModules() {
    log(logLevel.INFO, "CORE-LOADER", "Loading Modules");
    
    const foundModules = await findModules();
    log(logLevel.DEBUG, "CORE-LOADER", "All modules found, loading modules");
    
    const currentModules = CONFIG("modules") as { [key: string]: any };
    if (!compareDifferences(Object.keys(currentModules), Array.from(foundModules.keys()))) {
        log(logLevel.INFO, "CORE-LOADER", "Found changes in modules, resolving");
        const tmpConf = {...currentModules};
        for (let module of getDifference(Object.keys(currentModules), Array.from(foundModules.keys()))){
            delete tmpConf[module];
        }
        CONFIG("modules", tmpConf);
    }

    await loadModules(foundModules);
    log(logLevel.STATUS, "CORE-Loader", "All modules loaded, dumping config");

    dumpConfig();
}

function compareDifferences(curMods: (Module | string)[], foundMods: (Module | string)[]): boolean {
    curMods = [...curMods].sort();
    foundMods = [...foundMods].sort();
    if (curMods === foundMods) return true;
    if (curMods.length !== foundMods.length) return false;

    for (var i = 0; i < curMods.length; ++i) {
        if (curMods[i] !== foundMods[i]) return false;
    }

    log(logLevel.DEBUG, "CORE-LOADER", "Found no differences in modules");
    return true;
}

function getDifference(curMods: string[], foundMods: string[]): string[] {
    return [...curMods].filter((mod) => foundMods.includes(mod));

    // const oldMods = [...curMods];
    // const difference = oldMods.filter(x => !foundMods.includes(x));
    // log(logLevel.INFO, "CORE-LOADER", `Found ${difference.length} modules to remove`);
    // difference.forEach((mod) => {
    //     log(logLevel.INFO, "CORE-LOADER", `Removing Module ${mod}`);
    //     oldMods.filter((item: string) => item !== mod);
    // });
    // return newMods;
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
    const moduleBase = env.MODULES || `${cwd()}${env.SEP}modules`
    const moduleDir = await readEntry(`${moduleBase}`);
    if (typeof moduleDir === 'string') throw new Error(`Module directory not found: ${moduleBase}`);
    
    for (let module of moduleDir) {
        try {
            // TODO: Specific budder module files consisting of all required info (also zip?)
            if (!module.isDirectory()) throw new Error("Module has to be a directory");
            log(logLevel.INFO, "CORE-LOADER", `Found Module: ${module.name}`);
            let modBase = `${moduleBase}${env.SEP}${module.name}`;
            
            let modConf = await readModuleConfig(modBase).catch((error: any) => {
                log(logLevel.WARN, "CORE-LOADER", `Error reading module config`);
                log(logLevel.WARN, "CORE-LOADER", error);
            });
            if(!modConf) continue;

            CONFIG("modules")[modConf.name] ??= modConf.config;
            log(logLevel.DEBUG, "CORE-LOADER", `Added module ${module.name} to config`)
            
            // Also, thinking here - replace process.env with a config access
            // CONFIG().paths.modules.push(`${modulesBase}${env.SEP}${module}`);
            env[modConf.name] = `${modBase}${env.SEP}${modConf.file ?? "actions"}`;
            log(logLevel.INFO, "CORE-LOADER", "Added module to working environment")
            foundModules.set(modConf.name, modConf.dependencies ?? []);
            
            log(logLevel.INFO, "CORE-LOADER", `Found Module: ${modConf.name}, version ${modConf.version}`);
            log(logLevel.FINE, "CORE-LOADER", `desc: ${modConf.description}`);
        } catch (error) {
            log(logLevel.WARN, "CORE-LOADER", `Error evaluating module ${module.name ?? module}`);
            log(logLevel.ERROR, "CORE-LOADER", error);
        }
    }
    return foundModules;
}

const configRegex = /^(?:(default))?.?conf(ig)?(.json)?$/gmi
async function readModuleConfig(modulePath: string): Promise<Module> {
    let files = await readEntry(modulePath);
    if(typeof files === "string") throw new Error("Module directory not found");
    files = files.filter((item) => {
        return item.name.match(configRegex)
    });
    files.filter(item => { item.name.match(configRegex) })
    if (files.length === 0) throw new Error("No config file Found");
    if (files.length > 1) throw new Error("Multiple config files found");

    let modConf = await readEntry(`${modulePath}${env.SEP!}${files[0].name}`);
    if (Array.isArray(modConf)) throw new Error("Config folders are not supported (jet)")
    modConf = JSON.parse(modConf);
    return checkModConfig(modConf);
}

function checkModConfig(config: any): Module {
    if (!config.name) throw new Error("Module has no name")
    config.name = config.name.toUpperCase();
    if (!config.version) {
        log(logLevel.WARN, "CORE-LOADER", "Module has no version")
        config.version = "0.1-DEV"
    }
    return config as Module;
}

async function loadEntry(moduleName: string): Promise<any> {
    log(logLevel.DEBUG, "CORE-LOADER", `Access Module: ${moduleName}`);
    if (!env[moduleName]) throw new Error(`Module not found`);
    const moduleDir = env[moduleName]!.split(env.SEP!).slice(0, -1).join(env.SEP!);
    let files = await readEntry(moduleDir);
    if (!Array.isArray(files)) throw new Error(`Module directory not found: ${moduleDir}`);
    
    // Find possible entry file
    // files = files.filter(dirent => {
    //     if (!dirent.isFile()) return false;
    //     if (dirent.name.startsWith(env[moduleName]!.split(env.SEP!).pop()!)) return true;
    //     return false;
    // });
    if (await checkEntry(env[moduleName]!)) throw new Error(`Module has no entry file`);
    log(logLevel.DEBUG, "CORE-LOADER", `Found Module entry file: ${env[moduleName]}`);
    // return await require(env[moduleName]!);
    return await import(env[moduleName]!);
}

export async function start() {
    // Start Modules
    // const { CONFIG } = require(env.CONFIG);
    for (let module in CONFIG("modules")) {
        log(logLevel.INFO, "CORE", `Starting Module ${module}`);

        try {
            const mod = await loadEntry(env[module]!)
            await mod.start();
            log(logLevel.FINE, "CORE", `Module ${module} started`);
        } catch (error: any) {
            if (error.code === "MODULE_NOT_FOUND") {
                log(logLevel.WARN, "CORE", `Module ${module} has no start file`);
            } else if (error.message === "mod.start is not a function") {
                log(logLevel.WARN, "CORE", `Module ${module} has no start function`);
            } else {
                log(logLevel.WARN, "CORE-LOADER", `Cannot start module ${module}`);
                log(logLevel.ERROR, "CORE-LOADER", error);
            }
        }
    }
}
