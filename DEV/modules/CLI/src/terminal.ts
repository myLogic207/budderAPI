import { Terminal } from 'xterm';
import "./xterm.css";

export class BudderTerminal {
    #terminal;
    #curInput = "";

    constructor() {
        this.#terminal = new Terminal({
            theme: {
                background: "#23272e",
                foreground: "#d6d7d8",
                selectionForeground: "#3d4556",
            },
            allowProposedApi: true,
            cursorBlink: true,
            cursorStyle: "bar",
            cursorWidth: 14,
            fontFamily: "Fira Code",
            fontSize: 14,
            fontWeight: "normal",
            allowTransparency: true,
            convertEol: true,


        });
    }

    attach(element: HTMLElement) {
        this.#terminal.open(element);
        this.#terminal.write("Welcome to BudderCLI!\r\n");
        this.prompt();
        this.startListening();
    }

    startListening() {
        this.#terminal.onData((data) => {
            switch (data.charCodeAt(0)) {
                case 13: // Enter
                    console.log(this.#curInput);
                    this.write("\r\n");
                    if(this.#curInput.length > 0) {
                        this.processInput(this.sanitizeInput(this.#curInput)).then((output) => {
                            this.write("$ @response: " + output);
                            this.#curInput = "";
                            this.prompt();
                        });
                    } else {
                        this.prompt();
                    }
                    break;
                case 127: // Backspace
                    if(this.#terminal.buffer.active.cursorX > 2) {
                        this.#terminal.write("\b \b");
                        this.#curInput = this.#curInput.slice(0, -1);
                    }
                    break;
                default:
                    console.log(data.charCodeAt(0));
                    this.#curInput += data;
                    this.write(data);
            }
        });
    }

    sanitizeInput(input: string): string {
        let tmpStr = input;
        return tmpStr;
    }

    write(text: string) {
        this.#terminal.write(text);
    }

    prompt() {
        this.#terminal.write("\r\n$ ");
    }

    async processInput(input: string): Promise<string> {
        const command = input.trim().split(" ")[0];
        const args = input.trim().split(" ").slice(1);
        // fetch("/command", {
        //     method: "POST",
        //     body: JSON.stringify({
        //         command : command,
        //         args : args
        //     }),
        // }).then((res) => res.json()).then((data) => {
        //     return data;
        // });
        return new Promise<string>((resolve) => {  
            setTimeout(() => {
                resolve(input);
            }, 1000);
        })
    }
    
    clear() {
        this.#terminal.clear();
    }
}