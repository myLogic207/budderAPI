const { Sequelize } = require("sequelize");
const path = require('path');

const logbank = new Sequelize({
    host: 'localhost',
    dialect: 'sqlite',
    logging: () => {process.env.ENV === 'dev'},
    // SQLite only
    storage: path.join(__dirname, 'data/UTIL.db')
});

const LOG = logbank.define('Logs', {
    logID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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

module.exports = {
    initLog: function(){
        LOG.sync().then(() => {
            console.log('[DATA] Logging Database synced.');
            LOG.create({
                logID: 0,
                scope: 'SCOPE',
                message: 'log message'
            }.catch((error) => {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    elog('[DATA] Using existing logging database.');
                }
                throw "[DATA] Logging database initialization failed.";
            }));
            return LOG;
        }).catch(console.error("[DATA] Logging database initialization failed."));
    },
    createLog: function(msg){
        try {
            LOG.create({
                scope: msg.split(" ")[0].slice(1,-1),
                message: msg.split(" ").slice(1).join(" ")
            });
        } catch (error) {
            console.log("[DATA] Logging failed with error: " + error);
        }
        LOG.sync();
    },
    readLog: function(logID){
        if(logID){
            return LOG.findOne({
                where: {
                    id: logID
                }
            }).catch(console.error);
        } else {
            return LOG.findAll().catch(console.error);
        }
    },
    logbase: LOG
}