# Kumbh Park — Step 3: Turn-by-Turn Navigation HUD, Layout Fixes, Accurate Location

> **Scope lock.** Steps 1 and 2 are done and approved (Home journey, Find Parking UI, route line, Start Journey, arrival card).
> This step ONLY does three things:
> 1. Add an animated **turn-by-turn navigation HUD** on top of the map (Google Maps / road-signboard style).
> 2. Fix the **cropped/overlapping buttons** at the bottom of the Find Parking map.
> 3. Fix **"My current location"** so it is captured accurately (it is currently not working properly).
>
> Do NOT redesign the page, replace the map library or routing provider, or touch Bookings, Tickets/QR, Host, Admin, Scan QR, or the Home page.

---

## 1. Agent Prompt

You are working on the EXISTING Kumbh Park (Parkora) project. The Find Parking page
already draws a route, has a Start Journey flow with a moving car, an arrival card,
a navigation summary card and a "My current location" option. The overall UI is
approved — do NOT redesign it.

Do ONLY these three things, in this order:
  A) Fix the bottom-of-map layout (cropped buttons)
  B) Fix accurate current-location capture
  C) Add the turn-by-turn navigation HUD with animations

Reuse the existing map, routing and journey code. Do not add new libraries unless
they are already in package.json. Do not change data models, booking flow, or other pages.
Find the ROOT CAUSE of each bug before fixing; no magic margins, no hardcoded values.

PHASE 0 — INSPECT (no edits): locate the map container and its height rules, every
absolutely-positioned overlay on the map (parking card, Layers button, legend,
attribution, Reserve button, journey card), the geolocation code, the routing
request/response handling (check whether turn "steps" are requested), and the
Start Journey animation. Report findings and suspected root causes, then proceed.

Then do PHASE A, B, C, and finish with PHASE D (verify + report).
Verify in a real browser at 1366x768, 1440x900, 1920x1080 and ~390px wide;
a passing build alone is not enough.

---

## 2. What is wrong in the current screenshot

- **Bottom of the map is cropped:** the "Nashik Monitor Layers" button overlaps the selected-parking mini card; its "₹35/hr · Reserve →" button is cut off by the bottom edge; the Available/Limited/Full/Selected legend is clipped; the OpenFreeMap/OSM attribution collides with the legend.
- **Location looks wrong:** the blue dot sits at the preset "Nashik Rd Station" even when "My current location" is expected, and it is not clearly the user's real/accurate position. No accuracy indicator, no error feedback.
- **No driving directions:** the route is a line only. There is no "turn left in 300 m onto …" guidance, no next-turn arrow, no sign-style banner, no trip progress bar.
- The "You've arrived" card works — keep it, but it should be driven by the new HUD state.

---

## 3. PHASE A — Fix the cropped bottom layout

### Likely root causes (verify, don't assume)
1. Map wrapper height uses `100vh` while the page also has the demo banner + header above it, so the bottom ~100px is pushed off-screen. Use `height: calc(100dvh - <banner + header height>)` or a flex column that fills the remaining space (`min-height: 0` on flex children; `overflow: hidden` on the wrapper only).
2. Several overlays use independent `position:absolute; bottom: …` values, so they collide.
3. A parent with `overflow:hidden` clips children positioned outside it.

### Required result
- Wrap all bottom map overlays in **one container** (`absolute; inset-x: 0; bottom: 0; padding: 12px; display:flex; flex-direction:column; gap:8px; pointer-events:none`, children `pointer-events:auto`) so they stack instead of overlapping. Respect `env(safe-area-inset-bottom)`.
- Order (bottom-up): legend / attribution row → selected-parking card (with fully visible **Reserve** button) → Layers button. During a journey, the parking card collapses to one line so the HUD has room.
- The legend becomes compact (single row, small dots) and **never overlaps the attribution**. Keep the OSM/OpenFreeMap attribution visible and legal.
- Nothing is cut off at 1366×768, 1440×900, 1920×1080, or on a ~390px phone width. Both the list and map scroll/size correctly with no page-level double scrollbars.

