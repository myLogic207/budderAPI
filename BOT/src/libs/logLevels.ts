"use strict";
export class logLevel {
    static DEBUG: LogLevel = new logLevel("DEBUG", 0);
    static FINE: LogLevel = new logLevel("FINE", 100);
    static INFO: LogLevel = new logLevel("INFO", 200);
    static STATUS: LogLevel = new logLevel("STAT", 300);
    static WARN: LogLevel = new logLevel("WARN", 400);
    static ERROR: LogLevel = new logLevel("ERROR", 500);
    static SEVERE: LogLevel = new logLevel("SEVERE", 600);

    def;
    value;

    constructor(def: string, value: number) {
        this.def = def;
        this.value = value;
    }

    getLevel(level: any): LogLevel | number {
        if (level instanceof logLevel) {
            return level.value;
        } else {
            // Custom or Wrong level
            return 1000;
        }
    }
}

export type LogLevel = {def: string, value: number};
