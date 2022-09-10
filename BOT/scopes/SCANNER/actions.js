const DeploymentScanner = require("./deployments");
const Scanner = require("./scanner");

const Scanners = new Map();
module.exports = {
    init: () => {
        eLog(logLevel.STATUS, "SCANNER", "Initializing SCANNER");
        return new DeploymentScanner();
    },
    newScanner: (scannername, scannerdir, scannerinterval) => {
        eLog(logLevel.WARN, "SCANNER", "Initializing new custom scanner");
        return new Scanner(scannername, scannerdir, scannerinterval);
    },
    getScannerByName: (scannername) => {
        eLog(logLevel.WARN, "SCANNER", "Requested info for scanner: " + scannername);
        return Scanners.keys(obj).find(key => Scanners[key] === scannername);
    },
    getScannerByUUID: (scanneruuid) => {
        eLog(logLevel.WARN, "SCANNER", "Requested info for scanner: " + scanneruuid);
        return Scanners.get(scanneruuid);
    },
    register(scanner) {
        eLog(logLevel.INFO, "SCANNER", "Registered Scanner: " + scanner.name);
        Scanners.set(scanner.uuid, scanner.scannername);
    }
}
