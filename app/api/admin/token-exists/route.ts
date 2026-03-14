import { NextResponse } from "next/server";
import { getAdminToken } from "@/lib/db";

export async function GET() {
  const token = getAdminToken();
  return NextResponse.json({ exists: !!token });
}
