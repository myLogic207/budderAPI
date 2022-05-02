"use strict";
require("dotenv").config();

let LOG;

function connectDB() {
    const config = require("../../../config.json");
    const { eLog } = require(`${config.eLog.utilPath}${config.pathSep}actions`);
    const logLevel = require(`${config.eLog.utilPath}${config.pathSep}logLevels`);
    const { Sequelize } = require("sequelize");
    const path = require('path');
    
    eLog(logLevel.DEBUG, "DATA", "Attempting to connect to UTIL database");
    const logbank = new Sequelize({
        host: 'localhost',
        dialect: 'sqlite',
        logging: () => { process.env.NODE_ENV === 'development' },
        // SQLite only
        storage: path.join(__dirname, 'data/UTIL.db')
    });
    eLog(logLevel.WARN, "DATA", "Logging database found/created");
    eLog(logLevel.DEBUG, "DATA", "Attempting to find Logbank");
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
    eLog(logLevel.DEBUG, "DATA", "Logbank found/created");
    return LOG;
}

module.exports = {
    initLog: () => {
        const config = require("../../../config.json");
        const { eLog } = require(`${config.eLog.utilPath}${config.pathSep}actions`);
        const logLevel = require(`${config.eLog.utilPath}${config.pathSep}logLevels`);
        eLog(logLevel.DEBUG, "DATA", "Attempting to connect to logging database");
        LOG = connectDB();
        eLog(logLevel.INFO, "DATA", "Successfully connect to logging database");
        LOG.sync().then(() => {
            eLog(logLevel.STATUS, "DATA", "Synced logging database finished");
            return LOG;
        }).catch(err => {
            eLog(logLevel.ERROR, "DATA", "Logging database initialization failed");
            console.error(err);
        });
    },
    createLog: (severity, scope, message) => {
        const eLogLevel = require("../../../config.json").eLog.level;
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
        eLog(logLevel.INFO, "DATA", `Attempting to read log entry ${logID}`);
        if(logID){
            return LOG.findOne({
                where: {
                    id: logID
                }
            }).catch(console.error);
        } else {
            eLog(logLevel.WARN, "DATA", "No log ID provided - reading all logs");
            return LOG.findAll().catch(console.error);
        }
    }
}