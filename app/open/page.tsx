"use client";

import { useEffect } from "react";

/**
 * /open?city=...&street=...&house=... (או $city, $street, $house) → מפנה לדף המפה (/location-pin).
 * תומך גם בפורמט הישן (בלי $) וגם ב-address_type, callback_url.
 */
function getParam(sp: URLSearchParams, a: string, b: string): string | null {
  return sp.get(a) ?? sp.get(b);
}

export default function OpenPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();
    const city = getParam(urlParams, "$city", "city");
    const street = getParam(urlParams, "$street", "street");
    const house = getParam(urlParams, "$house", "house");
    const address_type = urlParams.get("address_type");
    const callback_url = urlParams.get("callback_url");
    if (city) params.set("$city", city);
    if (street) params.set("$street", street);
    if (house) params.set("$house", house);
    if (address_type) params.set("address_type", address_type);
    if (callback_url) params.set("callback_url", callback_url);
    params.set("in_popup", "true");

    const locationPinUrl = `${window.location.origin}/location-pin?${params.toString()}`;
    window.location.replace(locationPinUrl);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span>טוען מפה...</span>
      </div>
    </div>
  );
}
