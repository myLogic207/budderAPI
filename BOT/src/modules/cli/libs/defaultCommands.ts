import { commands } from "./main"
import { Command } from '../types';

const as = <T>(value: T) => value;

export default as<Command[]>([
    {
        name: "help",
        action: (args?: string[]) => {
            if(!args) return `
                Showing a list of commands aka "help":
                help - Displays this message
                help [command] - Displays help/description for a specific command
                shutdown - Shuts down the bot
                restart - Restarts the bot
                reload - Reloads the bot
                reload [module] - Reloads a specific module`
            return commands.get(args[0]!)?.details || "Command has no description";
        },
        details: {
            invoke: "help",
            args: [["command", "The command you want help with"]],
            description: "Displays a probably helpful message (for the specified command)",
            examples: [
                "help = Displays a list of commands",
                "help core = Displays help for the core module"
            ]
        }
    }
])