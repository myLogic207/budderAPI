"use strict";
const version = "devBudderCLIv0.2.3/Milkier"
let supportedScopes = [];
let SCOPE = " ";
const budderCLI = "> " + version + ":~$ ";
const cout = document.getElementById("budderCLI");
const cin = document.createElement("input");
cin.id = "customInput";
cin.autocomplete = "off";
cin.autofocus = true;
cin.placeholder = "...";
cin.focus();
document.getElementById("cliHead").innerHTML = 'root@' + budderCLI.substring(2, budderCLI.length - 4);
cout.innerHTML = "";
cout.appendChild(document.createTextNode("> budderBot's Interactive Command Line Interface"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode("> (c) 2022 Lijon Fogel"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode("> Budder-Bot Version 0.1.0 - rawBudder/Milk"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode(budderCLI));
cout.appendChild(cin);

cin.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    executeCommand();
  }
});

async function executeCommand() {
  if(supportedScopes.length === 0){
    (await fetch('command/core?cmd=scopes').then(res => res.text())).split(": ")[1].split(",").forEach(scope => supportedScopes.push(scope.trim()));
    supportedScopes.push("CORE");
  }
  var cmd = cin.value;
  cin.value = "";
  cout.removeChild(cin);
  cout.appendChild(document.createTextNode(cmd));
  cout.innerHTML += "<br>";
  var cid = "cmdOut" + cout.children.length;
  var cmdOut = document.createElement("span");
  cmdOut.id = cid;
  cmdOut.innerHTML = budderCLI + " " + SCOPE + " Loading...";
  cout.appendChild(cmdOut).subs;
  issueCommand(cmd).then(function (result) {
    document.getElementById(cid).innerHTML = budderCLI + " " + SCOPE + " " + result;
    cout.appendChild(cin);
    cin.focus();
  });
  cout.innerHTML += "<br>";
  cout.appendChild(document.createTextNode(budderCLI + " " + SCOPE + " "));
};

// call Command handling
async function issueCommand(rawcmd) {
  if (rawcmd.trim() === "return" || rawcmd.trim() === "exit" || rawcmd.trim() === "cs") {
    SCOPE = " ";
    return "Returned to root scope";
  } else if (rawcmd.trim().startsWith("cs ")) {
    if (supportedScopes.includes(rawcmd.trim().substring(3, rawcmd.length))) {
      SCOPE = rawcmd.trim().substring(3, rawcmd.length);
      return "set to active Scope";
    } else {
      return "Scope not supported/available";
    }
  }
  const rootCmds = ["info", "help"];
  const cmdarr = rawcmd.split(" ");
  let scoped = SCOPE.trim() ? SCOPE.trim() : cmdarr[0]
  if (supportedScopes.includes(scoped)) {
    let cmd = cmdarr.slice(1).join(" ");
    if (cmd.length === 0) cmd = "info";
      const result = await fetch('command/' + scoped + '?cmd=' + cmd.trim());
      switch(result.status){
        case 200:
          return await result.text();
        case 404:
          return "Command not found";
        case 500:
          return "Internal Server Error";
        default:
          return "Unknown Error";
      }
  } else if (rootCmds.includes(cmdarr[0])) {
    switch (cmdarr[0]) {
      case "info":
        return version;
      case "help":
        return "Help command";
      default:
        return "Unknown command";
    }
  } else {
    return "Unknown command/Scope not supported (yet)";
  }
}