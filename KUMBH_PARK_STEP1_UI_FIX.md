# Kumbh Park — Step 1: UI Fix (Home Journey + Find Parking)

> **Scope lock.** This file covers **Step 1 only**: fixing the UI of the Home page journey and the Find Parking page.
> **Do NOT build the "navigate from my current location to the chosen parking" feature in this step.** That is Step 2 and will be given as a separate prompt.
> Do not touch Bookings, Tickets/QR, Host, Admin, Scan QR, or auth/demo-mode logic.

---

## 0. How to use this file

1. Put this file in the project root (or `/docs`) as `KUMBH_PARK_STEP1_UI_FIX.md`.
2. Paste the **Agent Prompt** (Section 1) into your coding agent.
3. Tell the agent to read this entire file before editing anything.
4. When the agent finishes, check the **Acceptance Checklist** (Section 5) yourself in the browser before moving to Step 2.

---

## 1. Agent Prompt (copy-paste this)

```
You are working on an EXISTING project: Kumbh Park (Parkora), a smart parking
platform for Nashik, built for Kumbh Mela 2027. This is targeted debugging and
UI polish — NOT a rewrite.

Read KUMBH_PARK_STEP1_UI_FIX.md fully before changing anything.

RULES
- Work only on: (A) Home page "Welcome to Nashik" scroll journey, and
  (B) Find Parking page UI.
- Do NOT implement live-location or turn-by-turn navigation. That is a later step.
- Do NOT change routes, data models, booking logic, tickets/QR, Host, Admin,
  Scan QR, or the demo user/role switcher.
- Do NOT invent or duplicate destinations. Use the existing data.
- Do NOT apply arbitrary margins/hardcoded progress values to hide bugs.
  Find the root cause first.
- Preserve branding: dark charcoal grid (journey), forest green, gold/yellow,
  white, cream. Preserve existing fonts and nav/header.
- Make the smallest reliable changes. Reuse existing components.
- Do the work in the phases below, in order. After each phase, stop and report
  before starting the next.

PHASE 0 — INSPECT (no edits)
Find and list: the Home journey component(s), the SVG road path, the stops data
file, the scroll/progress logic, the car element, the progress HUD, the
Find Parking page, its map component, its listing-card component, and its
filter components. Report file paths, how scroll progress is computed, and what
you believe the root causes are. Wait for confirmation if anything is unclear.

PHASE 1 — HOME JOURNEY FIX (Section 3 of the .md)
PHASE 2 — FIND PARKING UI (Section 4 of the .md)
PHASE 3 — VERIFY (Section 5 of the .md), then report:
  root cause(s), files modified, what changed, test results.

Run the project's build, lint and type-check commands, and verify the actual
rendering in a browser at 1366x768, 1440x900 and 1920x1080 (and a narrow
~390px width for sanity). A passing build alone is NOT sufficient.
```

---

## 2. What is wrong today (observed in your screen recording)

### Home — "Welcome to Nashik" journey
- The **HUD says "Stop 02 / 05 · Muktidham Temple"** while the road on screen is at **Stop 04 (Panchavati & Sita Gufa) heading to Stop 05**. HUD, road and car are **out of sync**.
- **No destination cards are visible** anywhere along the road. Large empty dark-grid areas on both sides.
- A **stray grey spur** branches off the road near Stop 04 and ends in nothing (looks like an unfinished connector to a missing card).
- **Stop labels are drawn on top of the road** (e.g. "04. Panchavati & Sita Gufa" is struck through by the road line). Labels are tiny monospace text with no card.
- The **sticky HUD pill sits right under the header** along with the subtitle text; the top of the viewport is crowded and the road starts abruptly under it.
- The car is not clearly visible on the road in the captured frames.

### Find Parking
- **Map shows only one cluster marker** ("4 Spots · From ₹25") instead of a price pin per listing.
- **Map control bar is overcrowded**: Positron / Standard / Streets / Satellite + Price Filter + 3D Terrain + dark-mode moon + Nashik Layers all in one row.
- **Bottom of the map is clipped/overlapped**: "Search This Section" button and the Available/Limited/Full/Selected/Instant legend collide and are cut off.
- **Filter area is heavy**: two rows of large chips + a search bar + two icon buttons; "Open Now" is a solid black chip that doesn't match the rest of the palette; the green filter icon button duplicates "SORT & FILTERS →".
- **Listing cards are tall and sparse**: lots of white space, no photo, no distance/ETA, tiny grey sector tag, repeated "Reserve →" buttons. Only ~2.5 cards visible per screen.
- Badges use many different colors (green, yellow, orange, grey) with no clear hierarchy.
- The selected-marker → details-card link is not visible/obvious.

