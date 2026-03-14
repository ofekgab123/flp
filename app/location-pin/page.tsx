import { isValidClientToken } from "@/app/location-pin/lib/yit";
import { clientExists } from "@/lib/db";
import { validateOtp } from "@/lib/otp";
import LocationPinClient from "./LocationPinClient";

function getParam(
  params: Record<string, string | string[] | undefined>,
  a: string,
  b: string
): string {
  const v = params[a] ?? params[b];
  return Array.isArray(v) ? v[0] ?? "" : (v ?? "");
}

function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm max-w-md">
        <h2 className="text-lg font-semibold text-red-700 mb-2">{title}</h2>
        <p className="text-red-600 font-medium">{message}</p>
        <p className="mt-3 text-sm text-slate-500">
          הקישור פג תוקף או שאינו תקין. נא לפתוח מחדש מפני המערכת החיצונית.
        </p>
      </div>
    </div>
  );
}

/**
 * /location-pin – מסך בחירת מיקום.
 * כשיש clientToken (ללא admin) – נדרשים: פורמט UUID תקין, clientToken קיים במערכת, otp ו-otphash.
 * המסך דקירה מוצג רק אם כל התנאים מתקיימים.
 */
export default async function LocationPinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const clientToken = getParam(params, "clientToken", "clientToken");
  const admin = getParam(params, "admin", "admin");
  const otp = getParam(params, "otp", "otp");
  const otphash = getParam(params, "otphash", "otphash");

  const isAdmin = admin !== "" && admin !== "false";

  if (clientToken && !isAdmin) {
    if (!isValidClientToken(clientToken)) {
      return (
        <ErrorScreen
          title="אי אפשר להפעיל את LFP"
          message="clientToken לא תקין"
        />
      );
    }
    const otpResult = validateOtp(otp, otphash);
    if (!otpResult.valid) {
      return (
        <ErrorScreen
          title="אי אפשר להפעיל את LFP"
          message={otpResult.error ?? "חסר אימות OTP"}
        />
      );
    }
    const exists = await clientExists(clientToken);
    if (!exists) {
      return (
        <ErrorScreen
          title="אי אפשר להפעיל את LFP"
          message="clientToken לא קיים במערכת"
        />
      );
    }
  }

  return <LocationPinClient />;
}
