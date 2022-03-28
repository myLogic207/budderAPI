const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const path = require('path');
const eLogPath = require("../../../config.json").eLog.eLogPath;
const { eLog } = require(eLogPath);

module.exports = {
    newDB : function(name, Tags) {
        eLog("[DEBUG] [DATA] Attempting to build new database");
        const db = new Sequelize({
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            logging: process.env.ENV,
            // SQLite only
            storage: path.join(__dirname, 'data/UTIL.log')
        });

        eLog("[DEBUG] [DATA] Attempting to build new Table");
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
            eLog('[STATUS] [DATA] Custom Database synced');
            tags.authenticate().then(() => {
                eLog('[FINE] [DATA] Custom Database authenticated');
                return cdb;
            }).catch(err => {
                eLog('[ERROR] [DATA] Custom Database authentication failed with error: ' + err);
            });
        }).catch(() => {
            eLog('[ERROR] [DATA] Custom Database sync failed.');    
        });
    },  // end newDB
    createEntry: function(base, data) {
        eLog("[DEBUG] [DATA] Attempting to create new entry");
        base.create(data).catch(console.error);
    },
    readEntry: function(base, id) {
        eLog("[DEBUG] [DATA] Attempting to read entry");
        if(id){
            return base.findOne({
                where: {
                    id: id
                }
            }).catch(console.error);
        } else {
            eLog("[WARN] [DATA] No ID provided - returning all");
            return base.findAll().catch(console.error);
        }
    }
}