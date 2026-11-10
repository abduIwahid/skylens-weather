# Interviewer Q&A — SkyLens Weather

**Q1. Why are there two API calls for one search?**
They are dependent requests: the forecast endpoint needs coordinates, and only the geocoding endpoint can turn a city name into coordinates. I wrapped the chain in one function so loading, error and retry states cover the whole flow, not half of it.

**Q2. What stops a request firing on every keystroke?**
A 300 ms debounce, plus an AbortController per flow — a new keystroke cancels the in-flight geocoding request, so a slow earlier response can never overwrite a newer one.

**Q3. How does the app know a city doesn't exist?**
Open-Meteo omits the `results` key entirely on no match — it does not return an empty array or a 404. The code treats a missing key as the empty state. It is the kind of behaviour you only learn by testing the unhappy path.

**Q4. Why doesn't the °C/°F toggle refetch?**
The forecast is stored once, in °C, and conversion happens in the render layer. Refetching for a display preference would waste rate limit and add latency for pure arithmetic.

**Q5. The hourly strip — whose timezone is it in?**
The city's. Every forecast call passes `timezone=auto`, and the strip is anchored to the `current.time` inside the same response, so it starts at the city's current local hour regardless of where the visitor sits.
