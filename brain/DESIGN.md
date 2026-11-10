# Design — SkyLens Weather

**Direction:** deep slate "ink" panels on a paper background with a single amber accent — a printed weather almanac feel. Solid colours only.

**Tokens (as used in styles.css):**
- `--bg: #F7F6F2` · `--surface: #FFFFFF` · `--surface-alt: #EFECE3`
- `--ink: #17222B` (header + current-conditions card) · `--text: #1C1C1C`
- `--text-on-ink: #F5F2E9` · `--text-muted: #5C5A52` · `--border: #D8D3C3`
- `--accent: #D97706` · `--accent-dark: #9A5203`
- `--danger: #B3261E` · `--focus: #1A56C4` · `--radius: 10px`

**Typography:** system stack — "Helvetica Neue", Helvetica, Arial, sans-serif. The current temperature is the single oversized element (fluid `clamp()` size).

**Component states:**
- Suggestion list: hidden / open / hover + focus-visible rows; closes on Escape, selection, or outside click.
- Unit toggle: segmented control, `aria-pressed` marks the active unit.
- Skeleton card while a forecast loads; empty state for unknown cities; error state with retry; offline banner; explicit start state before the first search.
- Recent chips appear only when localStorage has entries.

**Responsive:** search row wraps; hourly strip scrolls horizontally by design (contained, page never overflows); daily rows compress at 480px.
