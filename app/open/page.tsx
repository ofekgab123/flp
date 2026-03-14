import { redirect } from "next/navigation";
import { validateOtp } from "@/lib/otp";

function getParam(
  params: Record<string, string | string[] | undefined>,
  a: string,
  b: string
): string {
  const v = params[a] ?? params[b];
  return Array.isArray(v) ? v[0] ?? "" : (v ?? "");
}

/**
 * /open?city=...&street=...&house=... (או $city, $street, $house) → מפנה לדף המפה (/location-pin).
 * תומך גם בפורמט הישן (בלי $) וגם ב-callback_url.
 * כשיש clientToken – נדרשים otp ו-otphash. הבדיקה מתבצעת בכניסה.
 */
export default async function OpenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const city = getParam(params, "$city", "city");
  const street = getParam(params, "$street", "street");
  const house = getParam(params, "$house", "house");
  const clientToken = Array.isArray(params.clientToken)
    ? params.clientToken[0] ?? ""
    : (params.clientToken ?? "");
  const callback_url = Array.isArray(params.callback_url)
    ? params.callback_url[0] ?? ""
    : (params.callback_url ?? "");
  const otp = Array.isArray(params.otp) ? params.otp[0] ?? "" : (params.otp ?? "");
  const otphash = Array.isArray(params.otphash)
    ? params.otphash[0] ?? ""
    : (params.otphash ?? "");

  if (clientToken) {
    const otpResult = validateOtp(otp, otphash);
    if (!otpResult.valid) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-red-600 font-medium">{otpResult.error}</p>
            <p className="mt-2 text-sm text-slate-500">
              הקישור פג תוקף או שאינו תקין. נא לפתוח מחדש מפני המערכת החיצונית.
            </p>
          </div>
        </div>
      );
    }
  }

  const urlParams = new URLSearchParams();
  if (clientToken) urlParams.set("clientToken", clientToken);
  if (otp) urlParams.set("otp", otp);
  if (otphash) urlParams.set("otphash", otphash);
  if (city) urlParams.set("$city", city);
  if (street) urlParams.set("$street", street);
  if (house) urlParams.set("$house", house);
  if (callback_url) urlParams.set("callback_url", callback_url);

  redirect(`/location-pin?${urlParams.toString()}`);
}
