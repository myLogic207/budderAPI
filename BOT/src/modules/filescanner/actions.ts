import { CustomScanner, ScannerConfig } from "./types";

import { Scanner } from './libs/scanner';

const { log, logLevel } = require(process.env.LOG!);
const { getRandomUUID } = require(process.env.UTILS!);

let baseConfig: ScannerConfig;
const Scanners: Map<string, Scanner | CustomScanner> = new Map();

export function register(scanner: CustomScanner) {
    log(logLevel.STATUS, "FILESCANNER", "Registering Scanner: " + scanner.name);
    scanner.scannerID = getRandomUUID();
    Scanners.set(scanner.scannerID, scanner);
    return scanner.scannerID;
}

export async function init(name: string) {
    log(logLevel.INFO, "FILESCANNER", `Initializing File Scanner`);
    const { CONFIG } = await import(process.env.CONFIG!);
    baseConfig = CONFIG().modules[name];
    log(logLevel.STATUS, "FILESCANNER", `File Scanner initialized`);
}

export const customScanner = Scanner;

// deprecated!
export function newScanner(scannerDir: string, scannerName?: string, scannerInterval?: number): CustomScanner {
    log(logLevel.WARN, "FILESCANNER", "DEPRECATED! - Initializing new custom scanner"); 
    scannerName ??= baseConfig.name;
    scannerInterval ??= baseConfig.interval;
    
    const scanner = new Scanner(scannerDir, scannerName, scannerInterval) as unknown as CustomScanner;
    scanner.scannerID = register(scanner);
    return scanner;
}

export function getScannerByName (scannerName: string) {
    log(logLevel.DEBUG, "FILESCANNER", `Getting scanner by name ${scannerName}`);
    return Object.keys(Scanners).find(key => Scanners.get(key)?.name === scannerName);
}

export function getScannerByUUID (scannerID: string) {
    log(logLevel.DEBUG, "FILESCANNER", `Getting scanner by UUID ${scannerID}`);
    return Scanners.get(scannerID);
}

export async function shutdown () {
    log(logLevel.INFO, "FILESCANNER", "Stopping Hotdeploy Scanners");
    for (let [_, scanner] of Scanners) {
        await scanner.stop!();
    };
    log(logLevel.STATUS, "FILESCANNER", "Hotdeploy Scanners stopped");
}
