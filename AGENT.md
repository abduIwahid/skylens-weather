# SkyLens Weather — agent entry
Summary: Static weather app on Open-Meteo (keyless). City search with suggestions, current conditions, 24-hour strip, 7-day forecast, °C/°F toggle, geolocation, recent searches. Vanilla HTML/CSS/JS, no build step.
Core feature: Dependent geocoding → forecast requests turned into a complete local forecast view.
Read first: `brain/00-START-HERE.md`, then `brain/PRD.md` and `brain/ARCHITECTURE.md`.
Hard rules: design tokens only (see brain/DESIGN.md); no API keys anywhere (the API is keyless); the footer attribution "Weather data by Open-Meteo.com" must never be removed; every change is logged in `brain/changes/` (changelog + session file).
Commands: open `index.html`, or `python3 -m http.server` then visit http://localhost:8000 . Syntax check: `node --check app.js`.
