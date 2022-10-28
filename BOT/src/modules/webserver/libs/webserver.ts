import { Route, ServerConfig } from "../types";
import express from "express";
import { Server } from "http";
import { Methods } from "./methods";

const { log, logLevel } = require(process.env.LOG!);

export class Webserver {
    #server: Server | undefined;
    #port;
    #host;
    #app = express();
    #router = new Map();

    #defaultRouter(req: any, res: any, next: any) {
        log(logLevel.FINE, "WEBSERVER", `Request for ${req.url}`);
        if (req.url === "/health") {
            res.status(200).send("I am alive!");
        } else {
            next();
        }
    }

    constructor(config: ServerConfig) {
        log(logLevel.INFO, "WEBSERVER", "Initializing Address");
        this.#port = config.port || 2070;
        log(logLevel.FINE, "WEBSERVER", `Registered Port: ${this.#port}`);
        this.#host = config.host || "localhost";
        log(logLevel.FINE, "WEBSERVER", `Registered Host: ${this.#host}`);

        this.#app.use("/", this.#defaultRouter);
        this.#router.set("default", "/");

        log(logLevel.DEBUG, "WEBSERVER", "Set default route");
    }

    startServer() {
        this.#server = this.#app.listen(this.#port, this.#host, () => {
            log(logLevel.STATUS, "WEBSERVER", `Server running at http://${this.#host}:${this.#port}/`);
        });
    }

    addRouter(route: string, routes: Route[], name: string) {
        const router = this.#assembleRouter(routes);
        this.#app.use(`/${route}`, router);
        this.#router.set(name, route);
        log(logLevel.FINE, "WEBSERVER", `Registered route '/${route}' for ${name}`);
    }

    #assembleRouter(routes: Route[]) {
        const router = express.Router();
        routes.forEach((route: Route) => {
            if (route.type === Methods.STATIC) {
                if (!route.path) { throw new Error("Path is missing"); }
                log(logLevel.DEBUG, "WEBSERVER", `Registered static route dir '${route.path}'`);
                router.use(route.route, express.static(route.path));
                return;
            } 
            if (!route.callback) { throw new Error("No callback defined"); }
            switch (route.type) {
                case Methods.GET:
                    router.get(route.route, route.callback);
                    break;
                case Methods.POST:
                    router.post(route.route, route.callback);
                    break;
                case Methods.PUT:
                    router.put(route.route, route.callback);
                    break;
                case Methods.DELETE:
                    router.delete(route.route, route.callback);
                    break;
                default:
                    log(logLevel.WARN, "WEBSERVER", `Unknown Route Type: ${route.type}`);
            }
            log(logLevel.DEBUG, "WEBSERVER", `Registered '${route.type}' type Route '${route.route}'`);
        });
        return router;
    }

    removeRouter(router: string) {
        try {
            // this.#app._router.stack = this.#app._router.stack.filter(r => r.name !== router);
            this.#app.use(`${this.#router.get(router)}`, this.#defaultRouter);
            this.#router.delete(router);
            log(logLevel.INFO, "WEBSERVER", `Unregistered Module`);
        } catch (error) {
            log(logLevel.WARN, "WEBSERVER", `Failed to unregister Module`);
            throw error;
        }
    }

    async shutdown() {
        this.#server?.close(() => {
            log(logLevel.STATUS, "WEBSERVER", "Server closed");
        });
    }
}
