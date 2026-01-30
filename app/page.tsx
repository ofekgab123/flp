"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const city = searchParams.get("$city") ?? searchParams.get("city");
    const street = searchParams.get("$street") ?? searchParams.get("street");
    if (city ?? street) {
      setRedirecting(true);
      window.location.replace(`/open?${searchParams.toString()}`);
    }
  }, [searchParams]);

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex min-h-screen items-center justify-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>מפנה למפה...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6">
      <h1 className="text-xl font-semibold text-slate-800">
        Location Pin – דקירת נקודת ציון
      </h1>
      <p className="max-w-md text-center text-sm text-slate-600">
        לפתיחת חלון במפה: <code className="rounded bg-slate-200 px-1">/open?$city=...&$street=...&$house=...</code> או <code className="rounded bg-slate-200 px-1">city=...&street=...&house=...</code>
        <br />
        API: <code className="rounded bg-slate-200 px-1">GET /api/location-pin?$city=...&$street=...&$house=...</code> מחזיר <code className="rounded bg-slate-200 px-1">url</code> + 25% מידות.
      </p>
    </div>
  );
}

const fallback = (
  <div className="flex min-h-screen items-center justify-center bg-slate-100">
    <div className="flex items-center gap-2 text-slate-500">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span>טוען...</span>
    </div>
  </div>
);

export default function HomePage() {
  return (
    <Suspense fallback={fallback}>
      <HomeContent />
    </Suspense>
  );
}
