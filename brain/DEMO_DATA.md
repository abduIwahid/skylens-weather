# Demo data — SkyLens Weather

- **Search:** `Attock` (owner's city — resolves to Attock City, Punjab, Pakistan), `London`, `Tokyo`.
- **Empty state:** type `zzzqqq` and pause — geocoding returns no `results` key and the empty state appears.
- **Unit toggle:** load any city, open DevTools Network, toggle °C/°F — zero new requests.
- **Geolocation:** "Use my location" → forecast labelled "Current location".
- **Recents:** search two or three cities, reload the page — the recent chips persist.
- **Fast typing:** type a long city name quickly — only the final query's suggestions render (debounce + abort).
