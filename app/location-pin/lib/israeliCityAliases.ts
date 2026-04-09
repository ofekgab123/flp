/**
 * קיצורי עיר נפוצים בעברית → שם מלא לחיפוש ב-Nominatim / YIT.
 * מפתח: עיר לאחר הסרת גרשיים/מירכאות ורווחים מיותרים.
 * (למשל ת״א/ת"א → תא, פ״ת/פ"ת → פת, וכו׳)
 */
const ALIASES: Record<string, string> = {
  ראשלצ: "ראשון לציון",
  תא: "תל אביב",
  פת: "פתח תקווה",
  בש: "באר שבע",
  רג: "רמת גן",
  כס: "כפר סבא",
};

/** מסיר גרש עברי (U+05F4), מירכאות ASCII ורווחים מיותרים לצורך התאמה */
function cityKey(city: string): string {
  return city
    .trim()
    .replace(/[\u05F4\u201C\u201D"']/g, "")
    .replace(/\s+/g, " ");
}

/** מחזיר את שם העיר המלא אם יש קיצור מוכר, אחרת את המקור */
export function expandIsraeliCityAlias(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return trimmed;
  const key = cityKey(trimmed);
  return ALIASES[key] ?? trimmed;
}
