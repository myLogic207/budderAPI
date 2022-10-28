export interface FileScanner {
    name: string,
    // constructor(scannerName: string, scannerDir: string, scannerInterval: number, baseConfig: ScannerConfig): void;
    start: () => Promise<void>;
    stop: () => void;
    loop: () => Promise<void>;
    scan: () => Promise<void>;
    afterScan: () => Promise<void>;
    handleFile: (file: { name: string }) => Promise<void>;
}

export type ScannerConfig = {
    name: string,
    interval: number,
}

type internalFunctions = 'start' | 'stop' | 'loop' | 'scan' | 'afterScan' | 'scannerID';

export interface CustomScanner extends Omit<FileScanner, internalFunctions> {
    scannerID: string,
    afterScan?: () => Promise<void>;
    start?: () => Promise<void>;
    stop?: () => Promise<void>;
}