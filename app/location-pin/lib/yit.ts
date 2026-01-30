const YIT_API =
  "https://interfaceserviceapi.y-it.co.il/FcApiService/FcApiService.svc/InvokeFcApiService";

/** Token מיועד לסביבת פיתוח בלבד – ב-production להגדיר NEXT_PUBLIC_YIT_AUTH_TOKEN */
const YIT_AUTH_TOKEN =
  process.env.NEXT_PUBLIC_YIT_AUTH_TOKEN ??
  "b380dc34-6754-4b50-8a35-cd714f201d6a";

export interface SendToYITParams {
  city: string;
  street: string;
  house?: string;
  lat: number;
  lng: number;
}

export interface SendToYITResult {
  success: boolean;
  message: string;
  fullResponse: unknown;
}

const ERROR_MESSAGES: Record<number, string> = {
  0: "הועבר בהצלחה",
  1: "שדה עיר חסר ($city)",
  2: "קו רוחב חסר ($lat)",
  3: "קו אורך חסר ($lng)",
  99: "שגיאת SQL",
};

/**
 * שולח מיקום ל-YIT לאחר לחיצה על "שמור מיקום".
 * פרמטרים: authenticationToken (בלי $), $action, $updateObject, $city, $street, $house, $lat, $lng.
 */
export async function sendToYIT(data: SendToYITParams): Promise<SendToYITResult> {
  try {
    const formData = new URLSearchParams({
      authenticationToken: YIT_AUTH_TOKEN,
      $action: "set",
      $updateObject: "AddressCoordinates",
      $city: data.city,
      $street: data.street,
      $house: data.house ?? "",
      $lat: data.lat.toString(),
      $lng: data.lng.toString(),
    });

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
      return {
        success: false,
        message: "תשובה לא צפויה משרת YIT",
        fullResponse: { status: response.status, bodyPreview: text?.slice(0, 100) },
      };
    }

    const code = Number(fullResponse.code ?? 99);
    const message =
      fullResponse.message ?? ERROR_MESSAGES[code] ?? "שגיאה לא ידועה";

    return {
      success: code === 0 || fullResponse.isSuccess === true,
      message,
      fullResponse,
    };
  } catch (err) {
    return {
      success: false,
      message: "שגיאת תקשורת עם YIT",
      fullResponse: err,
    };
  }
}
