import { BudderTerminal } from "./terminal";

function start(){
    const termElem = document.getElementById('terminal')!
    const terminal = new BudderTerminal();
    terminal.attach(termElem);
    termElem.focus();
    document.getElementById('loading')!.remove();
}

start();