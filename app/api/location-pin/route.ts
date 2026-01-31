import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/location-pin
 * Query: clientToken?, $city / city, $street / street, $house / house, callback_url?
 * Supports both formats: $city=... and city=...
 * Returns JSON: { url, widthPercent, heightPercent, openInNewWindow }.
 * IMPORTANT: Open the returned `url` in the popup (it points to /location-pin), NOT this API path (/api/location-pin).
 * clientToken is passed through and sent to YIT as token.
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

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request.nextUrl.origin || "http://localhost:3000");

  const params = new URLSearchParams();
  if (clientToken) params.set("clientToken", clientToken);
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
