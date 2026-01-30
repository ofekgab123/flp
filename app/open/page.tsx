"use client";

import { useEffect } from "react";

/**
 * /open?city=...&street=... → מפנה באותו חלון לדף המפה (/location-pin).
 */
export default function OpenPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("in_popup", "true");

    const locationPinUrl = `${window.location.origin}/location-pin?${urlParams.toString()}`;
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
