"use strict";

import { _LogLevel } from "./types";

export class LogLevel {
    static DEBUG: _LogLevel = new LogLevel("DEBUG", 0);
    static FINE: _LogLevel = new LogLevel("FINE", 100);
    static INFO: _LogLevel = new LogLevel("INFO", 200);
    static STATUS: _LogLevel = new LogLevel("STAT", 300);
    static WARN: _LogLevel = new LogLevel("WARN", 400);
    static ERROR: _LogLevel = new LogLevel("ERROR", 500);
    static SEVERE: _LogLevel = new LogLevel("SEVERE", 600);

    def;
    value;

    constructor(def: string, value: number) {
        this.def = def;
        this.value = value;
    }

    getLevel(level: any): LogLevel | number {
        if (level instanceof LogLevel) {
            return level.value;
        } else {
            // Custom or Wrong level
            return 1000;
        }
    }
}
