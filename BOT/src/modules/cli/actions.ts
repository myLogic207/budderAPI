const { addRouter, registerWebserver } = require(process.env.WEB!);
import { Webserver } from "../webserver/libs/webserver";
import defaultCommands from "./libs/defaultCommands";
import { commands, getRoutes } from "./libs/main";
import { Command } from "./types";

const { log, logLevel } = require(process.env.LOG!);

let cliServer: Webserver;
let config: any;

export async function init(name: string) {
    log(logLevel.INFO, "CLI", "Initializing");
    config = require(process.env.CONFIG!).CONFIG("modules")[name];
    log(logLevel.FINE, "CLI", "Loading default commands");
    defaultCommands.forEach((command: Command) => {
        registerCommand(command);
    });
    log(logLevel.STATUS, "CLI", "Loaded");
}

export async function start(){
    log(logLevel.INFO, "CLI", "Starting WebInterface");
    cliServer = await registerWebserver(config.server);
    const frontendDir = `${__dirname}${process.env.SEP}frontend`;
    await addRouter('', getRoutes(frontendDir), 'cli', cliServer);
}

// export async function shutdown() {
//     log(logLevel.INFO, "CLI", `Shutting down CLI`);
//     cliServer.shutdown();
// }

export async function registerCommand(command: Command) {
    log(logLevel.INFO, "CLI", `Registering Command ${command.name}`);
    commands.set(command.name, command);
}

export async function deleteCommand(commandName: string) {
    log(logLevel.INFO, "CLI", `Deleting Command ${commandName}`);
    commands.delete(commandName);
}

export async function getCommands() {
    log(logLevel.WARN, "CLI", `Getting ALL Commands`);
    return commands;
}
