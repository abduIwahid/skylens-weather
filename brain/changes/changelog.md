# Changelog — SkyLens Weather

Format: Change → Reason → Affected Area → Impact → Status.

## 2026-11-10 — Project initialized + Phase 1 MVP built
- **Change:** Created the full static app (index.html, styles.css, app.js), README, AGENT.md and this brain.
- **Reason:** Portfolio project #2 from the "5 Free APIs → 5 Portfolio Projects" guide; demonstrates dependent requests, debounce + abort, and render-time unit conversion on a keyless API.
- **Affected Area:** Entire repo (new).
- **Impact:** Complete weather flow runs from static files; not yet deployed.
- **Status:** Verified — `node --check app.js` passes; geocoding/forecast field names and the missing-`results` behaviour confirmed against live Open-Meteo responses.

- **Change:** Rain probability per day in the 7-day forecast (`precipitation_probability_max`, null-safe) → **Reason:** owner asked for the repos to look genuinely worked on; rain chance is the first thing a real user asks a forecast → **Affected Area:** `app.js`, `styles.css` → **Status:** Verified against the live Open-Meteo payload for Attock (mapper output checked in Node).
- **Change:** First-person About section in the app + README author byline and rain feature entry → **Reason:** the repo should read as its author's own project → **Affected Area:** `index.html`, `styles.css`, `README.md` → **Status:** Verified locally.
