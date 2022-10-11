import { Styles } from './style';
import { env } from 'process';
import crypto from 'crypto';
import fs from "fs";

const { log, logLevel } = require(env.LOG!);

export const Style = Styles;

type uuid = string;
export function getRandomUUID(): uuid{
    try {
        return crypto.randomUUID();
    } catch (error) {
        return crypto.randomBytes(16).toString("hex");
    }
}

export function getSHA1ofInput(input: any): string {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export function checkJson(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (e) {
        try {
            JSON.stringify(str);
        } catch (e) {
            return false;
        }
    }
    return true;
}

export async function unarchive(archive: string, dest?: string, force?: boolean){
    if (!dest) {
        log(logLevel.DEBUG, "UTIL", "No destination specified, using archive path");
        dest = archive.slice(0, -4);
        createDirStruct(dest);
    }

    log(logLevel.INFO, "UTIL", "Attempting to unarchive " + archive);
    await decompress(archive, dest, force);
}

export function removeFolder(path: string){
    if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true });
        log(logLevel.DEBUG, "UTIL", "Folder Removed: " + path);
    } else {
        log(logLevel.WARN, "UTIL", "Folder not found: " + path);
    }
}

export function ensureEntry(path: string){
    log(logLevel.FINE, "UTIL", "Ensuring entry: " + path);
    if (path.split(env.SEP || "/").slice(-1).toString().includes(".")) {
        log(logLevel.FINE, "UTIL", "Found '.' assuming file");
        const dir = path.split(env.SEP || "/").slice(0, -1).join(env.SEP);
        createDirStruct(dir);
        try {
            fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error: any) {
            if(error.code === 'ENOENT') {
                fs.writeFileSync(path, "");
            } else {
                log(logLevel.WARN, "UTIL", "Error validating file/folder");
                log(logLevel.ERROR, "UTIL", error);
            }
        }
    } else {
        createDirStruct(path);
    }
    return path;
}

export function cleanPath(path: string) {
    const sep = env.SEP || "/";
    return path.replace(/\\/g, sep).replace(/\//g, sep);
}


function createDirStruct(dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, {
            recursive: true
        });
        log(logLevel.DEBUG, "UTIL", "Folder Created: " + dest);
    }
}

async function decompress(src: string, dest: string, force = false) {
    const extract = require('extract-zip')
    log(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
    try {
        log(logLevel.DEBUG, "UTIL-DEZIP", `Extracting ${src} to ${dest}`);
        await extract(src, { dir: dest });
        log(logLevel.DEBUG, "UTIL-DEZIP", "Unarchiving finished: " + src);
    } catch (error) {
        log(logLevel.WARN, "UTIL-DEZIP", `Error extracting ${src} to ${dest}`);
        if (!force) {
            throw error;
        }
        log(logLevel.ERROR, "UTIL-DEZIP", error);
        log(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
    }
}
