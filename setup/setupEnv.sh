printf "============================================================\n"
printf "Starting setup .env variables...\n"
printf "In the following you will be asked for mandatory (ond optional) information\n"
printf "that is required to setup the environment.\n"
printf "Please make sure you have the following information (if needed) before you continue:\n"
printf "\033[0;31mAlso Note that tokens should never be shared with anyone\033[0m\n"

# Main Application variables, needed at all cost
printf "\033[0;35m[Required by Application]\033[0m - "
printf "Hostname and Port where your application should run\n"

# Discord Bot variables, recommended
printf "\033[0;35m[Required by Discord]\033[0m - "
printf "Discord Bot Auth Token, it's userID and your main Servers guildID\n" 

# Database variables, optional
printf "\033[0;35m[Required by Database]\033[0m - "
printf "Hostname and Port where your Database is running - "
printf "\033[0;31mWARN: NOT YET IMPLEMENTED\033[0m\n"
printf "\033[0;36mNote: Budder-Bot comes with it's own SQLite database\033[0m\n"

# Twitter variables, optional
printf "\033[0;35m[Required by Twitter]\033[0m - "
printf "Twitter Auth Token - "
printf "\033[0;31mWARN: NOT YET IMPLEMENTED\033[0m\n"

# Calender variables, recommended
printf "\033[0;35m[Required by Callender]\033[0m - "
printf "Microsoft Calander Auth token - "
printf "\033[0;31mWARN: NOT YET IMPLEMENTED\033[0m\n"

read -p "If all the needed information is at hand press enter to continue..."
# Create .env file
env_path="../app/sh.env"
touch ${env_path}
echo -e "#dotenv file - stores all app variables/flags" > ${env_path}
printf To use the default values, just press enter

# Set Aplication Variables
read -p "Please enter the hostname (ip) where your application should run (default: localhost):" app_ip
if [ -z "$app_ip" ]
then
    app_ip="localhost"
fi
echo -e "APP_HOST=${app_ip}" >> ${env_path}
read -p "Please enter the port where your application should run (default: 2070):" app_port
if [ -z "$app_port" ]
then
    app_port="2070"
fi
echo -e "APP_PORT=${app_port}" >> ${env_path}
printf "\033[0;32mYour application will now run on: \"http://${app_ip}:${app_port}/\"\033[0m\n";

# Discord Bot settings
read -p "Do you want to use the discord bot? (y/n):" discord
# if discord is y
if [ "$discord" = "y" ]
then
    read -p "Please enter your Discord Bot Auth Token:" discord_token
    echo -e "DISCORD_TOKEN=${discord_token}" >> ${env_path}
    read -p "Please enter your Discord Bot ClientID:" discord_clientid
    echo -e "DISCORD_CLIENTID=${discord_clientid}" >> ${env_path}
    read -p "Please enter your Discord Bot GuildID:" discord_guildid
    echo -e "DISCORD_GUILDID=${discord_guildid}" >> ${env_path}
fi

# Database settings
read -p "Do you want to use the database? (y/n):" db
if [ "$db" = "y" ]
then
    printf "Please enter the database type, options are: sqlite, mysql, mariadb, postgres, mssql (default: sqlite, enter sqlite for custom sqlite database):"
    read db_type
    case "$db_type" in
        "")
            echo -e "DATABASE_CUSTOM=false" >> ${env_path}
            echo -e "DATABASE_DIALECT=sqlite" >> ${env_path}
            printf "\033[0;33mUsing integrated sqlite database\033[0m\n"
            ;;
        sqlite)
            echo -e "DATABASE_CUSTOM=true" >> ${env_path}
            echo -e "DATABASE_DIALECT=sqlite" >> ${env_path}
            read -p "Please enter the path to your sqlite database file:" db_path
            echo -e "DATABASE_PATH=${db_path}" >> ${env_path}
            printf "\033[0;33mCustom sqlite database stored at ${db_path}\033[0m\n"
            ;;
        *)
            echo -e "DATABASE_CUSTOM=true" >> ${env_path}
            echo -e "DATABASE_DIALECT=${db_type}" >> ${env_path}
            read -p "Please enter the hostname (ip) where your database is running:" db_host
            echo -e "DATABASE_HOST=${db_host}" >> ${env_path}
            read -p "Please enter the port where your database is running:" db_port
            echo -e "DATABASE_PORT=${db_port}" >> ${env_path}
            read -p "Please enter the database name:" db_name
            echo -e "DATABASE_NAME=${db_name}" >> ${env_path}
            read -p "Please enter the database username:" db_user
            echo -e "DATABASE_USER=${db_user}" >> ${env_path}
            read -p "Please enter the database password:" db_pass
            echo -e "DATABASE_PASS=${db_pass}" >> ${env_path}
            printf "\033[0;33mUsing custom database at \"${db_type}://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}\"\033[0m\n"
            ;;
    esac
fi

# Twitter setting
printf "Do you want to use the twitter bot? (y/n):"
read twitter
if [ "$twitter" = "y" ]
then
    read -p "Please enter your Twitter Auth Token:" twitter_token
    echo -e "TWITTER_TOKEN=${twitter_token}" >> ${env_path}
fi

# Calander settings
read -p "Do you want to use the calander bot? (y/n):" calander
if [ "$calander" = "y" ]
then
    read -p "Please enter your Calander Auth Token:" calander_token
    echo -e "CALANDER_TOKEN=${calander_token}" >> ${env_path}
fi

if [ -f "$env_path" ]
then
    printf "\033[0;32mSuccessfully created .env file\033[0m\n"
else
    printf "\033[0;31mFailed to create .env file\033[0m\n"
fi

printf "============================================================"