"use strict";
const fs = require("fs");
const { setInterval, clearInterval } = require("timers");
const { register } = require("../main");
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
        register(this)
    }

    start() {
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Starting scanner`);
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `in directory ${this.dir}`);
        this.working = true;
        this.timer = setInterval(() => {
            this.loop();
        }, this.interval);
    }

    stop() {
        clearInterval(this.timer);
    }

    loop() {
        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Waking");
        try {
            this.scan();
        } catch (error) {
            eLog(logLevel.WARN, `SCANNER-${this.name}`, "Scanning Cycle failed");
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, error);
            this.working = false;
        }
    }
    
    async scan() {
        fs.readdir(this.dir, { withFileTypes: true }, (err, files) => {
            if (err) throw err;
            files.forEach(file => {
                eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found file ${file.name}`);
                this.handleFile(file)
            });
            eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Scanning Cycle complete - Sleeping");
        })
        // .then(() => {
        //     eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Scanning Cycle complete");
        //     return true;
        // }).catch(err => {
        //     eLog(logLevel.WARN, `SCANNER-${this.name}`, "Failed Scanning Files");
        //     this.working = false;
        //     throw err;
        // });
    }

    async handleFile(file) {
        eLog(logLevel.INFO, `SCANNER-${this.name}`, `Found new file ${file.name}`);
        setTimeout(() => {
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Processed file ${file.name}`);
            return;
        }, 1000);
    }
}

module.exports = Scanner;