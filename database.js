const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database('./myDatabase.db');

db.serialize(()=>{
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, name TEXT, score INTEGER)");
});

module.exports = db;