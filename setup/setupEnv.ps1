Write-Host "Starting setup .env variables..."
Write-Host "In the following you will be asked for mandatory (ond optional) information that is required to setup the environment."
Write-Host "Please make sure you have the following information (if needed) before you continue:"
Write-Host "Also Note that tokens should never be shared with anyone" -ForegroundColor Red
# Main Application variables, needed at all cost
Write-Host "[Required by Application] - " -ForegroundColor Magenta -NoNewline
Write-Host "Hostname and Port where your application should run " 
# Discord Bot variables, recommended
Write-Host "[Required by Discord] - " -ForegroundColor Magenta -NoNewline
Write-Host "Discord Bot Auth Token, it's userID and your main Servers guildID "
# Database variables, optional
Write-Host "[Required by Database] - " -ForegroundColor Magenta -NoNewline
Write-Host "Hostname and Port where your Database is running " -NoNewline
Write-Host " - Note: Budder-Bot comes with it's own SQLite database" -ForegroundColor Green -NoNewline
Write-Host " - WARN: NOT YET IMPLEMENTED" -ForegroundColor Red
# Twitter variables, optional
Write-Host "[Required by Twitter] - " -ForegroundColor Magenta -NoNewline
Write-Host "Twitter Auth Token " -NoNewline
Write-Host "- WARN: NOT YET IMPLEMENTED" -ForegroundColor Red
# Calender variables, recommended
Write-Host "[Required by Callender] - " -ForegroundColor Magenta -NoNewline
Write-Host "Microsoft Calander Auth token " -NoNewline
Write-Host " - WARN: NOT YET IMPLEMENTED" -ForegroundColor Red

Write-Host "If all the needed information is at hand press any key to continue..." -NoNewline
Read-Host
# Create hashtable for value storage
$variables = @{}
Write-Host "To use the default values, just press enter"

# Application settings
$ip = Read-Host "Please enter the hostname (ip) where your application should run (default: localhost)"
if (-Not $ip) {$ip = "localhost"}
$variables.Add("APP_HOST", $ip)
$port = Read-Host "Please enter the port where your application should run (default: 2070)"
if (-Not $port) {$port = "2070"}
$variables.Add("APP_PORT", $port)
Write-Host "Your application will now run on: http://${ip}:${port}/" -ForegroundColor Green

# Discord Bot settings
$discord = Read-Host "Do you want to use the discord bot? (y/n)"
if($discord -like "y*") {
    $variables.Add("DISCORD_ENABLED", "true")
    $discord_token = Read-Host "Please enter your Discord Bot Auth Token" -MaskInput
    $discord_token = if ($discord_token) {$discord_token} else {"null"}
    $variables.Add("DISCORD_TOKEN", $discord_token)
    $discord_clientID = Read-Host "Please enter your Discord Bot clientID"
    $discord_clientID = if ($discord_clientID) {$discord_clientID} else {"null"}
    $variables.Add("DISCORD_CLIENTID", $discord_clientID)
    $discord_guildID = Read-Host "Please enter your Servers GuildID"
    $discord_guildID = if ($discord_guildID) {$discord_guildID} else {"null"}
    $variables.Add("DISCORD_GUILDID", $discord_guildID)
    Write-Host "Discord Bot sucessfully setup" -ForegroundColor Green
} else {
    $variables.Add("DISCORD_ENABLED", "false")
}

# Database settings
$db = Read-Host "Do you want to use a database? (y/n)"
if($db -like "y*") {
    $variables.Add("DB_ENABLED", "true")
    $db_type = Read-Host "Please enter the database type, options are: sqlite, mysql, mariadb, postgres, mssql `n (default: sqlite, enter sqlite for custom sqlite database)"
    
    switch ($db_type) {
        "" {
            $variables.Add("DATABASE_CUSTOM", "false")
            Write-Host "Using integrated sqlite database" -ForegroundColor Yellow
            break;
        }
        "sqlite" {
            Write-Host "Told you, not yet implemented" -ForegroundColor Red
            break;

            $db_dialect = $db_type.ToLower()
            $db_uri = Read-Host "Please enter the database URI"
            $variables.Add("DATABASE_URI", $db_uri)
            $db_path = Read-Host "Please enter the path to the custom SQLite storage"
            $variables.Add("DATABASE_PATH", $db_path)
            $variables.Add("DATABASE_CUSTOM", "true")
            Write-Host "Your SQLite database is stored at ${db_path}" -ForegroundColor Yellow
            break;
        }
        Default {
            Write-Host "Told you, not yet implemented" -ForegroundColor Red
            break;

            $db_dialect = $db_type.ToLower()
            $db_uri = Read-Host "Please enter the database URI"
            $variables.Add("DATABASE_URI", $db_uri)
            $db_host = Read-Host "Please enter the database hostname"
            $variables.Add("DATABASE_HOST", $db_host)
            $db_port = Read-Host "Please enter the database port"
            $variables.Add("DATABASE_PORT", $db_port)
            $db_username = Read-Host "Please enter the database username"
            $variables.Add("DATABASE_USERNAME", $db_username)
            $db_pass = Read-Host "Please enter the database password" -MaskInput
            $variables.Add("DATABASE_PASSWORD", $db_pass)
            $db_name = Read-Host "Please enter the database name"
            $variables.Add("DATABASE_NAME", $db_name)
            $variables.Add("DATABASE_CUSTOM", "true")
            Write-Host "Your Database connection: ${db_dialect}://${db_username}:${db_pass}@${db_uri}:${db_port}/${db_name}" -ForegroundColor Yellow
            break;
        }
    }
    $variables.Add("DATABASE_DIALECT", $db_dialect)
    Write-Host "Database sucessfully setup" -ForegroundColor Green
} else {
    $variables.Add("DB_ENABLED", "false")
}

$twitter = Read-Host "Do you want to use the twitter bot? (y/n)"
if($twitter -like "y*") {
    Write-Host "Told you, not yet implemented" -ForegroundColor Red
    break;
    $variables.Add("TWITTER_ENABLED", "true")
    $twitter_token = Read-Host "Please enter your Twitter Auth Token" -MaskInput
    $twitter_token = if ($twitter_token) {$twitter_token} else {"null"}
    $variables.Add("TWITTER_TOKEN", $twitter_token)
    Write-Host "Twitter Bot sucessfully setup" -ForegroundColor Green
} else {
    $variables.Add("TWITTER_ENABLED", "false")
}

$callender = Read-Host "Do you want to use the callender? (y/n)"
if($callender -like "y*") {
    Write-Host "Told you, not yet implemented" -ForegroundColor Red
    break;
    $variables.Add("CALLENDER_ENABLED", "true")
    $callender_token = Read-Host "Please enter your Microsoft Calander Auth Token" -MaskInput
    $callender_token = if ($callender_token) {$callender_token} else {"null"}
    $variables.Add("CALLENDER_TOKEN", $callender_token)
    Write-Host "Microsoft Calander Bot sucessfully setup" -ForegroundColor Green
} else {
    $variables.Add("CALLENDER_ENABLED", "false")
}

$path = "..\app\.env"
New-Item -Path $path -ItemType File -Force -Value "#dotenv file - stores all app variables/flags`r`n"

$variables.GetEnumerator() | Sort-Object Name | ForEach-Object {"{0}={1}" -f $_.Name,$_.Value} | Add-Content -Path $path

if(Test-Path -Path $path){
    Write-Host "created .env file in 'app' dir" -ForegroundColor Green
} else {
    Write-Host ".env file could not be cerated" -ForegroundColor Red
}