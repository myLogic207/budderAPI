"use strict";
const crypto = require('crypto')
const fs = require('fs');
const yauzl = require("yauzl");

const STYLE = require("./style");
const logLevel = require("./logLevels");
const { createLog } = require("../DATABASE/dbms/log");
const config = require(process.env.CONFIG);

const time = new Date().toISOString().slice(0, -8).replace(/-/g, '.').replace(/T/g, '-').replace(/:/g, '.');
const logFiledest = `${config.eLog.filedest}${process.env.destSep}eLog-${time}.log`;

let LOGLEVEL = config.eLog.level;
let CLOG = config.eLog.cLogEnabled;
let DLOG = false;
let ELOG = config.eLog.eLogEnabled;
let FLOG = false;
let DBENABLED = config.scopes.DATABASE;
let DEVENV = process.env.NODE_ENV === 'development';


module.exports = {
    style: STYLE,
    logLevel: logLevel,
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
    eLog: (level, scope, rawmsg, forceConsole = false) => {
        eLog2(level, scope, rawmsg, forceConsole);
    },
    utilInit: () => {
        eLog2(logLevel.INFO, "UTIL", "Initializing!");
        if (ELOG) {
            eLog2(logLevel.STATUS, "UTIL", "Custom extending logging 'eLog2' is enabled");
            eLog2(logLevel.STATUS, "UTIL", "Log level is set to: " + LOGLEVEL);
            if (DEVENV) eLog2(logLevel.WARN, "UTIL", "Environment is set to development, log level will be overwritten");
            if (CLOG) eLog2(logLevel.STATUS, "UTIL", "Console logging is enabled");
            if (config.eLog.dLogEnabled) {
                eLog2(logLevel.STATUS, "UTIL", "Database logging is enabled");
                const { initLogbank } = require("../DATABASE/actions");
                const LOGBANK = initLogbank();
                eLog2(logLevel.STATUS, "UTIL", "Database connection is ready");
                DLOG = true;
            }
            if (config.eLog.fLogEnabled) {
                checkLogFile();
                eLog2(logLevel.STATUS, "UTIL", "File logging is enabled");
                eLog2(logLevel.INFO, "UTIL", "Log-file is saved in: " + logFiledest);
                FLOG = true;
            }
        } else {
            eLog2(logLevel.STATUS, "UTIL", "Custom extending logging 'eLog2' is disabled");
        }
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
    disableLogBase: () => {
        eLog2(logLevel.WARN, "UTIL", "Disabling logging database");
        DBENABLED = false;
    },
    unarchive: (archive, dest = null, force = false) => {
        if (!dest) {
            eLog2(logLevel.DEBUG, "UTIL", "No destination specified, using archive path");
            dest = archive.slice(0, -4);
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, {
                    recursive: true
                });
                eLog2(logLevel.DEBUG, "UTIL", "Folder Created: " + dest);
            }
        }

        eLog2(logLevel.INFO, "UTIL", "Attempting to unarchive " + archive);
        return new Promise((resolve, reject) => {
            try {
                decompress(archive, dest, force);
                eLog2(logLevel.STATUS, "UTIL", "Unarchiving Finished: " + archive);
                resolve(archive, dest);
            } catch (error) {
                eLog2(logLevel.WARN, "UTIL", "Unarchiving Failed: " + archive + " - " + dest);
                eLog2(logLevel.ERROR, "UTIL", error);
                reject(archive, dest);
            }
        });
    },
    removeFolder: (path) => {
        if (fs.existsSync(path)) {
            fs.rmSync(path, { recursive: true, force: true });
            eLog2(logLevel.DEBUG, "UTIL", "Folder Removed: " + path);
        } else {
            eLog2(logLevel.WARN, "UTIL", "Folder not found: " + path);
        }
    },
}

