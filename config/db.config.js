require('dotenv').config();
module.exports = {
  HOST:process.env.HOST,
  USER:process.env.USER_ID,
  PASSWORD: process.env.PASSWORD,
  DB: process.env.DB_NAME,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  }
};