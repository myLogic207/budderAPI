"use strict";
const { Sequelize } = require("sequelize");
const path = require('path');
const config = require(process.env.CONFIG);
const { eLog, logLevel } = require(process.env.UTILS);

module.exports = {
    newDB : function(name, Tags) {
        log(logLevel.DEBUG, "DATA", "Attempting to build new database");
        const db = new Sequelize({
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            logging: process.env.NODE_ENV,
            // SQLite only
            storage: path.join(__dirname, 'data/UTIL.log')
        });
        log(logLevel.DEBUG, "DATA", "Attempting to build new Table");
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
            log(logLevel.STATUS, "DATA", "Custom Database synced");
            tags.authenticate().then(() => {
                log(logLevel.FINE, "DATA", "Custom Database Authenticated");
                return cdb;
            }).catch(err => {
                log(logLevel.WARN, "DATA", "Custom Database authentication failed");
                log(logLevel.ERROR, "DATA", err);
            });
        }).catch((err) => {
            log(logLevel.WARN, "DATA", "Custom Database sync failed.");
            log(logLevel.ERROR, "DATA", err);
            throw err;
        });
    },  // end newDB
    createEntry: function(table, data) {
        log(logLevel.DEBUG, "DATA", "Attempting to create new entry");
        table.create(data).catch(err => {
            log(logLevel.WARN, "DATA", "Failed to create new entry");
            log(logLevel.ERROR, "DATA", err);
        });
        table.sync();
    },
    readEntry: function(base, id) {
        log(logLevel.DEBUG, "DATA", "Attempting to read entry");
        if(id){
            return base.findOne({
                where: {
                    id: id
                }
            }).catch(err => {
                log(logLevel.WARN, "DATA", "Failed to read entry");
                log(logLevel.ERROR, "DATA", err);
            });
        } else {
            log(logLevel.WARN, "DATA", "No ID provided - returning all");
            return base.findAll().catch(console.error);
        }
    }
}