function decompress(src, dest, force = false) {
    yauzl.open(src, { lazyEntries: true }, function (err, zipfile) {
        if (err) {
            eLog2(logLevel.ERROR, "UTIL-DEZIP", "Error opening archive: " + src);
            eLog2(logLevel.ERROR, "UTIL-DEZIP", err);
            return err;
        }
        eLog2(logLevel.DEBUG, "UTIL-DEZIP", "Reading archive: " + src);
        zipfile.readEntry();
        zipfile.on("entry", function (entry) {
            if (/\/$/.test(entry.fileName)) {
                // Directory file names end with '/'.
                // Note that entires for directories themselves are optional.
                // An entry's fileName implicitly requires its parent directories to exist.
                eLog2(logLevel.DEBUG, "UTIL-DEZIP", "Folder Found" + entry.fileName);
                if (!fs.existsSync(dest + entry.fileName)) {
                    fs.mkdirSync(dest + entry.fileName, {
                        recursive: true
                    });
                    eLog2(logLevel.DEBUG, "UTIL-DEZIP", "Folder created at destination: " + dest + entry.fileName);
                }
                dest = + entry.fileName;
                zipfile.readEntry();
            } else {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, {
                        recursive: true
                    });
                    eLog2(logLevel.DEBUG, "UTIL-DEZIP", "Ensured that the destination dir exists!");
                }
                var ws = fs.createWriteStream(dest + entry.fileName);
                // file entry
                zipfile.openReadStream(entry, function (err, readStream) {
                    if (err) {
                        eLog2(logLevel.WARN, "UTIL-DEZIP", "Error reading file" + entry + "; in archive: " + src);
                        eLog2(logLevel.ERROR, "UTIL-DEZIP", err);
                        if (!force) {
                            eLog2(logLevel.WARN, "UTIL-DEZIP", "Force is disabled, aborting!");
                            return false;
                        }
                        eLog2(logLevel.WARN, "UTIL-DEZIP", "Force is enabled, skipping file!");
                    }
                    readStream.on("end", function () {
                        zipfile.readEntry();
                    });
                    readStream.pipe(ws);
                    eLog2(logLevel.DEBUG, "UTIL-DEZIP", "Unarchived file: " + entry.fileName);
                });
            }
        });
    });
}

function checkLogFile() {
    try {
        if (!fs.existsSync(logFiledest)) {
            fs.mkdirSync(config.eLog.filedest, { recursive: true })
            fs.writeFileSync(logFiledest, "===eLog2 Log File - enjoy extended logging functionality===\n", "utf8");
        }
    } catch (err) {
        eLog2(logLevel.ERROR, "UTIL", "Error creating eLog file");
        console.log(err);
    }
}

function eLog2(level, scope, rawmsg, forceConsole = false) {
    if (level.value < LOGLEVEL && process.env.NODE_ENV !== "development") return;
    let msg = getMSG(level, scope, rawmsg);

    if (ELOG) {
        let cLog = CLOG || DEVENV;
        if (FLOG) {
            fs.appendFileSync(logFiledest, `${msg.slice(5, -4)}\n`, "utf8");
        }
        if (DLOG && DBENABLED) {
            createLog(level.def, scope, rawmsg);
        } else if (DLOG) {
            console.log(`${STYLE.YELLOW}[UTIL] eLog (DATABASE) is enabled but scope DATABASE is not${STYLE.END}`);
            cLog = true;
        }
        if (cLog || forceConsole) {
            console.log(msg);
        }
    } else {
        console.log(msg);
    }
}

function getMSG(level, scope, rawmsg) {
    let logTime = new Date().toISOString().replace(/T/g, ' ').slice(0, -1);
    switch (level) {
        case logLevel.ERROR:
            return `${STYLE.RED}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.WARN:
            return `${STYLE.YELLOW}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.STATUS:
            return `${STYLE.BLUE}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.INFO:
            return `${STYLE.WHITE}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.FINE:
            return `${STYLE.GREEN}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        case logLevel.DEBUG:
            return `${STYLE.PURPLE}${logTime} [${level.def}] [${scope}] ${rawmsg}${STYLE.END}`;
        default:
            return `${STYLE.CYAN}${logTime} [${level.def}] [${scope}] ${rawmsg} (UNSUPPORTED LEVEL)${STYLE.END}`;
    }
}