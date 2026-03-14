import { NextRequest, NextResponse } from "next/server";
import { getYitApiToken } from "@/lib/db";
import { isValidClientToken } from "@/app/location-pin/lib/yit";
import { YIT_DEFAULT_API_URL } from "@/app/location-pin/lib/yit";

const ERROR_MESSAGES: Record<number, string> = {
  0: "הועבר בהצלחה",
  1: "שדה עיר חסר ($city)",
  2: "קו רוחב חסר ($lat)",
  3: "קו אורך חסר ($lng)",
  99: "שגיאת SQL",
};

/**
 * POST /api/location-pin/save
 * Body: { clientToken, city, street, house?, lat, lng }
 * מתרגם clientToken ל-yitApiToken ושולח ל-YIT.
 */
export async function POST(request: NextRequest) {
  let body: {
    clientToken?: string;
    city?: string;
    street?: string;
    house?: string;
    lat?: number;
    lng?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const clientToken = (body.clientToken ?? "").trim();
  const city = (body.city ?? "").trim();
  const street = (body.street ?? "").trim();
  const house = body.house ?? "";
  const lat = body.lat;
  const lng = body.lng;

  if (!clientToken) {
    return NextResponse.json(
      { success: false, message: "לא נשלח clientToken" },
      { status: 400 }
    );
  }
  if (!isValidClientToken(clientToken)) {
    return NextResponse.json(
      { success: false, message: "clientToken לא תקין" },
      { status: 400 }
    );
  }

  const yitApiToken = getYitApiToken(clientToken);
  if (!yitApiToken) {
    return NextResponse.json(
      { success: false, message: "clientToken לא קיים במערכת" },
      { status: 400 }
    );
  }

  if (!city) {
    return NextResponse.json(
      { success: false, message: "שדה עיר חסר ($city)" },
      { status: 400 }
    );
  }
  if (!street) {
    return NextResponse.json(
      { success: false, message: "שדה רחוב חסר ($street)" },
      { status: 400 }
    );
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json(
      { success: false, message: "lat ו-lng נדרשים" },
      { status: 400 }
    );
  }

  const apiUrl =
    (process.env.YIT_API_URL ?? "").trim() || YIT_DEFAULT_API_URL;

  if (process.env.MOCK_YIT === "true") {
    return NextResponse.json({
      success: true,
      message: "הועבר בהצלחה (מצב פיתוח – לא נשלח ל-YIT)",
      fullResponse: { _mock: true, city, street, house, lat, lng },
    });
  }

  try {
    const formData = new URLSearchParams({
      authenticationToken: yitApiToken,
      $action: "set",
      $updateObject: "AddressCoordinates",
      $city: city,
      $street: street,
      $house: house,
      $lat: lat.toString(),
      $lng: lng.toString(),
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const text = await response.text();
    let fullResponse: {
      isSuccess?: boolean;
      message?: string;
      code?: number;
      data?: { returnCode?: number };
    };
    try {
      fullResponse = text ? JSON.parse(text) : {};
    } catch {
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
    const message =
      fullResponse.message ?? ERROR_MESSAGES[code] ?? "שגיאה לא ידועה";
    const success = code === 0 || fullResponse.isSuccess === true;

    return NextResponse.json({
      success,
      message,
      fullResponse,
    });
  } catch (err) {
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
