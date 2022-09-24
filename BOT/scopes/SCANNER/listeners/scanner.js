"use strict";
const fs = require("fs");
const { setInterval, clearInterval } = require("timers");
const { register } = require("../controller");
const { eLog, getRandomUUID, logLevel } = require(`${process.env.UTILS}`);

class Scanner {
    constructor(scannername, scannerdir, scannerinterval) {
        if (!scannerdir) {
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, "Scanner directory not provided");
            throw new Error(`Failed Constructing "SCANNER-${this.name}": Scanner directory is required`);
        }
        this.dir = scannerdir;
        this.name = scannername ?? "Default";
        this.scannerID = getRandomUUID();
        this.interval = scannerinterval ?? process.env.STD_SLEEP;
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Constructed new scanner`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Scanner Dir: ${this.dir}`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Scanner ID: ${this.scannerID}`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Scanner Interval: ${this.interval}`);
        register(this);
    }

    async start() {
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Starting scanner`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `in directory ${this.dir}`);
        this.working = true;
        while (this.working) {
            await this.loop().catch((error) => {
                eLog(logLevel.ERROR, `SCANNER-${this.name}`, `Error in scanner loop`);
                eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
            });
            await new Promise((resolve) => setTimeout(resolve, this.interval));
        }
    }

    stop() {
        clearInterval(this.timer);
    }

    async loop() {
        return new Promise((resolve, reject) => {
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Waking");
            this.files = [];
            this.scan().then(() => {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Executing after scan");
                this.afterScan();
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Sleeping");
                resolve();
            }).catch((error) => {
                eLog(logLevel.WARN, `SCANNER-${this.name}`, "Failed to scan");
                reject(error);
            });
        });
    }
    
    async scan() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.dir, { withFileTypes: true }, (err, files) => {
                if (err) throw err;
                files.forEach(file => {
                    eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found file ${file.name}`);
                    this.handleFile(file).then(() => {
                        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Handled file ${file.name}`);
                        resolve();
                    }).catch((error) => {
                        eLog(logLevel.WARN, `SCANNER-${this.name}`, `Failed to handle file ${file.name}`);
                        reject(error);
                    });
                });
            });
        });
    }

    afterScan() {
        // eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found ${this.files.length} files`);
    }

    async handleFile(file) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Found new file ${file.name}`);
            this.files.push(file);
            setTimeout(() => {
                eLog(logLevel.INFO, `SCANNER-${this.name}`, `Processed file ${file.name}`);
                resolve();
            }, 1000);
        });
    }
}

module.exports = Scanner;