# PRD — SkyLens Weather

**Core feature (one sentence):** Type a city name and get its current weather, next 24 hours and 7-day forecast from Open-Meteo, through a debounced dependent-request flow that handles every failure state cleanly.

**Problem:** Weather demos usually hardcode one city or fire a forecast request per keystroke. Real usage needs suggestion handling, cancellation, timezone-correct hours, and an answer for "that city doesn't exist" — which this API signals by omitting a key, not by returning an empty list.

**Target user:** Recruiters and interviewers trying the live demo with their own city; visitors who just want a forecast without an account or API key.

## Scope
**MUST** — city search + suggestions (debounce, AbortController); current conditions; 24-hour strip; 7-day list; full WMO label table; °C/°F toggle from cached data; geolocation; last-5 recents in localStorage; loading/error/empty/offline states; footer attribution.
**SHOULD** — air-quality tab (Open-Meteo air-quality API), two-city comparison. (Phase 2, not built yet.)
**COULD** — PWA offline cache of the last forecast. (Stretch.)

## Success criteria
- Toggling °C/°F makes zero network requests (verifiable in DevTools).
- Searching a nonsense city shows the empty state, not a crash or a spinner forever.
- The 24-hour strip starts at the city's current local hour, not the visitor's.
