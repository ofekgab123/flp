export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6">
      <h1 className="text-xl font-semibold text-slate-800">
        Location Pin – דקירת נקודת ציון
      </h1>
      <p className="max-w-md text-center text-sm text-slate-600">
        לפתיחת חלון במפה: <code className="rounded bg-slate-200 px-1">/open?city=...&street=...&house=...</code>
        <br />
        API: <code className="rounded bg-slate-200 px-1">GET /api/location-pin?city=...&street=...</code> מחזיר <code className="rounded bg-slate-200 px-1">url</code> + 25% מידות.
      </p>
    </div>
  );
}
