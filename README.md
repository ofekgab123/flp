# Location Pin – דקירת נקודת ציון

מערכת שפונים אליה ב-API והיא מחזירה URL לפתיחת חלון כרום חדש בגודל 25% עם מסך בחירת מיקום (מפה, גאוקודינג, YIT).

## התקנה והרצה

```bash
npm install
cp .env.example .env.local   # וודא ש-DATABASE_URL מוגדר
npm run dev
```

האפליקציה תרוץ ב-`http://localhost:3000`.

## מסד נתונים (Neon PostgreSQL)

הפרויקט משתמש ב-Neon PostgreSQL. אחרי יצירת מסד ב-[Neon](https://neon.tech):

```bash
# אתחול טבלאות
DATABASE_URL='postgresql://...' npm run db:init

# (אופציונלי) הוספת client ברירת מחדל
DATABASE_URL='postgresql://...' npm run db:seed
```

## פריסה ב-Vercel

בוורצל: **Settings → Environment Variables** הוסף:

| משתנה | ערך | הערות |
|-------|-----|-------|
| `DATABASE_URL` | מחרוזת החיבור מ-Neon Console | פורמט: `postgresql://user:password@host/db?sslmode=require` |

וודא שהמשתנה מוגדר לכל הסביבות (Production, Preview, Development).

## API

### `GET /api/location-pin`

מחזיר JSON עם כתובת לפתיחת LocationPin בחלון חדש (25% ממסך).

**Query params:**

| פרמטר        | תיאור                          |
|--------------|---------------------------------|
| `clientToken` | טוקן לקוח (חובה כשמשתמשים ב-YIT) |
| `otp`        | אבטחה: Unix timestamp + 300 שניות (חובה עם clientToken) |
| `otphash`    | אבטחה: MD5 של otp (חובה עם clientToken) |
| `city`       | עיר (חובה)                      |
| `street`     | רחוב (חובה)                     |
| `house`      | מספר בית (אופציונלי)            |
| `callback_url` | URL לחזרה אחרי שמירה (אופציונלי) |

**OTP:** `otp` = `seconds('1970-01-01 00:00', CURRENT_UTC_TIMESTAMP) + (5 * 60)`. הקישור תקף 5 דקות. `otphash` = MD5('**' + otp + '!!').

**דוגמה:**

```http
GET /api/location-pin?clientToken=xxx&otp=1772892222&otphash=d86ab58b6df423cfd5f00c7b4a52fefc&city=תל%20אביב&street=דיזנגוף&house=50&callback_url=https://...
```

**תגובה:**

```json
{
  "url": "http://localhost:3000/location-pin?city=...",
  "widthPercent": 25,
  "heightPercent": 25,
  "openInNewWindow": true
}
```

הלקוח (דפדפן) פותח את החלון:

```js
const res = await fetch('/api/location-pin?city=תל%20אביב&street=דיזנגוף');
const { url, widthPercent, heightPercent } = await res.json();
const w = Math.round(window.screen.width * (widthPercent / 100));
const h = Math.round(window.screen.height * (heightPercent / 100));
window.open(url, '_blank', `width=${w},height=${h},...`);
```

## דפים

- **`/open?city=...&street=...&house=...&callback_url=...`**  
  נטען כשמערכת חיצונית מפנה אליו. מפנה אוטומטית ל־`/location-pin?...` (דף המפה).

- **`/location-pin?city=...&street=...&...`**  
  המסך הראשי: חיפוש כתובת, מפה (OpenStreetMap), סימון נקודה, שמירה ל-YIT. אם יש `callback_url` – מפנה אליו עם קואורדינטות ותוצאת YIT; אחרת – דיאלוג תוצאה וכפתור "סגור" סוגר את החלון.

## טכנולוגיות

- Next.js 14, React 18
- React Leaflet + Leaflet
- OpenStreetMap Nominatim (גאוקודינג)
- YIT API (שמירת קואורדינטות)
- Tailwind CSS, Lucide Icons, Sonner (toast)
