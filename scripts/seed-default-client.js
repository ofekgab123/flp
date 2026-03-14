/**
 * יוצר client token ברירת מחדל:
 * clientToken = b380dc34-6754-4b50-8a35-cd714f201d6a
 * yitApiToken = b380dc34-6754-4b50-8a35-cd714f201d6a
 *
 * הרצה: node scripts/seed-default-client.js
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "clients.db");
const CLIENT_TOKEN = "b380dc34-6754-4b50-8a35-cd714f201d6a";
const YIT_API_TOKEN = "b380dc34-6754-4b50-8a35-cd714f201d6a";

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    clientToken TEXT PRIMARY KEY,
    yitApiToken TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.prepare(
  "INSERT OR REPLACE INTO clients (clientToken, yitApiToken, createdAt) VALUES (?, ?, datetime('now'))"
).run(CLIENT_TOKEN, YIT_API_TOKEN);

db.close();
console.log("✓ Client נוצר:", CLIENT_TOKEN, "→ yitApiToken:", YIT_API_TOKEN);
