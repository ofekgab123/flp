import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  const stored = await getAdminToken();
  if (!token || !stored || token !== stored) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
  return NextResponse.json({ valid: true });
}
