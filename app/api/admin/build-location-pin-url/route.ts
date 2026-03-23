import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/db";
import { generateOtpPair } from "@/lib/otp";
import { isValidClientToken } from "@/app/location-pin/lib/yit";

export const dynamic = "force-dynamic";

const DEFAULT_LFP_BASE = "https://api.pickmeup.co.il";

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
 * POST /api/admin/build-location-pin-url
 * Header: Authorization: Bearer <admin token>
 * Body: { clientToken, city, street, house?: string, baseUrl?: string }
 * Returns: { url } — קישור מלא ל-/location-pin עם otp/otphash תקפים
 */
export async function POST(request: NextRequest) {
  const err = await verifyAdmin(request);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });

  const body = (await request.json().catch(() => ({}))) as {
    clientToken?: string;
    city?: string;
    street?: string;
    house?: string;
    baseUrl?: string;
  };

  const clientToken = (body.clientToken ?? "").trim();
  const city = (body.city ?? "").trim();
  const street = (body.street ?? "").trim();
  const house = (body.house ?? "").trim();
  const baseRaw = (body.baseUrl ?? "").trim() || DEFAULT_LFP_BASE;

  if (!clientToken) {
    return NextResponse.json({ error: "חסר clientToken" }, { status: 400 });
  }
  if (!isValidClientToken(clientToken)) {
    return NextResponse.json({ error: "clientToken לא תקין" }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json({ error: "חסרה עיר" }, { status: 400 });
  }
  if (!street) {
    return NextResponse.json({ error: "חסר רחוב" }, { status: 400 });
  }

  const { otp, otphash } = generateOtpPair();
  const base = baseRaw.replace(/\/$/, "");
  const params = new URLSearchParams();
  params.set("clientToken", clientToken);
  params.set("otp", otp);
  params.set("otphash", otphash);
  params.set("$city", city);
  params.set("$street", street);
  if (house) params.set("$house", house);

  const url = `${base}/location-pin?${params.toString()}`;
  return NextResponse.json({ url });
}
