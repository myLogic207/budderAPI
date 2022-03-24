require ("dotenv").config();

function selectDB(){   
    if(process.env.DATABSE_CUSTOM){
        return require('./dbm/' + process.env.DATABASE_DIALECT);
    } else {
        return require('./dbm/integrated');
    }
}

function initDB(data){
    data.Test.sync().then(() => {
        console.log('[INFO] Database synced.');
    }).catch(console.error);
}

module.exports = {
    useDB: function(){
        const db = selectDB();
        initDB(db)
        return db
    }
};
