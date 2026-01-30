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

/**
 * Sends location to YIT via our API (avoids CORS – request goes from server).
 */
export async function sendToYIT(data: SendToYITParams): Promise<SendToYITResult> {
  try {
    const response = await fetch("/api/location-pin/yit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: data.city,
        street: data.street,
        house: data.house ?? "",
        lat: data.lat,
        lng: data.lng,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        success: json.success ?? false,
        message: json.message ?? "שגיאת שרת",
        fullResponse: json.fullResponse ?? json,
      };
    }

    return {
      success: json.success ?? false,
      message: json.message ?? "",
      fullResponse: json.fullResponse ?? json,
    };
  } catch (err) {
    return {
      success: false,
      message: "שגיאת תקשורת עם YIT",
      fullResponse: err,
    };
  }
}
