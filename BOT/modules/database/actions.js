"use strict";

const { getRandomUUID } = require("../../scopes/CORE/bin/utils");

const { log, logLevel } = require(process.env.LOG);

let dataBases = [];

module.exports = {
    init: async (name) => {
        log(logLevel.INFO, "DATA", "Initializing DBMS");
        const config = require(process.env.CONFIG);

        log(logLevel.INFO, "DATA", "Finished initializing DBMS");
    },
    shutdown: async () => {
        log(logLevel.INFO, "DATA", "Shutting down DBMS");
        dataBases.forEach(db => {
            log(logLevel.INFO, "DATA", `Shutting down database ${db.name}`);
            db.close();
        });
        log(logLevel.STATUS, "DATA", "Successfully closed all database connections");
    },
    dbTypes: Object.freeze({
        integrated: "integrated",
        sql: "sql",
        mongodb: "mongodb"
    }),
    connectDB: async (connection, fields) => {
        connection = generateConnectionObject(connection);
        switch(connection.dialect){
            case "sqlite":

        }
    },
    querryDB: async (database, querry) => {
        
    }
};

// Example:
// mysql://10.10.10.10:1234/users
// integrated:///test (integrated will auto select the data directory)
function generateURL(connectionString) {
    const connectionParts = connectionString.split("/");
    const connection = {
        id: getRandomUUID(),
        dialect: connectionParts[0].slice(0, -1),
        host: connectionParts[2].split(":")[0] || "localhost",
        port: connectionParts[2].split(":")[1],
        path: connectionParts.slice(3).join("/"),
    };
    if(connection.dialect === module.exports.dbTypes.integrated) {
        connection.storage = `${process.env.TMP}${process.env.SEP}data${process.env.SEP}${connection.path}.db`;
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
