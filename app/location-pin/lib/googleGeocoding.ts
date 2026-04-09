import { GOOGLE_MAPS_API_KEY } from "./googleMapsConfig";

type GoogleGeocodeResponse = {
  status: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  }>;
};

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/** גאוקוד קדימה (כתובת → קואורדינטות) */
export async function googleGeocodeForward(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const addr = address?.trim();
  if (!addr || !GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    address: addr,
    key: GOOGLE_MAPS_API_KEY,
    language: "he",
    region: "il",
  });
  params.append("components", "country:IL");

  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  const data = (await res.json()) as GoogleGeocodeResponse;

  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    return null;
  }
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

/** גאוקוד אחורה (קואורדינטות → כתובת מעוצבת) */
export async function googleGeocodeReverse(
  lat: number,
  lng: number
): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: GOOGLE_MAPS_API_KEY,
    language: "he",
  });

  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  const data = (await res.json()) as GoogleGeocodeResponse;

  if (data.status !== "OK" || !data.results?.[0]?.formatted_address) {
    return null;
  }
  return data.results[0].formatted_address.trim();
}
