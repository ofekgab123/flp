/**
 * אותו מפתח ל־Maps JavaScript API ול־Geocoding API (יש להפעיל בשניהם ב-Google Cloud).
 */
export const GOOGLE_MAPS_API_KEY =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()) ||
  "AIzaSyApUhkvnyJe4bPKIv8BquWpaIbMcjgcZQM";
