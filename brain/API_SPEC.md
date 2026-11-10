# API spec — Open-Meteo (keyless)

No authentication. Documented free limits: under 10,000 calls/day, 5,000/hour, 600/minute. Free tier is **non-commercial** and requires attribution.

| Endpoint | Used for | Response fields consumed |
|---|---|---|
| `GET geocoding-api.open-meteo.com/v1/search?name={q}&count=6&language=en&format=json` | City suggestions | `results[].name`, `results[].latitude`, `results[].longitude`, `results[].admin1`, `results[].country`. **No match ⇒ the `results` key is absent entirely.** |
| `GET api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto` | Forecast | `current.*` (incl. `current.time`), `hourly.time[]` + `hourly.temperature_2m[]` (parallel arrays), `daily.time[]`, `daily.weather_code[]`, `daily.temperature_2m_max/min[]`, `timezone` |

**Key details:**
- `timezone=auto` is essential — without it, timestamps arrive in UTC and the hourly strip is wrong for the city.
- `weather_code` is a WMO code; the full label mapping lives in app.js (`WMO` table).
- Geolocation path skips geocoding and calls the forecast endpoint directly with the device's coordinates.

**Verified live 2026-11-10:** geocoding "Attock" → Attock City, Punjab, Pakistan (33.76671, 72.35977); forecast response shape confirmed (current fields, 168 hourly entries, daily arrays, timezone Asia/Karachi); nonsense query returns `{}` with no `results` key.
