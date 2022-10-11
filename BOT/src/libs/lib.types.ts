import { Bootconfig, Module, Scope } from "../types";
import { logLevel } from "./logLevels";

export type Logging = {
    default: string,
    logLevel: keyof typeof logLevel,
    eLogEnabled?: boolean,
    console_active?: boolean,
    filePath?: string,
    file_active?: boolean,
}

export type Config = {
    boot?: Bootconfig,
    scopes: Scope[],
    modules: Module[],
    logging: Logging,
}

export type uuid = string;