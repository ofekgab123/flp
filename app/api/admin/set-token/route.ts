import { NextRequest, NextResponse } from "next/server";
import { setAdminToken } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const newToken = (body.token ?? "").trim();
  if (!newToken) {
    return NextResponse.json(
      { error: "token חסר" },
      { status: 400 }
    );
  }

  setAdminToken(newToken);
  return NextResponse.json({ success: true });
}
