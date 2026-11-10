# Tools — SkyLens Weather

**API: Open-Meteo** — free, no key, CORS-friendly. Documented free limits: <10,000/day, 5,000/hour, 600/minute. Free tier is non-commercial and requires the "Weather data by Open-Meteo.com" attribution (in the footer and README).

**Hosting plan:** static files only — GitHub Pages or Vercel static. **TBD by owner** (no repo/deployment created yet).

**Fallback if the API is down:** no alternate weather source is wired in; the app shows its error state with retry, and recent-city chips remain visible. (A second provider behind the same mapper is the documented Phase 2 resilience option.)

**Accounts needed:** none.
