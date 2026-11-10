# Decisions — SkyLens Weather

## ADR-1 — Vanilla JS, no build step (2026-11-10)
One page, two API calls, local state. A framework would add a toolchain and hide the request choreography that is the entire point of the project. Trade-off: more manual DOM code.

## ADR-2 — Key strategy: none needed, by API choice (2026-11-10)
Open-Meteo is keyless, which removes the whole class of "key leaked in the frontend bundle" problems. The constraint accepted in exchange: free tier is non-commercial and attribution is mandatory — both honoured in the UI and README.

## ADR-3 — Cache metric data, convert at render (2026-11-10)
Options: refetch with `temperature_unit=fahrenheit` on toggle vs store °C and convert in the render layer. Chose render-time conversion: zero network on toggle, one canonical dataset in state, and the pattern generalises to any display-unit switch.
