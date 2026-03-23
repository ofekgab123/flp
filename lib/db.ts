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
    await sql`
      CREATE TABLE IF NOT EXISTS save_requests (
        id SERIAL PRIMARY KEY,
        "clientToken" TEXT NOT NULL,
        city TEXT NOT NULL,
        street TEXT NOT NULL,
        house TEXT,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        "yitApiTokenMasked" TEXT NOT NULL,
        status TEXT NOT NULL,
        "yitResponse" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
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

export interface SaveRequestRow {
  id: number;
  clientToken: string;
  city: string;
  street: string;
  house: string | null;
  lat: number;
  lng: number;
  yitApiTokenMasked: string;
  status: string;
  yitResponse: string | null;
  createdAt: string;
}

export async function insertSaveRequest(params: {
  clientToken: string;
  city: string;
  street: string;
  house?: string;
  lat: number;
  lng: number;
  yitApiTokenMasked: string;
  status: "not_sent" | "sent" | "approved" | "rejected";
  yitResponse?: Record<string, unknown> | null;
}): Promise<void> {
  await ensureInit();
  const sql = getSql();
  const yitResponseStr = params.yitResponse != null ? JSON.stringify(params.yitResponse) : null;
  await sql`
    INSERT INTO save_requests ("clientToken", city, street, house, lat, lng, "yitApiTokenMasked", status, "yitResponse")
    VALUES (${params.clientToken}, ${params.city}, ${params.street}, ${params.house ?? ""}, ${params.lat}, ${params.lng}, ${params.yitApiTokenMasked}, ${params.status}, ${yitResponseStr})
  `;
}

function pickRowField(row: Record<string, unknown>, camel: string, lower: string): unknown {
  if (row[camel] !== undefined && row[camel] !== null) return row[camel];
  if (row[lower] !== undefined && row[lower] !== null) return row[lower];
  return undefined;
}

/** מנרמל תוצאת pg/Neon (לעיתים שמות עמודות באותיות קטנות) */
function normalizeSaveRequestRow(row: Record<string, unknown>): SaveRequestRow {
  const idRaw = pickRowField(row, "id", "id");
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw ?? 0);

  const clientToken = String(pickRowField(row, "clientToken", "clienttoken") ?? "");
  const city = String(pickRowField(row, "city", "city") ?? "");
  const street = String(pickRowField(row, "street", "street") ?? "");
  const houseRaw = pickRowField(row, "house", "house");
  const house = houseRaw == null || houseRaw === "" ? null : String(houseRaw);

  const latRaw = pickRowField(row, "lat", "lat");
  const lngRaw = pickRowField(row, "lng", "lng");
  const lat = typeof latRaw === "number" ? latRaw : Number(latRaw ?? NaN);
  const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw ?? NaN);

  const yitApiTokenMasked = String(
    pickRowField(row, "yitApiTokenMasked", "yitapitokenmasked") ?? ""
  );
  const status = String(pickRowField(row, "status", "status") ?? "");
  const yitResponseRaw = pickRowField(row, "yitResponse", "yitresponse");
  let yitResponse: string | null;
  if (yitResponseRaw == null) {
    yitResponse = null;
  } else if (typeof yitResponseRaw === "string") {
    yitResponse = yitResponseRaw;
  } else {
    yitResponse = JSON.stringify(yitResponseRaw);
  }

  const createdRaw = pickRowField(row, "createdAt", "createdat");
  let createdAt: string;
  if (createdRaw instanceof Date) {
    createdAt = createdRaw.toISOString();
  } else if (typeof createdRaw === "string" || typeof createdRaw === "number") {
    const d = new Date(createdRaw);
    createdAt = isNaN(d.getTime()) ? String(createdRaw) : d.toISOString();
  } else {
    createdAt = "";
  }

  return {
    id,
    clientToken,
    city,
    street,
    house,
    lat,
    lng,
    yitApiTokenMasked,
    status,
    yitResponse,
    createdAt,
  };
}

export async function getAllSaveRequests(): Promise<SaveRequestRow[]> {
  await ensureInit();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, "clientToken", city, street, house, lat, lng, "yitApiTokenMasked", status, "yitResponse", "createdAt"
    FROM save_requests
    ORDER BY "createdAt" DESC
    LIMIT 500
  `) as Record<string, unknown>[];
  return rows.map((r) => normalizeSaveRequestRow(r));
}
