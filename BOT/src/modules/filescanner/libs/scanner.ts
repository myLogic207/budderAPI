"use strict";
import fs from "fs";
const { getRandomUUID } = require(process.env.UTILS!);
const { log, logLevel } = require(process.env.LOG!);

export type ScannerConfig = {
    name: string,
    interval: number,
}
export class Scanner {
    name: any;
    dir: string;
    scannerID: any;
    interval: number;
    working: boolean = false;
    files: any[] = [];
    constructor(scannerName: string, scannerDir: string, scannerInterval: number, baseConfig: ScannerConfig) {
        if (!scannerDir) {
            log(logLevel.ERROR, `FILESCANNER-${this.name}`, "Scanner directory not provided");
            throw new Error(`Failed Constructing "SCANNER-${this.name}": Scanner directory is required`);
        }
        this.dir = scannerDir;
        this.name = scannerName ?? baseConfig.name;
        this.scannerID = getRandomUUID();
        this.interval = scannerInterval ?? baseConfig.interval;
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
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Waking");
        this.files = [];
        await this.scan().catch((error) => {
            log(logLevel.WARN, `FILESCANNER-${this.name}`, "Failed to scan");
            throw error;
        });
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Executing after scan");
        this.afterScan();
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Sleeping");
    }
    
    async scan() {
        await fs.readdir(this.dir, { withFileTypes: true }, (err, files) => {
            if (err) throw err;
            files.forEach(file => {
                log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found file ${file.name}`);
                this.handleFile(file).then(() => {
                    log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Handled file ${file.name}`);
                }).catch((error) => {
                    log(logLevel.WARN, `FILESCANNER-${this.name}`, `Failed to handle file ${file.name}`);
                    throw error;
                });
            });
        });
    }

    afterScan() {
        return; // log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found ${this.files.length} files`);
    }

    async handleFile(file: any) {
        log(logLevel.INFO, `FILESCANNER-${this.name}`, `Found new file ${file.name}`);
        this.files.push(file);
        await setTimeout(() => {
            log(logLevel.INFO, `FILESCANNER-${this.name}`, `Processed file ${file.name}`);
        }, 1000);
    }
}
