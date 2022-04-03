require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require('path');

if(process.env.NODE_ENV === 'development') console.log("\x1b[35m[DEBUG] [DATA] Attempting to connect to UTIL database\x1b[0m");
const logbank = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: () => {process.env.NODE_ENV === 'development'},
    // SQLite only
    storage: path.join(__dirname, 'data/UTIL.db')
});
console.log("\x1b[34m[STATUS] [DATA] Logging database found/created\x1b[0m");
if(process.env.NODE_ENV === 'development') console.log("\x1b[35m[DEBUG] [DATA] Attempting to find Logbank\x1b[0m");
const LOG = logbank.define('Logs', {
    logID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    severity: {
        type: Sequelize.STRING,
        allowNull: true
    },
	scope: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    message: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
});
if(process.env.NODE_ENV === 'development') console.log("\x1b[34m[STATUS] [DATA] Logbank found/created\x1b[0m");

module.exports = {
    initLog: function(){
        if(process.env.NODE_ENV === 'development') console.log("\x1b[35m[DEBUG] [DATA] Attempting to initialize logging database\x1b[0m");
        LOG.sync().then(() => {
            console.log('\x1b[34m[STATUS] [DATA] Logging Database synced\x1b[0m');
            LOG.create({
                logID: 0,
                severity: 'SEVERITY',
                scope: 'SCOPE',
                message: 'log message'
            }.catch((error) => {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    console.log('[INFO] [DATA] Using existing logging database.');
                }
                throw "\x1b[31m[ERROR] [DATA] Logging database initialization failed\x1b[0m";
            }));
            return LOG;
        }).catch(console.error("\x1b[31m[ERROR] [DATA] Logging database initialization failed\x1b[0m"));
    },
    createLog: function(msg){
        try {
            if(process.env.NODE_ENV === 'development') console.log("\x1b[35m[DEBUG] [DATA] Attempting to create new log entry\x1b[0m");
            LOG.create({
                severity: msg[0].slice(1, -1),
                scope: msg[1].slice(1, -1),
                message: msg[2]
            });
        } catch (error) {
            console.log("\x1b[31m[ERROR] [DATA] Logging failed with error:\x1b[0m " + error);
        }
        if(process.env.NODE_ENV === 'development') console.log("\x1b[35m[DEBUG] [DATA] Logging complete - resync again\x1b[0m");
        LOG.sync();
    },
    readLog: function(logID){
        if(process.env.NODE_ENV === 'development') console.log("\x1b[35m[DEBUG] [DATA] Attempting to read log entry\x1b[0m");
        if(logID){
            return LOG.findOne({
                where: {
                    id: logID
                }
            }).catch(console.error);
        } else {
            console.log("\x1b[31m[WARN] [DATA] No log ID provided - reading all logs\x1b[0m");
            return LOG.findAll().catch(console.error);
        }
    },
    logbase: LOG
}