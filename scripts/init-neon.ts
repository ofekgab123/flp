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
  console.log("✓ טבלאות clients, admin_settings נוצרו/קיימות");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
