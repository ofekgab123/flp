export const YIT_DEFAULT_API_URL =
  "https://interfaceserviceapi.y-it.co.il/FcApiService/FcApiService.svc/InvokeFcApiService";

/** מבנה UUID: 8-4-4-4-12 תווים hex (לדוגמה b380dc34-6754-4b50-8a35-cd714f201d6a) */
const CLIENT_TOKEN_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidClientToken(value: string): boolean {
  return CLIENT_TOKEN_UUID_REGEX.test((value ?? "").trim());
}

/** ה־clientToken היחיד המורשה במערכת */
export const ALLOWED_CLIENT_TOKEN =
  "b380dc34-6754-4b50-8a35-cd714f201d6a";

export function isAllowedClientToken(value: string): boolean {
  return (value ?? "").trim().toLowerCase() === ALLOWED_CLIENT_TOKEN.toLowerCase();
}

export interface SendToYITParams {
  city: string;
  street: string;
  house?: string;
  lat: number;
  lng: number;
  /** נדרש – נשלח ל-YIT בשדה authenticationToken. ללא token מחזיר שגיאה. */
  token: string;
  /** כתובת בסיס ל-API – אם לא מועבר משתמש ב-YIT_DEFAULT_API_URL */
  baseUrl?: string;
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
 * ללא token / עיר / רחוב – מחזיר שגיאה מיידית, לא קורא ל-API.
 */
export async function sendToYIT(data: SendToYITParams): Promise<SendToYITResult> {
  const token = (data.token ?? "").trim();
  const city = (data.city ?? "").trim();
  const street = (data.street ?? "").trim();

  if (!token) {
    return {
      success: false,
      message: "לא נשלח token – יש לצרף clientToken בכתובת ה-URL",
      fullResponse: { _validation: "missing_token" },
    };
  }
  if (!isValidClientToken(token)) {
    return {
      success: false,
      message: "clientToken לא תקין",
      fullResponse: { _validation: "invalid_client_token" },
    };
  }
  if (!isAllowedClientToken(token)) {
    return {
      success: false,
      message: "clientToken לא קיים במערכת",
      fullResponse: { _validation: "client_token_not_allowed" },
    };
  }
  if (!city) {
    return {
      success: false,
      message: "שדה עיר חסר ($city)",
      fullResponse: { _validation: "missing_city" },
    };
  }
  if (!street) {
    return {
      success: false,
      message: "שדה רחוב חסר ($street)",
      fullResponse: { _validation: "missing_street" },
    };
  }

  const apiUrl = (data.baseUrl ?? "").trim() || YIT_DEFAULT_API_URL;

  try {
    const formData = new URLSearchParams({
      authenticationToken: token,
      $action: "set",
      $updateObject: "AddressCoordinates",
      $city: city,
      $street: street,
      $house: data.house ?? "",
      $lat: data.lat.toString(),
      $lng: data.lng.toString(),
    });

    const response = await fetch(apiUrl, {
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
