import { Styles } from './style';
import { env } from 'process';
import crypto from 'crypto';
import { uuid } from '../types';
import { decompress, ensureEntry as eEntry, removeEntry as rmDir } from './files';

const { log, logLevel } = require(env.LOG!);

export const Style = Styles;

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
        return false;
    }
    return true;
}

export async function unarchive(archive: string, dest?: string){
    if (!dest) {
        log(logLevel.DEBUG, "UTIL", "No destination specified, using archive path");
        dest = archive.slice(0, -4);
        await ensureEntry(dest);
    }

    log(logLevel.INFO, "UTIL", "Attempting to unarchive " + archive);
    await decompress(archive, dest);
}

export async function removeFolder(path: string, force: boolean = false, recursive: boolean = false) {
    return await rmDir(path, force, recursive);
}

export async function ensureEntry(ent: string): Promise<string | null> {
    return await eEntry(ent).catch(_ => {
        return null;
    });
}

export function cleanPath(path: string): string {
    const sep = env.SEP || "/";
    return path.replace(/\\/g, sep).replace(/\//g, sep);
}

export function applyStyle(style: keyof typeof Style, text: string): string {
    return Styles[style] + text + Style.END;
}
