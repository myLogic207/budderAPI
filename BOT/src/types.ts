import { Route } from "./modules/webserver/types";
import { LogLevel } from './logger/logLevels';

export type ValueOf<T> = T[keyof T];

// 2022-10-08 16:37:17.326
export type digit =  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 ;

export type Scope = {
    file?: string,
    name?: string,
    hash: string,
    active: boolean,
    config?: ScopeConfig,
}

export type ScopeConfig = {
    name: string,
    active: boolean,
    init?: string,
    baseRoute?: string,
    routes?: Route[],
}

type ModuleKey = string;
type ModuleCfg = any;
export type Module = [ModuleKey, ModuleCfg];
// {
    
//     // name: string,
//     // description?: string,
//     // version: string,
//     // require?: string[],
//     // config?: {},
// }

export type Bootconfig = {
    env: string,
}

export type Config = {
    boot?: Bootconfig,
    scopes: Scope[],
    modules: any,
    logging: LogConfig,
}

export type LogConfig = {
    logger: string,
    logLevel: keyof typeof LogLevel,
    filePath?: string,
    fileActive?: boolean,
    consoleActive?: boolean,
}

export type uuid = string;