import fs from "fs/promises";
import { Config, Module, ValueOf } from '../types';

let CONFIGURATION: Config;

const configHandler = {
    ownKeys(target: Config) {
        return Object.keys(target).filter((key) => {
            return key !== ".boot"; 
        });
    },
    deleteProperty(_: Config, prop: string) {
        console.warn(`Cannot delete property ${prop} from config`, "CONFIGERROR");
        return false;
    },
    get: (target: Config, prop: keyof Config): ValueOf<Config> => {
        if(prop in target) {
            if(prop === ".boot") {
                console.warn("Try to access boot config", "CONFIGERROR");
                return target[".boot"] ?? null;
            }
            return target[prop];
        }
        return undefined;
    },
    /*
     * TODO: #22 Add checks to write to config
     */
    set: (target: Config, prop: keyof Config, value: ValueOf<Config>): boolean => {
        if(prop in target) {
            target[prop] = value;
            return true; 
        }
        return false;
    },
}
let configfile: string;

export async function initConfig(file: string) {
    try {
        let tmpConf = await readConfig(file);
        tmpConf = checkConfig(tmpConf);
        CONFIGURATION = new Proxy(tmpConf, configHandler);
    } catch (error) {
        throw new Error(`Failed to init config: ${error}`);
    }
    configfile = file;
    process.env.CONFIG = __filename;
    await dumpConfig();
    console.info("Config handler loaded", "CONFIGFINE");
}

/*
 * TODO: #22 There has to be a better way then just overwriting the config
 */
function checkConfig(config: any): Config {
    if(!config.scopes) config.scopes = [];
    else {
        for (let scope of config.scopes) {
            scope.active = false;
        }
    }
    if(!config.modules) config.modules = {};
    else {
        if(typeof config.modules !== "object") config.modules = {};
        else for (let module of Object.values(config.modules)) {
            let cMod = checkModule(module) as Module;
            config.modules[cMod.name] = cMod;
        }
    }
    if(!config.logging) config.logging = {
        logger: "default",
        logLevel: "INFO"
    };
    return config;
}

function checkModule(module: any): Module {
    if(!module.name) module.name = "unknown";
    else { module.name = module.name.toString().trim().toUpperCase(); }
    if(!module.version) module.version = "unknown";
    if(!module.dependencies) module.dependencies = [];
    if(!module.config) module.config = {};
    return module;
}

function newConfig(): Config {
    return {
        scopes: [],
        modules: {},
        logging: {
            logger: "default",
            logLevel: "INFO"
        }
    };
}

async function readConfig(configfile: string): Promise<Config> {
    let file;
    try {
        file = await fs.open(configfile);
        const data = await file!.readFile("utf-8");
        return validateSyntax(data!.toString());
    } catch (error: any) {
        if(error.code === "ENOENT"){
            console.warn("Config file not found", "CONFIGWARN");
            return newConfig();
        } else {
            console.error(`Failed to open config file ${configfile}`, "CONFIGERROR");
            throw error;
        }
    } finally {
        await file?.close();
    }
}

function validateSyntax(config: string): Config {
    try {
        return JSON.parse(config) as Config;
    } catch (error) {
        console.warn("Config file is not valid (JSON)", "CONFIGWARN");
        return newConfig();
    }
}

export function CONFIG(prop?: keyof Config, value?: any): Config | ValueOf<Config> | boolean | undefined {
    if (!prop) return { ...CONFIGURATION };
    if(!value) return CONFIGURATION[prop];  
    return (CONFIGURATION[prop] = value);
}

export async function reloadConfig() {
    const data = await fs.readFile(configfile).catch((err) => {
        console.error("Failed to reload config file", "CONFIGERROR");
        throw err;
    } 
    );
    CONFIGURATION = JSON.parse(data.toString('utf8', 0, data.length));
    console.info("Config reloaded", "CONFIGFINE");
}

export async function dumpConfig() {
    try {
        const config = checkConfig({...CONFIGURATION});
        await fs.writeFile(configfile, JSON.stringify(config, null , 4));
        console.info("Config dumped", "CONFIGFINE");
    } catch (error) {
        console.error("Failed to dump config", "CONFIGERROR");
        throw error;        
    }
}
