"use strict";
require("dotenv").config();
const fs = require("fs");
const { eLog, getRandomUUID } = require("../UTIL/actions");
const logLevel = require("../UTIL/logLevels");
const { register } = require("./actions");


class Scanner{
    constructor(scannername, scannerdir, scannerinterval){
        if (!scannerdir){
            eLog(logLevel.ERROR, `SCANNER-${this.name}`, "Scanner directory not provided");
            throw new Error(`Failed Constructing "SCANNER-${this.name}": Scanner directory is required`);
        }
        this.dir = scannerdir;
        this.name = scannername ?? "Default";
        this.files = new Map();
        this.scannerID = getRandomUUID();
        this.interval = scannerinterval ?? process.env.STD_SLEEP;
        register(this);
    }

    async start(){
        return new Promise((resolve, reject) => {
            fileScanner.working = true;
            while(fileScanner.working) {
                this.scan()
                .then(() => {
                    eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Scanning Cycle complete - Sleeping");
                    setTimeout(() => {
                        eLog(logLevel.DEBUG, `SCANNER-${this.name}`, "Scanning Cycle complete - Waking");
                    }, scannerinterval);
                })
                .catch(err => {
                    eLog(logLevel.ERROR, `SCANNER-${this.name}`, "Scanning Cycle failed");
                    fileScanner.working = false;
                    reject(err);
                });
            }
            resolve(true);
        });
    }
    
    async scan(){
        return new Promise((resolve, reject) => {
            fs.readdir(this.dir, (err, files) => {
                if(err) reject(err);
                files.forEach(file => {
                    eLog(logLevel.DEBUG, `SCANNER-${this.name}`, `Found file ${file}`);
                    this.handleFile(file);
                });
                resolve(true);
            });
        });
    }

    handleFile(file){
        if(!this.files.get(file)){
            eLog(logLevel.INFO, `SCANNER-${this.name}`, `Found new file ${file}`);
            this.files.set(file, new Date().toISOString().replace(/T/g, ' ').slice(0, -1));
        }
    };
    
}

module.exports = Scanner;