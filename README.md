# Location Pin – דקירת נקודת ציון

מערכת שפונים אליה ב-API והיא מחזירה URL לפתיחת חלון כרום חדש בגודל 25% עם מסך בחירת מיקום (מפה, גאוקודינג, YIT).

## התקנה והרצה

```bash
npm install
npm run dev
```

האפליקציה תרוץ ב-`http://localhost:3000`.

## API

### `GET /api/location-pin`

מחזיר JSON עם כתובת לפתיחת LocationPin בחלון חדש (25% ממסך).

**Query params:**

| פרמטר        | תיאור                          |
|--------------|---------------------------------|
| `city`       | עיר (חובה)                      |
| `street`     | רחוב (חובה)                     |
| `house`      | מספר בית (אופציונלי)            |
| `address_type` | `pickup` / `dropoff` (אופציונלי) |
| `callback_url` | URL לחזרה אחרי שמירה (אופציונלי) |

**דוגמה:**

```http
GET /api/location-pin?city=תל%20אביב&street=דיזנגוף&house=50&callback_url=https://...
```

**תגובה:**

```json
{
  "url": "http://localhost:3000/location-pin?city=...&in_popup=true",
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
  נטען כשמערכת חיצונית מפנה אליו. פותח אוטומטית חלון 25% עם `/location-pin?...&in_popup=true` ומציג "החלון נפתח" בדף הנוכחי.

- **`/location-pin?city=...&street=...&in_popup=true&...`**  
  המסך הראשי: חיפוש כתובת, מפה (OpenStreetMap), סימון נקודה, שמירה ל-YIT. אם יש `callback_url` – מפנה אליו עם קואורדינטות ותוצאת YIT; אחרת – דיאלוג תוצאה וכפתור "סגור" סוגר את החלון.

## טכנולוגיות

- Next.js 14, React 18
- React Leaflet + Leaflet
- OpenStreetMap Nominatim (גאוקודינג)
- YIT API (שמירת קואורדינטות)
- Tailwind CSS, Lucide Icons, Sonner (toast)
