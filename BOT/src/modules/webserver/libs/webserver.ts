"use strict";

const { log, logLevel } = require(process.env.LOG || '');

export type Route = {
    type: string,
    path: string,
    route: string,
    callback?: Function,
}

// type Port = Range<0, 65535>;
type Port = number;
type Host = string

type ServerConfig = {
    host: Host,
    port: Port,
}

export class Webserver {

    #server: any;
    #port;
    #host;
    #app = require("express")();
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

    async startServer() {
        this.#server = this.#app.listen(this.#port, this.#host, () => {
            log(logLevel.STATUS, "WEBSERVER", `Server running at http://${this.#host}:${this.#port}/`);
        });
    }

    async addRouter(route:string, routes: Route[], name: string) {
        return new Promise<void>((resolve, reject) => {
            try {
                const router = this.#assembleRouter(routes);
                this.#app.use(`/${route}`, router);
                this.#router.set(name, route);
                log(logLevel.FINE, "WEBSERVER", `Registered route ${route} for ${name}`);
                resolve();
            } catch (error) {
                log(logLevel.WARN, "WEBSERVER", `Failed to register Routes`);
                reject(error);
            }
        })
    }

    #assembleRouter(routes: Route[]) {
        const router = require("express").Router();
        routes.forEach(route => {
            switch (route.type) {
                case "static":
                    router.use(route.route, require("express").static(route.path));
                    break;
                case "get":
                    router.get(route.route, route.callback);
                    break;
                case "post":
                    router.post(route.route, route.callback);
                    break;
                case "put":
                    router.put(route.route, route.callback);
                    break;
                case "delete":
                    router.delete(route.route, route.callback);
                    break;
                default:
                    log(logLevel.WARN, "WEBSERVER", `Unknown Route Type: ${route.type}`);
                    break;
            }
        });
        return router;
    }

    async removeRouter(router: string){
        return new Promise<void>((resolve, reject) => {
            try {
                // this.#app._router.stack = this.#app._router.stack.filter(r => r.name !== router);
                this.#app.use(`${this.#router.get(router)}`, this.#defaultRouter);
                this.#router.delete(router);
                log(logLevel.INFO, "WEBSERVER", `Unregistered Module`);
                resolve();
            } catch (error) {
                log(logLevel.WARN, "WEBSERVER", `Failed to unregister Module`);
                reject(error);
            }
        })
    }

    async shutdown() {
        return new Promise<void>((resolve, reject) => {
            this.#server.close(() => {
                log(logLevel.STATUS, "WEBSERVER", "Server closed");
                resolve();
            });
        });
    }
};