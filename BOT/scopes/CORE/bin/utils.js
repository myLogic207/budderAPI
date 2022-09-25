"use strict";
const crypto = require('crypto')
const yauzl = require("yauzl");
const fs = require("fs");
const { log, logLevel } = require(process.env.LOG);

module.exports = {
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
    return new Promise((resolve, reject) => {
        yauzl.open(src, { lazyEntries: true }, function (err, zipfile) {
            if (err) {
                log(logLevel.WARN, "UTIL-DEZIP", "Error opening archive: " + src);
                reject(err);
            }
            log(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                if (/\/$/.test(entry.fileName)) {
                    // Directory file names end with '/'.
                    // Note that entires for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    log(logLevel.DEBUG, "UTIL-DEZIP", "Folder Found" + entry.fileName);
                    if (!fs.existsSync(dest + entry.fileName)) {
                        fs.mkdirSync(dest + entry.fileName, {
                            recursive: true
                        });
                        log(logLevel.DEBUG, "UTIL-DEZIP", "Folder created at destination: " + dest + entry.fileName);
                    }
                    dest = + entry.fileName;
                    zipfile.readEntry();
                } else {
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, {
                            recursive: true
                        });
                        log(logLevel.DEBUG, "UTIL-DEZIP", "Ensured that the destination dir exists!");
                    }
                    var ws = fs.createWriteStream(dest + process.env.SEP + entry.fileName);
                    // file entry
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            log(logLevel.WARN, "UTIL-DEZIP", "Error reading file" + entry.fileName + "; in archive: " + src);
                            if (!force) {
                                log(logLevel.WARN, "UTIL-DEZIP", "Force is disabled, aborting!");
                                reject(err);
                            }
                            log(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
                        }
                        readStream.on("end", function () {
                            zipfile.readEntry();
                        });
                        readStream.pipe(ws);
                        log(logLevel.DEBUG, "UTIL-DEZIP", "Unarchived file: " + entry.fileName);
                        log(logLevel.DEBUG, "UTIL-DEZIP", "to: " + dest + process.env.SEP + entry.fileName);
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
