# Kumbh Park — Step 2: Live Location + Start Journey

> **Scope lock.** Step 1 (Home journey + Find Parking UI) and the basic route drawing are DONE and approved.
> This step ONLY adds: (1) "Use my current location", (2) a "Start Journey" button/flow, (3) a small journey animation, (4) a clear Google Maps button.
> Do NOT redesign the page, change the route-drawing engine, or touch Bookings, Tickets/QR, Host, Admin, Scan QR, or auth/demo logic.

---

## 1. Agent Prompt (copy-paste this)

```
You are working on the EXISTING Kumbh Park (Parkora) project. The Find Parking page
already draws a route (green line), shows a "Navigating to <parking>" card with
drive time, distance, walk time, a "From:" dropdown and a Google Maps button, and
each listing has a "Route" button. The UI is approved — do NOT redesign it.

Read KUMBH_PARK_STEP2_NAVIGATION.md fully before editing.

Add ONLY the features in that file, in order. Reuse the existing routing code,
map component and navigation card. Do not add new map/routing libraries unless
already in package.json. Do not change routes, data models, booking flow, or
other pages.

PHASE 0 — INSPECT (no edits): find the navigation card, the "From" dropdown,
the Route button handler, the locate-me icon in the search bar, the routing
function, and the user-location marker code. Report what already exists
(some of these may be half-built) and what is missing. Then proceed.

PHASE 1 — Use my current location
PHASE 2 — Start Journey flow + animation
PHASE 3 — Google Maps button polish
PHASE 4 — Verify and report (root cause of anything that was not working,
files modified, test results, build/lint/type-check output).

Verify in a real browser, not only by building.
```

---

## 2. What I see in the current screenshot

Working: route line, navigation card (10 min drive · 9.4 km · 125 min walk), From dropdown, Google Maps button, Route buttons, price pins.

Missing / broken:
- **No "Start Journey" button** anywhere, so there is no way to begin navigating.
- **No clear "Use my current location" action.** The small locate icon in the search bar does not visibly do anything, and the "From:" dropdown only offers preset places (e.g. Nashik Rd Station).
- **No journey animation** — the route just appears.
- Layout glitches near the bottom of the map: the selected-parking card overlaps the "Nashik Monitor Layers" button, and the "Reserve Bay →" button is partly clipped.
- Many price pins overlap in the Adgaon/Panchavati area (cluster when zoomed out).

---

## 3. PHASE 1 — "Use my current location"

1. In the navigation card's **From** dropdown, add a first option: **📍 My current location**. Make it the default when location is available.
2. Make the **locate icon in the search bar** work: on click, request location and fly the map to the user.
3. Use `navigator.geolocation.getCurrentPosition` (high accuracy, ~10s timeout) on a **user click only** — never on page load.
4. Show a **blue pulsing dot** at the user's position (keep the existing "Nashik Rd Station" marker only when that preset is chosen).
5. **States to handle with friendly inline messages** (no alerts):
   - Requesting: button shows "Locating…" with a spinner.
   - Denied: "Location permission blocked. Enable it in your browser settings, or pick a starting point from the list."
   - Unavailable / timeout: "Couldn't get your location. Pick a starting point instead."
   - Not HTTPS / unsupported: same fallback message.
   - Always keep the preset dropdown as a working fallback.
6. When location is obtained and a parking is already selected, **recalculate the route** from the real position to the parking, and update drive time, distance and walk time.
7. Don't store or send the location anywhere; keep it in component state only.

**Edge case:** if the user is far from Nashik (e.g. testing from another city), still compute the route but show a small note "You're far from Nashik — showing the route anyway", or fall back to the preset. Do not crash.

---

## 4. PHASE 2 — "Start Journey" + animation

### Button
- Add a prominent **Start Journey** button inside the navigation card (primary: forest green, white text, play/navigation icon). Place it beside or under the stats; keep the Google Maps button as secondary.
- Visible only when a route exists. Disabled with tooltip "Choose a parking first" otherwise.