---

## 3. PHASE 1 — Home journey: required behavior

### Stops (use existing data only)
| # | Stop |
|---|------|
| 01 | *(existing in code — inspect and reuse)* |
| 02 | Muktidham Temple *(already exists — do not recreate)* |
| 03 | Ramkund & Godavari Ghat |
| 04 | Panchavati & Sita Gufa *(already exists)* |
| 05 | Shri Kalaram Mandir |

Verify the real data file for Stop 01 and the exact copy of every stop. If any stop is missing from the data, report it before adding anything.

### Likely root-cause areas to check (verify, don't assume)
1. **Single source of truth for progress.** Car position, HUD, dots, distance and completion must all derive from ONE `progress` value (0 → 1) computed from the journey container's scroll range — not from separate calculations.
2. **Stop positions on the path.** Each stop's position must be computed from the real SVG path (`getPointAtLength`) at a fixed fraction of total length, and the stop "active" thresholds must use the same fractions.
3. **Scroll range.** Use the journey section's own `getBoundingClientRect()`/offset, minus sticky header height, for start/end. Check the section height, `position: sticky` container, `top` offset, and any ancestor with `overflow: hidden` (which silently breaks sticky).
4. **SVG sizing.** `viewBox` aspect ratio vs. container size; `preserveAspectRatio`; road path coordinates vs. stop coordinates (they may be in different coordinate spaces).
5. **Cards hidden** by opacity/transform tied to a wrong progress, `display:none`, z-index, or clipped by overflow.
6. **Stray spur path** — find where it is defined; it should either connect to a card (as a short connector) or be removed.

### Required result
1. All five stops appear **in order, 01 → 05**, along the road.
2. **Every stop has a destination card**, attached to its stop point by a short connector line. Cards **alternate left / right** (01 right, 02 left, 03 right, 04 left, 05 right — or the reverse, whichever matches the road curve better).
3. Card contents use existing data (name, short description, parking hint/price if present). Style: dark card, thin border, gold accent for the stop number, green for CTA; consistent with the rest of the site.
4. **The car follows the SVG road path** and rotates to the path tangent.
5. **HUD, car, distance, dots and completion are synchronized** from the single progress value. Dot *n* is "active" only when the car has reached stop *n*; the final state shows a clear "Journey complete" state at Stop 05.
6. Works **scrolling down and up** (no one-way state, no sticky "visited" flags that fail on reverse).
7. **Cards can appear/fade in** as the car approaches, but must **never stay invisible** when their stop is reached, and must be reachable when scrolling back.
8. **No clipping**: no stop, label or card hidden behind the header, the HUD, or outside the viewport. Account for header + HUD height in the sticky offset.
9. **Space used well**: the road occupies the center; cards fill the sides. No huge empty grid areas, and the road must not be stretched unnaturally — adjust `viewBox`/section height instead.
10. Stop labels must **not overlap the road line**; offset them or move them into the cards.
11. Respect `prefers-reduced-motion` (show all stops/cards statically).

### Do not
- Hardcode `progress`, or add magic `margin-top` values to hide misalignment.
- Replace the whole journey with a new component if a fix to the existing one works.
- Change brand colors or the grid background.

---

## 4. PHASE 2 — Find Parking: required UI changes

Keep all working map and filter functionality. This is a visual/layout pass.

### 4.1 Layout
- Keep the two-pane layout: **list on the left, map on the right**.
- Make the map and list fill the viewport height under the header (no double scrollbars, no page-level clipping).

### 4.2 Search + filters (left pane header)
- One search input. Move the "locate me" icon **inside** the search field (right side). Do **not** wire it to navigation yet — keep whatever it does today.
- **One** row of compact, horizontally scrollable filter chips: `Within 1 km · Under ₹20 · ₹20–₹40 · Above ₹40 · Instant QR · Open Bays · Open Now`.
- Remove the duplicated green filter icon button *or* the "SORT & FILTERS →" link — keep one, styled consistently.
- Active chip style: **forest-green fill, white text**. Inactive: white with a light border. Remove the solid black "Open Now" chip.
- **Price filters must actually filter** the list and the map pins. Verify.
- Show result count + sector in one small line ("10 parking spots · Nashik · Kumbh 2027").

