import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "clients.db");

// Ensure the data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        clientToken TEXT PRIMARY KEY,
        yitApiToken TEXT NOT NULL,
        createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  return _db;
}

export function clientExists(clientToken: string): boolean {
  const row = getDb()
    .prepare("SELECT 1 FROM clients WHERE clientToken = ?")
    .get(clientToken);
  return !!row;
}

export function getYitApiToken(clientToken: string): string | null {
  const row = getDb()
    .prepare("SELECT yitApiToken FROM clients WHERE clientToken = ?")
    .get(clientToken) as { yitApiToken: string } | undefined;
  return row?.yitApiToken ?? null;
}

export function insertClient(clientToken: string, yitApiToken: string): void {
  getDb()
    .prepare("INSERT INTO clients (clientToken, yitApiToken) VALUES (?, ?)")
    .run(clientToken, yitApiToken);
}

export interface ClientRow {
  clientToken: string;
  yitApiToken: string;
  createdAt: string;
}

export function getAllClients(): ClientRow[] {
  const rows = getDb()
    .prepare("SELECT clientToken, yitApiToken, createdAt FROM clients ORDER BY createdAt DESC")
    .all() as ClientRow[];
  return rows;
}

export function getAdminToken(): string | null {
  const row = getDb()
    .prepare("SELECT value FROM admin_settings WHERE key = ?")
    .get("adminToken") as { value: string } | undefined;
  return row?.value ?? null;
}

export function setAdminToken(token: string): void {
  getDb()
    .prepare(
      "INSERT INTO admin_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run("adminToken", token);
}

export function deleteClient(clientToken: string): void {
  getDb().prepare("DELETE FROM clients WHERE clientToken = ?").run(clientToken);
}