---

## 4. PHASE B — Accurate "My current location"

### Likely root causes (verify, don't assume)
1. The code silently falls back to the preset (Nashik Rd Station) when geolocation fails or times out.
2. Options aren't set for accuracy: needs `{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }`.
3. Only a single `getCurrentPosition` reading is used — the first reading is often a coarse Wi-Fi/IP fix.
4. **Coordinate order bug:** geolocation gives `latitude, longitude`; MapLibre/Mapbox and GeoJSON use `[longitude, latitude]`. Check every place the position is passed to the map, marker or router.
5. Desktop browsers have no GPS and use Wi-Fi/IP, which can be kilometres off — this is a hardware limit, not a code bug; the UI must be honest about it.
6. Page not on HTTPS/localhost → geolocation is blocked.

### Required behavior
1. On click of "My current location" (or the locate icon), start `navigator.geolocation.watchPosition` with high accuracy for up to ~15 seconds. **Keep the best (lowest `accuracy`) reading**; stop early once `accuracy ≤ 30 m`; clear the watch afterward (and on unmount).
2. Show a **blue dot + translucent accuracy circle** (radius = `coords.accuracy`) and a small label "Accuracy ±N m". Fly the map to the position (zoom ~16).
3. If the best accuracy is worse than ~100 m, show a gentle note: "Location is approximate. For best accuracy use your phone's GPS with Location turned on." Offer **"Set start on map"** — a manual mode where the user taps the map to place the start point (also a valid fallback).
4. **Never silently fall back** to the preset. If location fails, show a clear inline message (denied / unavailable / timeout / insecure context) and let the user choose a preset or place a pin manually. Mark clearly which start point is active.
5. When the position is obtained, recompute the route and drive/walk time from it. Debounce recomputation so it doesn't fire on every tiny update (e.g. only if moved > 25 m).
6. Do not use IP-based geolocation services. Do not store or transmit the location; keep it in state.
7. In journey mode with "Follow my location", use `watchPosition`, smooth the marker movement, and ignore readings with very poor accuracy (> 100 m) or impossible jumps.

---

## 5. PHASE C — Turn-by-turn navigation HUD

**Reference:** dark, glassy HUD over the map. Kumbh Park colors: charcoal glass panels, forest green route/accent, gold/yellow highlights, white text.

### C1. Get the steps from routing
- Inspect the routing request. Ensure it requests step-by-step data (e.g. OSRM: `steps=true&overview=full&geometries=geojson`; or the equivalent for the current provider). Do not change provider.
- Normalize each step into: `{ type, modifier, streetName, distanceMeters, durationSeconds, location: [lng, lat], pathStartIndex }`.
- Handle missing street names (show "Continue straight" / "Turn right" without a name). Handle roundabouts ("Take the 2nd exit"), U-turns, merge, fork, and arrive.

### C2. HUD components (all inside the map area, over the map)

**1. Maneuver card — top-left**
- Large turn icon (↰ ↱ ↑ ⮌ roundabout, etc. — use existing icon set; no new library), **distance to the next turn** in big text (e.g. "300 m", switching to "0.3 km" > 1 km), and the **street name** below.
- Below it a smaller "Then" chip showing the following maneuver icon + distance, when it's within ~500 m.

**2. Road-signboard banner (above the route, top-center)**
- A compact Indian-road-sign–style board: **green board with white text** for the destination direction ("Towards Adgaon · Farmhouse Front Lawn"), and a **blue/white** variant for parking/destination ("P · 7 bays"). Keep it small, rounded, with a subtle border; shown while driving and swapped for the arrival sign at the end. Keep text real (from the route/destination); do not invent road names or highway numbers.

**3. Trip progress bar — bottom**
- Remaining distance · remaining time · ETA clock time, a thin progress bar with the car/arrow marker traveling along it (green traveled, gray remaining), and a close/stop (X) button.
- Pause/Resume, Mute/Voice toggle, "Open in Google Maps" kept as secondary icon buttons.

