import { NextRequest, NextResponse } from "next/server";
import { isValidClientToken } from "@/app/location-pin/lib/yit";
import { clientExists } from "@/lib/db";
import { validateOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";

/**
 * GET /api/location-pin
 * Query: clientToken?, otp, otphash, $city / city, $street / street, $house / house, callback_url?
 * Supports both formats: $city=... and city=...
 * Returns JSON: { url, widthPercent, heightPercent, openInNewWindow }.
 * IMPORTANT: Open the returned `url` in the popup (it points to /location-pin), NOT this API path (/api/location-pin).
 * clientToken must be UUID format (8-4-4-4-12). If provided and invalid, returns 400 with "clientToken לא תקין".
 * When clientToken is provided. otp and otphash are required. otp = unix_timestamp + 300, otphash = MD5(otp).
 */
function getParam(sp: URLSearchParams, a: string, b: string): string {
  return sp.get(a) ?? sp.get(b) ?? "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = getParam(searchParams, "$city", "city");
  const street = getParam(searchParams, "$street", "street");
  const house = getParam(searchParams, "$house", "house");
  const clientToken = searchParams.get("clientToken") ?? "";
  const callback_url = searchParams.get("callback_url") ?? "";
  const otp = searchParams.get("otp") ?? "";
  const otphash = searchParams.get("otphash") ?? "";

  if (clientToken) {
    const otpResult = validateOtp(otp, otphash);
    if (!otpResult.valid) {
      return NextResponse.json(
        { error: otpResult.error ?? "חסר אימות OTP" },
        { status: 400 }
      );
    }
  }

  if (clientToken && !isValidClientToken(clientToken)) {
    return NextResponse.json(
      { error: "clientToken לא תקין" },
      { status: 400 }
    );
  }
  if (clientToken && !(await clientExists(clientToken))) {
    return NextResponse.json(
      { error: "clientToken לא קיים במערכת" },
      { status: 400 }
    );
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request.nextUrl.origin || "http://localhost:3000");

  const params = new URLSearchParams();
  if (clientToken) params.set("clientToken", clientToken);
  if (otp) params.set("otp", otp);
  if (otphash) params.set("otphash", otphash);
  if (city) params.set("$city", city);
  if (street) params.set("$street", street);
  if (house) params.set("$house", house);
  if (callback_url) params.set("callback_url", callback_url);

  const locationPinPath = `/location-pin?${params.toString()}`;
  const url = `${base}${locationPinPath}`;

  return NextResponse.json({
    url,
    widthPercent: 25,
    heightPercent: 25,
    openInNewWindow: true,
  });
}
