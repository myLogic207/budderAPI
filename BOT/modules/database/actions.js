"use strict";

const { getRandomUUID } = require("../../scopes/CORE/bin/utils");
const { initInMemoryDB, shutdownInMemoryDB } = require("./bin/dbms_sql");
const { connectMongoDB } = require("./bin/mongodb");

const { log, logLevel } = require(process.env.LOG);

let dataBases = [];

module.exports = {
    init: async (name) => {
        log(logLevel.INFO, "DATA", "Initializing DBMS");
        const { CONFIG } = require(process.env.CONFIG);
        // CONFIG("modules")[name]
        await initInMemoryDB();
        log(logLevel.INFO, "DATA", "Finished initializing DBMS");
    },
    shutdown: async () => {
        log(logLevel.INFO, "DATA", "Shutting down DBMS");
        await shutdownInMemoryDB();
        dataBases.forEach(db => {
            log(logLevel.INFO, "DATA", `Shutting down database ${db.name}`);
            db.close();
        });
        log(logLevel.STATUS, "DATA", "Successfully closed all database connections");
    },
    dbTypes: Object.freeze({
        inmemory: "memory",
        integrated: "integrated",
        sql: "sql", /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        mongodb: "mongodb"
    }),
    connectDB: async (fields, connection) => {
        connection = generateConnectionObject(connection);
        switch(connection.dialect){
            case this.dbTypes.inmemory:
                return connectInMemoryDB(fields);
            case this.dbTypes.integrated:
                return connectIntegratedDB(connection, fields);
            case this.dbTypes.mongodb:
                return await connectMongoDB(connection, fields);

        }
    },
    querryDB: async (database, querry) => {
        
    }
};

// Example:
// postgres://user:pass@example.com:5432/dbname
// mysql://10.10.10.10:1234/users
// integrated:///test (integrated will auto select the data directory)
function generateURL(connectionString) {
    const connectionParts = connectionString.split("/");
    const connection = {
        id: getRandomUUID(),
        url: validateConnectionURL(connectionString),
    };
    if(connection.dialect === module.exports.dbTypes.integrated) {
        connection.storage = `${process.env.TMP}${process.env.SEP}data${process.env.SEP}${connection.path}.db`;
    }
}

function validateConnectionURL(url) {
    const { URL } = require("url");
    const { log, logLevel } = require(process.env.LOG);

    try {
        const connectionURL = new URL(url);
        const dialect = connectionURL.protocol.replace(":", "");
        if(!module.exports.dbTypes[dialect]) {
            log(logLevel.ERROR, "DATA", `Invalid dialect: ${dialect}`);
            return false;
        }
        connectionURL.host ??= "localhost";
        connectionURL.hostname ??= "localhost";
        connectionURL.pathname ??= getRandomUUID();
        return connectionURL;
    } catch (error) {
        log(logLevel.ERROR, "DATA", `Invalid connection URL: ${url}`);
        return false;
    }
}

function generateTags(tags) {
    return tags.map(tag => {
        tag.type = resolveType(tag.type)(tag.length);
        delete tag.length;
        tag.primaryKey = false;
        return tag;
    });
}

function resolveType(type) {
    const { Sequelize } = require("sequelize");

    switch (type) {
        case "decimal":
            return Sequelize.DOUBLE;
        case "number":
            return Sequelize.INTEGER;
        case "boolean":
            return Sequelize.BOOLEAN;
        case "date":
            return Sequelize.DATE;
        case "object":
            return Sequelize.JSON;
        default:
            return Sequelize.STRING;
    }
}
