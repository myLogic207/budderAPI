"use strict";

const { Sequelize } = require("sequelize");
const { cleanPath } = require("../../../scopes/CORE/bin/utils");
const { log, logLevel } = require(process.env.LOG);

module.exports = {
    connectInMemory: async () => {
        log(logLevel.DEBUG, "DATABASE-SQL", "Connecting to in-memory database");
        return new Sequelize('sqlite::memory:');
    },
    connectSQL: async (connection) => {
        log(logLevel.DEBUG, "DATABASE-SQL", "Attempting to connect to SQL database");
    
        const sequelize = new Sequelize(connection.url.href, {
            logging: msg => log(logLevel.FINE, `DATABASE-${connection.id}`, msg),
        });
    
        return finishConnection(sequelize);
    },
    connectIntegratedDB: async (connection, fields) => {
        log(logLevel.DEBUG, "DATABASE-SQL", "Creating integrated database");

        const sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: cleanPath(`${process.env.TMP}/data${connection.url.pathname}.db`),
        });

        return finishConnection(sequelize);
    },
    addTable: async (database, table) => {
        log(logLevel.DEBUG, "DATABASE-SQL", `Adding table ${table.name} to database ${database.name}`);
        const model = database.define(table.name, table.fields);
        await model.sync();
        return model;
    },
};

async function finishConnection(sequelize) {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
}