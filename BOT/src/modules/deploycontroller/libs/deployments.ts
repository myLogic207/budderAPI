import { DeployScanner } from "../types";
import { Route } from '../../webserver/types';
import { Scope, ScopeConfig } from "../../../types";

import { env } from "process";
import { getState, isMarkerFile, setState, State } from "./stateControl";
import { Methods } from '../../webserver/libs/methods';

const { log, logLevel } = require(env.LOG!);
const { CONFIG, dumpConfig } = require(env.CONFIG!);
const { removeRouter, addRouter } = require(env.WEB!);
const { removeFolder, unarchive, getSHA1ofInput, ensureEntry} = require(env.UTILS!);
const { readEntry } = require(env.FILES!);
const { customScanner, register } = require(process.env.SCANNER!);

export class DeployFileScanner extends customScanner implements DeployScanner {
    name = "DEPLOY";
    scannerID: string;
    #workdir: string = "";


    constructor(config: {name: string, interval: number}, dir: string) {
        super(dir, config.name, config.interval);
        this.scannerID = register(this);
    }

    async start() {
        const path = await ensureEntry(`${env.WORKDIR}${env.SEP}tmp${env.SEP}deployments`).catch((error: any) => {
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to create deployments folder`);
            throw error;
        });
        this.#workdir = path;
        return super.start();
    }

    // TODO: #18 FIX This has an issue with marker files being processed as deployment files
    async handleFile(file: {name: string}) {
        if (isMarkerFile(file.name)) return;
        let action: {action: Promise<void>, state: State, msg: string} | undefined;
        switch (getState(file.name)) {
            case State.TODO:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now deploying`);
                setState(file.name, State.INPROG);
                
                action = {
                    action: this.deployScope(file),
                    msg: "deployed",
                    state: State.DONE,
                }
                
                break;
            case State.TODEL:
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} is now undeploying`);
                
                action = {
                    msg: "undeployed",
                    state: State.OFF,
                    action: this.fileUndeployScope(file.name),
                }
                
                break;
        }
        if(action === undefined) return;
        try {
            await action.action;
            log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYSCANNER", `${file.name} ${action.msg}`);
            setState(file.name, action.state);
        } catch (error) {
            setState(file.name, State.ERROR);
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYSCANNER", `Failed to (un)deploy ${file.name}`);
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYSCANNER", error);
        } finally {
            dumpConfig();
            log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYSCANNER", `Operation finished`);
        }
    }

    async deployScope(file: {name: string}) {
        log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `Deploying ${file.name}`);
        const hash = getSHA1ofInput(file.name)
        log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Hashed as ${hash}`);
        const addConf = { file: file.name, hash: hash, active: false, name: hash } as Scope;
        try {
            addConf["active"] = false;
            
            // Break if already deployed
            if (process.env[hash] === "enabled") {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${hash} is already active`);
                setState(file.name, State.DONE);
                throw new Error("Scope already active");
            }
            
            // Unpack
            await unarchive(`${this.dir}${process.env.SEP}${file.name}`, `${this.#workdir}${process.env.SEP}${hash}`);
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished unpacking ${file.name}`);
            // Init Scope
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Initializing ${file.name}`);
            const scopeConfig = await this.initScope(hash);
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished initializing ${file.name}`);
            addConf["config"] = scopeConfig;
            addConf["name"] = scopeConfig.name;
            addConf["active"] = true;
            log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeConfig.name} to active`);
            process.env[hash] = "enabled";
        } catch (error) {
            // set File to error
            addConf["active"] = false;
            env[hash] = 'disabled';
            throw error;
        } finally {
            CONFIG("scopes").push(addConf);
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finalizing ${file.name}`);
            
        }
    }

    // Init Scope
    async initScope(scope: string): Promise<ScopeConfig> {
        try {
            const conf = await readEntry(`${this.#workdir}${process.env.SEP}${scope}${process.env.SEP}config.json`);
            if(typeof conf !== "string") throw new Error("Config is not a file");
            const config = JSON.parse(conf) as ScopeConfig;
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `${config.name} config loaded`);
            const { init } = await import(`${this.#workdir}${process.env.SEP}${scope}${process.env.SEP}actions`);
            config.init = await init();
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${config.name} initialized`);
            if(config.routes && config.routes.length > 0) {
                config.routes = await this.initScopeRoutes(config.baseRoute!, config.routes, scope);
                log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Scope ${config.name} routes initialized`);
            }
            log(logLevel.STATUS, "DEPLOYCONTROL-DEPLOYMENTS", `${config.name} Fully loaded!`);
            return config;
        } catch (error) {
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to load ${scope}`);
            throw error;
        }
    }

    async initScopeRoutes(baseRoute: string, rawRoutes: Route[], scope: string): Promise<Route[]> {
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Initializing with base route ${baseRoute}`);
        const routes: Route[] = [];
        try {
            for (const route of rawRoutes) {
                route.path = `${this.#workdir}${process.env.SEP}${scope}${process.env.SEP}${route.path}`;
                route.route = "/" + route.route;
                if (!Object.values(Methods).some(method => method !== (route.type as string).toUpperCase())) throw new Error(`Invalid method ${route.type}`);
                route.type = route.type.toUpperCase() as Methods;
                if (route.type !== Methods.STATIC) {
                    route.callback = await require(route.path).default;
                }
                routes.push(route);
            };
            addRouter(baseRoute, routes, scope)
        } catch (error) {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Failed to init routes for ${scope}`);
            log(logLevel.FINE, "DEPLOYCONTROL-DEPLOYMENTS", "This could be caused by a error in the route definition");
            throw error;
        }
        return routes;
    }

    async fileUndeployScope(filename: string) {
        log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying file deployment ${filename}`);
        let error;
        // @ts-expect-error ts(7030) - This only has to return if a valid scope is found
        CONFIG("scopes").forEach((scope: Scope) => {
            try {
                log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Checking ${scope.file} for ${filename}`);
                if (scope.file === filename) {
                    log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Resolved ${filename} to ${scope.name}`);
                    return this.undeployScope(scope.hash);
                }
            } catch (err: any) {
                log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error occurred while checking ${scope}`);
                error = err;
            }
        });
        // log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Finished checking ${scope}`);
        if (error) throw error;
    }

    async undeployScope(scopeHash: string) {
        // call uninit
        // unregister routes if possible/override router with 404 message
        // remove folder
        // update config
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Undeploying ${scopeHash}`);
        const scopeConfig = CONFIG("scopes").find((scope: Scope) => scope.hash === scopeHash);
        log(logLevel.DEBUG, "DEPLOYCONTROL-DEPLOYMENTS", `Setting ${scopeConfig.hash} to inactive`);
        process.env[scopeConfig.hash] = "disabled";
        const unregister = removeRouter(scopeConfig.baseRoute);
        const shutdown = require(`${this.#workdir}${process.env.SEP}${scopeConfig.hash}${process.env.SEP}actions`).shutdown();
        const remove = removeFolder(`${this.#workdir}${process.env.SEP}${scopeConfig.hash}`);
        
        await Promise.allSettled([unregister, shutdown, remove]).catch((error) => {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error undeploying ${scopeHash}`);
            log(logLevel.ERROR, "DEPLOYCONTROL-DEPLOYMENTS", error);
            CONFIG.scopes[scopeConfig].active = false;
            CONFIG.scopes[scopeConfig].error = "Error Undeploying";
            throw new Error("Error Undeploying");
        });
        log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Finished undeploying ${scopeHash}`);
        this.removeFromConfig(scopeConfig.hash);
    }

    removeFromConfig(scopeHash: string) {
        try {
            let newScopes: Scope[] = [];
            log(logLevel.INFO, "DEPLOYCONTROL-DEPLOYMENTS", `Removing ${scopeHash} from work-config`);
            CONFIG("scopes").forEach((scope: Scope) => {
                if (scope.hash !== scopeHash) {
                    newScopes.push(scope);
                }
            });
            CONFIG().scopes = newScopes;
        } catch (error) {
            log(logLevel.WARN, "DEPLOYCONTROL-DEPLOYMENTS", `Error removing ${scopeHash} from work-config`);
            throw error;
        }
    }

}
