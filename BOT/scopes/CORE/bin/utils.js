"use strict";
const crypto = require('crypto')
const fs = require("fs");
const { pipeline } = require('stream');
const { log, logLevel } = require(process.env.LOG);
const Style = require("./style");

module.exports = {
    Style,
    getRandomUUID: () => {
        try {
            return crypto.randomUUID();
        } catch (error) {
            return crypto.randomBytes(16).toString("hex");
        }
    },
    getSHA1ofInput: (input) => {
        return crypto.createHash('sha1').update(input).digest('hex');
    },
    checkJson: (str) => {
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
    },
    unarchive: async (archive, dest = null, force = false) => {
        if (!dest) {
            log(logLevel.DEBUG, "UTIL", "No destination specified, using archive path");
            dest = archive.slice(0, -4);
            createDirStruc(dest);
        }

        log(logLevel.INFO, "UTIL", "Attempting to unarchive " + archive);
        return decompress(archive, dest, force);
    },
    removeFolder: (path) => {
        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true, force: true });
            log(logLevel.DEBUG, "UTIL", "Folder Removed: " + path);
        } else {
            log(logLevel.WARN, "UTIL", "Folder not found: " + path);
        }
    },
    ensureEntry: (path) => {
        log(logLevel.FINE, "UTIL", "Ensuring entry: " + path);
        if (path.split(process.env.SEP)[-1].split(".") > 1) {
            const dir = path.split(process.env.SEP).slice(0, -1).join(process.env.SEP);
            createDirStruc(dir);
            try {
                fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
            } catch (error) {
                if(error.code === 'ENOENT') {
                    fs.writeFileSync(path, "");
                } else {
                    log(logLevel.WARN, "UTIL", "Error validating file/folder");
                    log(logLevel.ERROR, "UTIL", error);
                }
            }
        } else {
            createDirStruc(path);
        }
        return path;
    },
    cleanPath(path) {
        return path.replace(/\\/g, process.env.SEP).replace(/\//g, process.env.SEP);
    }
}

function createDirStruc(dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, {
            recursive: true
        });
        log(logLevel.DEBUG, "UTIL", "Folder Created: " + dest);
    }
}

async function decompress(src, dest, force = false) {
    const extract = require('extract-zip')
    log(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
    try {
        log(logLevel.DEBUG, "UTIL-DEZIP", `Extracting ${src} to ${dest}`);
        await extract(src, { dir: dest });
        log(logLevel.DEBUG, "UTIL-DEZIP", "Unarchiving finished: " + src);
        return dest;
    } catch (error) {
        log(logLevel.WARN, "UTIL-DEZIP", `Error extracting ${src} to ${dest}`);
        if (!force) {
            throw error;
        }
        log(logLevel.ERROR, "UTIL-DEZIP", error);
        log(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
    }
}
