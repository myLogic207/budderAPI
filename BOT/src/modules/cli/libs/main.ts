import { Route } from "../../webserver/types";
import { Command } from "../types";

export const commands: Map<string, Command> = new Map();

export function getRoutes(frontendDir: string): Route[] {
    return [
        {
            type: "static",
            route: "/",
            path: frontendDir
        },
        {
            type: "post",
            route: "/command",
            callback: handleCommand
        }
    ]
}

function handleCommand(req: any, res: any) {
    const commandName = req.body.command;
    const result = invokeCommand(commandName, req.body.args);
    res.send(result || "Command Not Found");
}

function invokeCommand(command: string, args: string[]): any {
    if(!commands.has(command)) return false;
    return commands.get(command)!.action(args);
}
