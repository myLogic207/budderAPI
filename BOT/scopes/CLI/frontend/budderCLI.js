"use strict";
let SCOPE = " ";
const budderCLI = "> devBudderCLIv0.2.3/Milkier:~$";
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

function executeCommand () {
  var cmd = cin.value;
  cin.value = "";
  cout.removeChild(cin);
  cout.appendChild(document.createTextNode(cmd));
  cout.innerHTML += "<br>";
  var cid = "cmdOut" + cout.children.length;
  var cmdOut = document.createElement("span");
  cmdOut.id = cid;
  cmdOut.innerHTML = budderCLI + SCOPE + "Loading...";
  cout.appendChild(cmdOut).subs;
  issueCommand(cmd).then(function (result) {
    document.getElementById(cid).innerHTML = budderCLI + SCOPE + result;
    cout.appendChild(cin);
    cin.focus();
  });
  cout.innerHTML += "<br>";
  cout.appendChild(document.createTextNode(budderCLI + SCOPE));
};

// call Command handling
async function issueCommand (rawcmd) {
  rawcmd = (SCOPE + " " + rawcmd).trim();
  const supportedScopes = ["CORE", "DISCORD"];
  const rootCmds = ["info", "cs", "help"];
  const cmdarr = rawcmd.split(" ");

  console.log(cmdarr);

  if (rootCmds.includes(cmdarr[0])) {
    switch (cmdarr[0]) {
      case "info":
        return "devBudderCOREv0.1.6/MilkFat";
      case "cs":
        let newSCOPE = cmdarr[1]
        SCOPE = newSCOPE ? newSCOPE : " ";
        return newSCOPE ? "Root SCOPE set to: " + SCOPE : "Returned back to CLI root scope";
      case "help":
        return "Help command";
      default:
        return "Unknown command";
    }
  } else if (supportedScopes.includes(cmdarr[0])) {
    let cmd = cmdarr.slice(1).join(" ");
    if (cmd.length === 0) cmd = "info";
    return fetch('command/' + cmdarr[0] + '?cmd=' + cmd).then(response => response.text());
  } else {
    return "Unknown command";
  }
}