"use strict";
const customShell = "> devBudderCLIv0.1.0/Milk: $ ";
const cout = document.getElementById("budderCLI");
const cin = document.createElement("input");
cin.id = "customInput";
cin.autofocus = true;
cin.placeholder = "...";
cin.focus();
cout.innerHTML = "";
cout.appendChild(document.createTextNode("> budderBot's Interactive Command Line Interface"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode("> (c) 2022 Lijon Fogel"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode("> Budder-Bot Version 0.1.0 - rawBudder/Milk"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode(customShell));
cout.appendChild(cin);
cin.onchange = function () {
  var cmd = this.value;
  this.value = "";
  cout.removeChild(cin);
  cout.appendChild(document.createTextNode(cmd));
  cout.innerHTML += "<br>";
  var cid = "cmdOut" + cout.children.length;
  var cmdOut = document.createElement("span");
  cmdOut.id = cid;
  cmdOut.innerHTML = customShell;
  cout.appendChild(cmdOut).subs;
  count10(cmdOut, cmd).then(function (result) {
    document.getElementById(cid).innerHTML = customShell + result;
    cout.appendChild(cin);
    cin.focus();
  });
  cout.innerHTML += "<br>";
  cout.appendChild(document.createTextNode(customShell));
};

var SCOPE = "";
function count10(element, cmd) {
  return new Promise((resolve) => {
    element.innerHTML = customShell + "Loading...";
    const cmdarr = (SCOPE + cmd).split(" ");
    switch (cmdarr[0]) {
      case "CORE":
        resolve("CORE COMMAND");
      break;
      case "DATA":
        resolve("DATA COMMAND");
      break;
      case "DISCORD":
        resolve(issueCommand('command/discord', cmdarr.slice(1).join(" ")));
        break;
      default:
        resolve("Unknown command");
        break;
    }
  });
}
async function issueCommand (url, cmd) {
  if (cmd.length === 0) cmd = "info";
  let response = await fetch(url + '?cmd=' + cmd);
  return response.text();
}