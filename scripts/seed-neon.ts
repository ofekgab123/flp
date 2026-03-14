/**
 * יוצר client token ברירת מחדל ב-Neon.
 * הרצה: DATABASE_URL='postgresql://...' npx tsx scripts/seed-neon.ts
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("נדרש: DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);
const CLIENT_TOKEN = "b380dc34-6754-4b50-8a35-cd714f201d6a";
const YIT_API_TOKEN = "b380dc34-6754-4b50-8a35-cd714f201d6a";

async function main() {
  await sql`
    INSERT INTO clients ("clientToken", "yitApiToken")
    VALUES (${CLIENT_TOKEN}, ${YIT_API_TOKEN})
    ON CONFLICT ("clientToken") DO UPDATE SET "yitApiToken" = ${YIT_API_TOKEN}
  `;
  console.log("✓ Client נוצר:", CLIENT_TOKEN, "→ yitApiToken:", YIT_API_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
