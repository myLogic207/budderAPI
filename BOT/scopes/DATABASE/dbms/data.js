const { Sequelize, Op, Model, DataTypes } = require("sequelize");
const path = require('path');
const { eLog } = require("../../UTIL/main");

module.exports = {
    newDB : function(name, Tags) {
        const db = new Sequelize({
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            logging: process.env.ENV,
            // SQLite only
            storage: path.join(__dirname, 'data/UTIL.log')
        });

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
            eLog('[DATA] Custom Database synced.');
            tags.authenticate().then(() => {
                eLog('[DATA] Custom Database authenticated.');
                return cdb;
            }).catch(err => {
                eLog('[DATA] Custom Database authentication failed with error: ' + err);
            });
        }).catch(() => {
            eLog('[DATA] Custom Database sync failed.');    
        });
    },  // end newDB
    createEntry: function(base, data) {
        base.create(data).catch(console.error);
    },
    readEntry: function(base, id) {
        if(id){
            return base.findOne({
                where: {
                    id: id
                }
            }).catch(console.error);
        } else {
            return base.findAll().catch(console.error);
        }
    }
}