import { Client, ClientOptions, Collection, Intents } from "discord.js" 

const { readEntry } = require(process.env.FILES!)

export class DiscordBot extends Client implements Bot {
    commands;

    #commandDir;

    constructor(intents: Intents[]) {
        super({
            intents: intents
        } satisfies ClientOptions)

        this.commands = this.#initCommands()
    }

    #initCommands(): Collection<string, string> {
        const cmds = new Collection<string, string>()
        for (let file of readEntry(this.#commandDir)) {
            
        }
        return cmds;
    }
}

interface Bot {
    commands: Collection<string, string>
}
