import { CertHandler } from "./libs/cert";

const { log, logLevel } = require(process.env.LOG!);

let certHandler: CertHandler;

export async function init(_: string) {
    log(logLevel.INFO, "FILESCANNER", `Initializing Auth Module`);
    certHandler = new CertHandler();
    log(logLevel.STATUS, "FILESCANNER", `Auth module initialized`);
}

export async function shutdown() {
    log(logLevel.INFO, "FILESCANNER", `Shutting down Auth Module`);
    log(logLevel.STATUS, "FILESCANNER", `Auth module shut down`);
}

export async function readCert(path: string) {
    return certHandler.loadCert(path);
}