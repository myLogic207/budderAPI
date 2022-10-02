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
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, {
                    recursive: true
                });
                log(logLevel.DEBUG, "UTIL", "Folder Created: " + dest);
            }
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

async function decompress_old(src, dest, force = false) {
    return new Promise((resolve, reject) => {
        runzip.open(src, { filter: isZip }, (err, zip) => {
            if (err) {
                log(logLevel.WARN, "UTIL-DEZIP", "Error opening archive: " + src);
                reject(err);
            }
            log(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
            zip.on("entry", (entry) => {
                const fileName = entry.fileName.replace("/", process.env.SEP)
                log(logLevel.DEBUG, "UTIL-DEZIP", "Reading entry: " + fileName);
                if (fileName.endsWith(process.env.SEP)) {
                    // directory file names end with '/'
                    log(logLevel.DEBUG, "UTIL-DEZIP", "Entry is a directory, skipping");
                    return;
                }
                entry.openReadStream((err, readStream) => {
                    if (err) {
                        log(logLevel.WARN, "UTIL-DEZIP", `Error reading file ${fileName} in archive: ${src}`);
                        if (!force) {
                            log(logLevel.WARN, "UTIL-DEZIP", "Force is disabled, aborting!");
                            reject(err);
                        }
                        log(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
                    }
                    let outputDir = dest + process.env.SEP + fileName.split(process.env.SEP).slice(0, -1).join(process.env.SEP);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, {
                            recursive: true
                        }, err => {});
                        log(logLevel.DEBUG, "UTIL-DEZIP", `Ensured that the destination ${outputDir} exists!`);
                    }
                    readStream.pipe(fs.createWriteStream(dest + process.env.SEP + fileName));
                    log(logLevel.DEBUG, "UTIL-DEZIP", `Extracted ${fileName} to ${dest + process.env.SEP + fileName}`);
                });
            });
            zip.on("end", () => {
                log(logLevel.DEBUG, "UTIL-DEZIP", "Unarchiving finished: " + src);
                resolve();
            });
        });
    });
}

function isZip(entry) {
    return /\.(zip|bud)$/.test(entry.fileName);
}

async function decompress_old(src, dest, force = false) {
    return new Promise((resolve, reject) => {
        yauzl.open(src, { lazyEntries: true }, function (err, zipfile) {
            if (err) {
                log(logLevel.WARN, "UTIL-DEZIP", "Error opening archive: " + src);
                reject(err);
            }
            log(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                console.log(entry);
                const fileName = entry.fileName.replace("/", process.env.SEP)
                log(logLevel.DEBUG, "UTIL-DEZIP", "Reading entry: " + fileName);
                if (fileName.includes(process.env.SEP)) {
                    // Directory file names end with '/'.
                    // Note that entires for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    const folder = fileName.split(process.env.SEP).slice(0, -1);
                    log(logLevel.DEBUG, "UTIL-DEZIP", "Folder Found" + fileName);
                    if (!fs.existsSync(dest + fileName)) {
                        fs.mkdirSync(dest + fileName, {
                            recursive: true
                        });
                        log(logLevel.DEBUG, "UTIL-DEZIP", "Folder created at destination: " + dest + folder);
                    }
                    dest = + folder;
                    zipfile.readEntry();
                } else {
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, {
                            recursive: true
                        });
                        log(logLevel.DEBUG, "UTIL-DEZIP", "Ensured that the destination dir exists!");
                    }
                    var ws = fs.createWriteStream(dest + process.env.SEP + fileName);
                    // file entry
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            log(logLevel.WARN, "UTIL-DEZIP", `Error reading file ${fileName} in archive: ${src}`);
                            if (!force) {
                                log(logLevel.WARN, "UTIL-DEZIP", "Force is disabled, aborting!");
                                reject(err);
                            }
                            log(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
                        }
                        readStream.on("end", () => {
                            zipfile.readEntry();
                        });
                        readStream.pipe(ws);
                        log(logLevel.DEBUG, "UTIL-DEZIP", `Unarchived file: ${fileName}`);
                        log(logLevel.DEBUG, "UTIL-DEZIP", `to: ${dest}${process.env.SEP}${fileName}`);
                    });
                }
            });
            zipfile.on("end", function () {
                log(logLevel.DEBUG, "UTIL-DEZIP", "Unarchiving finished: " + src);
                resolve(src, dest);
            });
        });
    });
}
