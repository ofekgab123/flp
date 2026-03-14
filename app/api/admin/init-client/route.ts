import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { insertClient, clientExists, getAdminToken } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/init-client
 * Header: Authorization: Bearer <admin token from /admin>
 * Body: { yitApiToken: string }
 *
 * Generates a new clientToken for the given YIT API token and stores
 * the mapping in the database. Returns the generated clientToken.
 */
export async function POST(request: NextRequest) {
  const adminToken = await getAdminToken();
  if (!adminToken) {
    return NextResponse.json(
      { error: "טוקן אדמין לא הוגדר – יש להגדיר ב-/admin" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || token !== adminToken) {
    return NextResponse.json(
      { error: "טוקן אדמין לא נכון – וודא שהזנת את אותו טוקן ששמרת ב-/admin" },
      { status: 401 }
    );
  }

  let body: { yitApiToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const yitApiToken = (body.yitApiToken ?? "").trim();
  if (!yitApiToken) {
    return NextResponse.json(
      { error: "yitApiToken חסר" },
      { status: 400 }
    );
  }

  let clientToken: string;
  do {
    clientToken = randomUUID();
  } while (await clientExists(clientToken));

  await insertClient(clientToken, yitApiToken);

  return NextResponse.json({ clientToken }, { status: 201 });
}
