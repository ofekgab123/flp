/**
 * מאתחל את הטבלאות ב-Neon PostgreSQL.
 * הרצה: DATABASE_URL='postgresql://...' npx tsx scripts/init-neon.ts
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("נדרש: DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);

async function main() {
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
  console.log("✓ טבלאות clients, admin_settings, save_requests נוצרו/קיימות");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
