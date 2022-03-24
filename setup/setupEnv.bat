@echo off
cls
echo ============================================================

title budder-Bot - Setup .env
echo Starting setup .env variables...
echo In the following you will be asked for mandatory (ond optional) information
echo that is required to setup the environment.
echo Please make sure you have the following information (if needed) before you continue:
echo [31mAlso Note that tokens should never be shared with anyone[0m

@REM  Main Application variables, needed at all cost
echo | set /p="[35m[Required by Application][0m - "
echo Hostname and Port where your application should run

@REM  Discord Bot variables, recommended
echo | set /p="[35m[Required by Discord][0m - "
echo Discord Bot Auth Token, it's userID and your main Servers guildID 

@REM Database variables, optional
echo | set /p="[35m[Required by Database][0m - "
echo | set /p="Hostname and Port where your Database is running -"
echo [31mWARN: NOT YET IMPLEMENTED[0m
echo [36mNote: Budder-Bot comes with it's own SQLite database[0m

@REM Twitter variables, optional
echo | set /p="[35m[Required by Twitter][0m - "
echo | set /p="Twitter Auth Token -"
echo [31mWARN: NOT YET IMPLEMENTED[0m

@REM Calender variables, recommended
echo | set /p="[35m[Required by Callender][0m - "
echo | set /p="Microsoft Calander Auth token - "
echo [31mWARN: NOT YET IMPLEMENTED[0m

set /p="If all the needed information is at hand press any key to continue..."
@REM Create File for value storage
set env_path=%~dp0..\app\.env
echo #dotenv file - stores all app variables/flags > %env_path%
echo To use the default values, just press enter

@REM Set Aplication Variables
title budder-Bot - Setup .env - Application
set app_ip=
set /p app_ip=Please enter the hostname (ip) where your application should run (default: localhost):
IF "%app_ip%"=="" SET app_ip=localhost
echo APP_HOST=%app_ip% >> %env_path%
set app_port=
set /p app_port=Please enter the port where your application should run (default: 2070):
IF "%app_port%"=="" SET app_port=2070
echo APP_PORT=%app_port% >> %env_path%
echo [32mYour application will now run on: "http://%app_ip%:%app_port%/"[0m

@REM Set Discord Bot Variables
title budder-Bot - Setup .env - Discord
set discord=
set /p discord=Do you want to use the discord bot? (y/n):
if "%discord%"=="n" GOTO END_DISCORD
set discord_token=
set /p discord_token=Please enter your Discord Bot Auth Token:
echo DISCORD_TOKEN=%discord_token% >> %env_path%
set discord_client=
set /p discord_client=Please enter your Discord Bot clientID:
echo DISCORD_CLIENT=%discord_client% >> %env_path%
set discord_guild=
set /p discord_guild=Please enter your Discord Bot GuildID:
echo DISCORD_GUILD=%discord_guild% >> %env_path%
echo [32mDiscord Bot sucessfully setup[0m
:END_DISCORD

@REM Set Database Variables
title budder-Bot - Setup .env - Database
set db=
set /p db=Do you want to use a database? (y/n):
if "%db%"=="n" GOTO END_DB
echo [31m[WARN] NOT YET IMPLEMENTED[0m
echo Told you it is still WIP
GOTO END_DB

set db_type=
echo Please enter the database type, options are: sqlite, mysql, mariadb, postgres, mssql
set db_type=(default: sqlite, enter sqlite for custom sqlite database):

2>NUL CALL :CASE_%db_type%
IF ERRORLEVEL 1 CALL :DEFAULT_CASE
:CASE_
    echo DATABASE_CUSTOM=false >> %env_path%
    echo DATABASE_DIALECT=sqlite >> %env_path%
    echo Using [33mintegrated database[0m
GOTO END_CASE
:CASE_sqlite
    echo DATABASE_CUSTOM=true >> %env_path%
    echo DATABASE_DIALECT=sqlite >> %env_path%
    set db_uri=
    set /p db_uri=Please enter the database URI:
    echo DATABASE_URI=%db_uri% >> %env_path%
    set db_path=
    set /p db_path=Please enter the database path:
    echo DATABASE_PATH=%db_path% >> %env_path%
    echo Using [33mCustom sqlite database stored at "%db_path%"[0m
GOTO END_CASE
:DEFAULT_CASE
    echo DATABASE_CUSTOM=true >> %env_path%
    echo DATABASE_DIALECT=%db_type% >> %env_path%
    set db_uri=
    set /p db_uri=Please enter the database URI:
    echo DATABASE_URI=%db_uri% >> %env_path%
    set db_port=
    set /p db_port=Please enter the database port:
    echo DATABASE_PORT=%db_port% >> %env_path%
    set db_user=
    set /p db_user=Please enter your Database user:
    echo DB_USER=%db_user% >> %env_path%
    set db_pass=
    set /p db_pass=Please enter your Database password:
    echo DB_PASS=%db_pass% >> %env_path%
    set db_name=
    set /p db_name=Please enter your Database name:
    echo DB_NAME=%db_name% >> %env_path%
    echo Using [33mcustom database connection: "%db_type%://%db_username%:%db_pass%@%db_uri%:%db_port%/%db_name%"[0m
GOTO END_CASE
:END_CASE
VER > NUL
GOTO :EOF
echo [32mDatabase sucessfully setup[0m
:END_DB

set twitter=
set /p twitter=Do you want to use the twitter bot? (y/n):
if "%twitter%"=="n" GOTO END_TWITTER 
echo [31m[WARN] NOT YET IMPLEMENTED[0m
echo Told you it is still WIP
GOTO END_TWITTER

set twitter_token=
set /p twitter_token=Please enter your Twitter Auth Token:
echo TWITTER_TOKEN=%twitter_token% >> %env_path%
echo [32mTwitter Bot sucessfully setup[0m
:END_TWITTER

@REM Set Calender Variables
title budder-Bot - Setup .env - Callender
set calender=
set /p calender=Do you want to use the calender bot? (y/n):
if "%calender%"=="n" GOTO END_CALENDER
echo [31m[WARN] NOT YET IMPLEMENTED[0m
echo Told you it is still WIP
GOTO END_CALENDER

set calender_token=
set /p calender_token=Please enter your Microsoft Calander Auth Token:
echo CALENDER_TOKEN=%calender_token% >> %env_path%
echo [32mMicrosoft Calender Bot sucessfully setup[0m
:END_CALENDER

if EXIST %env_path% (
    echo [32mSetup sucessfully completed[0m
) else (
    echo [31mSetup failed, please check your input[0m
)

echo ============================================================