### 4.3 Listing cards
- Make cards **compact and scannable** (target 4+ visible per screen at 1440×900):
  - Left: small thumbnail (use existing listing image if available; otherwise a neutral placeholder — do not fetch random images).
  - Title (bold), address (one line, truncated), rating + 2–3 amenity tags.
  - Right/bottom: **price (₹/hr) in bold**, distance or sector tag, and ONE "Reserve" button.
- Reduce badge noise: show at most **2 badges** (e.g. Verified + availability). Use one color for "good" (green), one for "limited" (amber).
- **Selected state**: when a marker is clicked, the matching card gets a green/gold border and scrolls into view; when a card is clicked/hovered, the marker highlights.

### 4.4 Map
- Style: **minimal, light-gray base with yellow/black accents** (keep the current Positron-style base if that's what is working). Don't change the map library or break pan/zoom.
- **One price pin per listing** (e.g. a rounded gold pill "₹40") at the listing's real coordinates. Use clustering only when zoomed out, and show the count + lowest price there.
- Selected pin: black pill with gold text, slightly larger, raised z-index.
- Clicking a pin updates a **details card** (name, price, availability, rating, "Reserve" button) — pinned bottom-left or bottom-center of the map, not covering the controls.
- **Simplify the top control bar**: keep a single base-layer toggle (Standard / Satellite), zoom controls, and a "Filters" button. Move "3D Terrain", dark-mode and "Nashik Layers" into one "Layers" popover (keep them functional, just tidy).
- **Fix the bottom edge**: "Search this area" becomes a small centered pill at the top-center or bottom-center with safe margin; the legend becomes a compact collapsible/inline legend that doesn't overlap it or get clipped.

### 4.5 Visual consistency
- Cream/off-white page background, white cards, forest-green primary actions, gold highlights, charcoal text. Max **one** accent color per component.
- Consistent radius (e.g. 12–16px), consistent card shadows, consistent font sizes.

### Do not
- Change data models, pricing, or the reservation/booking flow.
- Implement directions/routing/live-location tracking (Step 2).
- Add new map/UI libraries unless already in `package.json`.

---

## 5. PHASE 3 — Acceptance checklist

**Home journey**
- [ ] At scroll 0 the HUD shows Stop 01 and dot 1 is active; the car is at the start of the road.
- [ ] Scrolling down: Stop 01 → 02 → 03 → 04 → 05 in order; HUD label, distance, dots and car all change together.
- [ ] Stop 03 reads "Ramkund & Godavari Ghat"; Stop 05 reads "Shri Kalaram Mandir".
- [ ] Five cards exist, alternate sides, each connected to its stop; none clipped or hidden under the header/HUD.
- [ ] Car stays on the road and rotates with the curve.
- [ ] Scrolling back up reverses everything correctly; returning to top resets to Stop 01.
- [ ] Reaching the end shows a clear completion state, then the next page section appears normally.
- [ ] No large empty dark areas; road not distorted; no stray spur.
- [ ] Correct at 1366×768, 1440×900, 1920×1080; acceptable at ~390px.

**Find Parking**
- [ ] One compact search row + one chip row; no duplicated filter buttons.
- [ ] Price filters change both the list and the map pins.
- [ ] Each listing has its own price pin; clicking a pin updates the details card and highlights the list card.
- [ ] Map controls are decluttered; bottom button/legend not clipped or overlapping.
- [ ] 4+ cards visible per screen on a 1440×900 viewport.
- [ ] Reserve still opens the existing booking flow unchanged.

**Engineering**
- [ ] Build, lint, type-check all pass (paste the output).
- [ ] No new console errors/warnings.
- [ ] Only the files needed were modified; list them.

---

## 6. Required final report format

```
ROOT CAUSES:        (numbered, with file + line refs)
FILES MODIFIED:     (list)
FIXES — HOME:       (bullets)
FIXES — FIND PARKING: (bullets)
TESTS RUN:          (viewports, scroll up/down, filters, marker clicks)
BUILD/LINT/TYPES:   (commands + results)
KNOWN LIMITATIONS:  (anything not fixed, and why)
```

---

## 7. Coming next (do NOT start yet)

**Step 2 — Navigate to the chosen parking:** get the user's current location from the browser, and draw a route on the map from that location to the selected parking (with distance/ETA and an "Open in Google Maps" fallback). This will be a separate prompt once Step 1 is approved.
