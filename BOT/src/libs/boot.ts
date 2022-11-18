import { Bootconfig, Scope } from "../types";
import { CONFIG } from "./config";

const actions: (() => void)[] = [];

const BootLoader = {
    start(bootconf: Bootconfig) {
        for (let conf in bootconf) {
            switch (conf) {
                case "stats": actions.push(Functions.stats)
            }
        }
    },
    finishUp() {
        for (const action of actions) {
            action();
        }
    },
}

export default BootLoader;

// internal boot function

const Functions = {
    stats: () => {
        const { log, logLevel } = require(process.env.LOG!);
        log(logLevel.DEBUG, "CORE-BOOT", "Showing Stats");
        log(logLevel.DEBUG, "CORE-BOOT", `Memory Usage: ${process.memoryUsage().heapUsed / 1024 / 1024} MB`);
        log(logLevel.DEBUG, "CORE-BOOT", `CPU Usage: ${process.cpuUsage().user / 1000} ms`);
        log(logLevel.DEBUG, "CORE-LOADER", "Logger Configuration:")
        log(logLevel.DEBUG, "CORE-LOADER", {...CONFIG("logging")})
        const modules = CONFIG("modules");
        log(logLevel.DEBUG, "CORE-BOOT", `Loaded Modules: ${Object.keys(modules).length}`);
        for (let module of modules){
            log(logLevel.Debug, "CORE-BOOT", {...module})
        }
        const scopes = CONFIG("scopes")
        log(logLevel.DEBUG, "CORE-BOOT", `Initial Loaded Scopes: ${scopes.length}`)
        
        function formatScopeMsg(scope: Scope): string {
            return `${scope.name} (${scope.active})\n    hashed as: ${scope.hash}\n    file (if any): ${scope.file}`
        }

        for (let scope of scopes){
            log(logLevel.DEBUG, "CORE-LOADER", formatScopeMsg(scope))
        }
    },
}
