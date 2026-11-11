# Session 2026-11-10-02 — Personal pass: rain probability + About

## Goal / request
Owner: fix the 5 repos one by one so each reads like his own
worked-on project. Third repo in the series: SkyLens Weather.

## What was done
- app.js: the daily request now also asks Open-Meteo for
  precipitation_probability_max; mapForecast carries it as rainPct
  (null-safe if the field is absent); each 7-day row shows
  "Rain N%". The daily-row grid gained a fourth column.
- index.html: an "About this project" section in first person (the
  dependent-request story: geocoding must resolve before the
  forecast call can exist) with the author's signature.
- README.md: author byline; rain probability added to the 7-day
  feature line.

## Verification
- node --check app.js: OK.
- Mapper exercised in Node against the live Open-Meteo payload for
  Attock (33.77, 72.36): rainPct values came through correctly
  (73, 84, 97, 68, 2, 0, 0 across the week).
