import { FileScanner } from '../types';

const { readEntry } = require(process.env.FILES!);
const { log, logLevel } = require(process.env.LOG!);

export class Scanner implements FileScanner {
    name: string;

    #dir: string;
    #working: boolean = false;
    #interval: number;
    #files: string[] = [];

    constructor(scannerDir: string, scannerName: string, scannerInterval: number) {
        this.name = scannerName;
        if (!scannerDir) {
            log(logLevel.ERROR, `FILESCANNER-${this.name}`, "Scanner directory not provided");
            throw new Error(`Failed Constructing "SCANNER-${this.name}": Scanner directory is required`);
        }
        this.#dir = scannerDir;
        this.#interval = scannerInterval!;
        log(logLevel.INFO, `FILESCANNER-${this.name}`, `Constructed new scanner`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner Dir: ${this.#dir}`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Scanner Interval: ${this.#interval}`);
    }

    get dir(): string {
        return this.#dir;
    }

    set dir(_) {
        log(logLevel.WARN, `FILESCANNER-${this.name}`, "Cannot change scanner directory");
    }

    get files(): any[] {
        return this.#files;
    }

    set files(_) {
        this.#files = _;
    }

    async start() {
        log(logLevel.INFO, `FILESCANNER-${this.name}`, `Starting scanner`);
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `in directory ${this.#dir}`);
        this.#working = true;
        while (this.#working) {
            await this.loop().catch((error) => {
                log(logLevel.ERROR, `FILESCANNER-${this.name}`, `Error in scanner loop`);
                log(logLevel.ERROR, `FILESCANNER-${this.name}`, error);
            });
            await new Promise((resolve) => setTimeout(resolve, this.#interval));
        }
    }

    stop(): void {
        this.#working = false;
    }

    async loop() {
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Waking");
        this.#files = [];
        await this.scan().catch((error) => {
            log(logLevel.WARN, `FILESCANNER-${this.name}`, "Failed to scan");
            throw error;
        });
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Executing after scan");
        await this.afterScan()?.catch((error) => {
            log(logLevel.WARN, `FILESCANNER-${this.name}`, "Failed after scan");
            throw error;
        });
        log(logLevel.DEBUG, `FILESCANNER-${this.name}`, "Sleeping");
    }
    
    async scan() {
        const files = await readEntry(this.#dir);
        if(!Array.isArray(files)) throw new Error("Scanner dir is not a directory");
        for (const file of files) {
            log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Found file ${file.name}`);
            await this.handleFile(file).catch((error) => {
                log(logLevel.WARN, `FILESCANNER-${this.name}`, `Failed to handle file ${file.name}`);
                throw error;
            });
            log(logLevel.DEBUG, `FILESCANNER-${this.name}`, `Handled file ${file.name}`);
        };
    }

    async afterScan(): Promise<void> {};

    async handleFile(file: { name: string }) {
        log(logLevel.INFO, `FILESCANNER-${this.name}`, `Found new file ${file.name}`);
        this.#files.push(file.name);
        await setTimeout(() => {
            log(logLevel.INFO, `FILESCANNER-${this.name}`, `Processed file ${file.name}`);
        }, 1000);
    }
}
