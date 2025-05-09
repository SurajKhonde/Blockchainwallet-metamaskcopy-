const mysql = require('mysql2');
const dbConfig = require("./db.config.js");
const pool = mysql.createPool({
  connectionLimit: 10,
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  waitForConnections: true,
  queueLimit: 0
});

module.exports = pool.promise();


