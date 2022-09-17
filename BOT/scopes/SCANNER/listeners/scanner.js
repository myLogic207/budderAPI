"use strict";
const fs = require("fs");
const { eLog, getRandomUUID, logLevel } = require(process.env.UTILS);;
const { register } = require("../actions");


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
        register(this);
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.working = true;
            while (this.working) {
                this.scan()
                    .then(() => {
                        return new Promise((resolve, reject) => {
                            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Scanning Cycle complete - Sleeping");
                            afterScan().then(out => resolve(out));
                        });
                    }).then(() => {
                        setTimeout(() => {
                            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Scanning Cycle complete - Waking");
                        }, this.scannerinterval);
                    }).catch(err => {
                        eLog(logLevel.ERROR, `SCANNER-${this.name}`, "Scanning Cycle failed");
                        this.working = false;
                        reject(err);
                    });
            }
            resolve(true);
        });
    }

    async scan() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.dir, (err, files) => {
                if (err) reject(err);
                files.forEach(file => {
                    eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found file ${file}`);
                    this.handleFile(file);
                });
                resolve(true);
            });
        });
    }

    async handleFile(file) {
        return new Promise((resolve, reject) => {
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Found new file ${file}`);
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }

    async afterScan() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }
}

module.exports = Scanner;