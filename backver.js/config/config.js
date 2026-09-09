const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "midatabase",
});

db.connect(function (err){
    if (err) throw err;
    console.log("Connected to database, success");
});

module.exports = db;