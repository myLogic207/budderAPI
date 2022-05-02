const { Sequelize } = require("sequelize");
const path = require('path');
const config = require("../../../config.json");
const { eLog } = require(`${config.eLog.utilPath}${config.pathSep}actions`);
const logLevel = require(`${config.eLog.utilPath}${config.pathSep}logLevels`);

module.exports = {
    newDB : function(name, Tags) {
        eLog(logLevel.DEBUG, "DATA", "Attempting to build new database");
        const db = new Sequelize({
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            logging: process.env.NODE_ENV,
            // SQLite only
            storage: path.join(__dirname, 'data/UTIL.log')
        });
        eLog(logLevel.DEBUG, "DATA", "Attempting to build new Table");
        const cdb = db.define(name, {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            timestamp: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }}.append(Tags));

        tags.sync().then(() => {
            eLog(logLevel.STATUS, "DATA", "Custom Database synced");
            tags.authenticate().then(() => {
                eLog(logLevel.FINE, "DATA", "Custom Database Authenticated");
                return cdb;
            }).catch(err => {
                eLog(logLevel.ERROR, "DATA", "Custom Database authentication failed with error: " + err);
            });
        }).catch(() => {
            eLog(logLevel.ERROR, "DATA", "Custom Database sync failed.");    
        });
    },  // end newDB
    createEntry: function(table, data) {
        eLog(logLevel.DEBUG, "DATA", "Attempting to create new entry");
        table.create(data).catch(console.error);
        table.sync();
    },
    readEntry: function(base, id) {
        eLog(logLevel.DEBUG, "DATA", "Attempting to read entry");
        if(id){
            return base.findOne({
                where: {
                    id: id
                }
            }).catch(console.error);
        } else {
            eLog(logLevel.WARN, "DATA", "No ID provided - returning all");
            return base.findAll().catch(console.error);
        }
    }
}