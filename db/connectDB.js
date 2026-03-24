// db/connectDB.js
import mysql from "mysql2/promise";

// Debug environment variables
console.log("DB Environment Variables:", {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? "***" : "NOT SET",
  DB_NAME: process.env.DB_NAME,
});

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "6047",
  database: process.env.DB_NAME || "saas_meta",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log("Database config:", {
  ...config,
  password: config.password ? "***" : "NOT SET",
});

// Reuse pool across Next.js hot-reloads in development
const pool = global._mysqlPool ?? mysql.createPool(config);

if (process.env.NODE_ENV !== "production") {
  global._mysqlPool = pool;
}

export default pool;
