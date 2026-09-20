const mysql = require("mysql2/promise");

function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "white_label_ai_demo",
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = { createPool };
