const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: true,
  });
  await conn.query(sql);
  await conn.end();
  console.log("Database schema applied.");
}

main().catch((err) => {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
});