### Flow
1. **Idle:** route shown, Start Journey visible.
2. **On click → Journey mode:**
   - Map zooms/fits to the full route, then eases in toward the start.
   - A **car marker** (reuse the car icon from the Home journey if available) appears at the route start.
   - The route line **draws progressively / the traveled part turns gold** while the remaining part stays green.
   - The card switches to a compact **journey HUD**: remaining distance, ETA, and a thin progress bar; buttons: **Pause/Resume**, **Stop**, **Open in Google Maps**.
3. **Animation (simulated preview):**
   - Move the car along the actual route polyline using `requestAnimationFrame` (not setInterval), rotating to the heading.
   - Total animation length about **8–12 seconds** regardless of real distance, with ease-in-out. Camera follows gently (`easeTo`/`panTo`, no jerky re-centering).
   - Remaining distance and ETA count down in sync with the car.
4. **If the user is in live-location mode** (Phase 1 succeeded), additionally offer **"Follow my location"**: use `watchPosition` while journey mode is active, move the blue dot, and update remaining distance. Clear the watch on Stop/unmount. If not available, the simulated animation is the default.
5. **On arrival:** car stops at the parking, pin pulses, HUD shows **"You've arrived 🎉"** with two buttons: **Reserve Bay →** (opens the existing booking flow) and **Done**. Fire once only.
6. **Stop** resets to the idle route state. Selecting another parking or clicking "Route" on another card cancels any running journey cleanly.

### Quality rules
- Respect `prefers-reduced-motion`: skip the animated movement, jump to the arrival state with the route shown.
- Cancel animation frames, timers and geolocation watchers on unmount, Stop, and route change (no leaks, no double animations).
- Works with both Standard and Satellite layers.
- Keep colors consistent: forest green (remaining route), gold/yellow (traveled), charcoal HUD, white text.

---

## 5. PHASE 3 — Google Maps button

- Keep the existing **Google Maps** button; make sure it builds a correct deep link:
  `https://www.google.com/maps/dir/?api=1&origin=<lat,lng>&destination=<lat,lng>&travelmode=driving`
- **Origin** = user's real location if available, otherwise the selected preset's coordinates. If origin is unknown, omit it so Google Maps uses the device location.
- **Destination** = the selected parking's coordinates (not its name).
- Opens in a new tab with `rel="noopener noreferrer"`.
- Optional small toggle: Drive / Walk (sets `travelmode`).

---

## 6. Small layout fixes (only these)

- Selected-parking card at the bottom of the map must **not overlap** "Nashik Monitor Layers" and **must not clip** the "Reserve Bay →" button (add bottom spacing / move the layers button).
- When the journey HUD is open, keep the parking card and HUD from stacking over each other (collapse the parking card to a one-line summary).
- Do not otherwise restyle the map or list.

---

## 7. Acceptance checklist

- [ ] "My current location" appears in the From dropdown; locate icon in the search bar works.
- [ ] Location is requested only after a click; blue pulsing dot appears; map flies to it.
- [ ] Denied / timeout / unsupported cases show friendly messages and fall back to presets.
- [ ] Route and time/distance update when the start point changes.
- [ ] Start Journey button is visible when a route exists, and is disabled/hidden otherwise.
- [ ] Clicking it plays the car animation along the actual route; traveled part is gold; HUD updates in sync.
- [ ] Pause/Resume and Stop work; choosing another parking cancels the journey cleanly.
- [ ] Arrival state appears once, with a working Reserve Bay button.
- [ ] Google Maps button opens a correct directions link with the right origin/destination.
- [ ] Reduced-motion users get no animated movement.
- [ ] No console errors, no leaked listeners/animations; build, lint and type-check pass.
- [ ] Bottom-of-map overlap/clipping fixed; nothing else visually changed.

---

## 8. Required final report format

```
ALREADY EXISTED:      (what was found in Phase 0)
ROOT CAUSES:          (why location/Start Journey weren't available or working)
FILES MODIFIED:       (list)
CHANGES:              (bullets per phase)
TESTS RUN:            (permission allow / deny, far-away location, pause/stop,
                       route change mid-journey, satellite layer, reduced motion)
BUILD/LINT/TYPES:     (commands + results)
KNOWN LIMITATIONS:    (e.g. simulated animation vs live tracking)
```
