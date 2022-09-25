"use strict";
const fs = require("fs");
const { getRandomUUID } = require(process.env.UTILS);
const { eLog, logLevel } = require(process.env.ELOG);

class Scanner {
    constructor(scannername, scannerdir, scannerinterval, baseconfig) {
        if (!scannerdir) {
            eLog(logLevel.ERROR, `FILESCANNER-${this.name}`, "Scanner directory not provided");
            throw new Error(`Failed Constructing "SCANNER-${this.name}": Scanner directory is required`);
        }
        this.dir = scannerdir;
        this.name = scannername ?? baseconfig.name;
        this.scannerID = getRandomUUID();
        this.interval = scannerinterval ?? baseconfig.interval;
        eLog(logLevel.INFO, `FILESCANNER-${this.name}`, `Constructed new scanner`);
        eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner Dir: ${this.dir}`);
        eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner ID: ${this.scannerID}`);
        eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner Interval: ${this.interval}`);
    }

    async start() {
        eLog(logLevel.INFO, `FILESCANNER-${this.name}`, `Starting scanner`);
        eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `in directory ${this.dir}`);
        this.working = true;
        while (this.working) {
            await this.loop().catch((error) => {
                eLog(logLevel.ERROR, `FILESCANNER-${this.name}`, `Error in scanner loop`);
                eLog(logLevel.ERROR, `FILESCANNER-${this.name}`, error);
            });
            await new Promise((resolve) => setTimeout(resolve, this.interval));
        }
    }

    stop() {
        this.working = false;
    }

    async loop() {
        return new Promise((resolve, reject) => {
            eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Waking");
            this.files = [];
            this.scan().then(() => {
                eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Executing after scan");
                this.afterScan();
                eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Sleeping");
                resolve();
            }).catch((error) => {
                eLog(logLevel.WARN, `FILESCANNER-${this.name}`, "Failed to scan");
                reject(error);
            });
        });
    }
    
    async scan() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.dir, { withFileTypes: true }, (err, files) => {
                if (err) throw err;
                files.forEach(file => {
                    eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found file ${file.name}`);
                    this.handleFile(file).then(() => {
                        eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Handled file ${file.name}`);
                        resolve();
                    }).catch((error) => {
                        eLog(logLevel.WARN, `FILESCANNER-${this.name}`, `Failed to handle file ${file.name}`);
                        reject(error);
                    });
                });
            });
        });
    }

    afterScan() {
        // eLog(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found ${this.files.length} files`);
    }

    async handleFile(file) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, `FILESCANNER-${this.name}`, `Found new file ${file.name}`);
            this.files.push(file);
            setTimeout(() => {
                eLog(logLevel.INFO, `FILESCANNER-${this.name}`, `Processed file ${file.name}`);
                resolve();
            }, 1000);
        });
    }
}

module.exports = Scanner;