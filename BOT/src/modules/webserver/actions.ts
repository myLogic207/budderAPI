"use strict";

import { Webserver } from "./libs/webserver";
import { Route, ServerConfig } from "./types";

const { log, logLevel } = require(process.env.LOG!);

let webServer: Webserver[] = [];

export async function init(name: string){
    log(logLevel.INFO, "WEBSERVER", `Initializing Default Webserver`);
    const { CONFIG } = require(process.env.CONFIG!);
    webServer.push(new Webserver(CONFIG("modules")[name]));
    await webServer[0].startServer();
    log(logLevel.STATUS, "WEBSERVER", `Webserver initialized`);
}
// so there is the option to start the webserver with an extra start instead
// but tbh I think you should not use an extra start bc I might deprecate it (don't like the two calls)
export async function shutdown() {
    log(logLevel.INFO, "WEBSERVER", `Shutting down Webserver`);
    await webServer.forEach((server) => {
        server.shutdown();
    });
}

export async function addRouter(route: string, router: Route[], routerName: string, server: Webserver = webServer[0]) {
    log(logLevel.INFO, "WEBSERVER", `Registering Routes`);
    return server.addRouter(route, router, routerName);
}

export async function removeRouter(router: string){
    log(logLevel.INFO, "WEBSERVER", `Unregister Router`);
    return webServer[0].removeRouter(router);
}

export async function registerWebserver(config: ServerConfig){
    log(logLevel.INFO, "WEBSERVER", `Registering custom Webserver`);
    const server = new Webserver(config);
    webServer.push(server);
    await server.startServer();
    return server;
}