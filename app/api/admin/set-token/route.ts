import { NextRequest, NextResponse } from "next/server";
import { setAdminToken } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  try {
    await setAdminToken(newToken);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[set-token]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה בשמירת טוקן" },
      { status: 500 }
    );
  }
}
