# SkyLens Weather

> Built by [Abdul Wahid](https://github.com/abduIwahid) — BS Artificial Intelligence student at COMSATS University Islamabad (Attock Campus). One of a series of dependency-free apps I built against free public APIs to practise real-world API constraints: rate limits, caching, and payload normalisation. More at [abdulwahid.me](https://www.abdulwahid.me).


A keyless weather app on Open-Meteo: search any city, get current conditions, the next 24 hours and a 7-day forecast. The interesting part is the request choreography — a geocoding call must resolve a city to coordinates before the forecast call can exist, and both are debounced, cancellable and normalised through a mapper.

**Live demo:** _TBD — deploy pending owner decision (GitHub Pages or Vercel static)._
Run it locally: open `index.html` in a browser, or `python3 -m http.server` in this folder and visit `http://localhost:8000`.

## Features

- **City search with suggestions** — debounced geocoding with a dropdown; picking a result triggers the dependent forecast request.
- **Current conditions card** — temperature, feels-like, humidity, wind, and the WMO condition label.
- **Next 24 hours** — hourly strip zipped from Open-Meteo's parallel arrays, starting at the current hour in the city's own timezone (`timezone=auto`).
- **7-day forecast** — condition, low and high per day, plus the day's rain probability (from Open-Meteo's `precipitation_probability_max`).
- **°C / °F toggle** — instant, recomputed from the cached metric response. No refetch.
- **Use my location** — Geolocation API → forecast directly, labelled "Current location".
- **Recent searches** — last 5 cities in localStorage, one click to reload.
- **Full UI states** — loading skeleton, error with retry, empty (no matching city), offline banner, and an explicit start state.

## Engineering decisions

- **Dependent requests, one wrapper.** `selectPlace()` owns the whole geocode → forecast chain, so the UI can never enter a half-loaded state and retry replays the entire chain.
- **Debounce + AbortController on both calls.** Suggestions cancel superseded geocoding requests; selecting a city cancels any in-flight forecast. Fast typing can't produce out-of-order UI.
- **The missing-`results` gotcha.** When a city doesn't match, Open-Meteo's geocoding response omits the `results` key entirely instead of returning an empty array. The code reads `data.results || []` and maps that to the empty state.
- **WMO code mapping.** Weather arrives as numeric WMO codes (0 = clear … 95+ = thunderstorm). A complete local table translates them to text labels; unknown codes degrade to "Unknown conditions" instead of crashing.
- **Mapper layer.** Parallel hourly arrays are zipped into objects once, in the mapper; the render code never indexes raw arrays.
- **Unit toggle without network.** The API response is stored in °C; °F is arithmetic at render time. This is the correct default for any unit/currency/locale toggle.

## Attribution & terms

[Weather data by Open-Meteo.com](https://open-meteo.com). Open-Meteo's free tier is **non-commercial only** and requires this attribution; commercial use needs their paid plan. This is a non-commercial portfolio project. No API key is required, and none is used.

## Trade-offs

- Suggestions start at 2 characters to keep geocoding calls meaningful (fewer wasted requests).
- Recent cities store coordinates, so reloading one skips geocoding — but a renamed/moved place would keep its old coordinates. Acceptable at this scale.
- No server-side caching or PWA offline mode in Phase 1 (listed as stretch work in the build plan).
