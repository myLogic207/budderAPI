"use strict";
let LOG;

function connectDB() {
    const config = require(process.env.CONFIG);
    const { eLog, logLevel } = require(process.env.UTILS);
    const { Sequelize } = require("sequelize");
    const path = require('path');
    
    log(logLevel.DEBUG, "DATA", "Attempting to connect to UTIL database");
    const logbank = new Sequelize({
        host: 'localhost',
        dialect: 'sqlite',
        logging: () => { process.env.NODE_ENV === 'development' },
        // SQLite only
        storage: path.join(__dirname, 'data/UTIL.db')
    });
    log(logLevel.WARN, "DATA", "Logging database found/created");
    log(logLevel.DEBUG, "DATA", "Attempting to find Logbank");
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
    log(logLevel.DEBUG, "DATA", "Logbank found/created");
    return LOG;
}

module.exports = {
    initLog: () => {
        const config = require(process.env.CONFIG);
        const { eLog, logLevel } = require(process.env.UTILS);
        log(logLevel.DEBUG, "DATA", "Attempting to connect to logging database");
        LOG = connectDB();
        log(logLevel.INFO, "DATA", "Successfully connect to logging database");
        LOG.sync().then(() => {
            log(logLevel.STATUS, "DATA", "Synced logging database finished");
            return LOG;
        }).catch(err => {
            log(logLevel.WARN, "DATA", "Logging database initialization failed");
            log(logLevel.ERROR, "DATA", err);
        });
    },
    createLog: (severity, scope, message) => {
        const config = require(process.env.CONFIG);
        // DONT ELOG, IT WOULD LOG ITSELF
        try {
            if(process.env.NODE_ENV === 'development' || eLogLevel == 0) console.log("\x1b[35m[DEBUG] [DATA] Attempting to create new log entry\x1b[0m");
            LOG.create({
                severity: severity,
                scope: scope,
                message: message
            });
        } catch (error) {
            console.log("\x1b[31m[ERROR] [DATA] Logging failed with error:\x1b[0m " + error);
        }
        if(process.env.NODE_ENV === 'development' || eLogLevel == 0) console.log("\x1b[35m[DEBUG] [DATA] Logging complete - resync again\x1b[0m");
        LOG.sync();
    },
    readLog: function(logID){
        log(logLevel.INFO, "DATA", `Attempting to read log entry ${logID}`);
        if(logID){
            return LOG.findOne({
                where: {
                    id: logID
                }
            }).catch(console.error);
        } else {
            log(logLevel.WARN, "DATA", "No log ID provided - reading all logs");
            return LOG.findAll().catch(console.error);
        }
    }
}