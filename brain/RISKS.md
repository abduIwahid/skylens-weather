# Risks — SkyLens Weather

1. **Geocoding ambiguity** (many cities share a name) → Suggestions show region + country for every result; the visitor picks explicitly instead of the app guessing the first hit.
2. **Open-Meteo downtime or free-tier limit** (10k/day) → Debounced search and coordinate-cached recents minimise calls; failures land in a retryable error state, never a dead spinner.
3. **Geolocation denial** → Handled as a first-class outcome with a message pointing back to search; the app never blocks on it.
4. **Timezone bugs in the hourly strip** → `timezone=auto` on every forecast call, and hours are matched against `current.time` from the same response rather than the visitor's clock.
