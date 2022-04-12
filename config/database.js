// jshint esversion:6

const mariadb = require("mariadb");
require("dotenv").config();

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	connectionLimit: process.env.DB_CONNECTION_LIMIT
});

exports.pool = pool;
