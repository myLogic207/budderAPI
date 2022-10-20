import { Route } from "./modules/webserver/types";

export type ValueOf<T> = T[keyof T];

export type Scope = {
    file?: string,
    name?: string,
    hash: string,
    active: boolean,
    config?: ScopeConfig,
}

export type ScopeConfig = {
    name: string,
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
    env?: string,
}