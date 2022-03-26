# budder-bot

~~Attempt at making discord bot~~
What started out as discord bot is now slowly becoming the a main connection point between all your favorite services.

~~To start just open your favorite command line and execute the script in the root of the project.~~

- [budder-bot](#budder-bot)
  - [NodeJS start](#nodejs-start)
  - [Environment](#environment)
  - [Make you own Module](#make-you-own-module)
  - [Certified modules](#certified-modules)
  - [On the topic of Scopes](#on-the-topic-of-scopes)
  - [On the topic of Modules](#on-the-topic-of-modules)
  - [On the topic of naming](#on-the-topic-of-naming)
    - [FDSNs - an explanation](#fdsns---an-explanation)
    - [Stages](#stages)
    - [budder](#budder)
    - [SCOPE/APP](#scopeapp)
    - [Versioning](#versioning)
    - [Module Name](#module-name)
      - [FDSN examples](#fdsn-examples)
  - [On the topic of 'Certified' modules](#on-the-topic-of-certified-modules)
  - [Addendum - Information about included modules](#addendum---information-about-included-modules)
    - [Addendum: budderCORE](#addendum-buddercore)
    - [Addendum: budderDATA](#addendum-budderdata)
    - [Addendum: budderCLI](#addendum-buddercli)
    - [Addendum: budderAPI](#addendum-budderapi)
    - [Addendum: budderUTIL](#addendum-budderutil)
      - [Extended logging - introducing eLog](#extended-logging---introducing-elog)

## NodeJS start

To get started you first need to setup nodeJS.

clone and go into folder

```sh
npm install
```

should install the dependencies

to start bot do

```sh
node .
```

or

```sh
nodemon
```

---

## Environment

To setup the environmental variables, open ~~your favorite~~ *powershell* (for now only)

```ps1
cd [pathToDir]\budder-bot\setup
.\setupEnv.ps1
```

and follow the nice guide!

(yeah sure you can also do them manually but pffffffffff)

---

## Make you own Module

Making you own module is easy.
Here are some guildlines/project stucture (feel free to clone the example and start from there):

- Set a [FDSN](#fdsns---an-explanation) for your module.
- Build you module in one SCOPE folder, no need to exit that.
- Here is a list of required files
  - *main.js* containing all code and calls from your module, not accessible from outside of scope.
  - *actions.js* with all the actions you want to use/be usable
    - this should contain a **shutdown()** function for gracefully shutting down the module.
  - *routes.js* containg all needed routes
    - Those are only for in scope/module routes, not for adding to other modules - more on that later
  - An entry in the *custom.js* switch case if functions need to be executed on load.
    - Those should either be in your *actions.js* or in the *main.js* file.
- Optionally following files can be added as well:
  - A *readme.md* file with a short description of your module.
  - A *croutes* folder containing *[SCOPE].js* files to add routes for other modules
    - *Croutes* are loaded on startup, no need to add them to the switch-case.
  - A *frontend* folder containing an *index.html* file (optionally *style.css*) file to show your module is working.
  - A *ccommands* folder to add discord commands to your module.
    - Those are loaded on startup if *budderDISCORD* is available and active, no need to add them to the switch-case.
    - Has to follow the same structure as *commands* in *budderDISCORD*
  - A *cli.js* files to add commands to the *budderCLI* module.
    - Is loaded on startup as well, no need to add them to the switch-case.
    - This has to follow the switch-case structure of all cli commands. (see [budderCLI](#addendum-buddercli) for more info)

This should result in following project structure:

```js
SCOPE
|   actions.js
|   cli.js (optional)
|   main.js
|   readme.md (optional)
|   routes.js
|
+---ccommands (optional)
|       command.js
|
+---croutes (optional)
|       otherscope.js
|
\---frontend (recommended)
        index.css
        index.html
        index.js
```

## Certified modules

For a module to apply for certification, it has to fullfil following requirements:

- Module with the same SCOPE name does not already exist.
- *cli.js* file is present and working.
- A *readme.md* file is present and has explanations.
- Has to follow the [eLog](#extended-logging---introducing-elog) guidelines.

---

## On the topic of Scopes

A *scope* is the internal term for the modules extending application. It is used for the folder name and the CLI as well as in the FDSN.
**SCOPES ALWAYS HAVE TO BE UPPERCASE**

## On the topic of Modules

A Module is defined with by its [FDSN](#fdsns---an-explanation). It extends the functionality of budderBOT by another Application (like Discord) or feature (like a calculator).

## On the topic of naming

*This describes the **Fully Defined (Scope) Names** convention of any module+version combination, it always has to be unique!*\
*You can refer to your module with just budder followed by its all caps name instead of the FDI at any time*\
*The FDI should always be used when adding modules as well as in any documentation or support.*\
Following rules need to be followed when naming:

**TL:DR** *[stage]Budder[SCOPE][version]/[name]* and *budder[SCOPE][version]/[name]* respectively -> *budder[SCOPE]*

### FDSNs - an explanation

A **Fully Defined (Scope) Name** long for **FDSN** or **FDN** (they both reference the same thing) is a name that is unique to a specific module+version combination. They are case-sensitive.
The idea behind it is to have a universal naming convention. Easy.

For short a FDSN consist of the *stage*, *budder/Budder*, the applications *name* (in all caps), a *version* number followed by a slash '/' and the current releases/versions  *name*

### Stages

Stages are the first part of the FDSN. They refer roughly to the usability of your module.
Following stages are available:

- *raw* - initial development, does not have to be working; idea stage
- *dev* - development, should be working/usable; development stage
- *prod* - always working major version; production stage
- *end* - end of life, should not be used anymore; end of life stage

Those stages can be used freely, depending on the usability of your module.\
The *prod* tag is not mandatory in a FDSN, in fact it is recommended to not use it. (more on that [later](#stages)).
If you choose to not use the *prod* tag, the "b" in budder will stay lowercase.

### budder

This one is pretty simple. *budder* is the overarching namespace of the whole project.\
budder should always be lowercase under any circumstances. The only exception to this rule is when using a stage tag. Then the *b* in budder will be capitalized.

### SCOPE/APP

The Scope refers to the application the scope connects to. See more about that [here](###scope).
Reserved words are:

- *BOT* - refers to the whole budderBOT application
- *CORE* - refers to the main app capabilities [budderCORE](#Addendum:budderCORE)
- *DATA* - refers to the database [budderDATA](#Addendum:budderDATA)
- *CLI* - refers to the integrated frontend [budderCLI](#Addendum:budderCLI)
- *API* - refers to the integrated API functionality [budderAPI](#Addendum:budderAPI)
- *UTIL* - refers to the utility functions [budderUTIL](#Addendum:budderUTIL)

### Versioning

The version is the release of your module. It is a number that is incremented every time you make a new release.\
The version itself follows the pattern *[major].[minor].[patch/build]*. For the FDSN a lowercase 'v' is added in the front.\
There are however specific verisons:

- v0.0.1 (initial version when the module is created, always has to be raw stage)
- v0.1.0 (first Dev version)
- v1.0.0 (first prod version, has to be prod)

### Module Name

The Name is free to choose as long as under 32 characters. The name should be short and descriptive. It has to start with a capital letter in the FDSN.

- A new created module or any module in the *raw* stage is always *Milk*
- A deprecated module is always *Cheese*
- should be changed at least every major release

#### FDSN examples

- rawBudderCLIv0.1.0/Milk
- devBudderDISCORDv0.2.0/Blurple
- budderCALCv1.0.2/Cowculate
- endBudderMQTTv0.2.4/Cheese
- budderHUEv2.6.9/Bulb

All those mentions above are examples, they do not exist.

*Funfact* budderBOTs current full name currently is:
**devBudderBOTv0.2.4/Magic**

## On the topic of 'Certified' modules

Certified modules are modules that have been tested and are known to work.\
They can optionally also be included in the environmental setup and even the CLI.\
A list of certified modules can be found [here](#certified-modules).

## Addendum - Information about included modules

### Addendum: budderCORE

(WIP)

### Addendum: budderDATA

(WIP)

### Addendum: budderCLI

(WIP)

### Addendum: budderAPI

(WIP)

### Addendum: budderUTIL

(WIP)

#### Extended logging - introducing eLog

(WIP)
