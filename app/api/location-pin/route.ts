import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/location-pin
 * Query (only these): $city=cityName&$street=streetName&$house=houseNumber
 * Returns URL to open LocationPin in a new window at 25% of screen.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("$city") ?? "";
  const street = searchParams.get("$street") ?? "";
  const house = searchParams.get("$house") ?? "";

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (request.nextUrl.origin || "http://localhost:3000");

  const params = new URLSearchParams();
  if (city) params.set("$city", city);
  if (street) params.set("$street", street);
  if (house) params.set("$house", house);
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
