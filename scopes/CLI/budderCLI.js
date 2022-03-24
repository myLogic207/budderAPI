const customShell = "Budder-CLI: ";
const cout = document.getElementById("budder-shell");
const cin = document.createElement("input");
cin.id = "customInput";
cin.autofocus = true;
cin.placeholder = "your command";
cin.focus();
cout.innerHTML = "";
cout.appendChild(document.createTextNode("budderBot's Interactive Command Line Interface"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode("(c) 2022 Lijon Fogel"));
cout.appendChild(document.createElement("br"));
cout.appendChild(document.createTextNode("Budder-Bot Version 0.1.0 - rawBudder/Milk"));
cout.appendChild(document.createElement("br"));
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
    console.log(result);
    document.getElementById(cid).innerHTML = customShell + result;
    cout.appendChild(cin);
    cin.focus();
  });
  cout.innerHTML += "<br>";
  cout.appendChild(document.createTextNode(customShell));
};

function count10(element, cmd) {
  console.log(cmd);
  return new Promise((resolve) => {
    element.innerHTML = customShell + "Loading...";
    switch (cmd) {
      case "help":
        var cmdres = "help - displays this message";
        break;
      case "ping":
        var cmdres = "ping - pings the server";
        break;
      default:
        var cmdres = "Unknown command";
        break;
    }
    setTimeout(() => {
      resolve(cmdres);
    }, 1000);
  });
}
