import { NextRequest, NextResponse } from "next/server";

const YIT_API =
  "https://interfaceserviceapi.y-it.co.il/FcApiService/FcApiService.svc/InvokeFcApiService";
const AUTH_TOKEN = "b380dc34-6754-4b50-8a35-cd714f201d6a";

/**
 * POST /api/location-pin/yit
 * Body: { city, street, house?, lat, lng }
 * Proxies to YIT API (avoids CORS from browser).
 */
export async function POST(request: NextRequest) {
  let body: { city?: string; street?: string; house?: string; lat?: number; lng?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const city = body.city ?? "";
  const street = body.street ?? "";
  const house = body.house ?? "";
  const lat = body.lat;
  const lng = body.lng;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { success: false, message: "lat and lng are required" },
      { status: 400 }
    );
  }

  if (process.env.MOCK_YIT === "true") {
    return NextResponse.json({
      success: true,
      message: "הועבר בהצלחה (מצב פיתוח – לא נשלח ל-YIT)",
      fullResponse: { _mock: true, city, street, house, lat, lng },
    });
  }

  const formData = new URLSearchParams({
    authenticationToken: AUTH_TOKEN,
    $action: "set",
    $updateObject: "AddressCoordinates",
    $city: city,
    $street: street,
    $house: house,
    $lat: lat.toString(),
    $lng: lng.toString(),
  });

  try {
    const response = await fetch(YIT_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const text = await response.text();
    let fullResponse: { isSuccess?: boolean; message?: string; code?: number; data?: { returnCode?: number } };
    try {
      fullResponse = text ? JSON.parse(text) : {};
    } catch {
      console.error("[YIT proxy] Non-JSON response:", response.status, text?.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          message: "תשובה לא צפויה משרת YIT",
          fullResponse: { status: response.status, bodyPreview: text?.slice(0, 100) },
        },
        { status: 502 }
      );
    }

    const code = Number(fullResponse.code ?? 99);
    const errorMessages: Record<number, string> = {
      0: "הועבר בהצלחה",
      1: "שדה עיר חסר ($city)",
      2: "קו רוחב חסר ($lat)",
      3: "קו אורך חסר ($lng)",
      99: "שגיאת SQL",
    };
    const message = fullResponse.message ?? errorMessages[code] ?? "שגיאה לא ידועה";

    return NextResponse.json({
      success: code === 0 || fullResponse.isSuccess === true,
      message,
      fullResponse,
    });
  } catch (err) {
    console.error("[YIT proxy] Request failed:", err);
    return NextResponse.json(
      {
        success: false,
        message: "שגיאת תקשורת עם YIT",
        fullResponse: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
