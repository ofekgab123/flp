import { NextResponse } from "next/server";
import { getAdminToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getAdminToken();
  return NextResponse.json({ exists: !!token });
}
