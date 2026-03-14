import { NextRequest, NextResponse } from "next/server";
import { getAllClients, getAdminToken, deleteClient } from "@/lib/db";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const adminToken = await getAdminToken();
  if (!adminToken) return { error: "טוקן אדמין לא הוגדר", status: 500 as const };
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token !== adminToken) {
    return { error: "טוקן אדמין לא נכון – וודא שהזנת את אותו טוקן ששמרת ב-/admin", status: 401 as const };
  }
  return null;
}

/**
 * GET /api/admin/clients
 * Header: Authorization: Bearer <admin token>
 * Returns list of all clients (clientToken, yitApiToken masked, createdAt).
 */
export async function GET(request: NextRequest) {
  const err = await verifyAdmin(request);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });

  const clients = await getAllClients();

  return NextResponse.json({
    clients: clients.map((c) => ({
      clientToken: c.clientToken,
      yitApiToken: c.yitApiToken,
      createdAt: c.createdAt,
    })),
  });
}

/**
 * DELETE /api/admin/clients
 * Header: Authorization: Bearer <admin token>
 * Body: { clientToken: string }
 */
export async function DELETE(request: NextRequest) {
  const err = await verifyAdmin(request);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });

  const body = await request.json().catch(() => ({}));
  const clientToken = typeof body.clientToken === "string" ? body.clientToken.trim() : "";
  if (!clientToken) {
    return NextResponse.json({ error: "חסר clientToken" }, { status: 400 });
  }

  await deleteClient(clientToken);
  return NextResponse.json({ success: true });
}
