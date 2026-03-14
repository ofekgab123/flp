import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

let _initDone = false;

async function ensureInit() {
  if (!_initDone) {
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        "clientToken" TEXT PRIMARY KEY,
        "yitApiToken" TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    _initDone = true;
  }
}

export async function clientExists(clientToken: string): Promise<boolean> {
  await ensureInit();
  const sql = getSql();
  const rows = (await sql`SELECT 1 FROM clients WHERE "clientToken" = ${clientToken}`) as unknown[];
  return rows.length > 0;
}

export async function getYitApiToken(clientToken: string): Promise<string | null> {
  await ensureInit();
  const sql = getSql();
  const rows = (await sql`SELECT "yitApiToken" FROM clients WHERE "clientToken" = ${clientToken}`) as { yitApiToken: string }[];
  const row = rows[0];
  return row?.yitApiToken ?? null;
}

export async function insertClient(clientToken: string, yitApiToken: string): Promise<void> {
  await ensureInit();
  const sql = getSql();
  await sql`INSERT INTO clients ("clientToken", "yitApiToken") VALUES (${clientToken}, ${yitApiToken})`;
}

export interface ClientRow {
  clientToken: string;
  yitApiToken: string;
  createdAt: string;
}

export async function getAllClients(): Promise<ClientRow[]> {
  await ensureInit();
  const sql = getSql();
  const rows = (await sql`
    SELECT "clientToken", "yitApiToken", "createdAt"
    FROM clients
    ORDER BY "createdAt" DESC
  `) as { clientToken: string; yitApiToken: string; createdAt: Date }[];
  return rows.map(
    (r) => ({ ...r, createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt) })
  );
}

export async function getAdminToken(): Promise<string | null> {
  await ensureInit();
  const sql = getSql();
  const rows = (await sql`SELECT value FROM admin_settings WHERE key = 'adminToken'`) as { value: string }[];
  const row = rows[0];
  return row?.value ?? null;
}

export async function setAdminToken(token: string): Promise<void> {
  await ensureInit();
  const sql = getSql();
  await sql`
    INSERT INTO admin_settings (key, value) VALUES ('adminToken', ${token})
    ON CONFLICT (key) DO UPDATE SET value = ${token}
  `;
}

export async function deleteClient(clientToken: string): Promise<void> {
  await ensureInit();
  const sql = getSql();
  await sql`DELETE FROM clients WHERE "clientToken" = ${clientToken}`;
}
