"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { MapContainerClient } from "./MapContainerClient";
import { YIT_DEFAULT_API_URL, isValidClientToken } from "./lib/yit";

const DEFAULT_CENTER: [number, number] = [32.0853, 34.7818]; // Tel Aviv
const DEFAULT_ADDRESS = "דיזנגוף 150, תל אביב";
const YIT_BASE_URL_STORAGE_KEY = "location-pin-yitBaseUrl";

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: "application/json",
  "Accept-Language": "he,he-IL;q=0.9,en;q=0.8",
  "User-Agent": "flp-location-pin/1.0",
};

const NOMINATIM_LANG = "accept-language=he";

export default function LocationPinClient() {
  const [editableAddress, setEditableAddress] = useState(DEFAULT_ADDRESS);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const isAdmin = urlParams?.get("admin") != null && urlParams?.get("admin") !== "false";
  const clientToken = urlParams?.get("clientToken") ?? "";
  const city = urlParams?.get("$city") ?? urlParams?.get("city") ?? "";
  const street = urlParams?.get("$street") ?? urlParams?.get("street") ?? "";
  const house = urlParams?.get("$house") ?? urlParams?.get("house") ?? "";

  const [yitBaseUrl, setYitBaseUrl] = useState(YIT_DEFAULT_API_URL);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("yitBaseUrl");
    const fromStorage = localStorage.getItem(YIT_BASE_URL_STORAGE_KEY);
    const initial = fromUrl || fromStorage || YIT_DEFAULT_API_URL;
    setYitBaseUrl(initial);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !yitBaseUrl) return;
    try {
      localStorage.setItem(YIT_BASE_URL_STORAGE_KEY, yitBaseUrl);
    } catch {
      /* ignore */
    }
  }, [yitBaseUrl]);

  const geocodeAddress = useCallback(async (address: string) => {
    const addr = address?.trim();
    if (!addr) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}, Israel&format=json&limit=1&${NOMINATIM_LANG}`,
        { headers: NOMINATIM_HEADERS }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition({ lat, lng });
          setMapCenter([lat, lng]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&${NOMINATIM_LANG}`,
        { headers: NOMINATIM_HEADERS }
      );
      const data = await res.json();
      const name = data?.display_name;
      if (typeof name === "string" && name.trim()) {
        setEditableAddress(name.trim());
      }
    } catch {
      /* ignore reverse failures */
    }
  }, []);

  useEffect(() => {
    if (city && street) {
      const fullAddress = `${street} ${house}`.trim()
        ? `${street} ${house}, ${city}`.trim()
        : `${street}, ${city}`.trim();
      setEditableAddress(fullAddress);
      geocodeAddress(fullAddress);
    } else {
      setEditableAddress(DEFAULT_ADDRESS);
      geocodeAddress(DEFAULT_ADDRESS);
    }
  }, [city, street, house, geocodeAddress]);

  const handleAddressSearch = () => {
    geocodeAddress(editableAddress);
  };

  const handleSave = async () => {
    if (!position) {
      toast.error("נא לבחור מיקום על המפה");
      return;
    }
    if (!clientToken.trim()) {
      toast.error("לא נשלח token – יש לצרף clientToken בכתובת ה-URL");
      return;
    }
    if (!isValidClientToken(clientToken)) {
      toast.error("clientToken לא תקין");
      return;
    }
    if (!city.trim()) {
      toast.error("שדה עיר חסר ($city)");
      return;
    }
    if (!street.trim()) {
      toast.error("שדה רחוב חסר ($street)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/location-pin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientToken,
          city,
          street,
          house: house || undefined,
          lat: position.lat,
          lng: position.lng,
        }),
      });
      const result = await res.json();

      if (result.success) {
        window.close();
      } else {
        toast.error(result.message ?? "שמירה נכשלה");
      }
    } catch {
      toast.error("שגיאת תקשורת – נא לנסות שוב");
    } finally {
      setIsSaving(false);
    }
  };

  if (isAdmin) {
    const handleSaveBaseUrl = () => {
      const value = yitBaseUrl.trim() || YIT_DEFAULT_API_URL;
      try {
        localStorage.setItem(YIT_BASE_URL_STORAGE_KEY, value);
        toast.success("Base URL נשמר. הבקשה הבאה (שמירת מיקום) תפנה לכתובת הזאת.");
      } catch {
        toast.error("שמירה נכשלה");
      }
    };
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-lg font-semibold text-slate-800">
              הגדרות API – שמירת מיקום
            </h1>
            <p className="mb-4 text-sm text-slate-500">
              ערוך את כתובת ה-API ולחץ &quot;ערוך&quot;. ה-Base URL ישתנה במערכת – הבקשה הבאה בלחיצה על &quot;שמור מיקום&quot; תפנה לכתובת הזאת.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Base URL
                </label>
                <input
                  type="url"
                  value={yitBaseUrl}
                  onChange={(e) => setYitBaseUrl(e.target.value)}
                  placeholder={YIT_DEFAULT_API_URL}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  dir="ltr"
                />
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">כתובת מלאה: </span>
                <code className="break-all text-xs text-slate-700" dir="ltr">
                  {yitBaseUrl.trim() || YIT_DEFAULT_API_URL}
                </code>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleSaveBaseUrl}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                ערוך
              </button>
              <button
                type="button"
                onClick={() => setYitBaseUrl(YIT_DEFAULT_API_URL)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                איפוס לברירת מחדל
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-1 sm:p-2">
      <div className="flex h-[650px] w-[450px] max-h-[98vh] max-w-[98vw] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">דקירת נקודת ציון</span>
        </div>
        <button
          type="button"
          onClick={() => window.close()}
          title="סגור"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/20 hover:text-white"
          aria-label="סגור"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white p-3">
        <input
          type="text"
          value={editableAddress}
          onChange={(e) => setEditableAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
          placeholder="הזן כתובת לחיפוש"
          className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleAddressSearch}
          disabled={isLoading}
          className="flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-500 px-5 text-sm font-medium text-white shadow hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "חפש"
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <MapContainerClient
          center={mapCenter}
          position={position}
          onLocationSelect={(lat, lng) => {
            setPosition({ lat, lng });
            void reverseGeocode(lat, lng);
          }}
          isLoading={isLoading}
        />
      </div>

      <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!position || isSaving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 font-medium text-white shadow hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5" />
          )}
          {isSaving ? "שומר..." : "שמור מיקום"}
        </button>
        {position && (
          <p className="text-center text-sm text-slate-500">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        )}
      </footer>
      </div>
    </div>
  );
}
