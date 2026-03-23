import { createHash } from "crypto";

export interface OtpValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * OTP = Unix timestamp (seconds since 1970-01-01 00:00 UTC) + 5 minutes (300 seconds).
 * The link is valid only while: current_utc_timestamp <= otp
 *
 * otphash = MD5('**' + otp + '!!') - hash of the string with prefix ** and suffix !!
 */
export function validateOtp(otp: string, otphash: string): OtpValidationResult {
  const otpTrimmed = (otp ?? "").trim();
  const otphashTrimmed = (otphash ?? "").trim().toLowerCase();

  if (!otpTrimmed) {
    return { valid: false, error: "חסר פרמטר otp" };
  }
  if (!otphashTrimmed) {
    return { valid: false, error: "חסר פרמטר otphash" };
  }

  const otpNum = parseInt(otpTrimmed, 10);
  if (isNaN(otpNum) || otpNum <= 0) {
    return { valid: false, error: "otp לא תקין" };
  }

  const expectedHash = createHash("md5")
    .update("**" + otpTrimmed + "!!")
    .digest("hex");
  if (expectedHash !== otphashTrimmed) {
    return { valid: false, error: "otphash לא תואם" };
  }

  const nowUtc = Math.floor(Date.now() / 1000);
  if (nowUtc > otpNum) {
    return { valid: false, error: "הקישור פג תוקף" };
  }

  return { valid: true };
}

/** otp = now_utc + 300s; otphash = MD5('**' + otp + '!!') — לבניית קישורי בדיקה */
export function generateOtpPair(): { otp: string; otphash: string } {
  const otp = Math.floor(Date.now() / 1000) + 300;
  const otpStr = String(otp);
  const otphash = createHash("md5")
    .update("**" + otpStr + "!!")
    .digest("hex");
  return { otp: otpStr, otphash };
}
