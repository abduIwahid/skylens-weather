'use strict';
/*
 * SkyLens Weather — vanilla JS on Open-Meteo (keyless).
 * Flow: geocoding (city -> coordinates) then forecast (coordinates -> weather):
 * two DEPENDENT requests wrapped in one loadForecast().
 * API response -> mapper (mapForecast) -> state -> render.
 * Temperatures are cached in °C; the °F view is recomputed locally, no refetch.
 */
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const LS_RECENT = 'skylens:recent';
const MAX_RECENT = 5;

/* Full WMO weather-code mapping (Open-Meteo uses WMO 4677 codes). */
const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
  85: 'Light snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with light hail', 99: 'Thunderstorm with heavy hail',
};
function wmoLabel(code) { return WMO[code] || 'Unknown conditions'; }

const state = {
  unit: 'c',               // 'c' | 'f'
  forecast: null,          // mapped forecast for the selected place
  place: null,             // {name, region, latitude, longitude}
  lastRequest: null,       // for retry
};

const el = {
  input: document.getElementById('city-input'),
  suggestions: document.getElementById('suggestions'),
  locate: document.getElementById('locate-btn'),
  unitC: document.getElementById('unit-c'),
  unitF: document.getElementById('unit-f'),
  recentBlock: document.getElementById('recent-block'),
  recentChips: document.getElementById('recent-chips'),
  status: document.getElementById('status-region'),
  forecast: document.getElementById('forecast-region'),
  empty: document.getElementById('empty-state'),
  error: document.getElementById('error-state'),
  errorText: document.getElementById('error-text'),
  start: document.getElementById('start-state'),
  offline: document.getElementById('offline-banner'),
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function temp(celsius) {
  if (state.unit === 'f') return Math.round(celsius * 9 / 5 + 32) + '°F';
  return Math.round(celsius) + '°C';
}

/* ---------- mapper layer ---------- */
function mapPlace(raw) {
  return {
    name: raw.name,
    region: [raw.admin1, raw.country].filter(Boolean).join(', '),
    latitude: raw.latitude,
    longitude: raw.longitude,
  };
}
function mapForecast(raw) {
  // Zip the hourly parallel arrays into objects, starting at the current hour.
  const nowIso = raw.current.time.slice(0, 13); // "YYYY-MM-DDTHH"
  let startIdx = raw.hourly.time.findIndex((t) => t.slice(0, 13) >= nowIso);
  if (startIdx < 0) startIdx = 0;
  const hours = [];
  for (let i = startIdx; i < Math.min(startIdx + 24, raw.hourly.time.length); i++) {
    hours.push({ time: raw.hourly.time[i], tempC: raw.hourly.temperature_2m[i] });
  }
  const days = raw.daily.time.map((date, i) => ({
    date,
    code: raw.daily.weather_code[i],
    maxC: raw.daily.temperature_2m_max[i],
    minC: raw.daily.temperature_2m_min[i],
  }));
  return {
    timezone: raw.timezone,
    current: {
      tempC: raw.current.temperature_2m,
      feelsC: raw.current.apparent_temperature,
      humidity: raw.current.relative_humidity_2m,
      windKmh: raw.current.wind_speed_10m,
      code: raw.current.weather_code,
      time: raw.current.time,
    },
    hours,
    days,
  };
}

/* ---------- fetch ---------- */
async function fetchJson(url, signal) {
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) {
    const err = new Error('HTTP ' + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/* ---------- suggestions (dependent request #1) ---------- */
let suggestController = null;
async function fetchSuggestions(query) {
  if (suggestController) suggestController.abort();
  suggestController = new AbortController();
  try {
    const data = await fetchJson(
      GEO_API + '?name=' + encodeURIComponent(query) + '&count=6&language=en&format=json',
      suggestController.signal
    );
    // Gotcha: when nothing matches, the response has NO `results` key at all.
    const results = data.results || [];
    if (results.length === 0) {
      el.suggestions.hidden = true;
      showEmptyState();
      return;
    }
    renderSuggestions(results.map(mapPlace));
  } catch (err) {
    if (err.name === 'AbortError') return;
    el.suggestions.hidden = true;
    showError('City search failed. Check your connection and try again.');
  }
}
const debouncedSuggest = debounce((v) => {
  const q = v.trim();
  if (q.length < 2) { el.suggestions.hidden = true; return; }
  fetchSuggestions(q);
}, 300);
function renderSuggestions(places) {
  el.suggestions.innerHTML = '';
  for (const p of places) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = esc(p.name) + (p.region ? ' <span class="sub">' + esc(p.region) + '</span>' : '');
    b.addEventListener('click', () => selectPlace(p, true));
    li.appendChild(b);
    el.suggestions.appendChild(li);
  }
  el.suggestions.hidden = false;
}

/* ---------- forecast (dependent request #2) ---------- */
let forecastController = null;
async function selectPlace(place, saveRecent) {
  el.suggestions.hidden = true;
  el.input.value = place.name;
  state.place = place;
  state.lastRequest = () => selectPlace(place, saveRecent);
  if (forecastController) forecastController.abort();
  forecastController = new AbortController();
  hideStates();
  showSkeleton();
  el.status.textContent = 'Loading forecast for ' + place.name + '…';
  try {
    const url = FORECAST_API +
      '?latitude=' + place.latitude + '&longitude=' + place.longitude +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
      '&hourly=temperature_2m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto';
    const raw = await fetchJson(url, forecastController.signal);
    state.forecast = mapForecast(raw);
    if (saveRecent) saveRecentPlace(place);
    renderForecast();
    el.status.textContent = 'Forecast loaded for ' + place.name + '.';
  } catch (err) {
    if (err.name === 'AbortError') return;
    showError('Could not load the forecast for ' + place.name + '. Try again.');
  }
}

/* ---------- recent searches ---------- */
function getRecent() {
  try { return JSON.parse(localStorage.getItem(LS_RECENT) || '[]'); } catch (e) { return []; }
}
function saveRecentPlace(place) {
  const list = getRecent().filter((p) => !(p.latitude === place.latitude && p.longitude === place.longitude));
  list.unshift(place);
  try { localStorage.setItem(LS_RECENT, JSON.stringify(list.slice(0, MAX_RECENT))); } catch (e) { /* ignore */ }
  renderRecent();
}
function renderRecent() {
  const list = getRecent();
  el.recentBlock.hidden = list.length === 0;
  el.recentChips.innerHTML = '';
  for (const p of list) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = p.name;
    b.addEventListener('click', () => selectPlace(p, true));
    el.recentChips.appendChild(b);
  }
}

/* ---------- render ---------- */
function hideStates() {
  el.empty.hidden = true;
  el.error.hidden = true;
  el.start.hidden = true;
}
function showEmptyState() {
  hideStates();
  el.forecast.innerHTML = '';
  el.empty.hidden = false;
  el.status.textContent = '';
}
function showError(msg) {
  hideStates();
  el.forecast.innerHTML = '';
  el.errorText.textContent = msg;
  el.error.hidden = false;
  el.status.textContent = '';
}
function showSkeleton() {
  el.forecast.innerHTML = '<div class="skeleton-card"><div class="skel skel-title"></div><div class="skel skel-temp"></div><div class="skel skel-line"></div></div>';
}
function hourLabel(iso) {
  const h = Number(iso.slice(11, 13));
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ' ' + suffix;
}
function dayLabel(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function renderForecast() {
  const f = state.forecast;
  const p = state.place;
  if (!f || !p) return;
  hideStates();
  const hoursHtml = f.hours.map((h) =>
    '<div class="hour-cell"><span class="h">' + hourLabel(h.time) + '</span>' +
    '<span class="t">' + temp(h.tempC) + '</span></div>').join('');
  const daysHtml = f.days.map((d) =>
    '<li class="daily-row"><span class="day">' + dayLabel(d.date) + '</span>' +
    '<span class="cond">' + esc(wmoLabel(d.code)) + '</span>' +
    '<span class="range"><span class="lo">' + temp(d.minC) + '</span> / ' + temp(d.maxC) + '</span></li>').join('');
  el.forecast.innerHTML =
    '<article class="current-card">' +
    '<h2>' + esc(p.name) + '</h2>' +
    (p.region ? '<p class="place-sub">' + esc(p.region) + ' · ' + esc(f.timezone.replace('_', ' ')) + '</p>' : '') +
    '<div class="current-main"><span class="current-temp">' + temp(f.current.tempC) + '</span>' +
    '<span class="current-cond">' + esc(wmoLabel(f.current.code)) + '</span></div>' +
    '<div class="current-meta">' +
    '<span>Feels like <b>' + temp(f.current.feelsC) + '</b></span>' +
    '<span>Humidity <b>' + f.current.humidity + '%</b></span>' +
    '<span>Wind <b>' + Math.round(f.current.windKmh) + ' km/h</b></span>' +
    '</div></article>' +
    '<h3 class="section-title">Next 24 hours</h3>' +
    '<div class="hourly-strip">' + hoursHtml + '</div>' +
    '<h3 class="section-title">7-day forecast</h3>' +
    '<ul class="daily-list">' + daysHtml + '</ul>';
}

/* ---------- geolocation ---------- */
el.locate.addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    showError('Geolocation is not available in this browser.');
    return;
  }
  el.status.textContent = 'Getting your location…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      selectPlace({
        name: 'Current location',
        region: '',
        latitude: Number(pos.coords.latitude.toFixed(4)),
        longitude: Number(pos.coords.longitude.toFixed(4)),
      }, false);
    },
    () => showError('Location permission was denied or unavailable. Search for a city instead.'),
    { timeout: 10000 }
  );
});

/* ---------- wiring ---------- */
el.input.addEventListener('input', (e) => debouncedSuggest(e.target.value));
el.input.addEventListener('focus', () => {
  if (el.suggestions.children.length > 0) el.suggestions.hidden = false;
});
document.addEventListener('click', (e) => {
  if (!el.suggestions.contains(e.target) && e.target !== el.input) el.suggestions.hidden = true;
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') el.suggestions.hidden = true; });
function setUnit(u) {
  state.unit = u;
  el.unitC.setAttribute('aria-pressed', u === 'c' ? 'true' : 'false');
  el.unitF.setAttribute('aria-pressed', u === 'f' ? 'true' : 'false');
  renderForecast(); // recomputes from cached °C data — no refetch
}
el.unitC.addEventListener('click', () => setUnit('c'));
el.unitF.addEventListener('click', () => setUnit('f'));
document.getElementById('error-retry').addEventListener('click', () => {
  if (state.lastRequest) state.lastRequest();
});

function updateOffline() { el.offline.hidden = navigator.onLine; }
window.addEventListener('online', updateOffline);
window.addEventListener('offline', updateOffline);

renderRecent();
updateOffline();
