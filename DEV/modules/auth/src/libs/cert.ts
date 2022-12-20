import { CertInteractions } from "../types";
import crypto from 'crypto';

const { log, logLevel } = require(process.env.LOG!);
const { readEntry } = require(process.env.FILES!);

export class CertHandler implements CertInteractions {
    cert: string | null;
    key: string | null;
    ca: string | null;
    certPath: string | null;
    keyPath: string | null;
    caPath: string | null;
    
    constructor() {
        this.cert = null;
        this.key = null;
        this.ca = null;
        this.certPath = null;
        this.keyPath = null;
        this.caPath = null;
    }

    async loadCert(path: string, force: boolean = false): Promise<crypto.X509Certificate> {
        const file = await readEntry(path);
        if (typeof file !== "string") throw new Error("Entry is not a file");
        const cert = new crypto.X509Certificate(file);
        log(logLevel.DEBUG, "CERT", `Loaded certificate, validating...`);
        if(cert.verify(cert.publicKey)) {
            log(logLevel.DEBUG, "CERT", `Certificate is valid`);
            return cert;
        } else if (!force) {
            log(logLevel.DEBUG, "CERT", "Certificate is not valid, using anyway");
            return cert;
        } else {
            throw new Error("Certificate is not valid");
        }
    }

    async loadKey(path: string): Promise<crypto.KeyObject> {
        const file = await readEntry(path);
        if (typeof file !== "string") throw new Error("Entry is not a file");
        return crypto.createPublicKey(file);
    }
}