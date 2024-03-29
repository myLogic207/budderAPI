"use strict";
const fs = require("fs");
const { getRandomUUID } = require(process.env.UTILS);
const { log, logLevel } = require(process.env.LOG);

class Scanner {
    constructor(scannername, scannerdir, scannerinterval, baseconfig) {
        if (!scannerdir) {
            log(logLevel.ERROR, `FILESCANNER-${this.name}`, "Scanner directory not provided");
            throw new Error(`Failed Constructing "SCANNER-${this.name}": Scanner directory is required`);
        }
        this.dir = scannerdir;
        this.name = scannername ?? baseconfig.name;
        this.scannerID = getRandomUUID();
        this.interval = scannerinterval ?? baseconfig.interval;
        log(logLevel.INFO, `FILESCANNER-${this.name}`, `Constructed new scanner`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner Dir: ${this.dir}`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner ID: ${this.scannerID}`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner Interval: ${this.interval}`);
    }

    async start() {
        log(logLevel.INFO, `FILESCANNER-${this.name}`, `Starting scanner`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `in directory ${this.dir}`);
        this.working = true;
        while (this.working) {
            await this.loop().catch((error) => {
                log(logLevel.ERROR, `FILESCANNER-${this.name}`, `Error in scanner loop`);
                log(logLevel.ERROR, `FILESCANNER-${this.name}`, error);
            });
            await new Promise((resolve) => setTimeout(resolve, this.interval));
        }
    }

    stop() {
        this.working = false;
    }

    async loop() {
        return new Promise((resolve, reject) => {
            log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Waking");
            this.files = [];
            this.scan().then(() => {
                log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Executing after scan");
                this.afterScan();
                log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Sleeping");
                resolve();
            }).catch((error) => {
                log(logLevel.WARN, `FILESCANNER-${this.name}`, "Failed to scan");
                reject(error);
            });
        });
    }
    
    async scan() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.dir, { withFileTypes: true }, (err, files) => {
                if (err) throw err;
                files.forEach(file => {
                    log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found file ${file.name}`);
                    this.handleFile(file).then(() => {
                        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Handled file ${file.name}`);
                        resolve();
                    }).catch((error) => {
                        log(logLevel.WARN, `FILESCANNER-${this.name}`, `Failed to handle file ${file.name}`);
                        reject(error);
                    });
                });
            });
        });
    }

    afterScan() {
        return; // log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found ${this.files.length} files`);
    }

    async handleFile(file) {
        return new Promise((resolve, reject) => {
            log(logLevel.INFO, `FILESCANNER-${this.name}`, `Found new file ${file.name}`);
            this.files.push(file);
            setTimeout(() => {
                log(logLevel.INFO, `FILESCANNER-${this.name}`, `Processed file ${file.name}`);
                resolve();
            }, 1000);
        });
    }
}

module.exports = Scanner;