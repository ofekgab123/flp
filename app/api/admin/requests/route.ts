import { NextRequest, NextResponse } from "next/server";
import { getAllSaveRequests, getAdminToken } from "@/lib/db";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const adminToken = await getAdminToken();
  if (!adminToken) return { error: "טוקן אדמין לא הוגדר", status: 500 as const };
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token !== adminToken) {
    return { error: "טוקן אדמין לא נכון", status: 401 as const };
  }
  return null;
}

/**
 * GET /api/admin/requests
 * Header: Authorization: Bearer <admin token>
 * Returns list of save requests (clientToken, params, date, yitToken masked, status).
 */
export async function GET(request: NextRequest) {
  const err = await verifyAdmin(request);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });

  try {
    const requests = await getAllSaveRequests();
    return NextResponse.json({ requests, total: requests.length });
  } catch (e) {
    console.error("[admin/requests] getAllSaveRequests:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "שגיאת מסד נתונים",
        requests: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
