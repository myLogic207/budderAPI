import fs from "fs/promises";
import { env } from 'process';
const { log, logLevel } = require(env.LOG!);

export async function writeFile(file: string, content: string) {
    await fs.writeFile(file, content).catch(error => {
        log(logLevel.WARN, "FILES", "Failed to write config file");
        log(logLevel.WARN, "FILES", error);
    });
    log(logLevel.INFO, "FILES", "File written");
}

export async function ensureEntry(ent: string, counter = 0): Promise<string> {
    // Why your folders have so many dots... lol, will be fixed with #20
    if(counter > 10) throw new Error("Recursion limit reached");
    
    log(logLevel.FINE, "UTIL", "Ensuring entry: " + ent);
    let path = ent.split(env.SEP!);
    if(path.length < 2) {
        throw new Error("Invalid path: " + ent);
    }
    
    await fs.access(ent, fs.constants.W_OK).catch(async (error: any) => {
        if(error.code !== "ENOENT") throw new Error("Invalid access: " + ent);
        // TODO: #20 Breaking Change - Extends ensure files/folders
        if (path.pop()!.includes(".")) {
            log(logLevel.FINE, "UTIL", "Found '.' assuming file");
            const dir = path.slice(0, -1).join(env.SEP!);
            await ensureEntry(dir, counter++);
            
            await fs.open(ent, 'w').catch(error => {
                log(logLevel.ERROR, "UTIL", "Failed to create file: " + ent);
                throw error;
            });
        } else {
            log(logLevel.FINE, "UTIL", "Found no '.' assuming folder");
            await fs.mkdir(ent, { recursive: true }).catch(error => {
                log(logLevel.WARN, "UTIL", "Failed to create directory: " + path);
                throw error;
            });
        }
    });
    log(logLevel.DEBUG, "UTIL", "Ensured Read Entry: " + ent);
    return ent;
}

export async function decompress(src: string, dest: string) {
    log(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
    try {
        log(logLevel.DEBUG, "UTIL-DEZIP", `Extracting ${src} to ${dest}`);
        await require('extract-zip')(src, { dir: dest });
        log(logLevel.DEBUG, "UTIL-DEZIP", "Unarchiving finished: " + src);
    } catch (error) {
        log(logLevel.WARN, "UTIL-DEZIP", `Error extracting ${src} to ${dest}`);
        log(logLevel.ERROR, "UTIL-DEZIP", error);
    }
}

export async function removeEntry(path: string, force: boolean = false, recursive: boolean = false) {
    try {
        await fs.access(path, fs.constants.W_OK);
        log(logLevel.WARN, "UTIL", "Removing entry: " + path);
        fs.rm(path, { recursive: recursive, force: force });
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            log(logLevel.WARN, "UTIL", "Failed to remove entry: " + path);
            log(logLevel.WARN, "UTIL", error);
        }
    }
}