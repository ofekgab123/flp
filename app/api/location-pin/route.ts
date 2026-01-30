import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/location-pin
 * Query: $city / city, $street / street, $house / house, address_type?, callback_url?
 * Supports both formats: $city=... and city=...
 * Returns URL to open LocationPin in a new window at 25% of screen.
 */
function getParam(sp: URLSearchParams, a: string, b: string): string {
  return sp.get(a) ?? sp.get(b) ?? "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = getParam(searchParams, "$city", "city");
  const street = getParam(searchParams, "$street", "street");
  const house = getParam(searchParams, "$house", "house");
  const address_type = searchParams.get("address_type") ?? "";
  const callback_url = searchParams.get("callback_url") ?? "";

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request.nextUrl.origin || "http://localhost:3000");

  const params = new URLSearchParams();
  if (city) params.set("$city", city);
  if (street) params.set("$street", street);
  if (house) params.set("$house", house);
  if (address_type) params.set("address_type", address_type);
  if (callback_url) params.set("callback_url", callback_url);
  params.set("in_popup", "true");

  const locationPinPath = `/location-pin?${params.toString()}`;
  const url = `${base}${locationPinPath}`;

  return NextResponse.json({
    url,
    widthPercent: 25,
    heightPercent: 25,
    openInNewWindow: true,
  });
}
