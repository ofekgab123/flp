"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, Loader2, Check, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { MapContainerClient } from "./MapContainerClient";
import { sendToYIT } from "./lib/yit";

const DEFAULT_CENTER: [number, number] = [32.0853, 34.7818]; // Tel Aviv
const DEFAULT_ADDRESS = "דיזנגוף 150, תל אביב";

export default function LocationPinPage() {
  const [editableAddress, setEditableAddress] = useState(DEFAULT_ADDRESS);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [yitResultDialog, setYitResultDialog] = useState<{
    isOpen: boolean;
    success: boolean;
    message: string;
    response: unknown;
  }>({ isOpen: false, success: false, message: "", response: null });

  const urlParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const clientToken = urlParams?.get("clientToken") ?? "";
  const city = urlParams?.get("$city") ?? urlParams?.get("city") ?? "";
  const street = urlParams?.get("$street") ?? urlParams?.get("street") ?? "";
  const house = urlParams?.get("$house") ?? urlParams?.get("house") ?? "";

  const geocodeAddress = useCallback(async (address: string) => {
    const addr = address?.trim();
    if (!addr) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}, Israel&format=json&limit=1`,
        { headers: { Accept: "application/json" } }
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
    if (!city.trim()) {
      toast.error("שדה עיר חסר ($city)");
      return;
    }
    if (!street.trim()) {
      toast.error("שדה רחוב חסר ($street)");
      return;
    }

    try {
      const result = await sendToYIT({
        city,
        street,
        house: house || undefined,
        lat: position.lat,
        lng: position.lng,
        token: clientToken,
      });

      setYitResultDialog({
        isOpen: true,
        success: result.success,
        message: result.message,
        response: result.fullResponse,
      });
    } catch {
      toast.error("שגיאת תקשורת עם YIT");
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-1 sm:p-2">
      <div className="flex h-[650px] w-[450px] max-h-[98vh] max-w-[98vw] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
      <header className="flex shrink-0 items-center gap-3 bg-blue-600 px-4 py-3 text-white">
        <div className="flex h-9 w-9 items-center justify-center">
          <MapPin className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold">דקירת נקודת ציון</span>
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
            <Loader2 className="h-4 w-4 animate-spin" />
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
          }}
          isLoading={isLoading}
        />
      </div>

      <footer className="flex shrink-0 flex-col gap-1 border-t border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!position}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 font-medium text-white shadow hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-5 w-5" />
          שמור מיקום
        </button>
        {position && (
          <p className="text-center text-sm text-slate-500">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        )}
      </footer>

      {yitResultDialog.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center gap-3 text-center">
              {yitResultDialog.success ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              <p className="font-medium text-slate-800">{yitResultDialog.message}</p>
              <p className="text-sm text-slate-600">
                {yitResultDialog.success
                  ? "הנתונים נשמרו ב-YIT"
                  : "הנתונים לא נשמרו ב-YIT"}
              </p>
              {yitResultDialog.response != null && (
                <pre className="w-full max-h-32 overflow-auto rounded bg-slate-100 p-2 text-left text-xs text-slate-600">
                  {JSON.stringify(yitResultDialog.response, null, 2)}
                </pre>
              )}
              <button
                type="button"
                onClick={() => {
                  setYitResultDialog((prev) => ({ ...prev, isOpen: false }));
                  window.close();
                }}
                className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