**4. Side controls (right)**
- Recenter/follow button (arrow icon), zoom +/−, and a speed chip in **km/h** (simulated speed in preview mode, real `coords.speed` converted when live; hide if unavailable). Reuse existing zoom controls; don't duplicate them.

**5. Map marker**
- During journey, replace the car marker with a **navigation arrow** inside a faint pulsing accuracy/halo ring, rotated to the heading. Keep the existing car option only for the simulated preview if it already exists.

### C3. Logic (single source of truth)
- One `journeyProgress` value (meters along the route) drives: the car/arrow position, heading, current step index, distance to next maneuver, remaining distance/time/ETA, traveled-vs-remaining route coloring, the progress bar, and the arrival state. No separate calculations that can drift.
- Determine the current step by projecting the position onto the route polyline and comparing to each step's `pathStartIndex`. In live mode, if the user is > ~50 m off the route for several seconds, show "Rerouting…" and recompute (once, debounced).
- Works while paused/resumed, and when the user picks another parking or presses Stop (cancel everything cleanly).

### C4. Animations (smooth, subtle, 60fps, `requestAnimationFrame`/CSS transitions)
- Maneuver card **slides/fades** when the step changes; the turn arrow does a short "nudge" animation as the turn gets close (< 100 m); the distance number counts down smoothly.
- Route: traveled part turns **gold**, remaining stays **green**; a soft animated "flow" dash along the upcoming segment is allowed but must be subtle.
- Camera: follows the arrow gently with slight pitch/bearing-up **only if** the map library already supports it; no jerky re-centering; user pan pauses follow until Recenter is pressed.
- Sign banner: fade/slide in at the start and swap on arrival.
- Arrival: card slides in ("You've arrived") with the existing Reserve Bay button; fire once.
- Respect `prefers-reduced-motion`: no sliding/flow/nudge; update values instantly.

### C5. Voice (optional, default OFF)
- A speaker toggle using the browser `speechSynthesis` ("In 300 metres, turn left onto …", "You have arrived"). Speak each instruction at most once per step (at ~300 m and ~50 m). Silent if unsupported. No external TTS services.

### C6. Responsive
- Desktop: maneuver card top-left, sign top-center, side controls right, trip bar bottom-center.
- Narrow screens (≈390px): maneuver card full-width at the top, trip bar full-width at the bottom, sign banner hidden or inline in the maneuver card; nothing overlaps the Layers button, legend, or parking card (use the stacked container from Phase A).

---

## 6. Acceptance checklist

**Layout (A)**
- [ ] No cropped/overlapping buttons at 1366×768, 1440×900, 1920×1080, ~390px.
- [ ] Reserve button, Layers button, legend and attribution are all fully visible and don't overlap.

**Location (B)**
- [ ] Clicking "My current location" requests permission once, shows the blue dot and an accuracy circle with "±N m".
- [ ] Best-accuracy reading is used; watch is cleaned up; no silent fallback to Nashik Rd Station.
- [ ] Denied / timeout / insecure-context cases show clear messages and offer "Set start on map" and presets.
- [ ] Lat/lng order verified everywhere (the dot appears at the real place, not mirrored/offset).
- [ ] Route and ETA recompute from the real start point.

**HUD (C)**
- [ ] Route request includes steps; each maneuver has a correct icon, distance and street name.
- [ ] Maneuver card, "Then" chip, signboard, trip bar, speed chip and recenter button are present and styled in Kumbh Park colors.
- [ ] Starting the journey animates the arrow along the route; turn card updates at each step; distances count down smoothly.
- [ ] Traveled route is gold, remaining is green; progress bar and ETA stay in sync.
- [ ] Pause/Resume/Stop work; choosing another parking cancels cleanly; going off-route (live mode) triggers a single "Rerouting…".
- [ ] Arrival card appears once with a working Reserve Bay button.
- [ ] Voice toggle works and is off by default; reduced-motion respected.
- [ ] No console errors, no leaked animation frames/geolocation watchers; build, lint, type-check pass.
