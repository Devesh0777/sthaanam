# Sthanam — Roadmap (frontend polish → backend → deploy)

Project: formerly "Kumbh Park / Parkora". New brand name: **Sthanam**. Smart parking for Nashik, Maharashtra (Kumbh Mela 2027 + everyday use).
Run the steps **in order**. Give the coding agent ONE step file at a time. After each step, test in the browser, then send a screenshot to your planning agent.

## What I saw in your latest video (kumbh7.mp4)
- **Home:** the top hero ("Smart parking for Nashik's Kumbh journey" + two buttons + "scroll overview map below") is plain text on cream with a lot of empty space. The dark road journey below it now works (cards, car, "Journey complete" card).
- **Find Parking:** stock photos on every card. The same garage photo repeats across listings, a car-in-snow photo is used for a farmhouse lawn, and a bedroom photo is used for a temple parking extension. This is what makes it look generic.
- **Reserve:** Duration & Permit modal → Review & Pay ("Confirm & Pay") → Digital Parking Ticket (QR). Payment is simulated; there is no real payment step.
- **Host:** "List your parking" 6-step wizard (Location, Details, Photos, Pricing, Hours, Review) — functional but plain.
- **Admin:** "Operations Control Center" with 4 KPI cards, tabs, a bar chart, an occupancy donut, and a host-verification queue — functional but basic.
- **Brand text still says "Kumbh Park"** in the header, demo modal ("Kumbh Park Parking Demo"), and the Admin title.

## Order of work
| Step | File | What |
|---|---|---|
| 1 | `01_RENAME_TO_STHANAM.md` | Rename brand everywhere (no layout changes) |
| 2 | `02_FIND_PARKING_CARDS.md` | Replace photos with icons; richer, human-designed cards |
| 3 | `03_RESERVE_AND_UPI_QR_PAYMENT.md` | Payment step with UPI QR (provider-ready) |
| 4 | `04_HOME_LANDING_PAGE.md` | Upgrade the basic front page |
| 5 | `05_HOST_MY_SPACES.md` | Host dashboard / My Spaces + listing wizard polish |
| 6 | `06_ADMIN_DASHBOARD.md` | Admin console redesign |
| 7 | *(after 1–6 are approved)* | Backend: Postgres + API + real payments + deploy |

## Backend outline (Step 7 — prompt will be written after the UI steps)
- **Database:** PostgreSQL (Neon / Supabase / Railway all work). **ORM:** Prisma (fast to ship).
- **API:** Node (Fastify or Express) with TypeScript, JWT or session auth, role-based access (user / host / admin).
- **Core tables:** users, hosts, spaces, space_amenities, bookings, payments, gate_events (entry/exit scans), incidents, verification_requests, zones, landmarks.
- **Payments:** Razorpay (or Cashfree) UPI QR + webhooks; the server confirms payment. The frontend never decides a payment succeeded.
- **Deploy:** frontend on Vercel/Netlify; API + DB on Render/Railway/Fly + managed Postgres.
- Replace the demo data with seeded data (zones, landmarks, listings) via a seed script.

## Realistic note on "deploy in 2 days"
Doable if scope stays tight: Day 1 = Steps 1–4. Day 2 = Steps 5–6 + minimum backend (auth, spaces, bookings, payments webhook) + deploy. Skip anything not in these files.

## Shared rules (already repeated inside each step file)
Inspect first → fix root causes → reuse existing components/data → no new libraries unless already installed → don't touch finished features → verify in a real browser (1366×768, 1440×900, 1920×1080, ~390px) → run build/lint/type-check → report in the fixed format.
