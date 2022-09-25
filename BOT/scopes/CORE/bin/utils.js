"use strict";
const crypto = require('crypto')
const yauzl = require("yauzl");
const fs = require("fs");
const { eLog, logLevel } = require(process.env.LOG);

module.exports = {
    eLog: (level, scope, rawmsg, forceConsole = false) => {
        let logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
        console.log(`${logTime} [${level.def}] [${scope}] ${rawmsg}`);
    },
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
            eLog(logLevel.DEBUG, "UTIL", "No destination specified, using archive path");
            dest = archive.slice(0, -4);
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, {
                    recursive: true
                });
                eLog2(logLevel.DEBUG, "UTIL", "Folder Created: " + dest);
            }
        }

        eLog(logLevel.INFO, "UTIL", "Attempting to unarchive " + archive);
        return decompress(archive, dest, force);
    },
    removeFolder: (path) => {
        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true, force: true });
            eLog(logLevel.DEBUG, "UTIL", "Folder Removed: " + path);
        } else {
            eLog(logLevel.WARN, "UTIL", "Folder not found: " + path);
        }
    },
}

async function decompress(src, dest, force = false) {
    return new Promise((resolve, reject) => {
        yauzl.open(src, { lazyEntries: true }, function (err, zipfile) {
            if (err) {
                eLog(logLevel.WARN, "UTIL-DEZIP", "Error opening archive: " + src);
                reject(err);
            }
            eLog(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
            zipfile.readEntry();
            zipfile.on("entry", function (entry) {
                if (/\/$/.test(entry.fileName)) {
                    // Directory file names end with '/'.
                    // Note that entires for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    eLog(logLevel.DEBUG, "UTIL-DEZIP", "Folder Found" + entry.fileName);
                    if (!fs.existsSync(dest + entry.fileName)) {
                        fs.mkdirSync(dest + entry.fileName, {
                            recursive: true
                        });
                        eLog(logLevel.DEBUG, "UTIL-DEZIP", "Folder created at destination: " + dest + entry.fileName);
                    }
                    dest = + entry.fileName;
                    zipfile.readEntry();
                } else {
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, {
                            recursive: true
                        });
                        eLog(logLevel.DEBUG, "UTIL-DEZIP", "Ensured that the destination dir exists!");
                    }
                    var ws = fs.createWriteStream(dest + process.env.SEP + entry.fileName);
                    // file entry
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) {
                            eLog2(logLevel.WARN, "UTIL-DEZIP", "Error reading file" + entry.fileName + "; in archive: " + src);
                            if (!force) {
                                eLog(logLevel.WARN, "UTIL-DEZIP", "Force is disabled, aborting!");
                                reject(err);
                            }
                            eLog2(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
                        }
                        readStream.on("end", function () {
                            zipfile.readEntry();
                        });
                        readStream.pipe(ws);
                        eLog(logLevel.DEBUG, "UTIL-DEZIP", "Unarchived file: " + entry.fileName);
                        eLog(logLevel.DEBUG, "UTIL-DEZIP", "to: " + dest + process.env.SEP + entry.fileName);
                    });
                }
            });
            zipfile.on("end", function () {
                eLog(logLevel.DEBUG, "UTIL-DEZIP", "Unarchiving finished: " + src);
                resolve(src, dest);
            });
        });
    });
}
