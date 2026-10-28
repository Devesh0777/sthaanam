import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { spots } from '@/api/mock/spots'

/**
 * SthanamRoadHero
 * - "STHANAM" street-map typography with interactive perimeter parking spots.
 * - Dynamic scroll-driven vehicle driving along the Pilgrim Route road.
 * - Fully compliant with Sthanam branding and single CTA policy.
 */
export default function SthanamRoadHero() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const pilgrimPathRef = useRef(null)
  const [activeSpot, setActiveSpot] = useState(null)
  const [heroCarState, setHeroCarState] = useState({ x: 920, y: 85, angle: 180 })

  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return false
  }, [])

  // Calculate real total available bays from listings
  const totalAvailableBays = useMemo(() => {
    const sum = spots.reduce((acc, s) => acc + Number(s.capacity || 0), 0)
    return sum > 0 ? sum : 140
  }, [])

  // Calculate moving car position & rotation along saffron pilgrim route road
  const updateHeroCar = useCallback(() => {
    if (prefersReducedMotion) return
    if (!heroRef.current || !pilgrimPathRef.current) return
    try {
      const rect = heroRef.current.getBoundingClientRect()
      const totalScrollable = rect.height + window.innerHeight
      const currentScroll = window.innerHeight - rect.top
      const rawProgress = Math.max(0, Math.min(1, currentScroll / totalScrollable))

      const totalLen = pilgrimPathRef.current.getTotalLength()
      if (!totalLen || isNaN(totalLen)) return

      const currentLen = rawProgress * totalLen
      const pt = pilgrimPathRef.current.getPointAtLength(currentLen)

      const delta = 2.0
      const pt1 = pilgrimPathRef.current.getPointAtLength(Math.max(0, currentLen - delta))
      const pt2 = pilgrimPathRef.current.getPointAtLength(Math.min(totalLen, currentLen + delta))

      const dx = pt2.x - pt1.x
      const dy = pt2.y - pt1.y
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90

      setHeroCarState({ x: pt.x, y: pt.y, angle })
    } catch {
      // safe fallback
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) return
    window.addEventListener('scroll', updateHeroCar, { passive: true })
    updateHeroCar()
    return () => window.removeEventListener('scroll', updateHeroCar)
  }, [updateHeroCar, prefersReducedMotion])

  // Parking spots integrated along the perimeter city roads
  const mapParkingSpots = [
    {
      id: 'p-ramkund',
      name: 'Ramkund North Gate',
      zone: 'Zone 1',
      spots: '14 spots',
      walk: '3 min to Ghat',
      cx: 930,
      cy: 140,
    },
    {
      id: 'p-panchavati',
      name: 'Panchavati Heritage Hub',
      zone: 'Zone 2',
      spots: '22 spots',
      walk: '4 min to Banyan Grove',
      cx: 100,
      cy: 220,
    },
    {
      id: 'p-kalaram',
      name: 'Kalaram Basalt Parking',
      zone: 'Zone 3',
      spots: '9 spots',
      walk: '2 min to Temple',
      cx: 910,
      cy: 480,
    },
    {
      id: 'p-trimbak',
      name: 'Trimbak Highway Sector',
      zone: 'Zone 5',
      spots: '35 spots',
      walk: 'Express Shuttle',
      cx: 170,
      cy: 490,
    },
  ]

  // Highway typography paths for STHANAM (2 balanced rows: S T H A / N A M)
  const sthanamPaths = (
    <>
      {/* ROW 1: S T H A */}
      {/* S */}
      <path d="M 335,115 C 335,85 260,85 260,125 C 260,160 340,160 340,195 C 340,235 265,235 265,205" />
      {/* T */}
      <path d="M 425,85 L 515,85 M 470,85 L 470,235" />
      {/* H */}
      <path d="M 600,85 L 600,235 M 675,85 L 675,235 M 600,160 L 675,160" />
      {/* A */}
      <path d="M 760,235 L 800,85 L 840,235 M 775,175 L 825,175" />

      {/* ROW 2: N A M */}
      {/* N */}
      <path d="M 360,450 L 360,300 L 440,450 L 440,300" />
      {/* A */}
      <path d="M 520,450 L 560,300 L 600,450 M 535,390 L 585,390" />
      {/* M */}
      <path d="M 680,450 L 680,300 L 725,380 L 770,300 L 770,450" />
    </>
  )

  return (
    <section ref={heroRef} className="relative overflow-hidden bg-[#FAF7F2] text-[#17212B] pt-4 pb-10 md:pt-6 md:pb-14 border-b border-[#E6DFC6]">
      {/* ----------------- TOP IDENTITY BAR ----------------- */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#005A36]/10 px-4 py-1.5 border border-[#005A36]/20 text-[11px] sm:text-[12px] font-mono font-bold tracking-widest text-[#005A36] uppercase shadow-xs">
          <span className="size-2 rounded-full bg-[#E9A83A] animate-pulse" />
          NASHIK SMART MOBILITY 2027 • MAP OVERVIEW
        </div>
      </div>

      {/* ----------------- MAIN ILLUSTRATED ROAD-MAP HERO CONTAINER ----------------- */}
      <div className="relative mx-auto max-w-6xl px-3 sm:px-6 mt-5">
        <div className="relative overflow-hidden rounded-3xl bg-[#E0EBDC] border-4 border-[#C7DAC2] shadow-2xl p-2 sm:p-4 md:p-6">
          {/* Grid Texture Overlay */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #005A36 1px, transparent 1px),
                linear-gradient(to bottom, #005A36 1px, transparent 1px)
              `,
              backgroundSize: '36px 36px',
            }}
          />

          {/* Map Compass Rose (Top Right) */}
          <div className="absolute top-3 right-3 z-10 hidden sm:block pointer-events-none opacity-80">
            <svg className="size-14 text-[#005A36]" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="1" />
              <path d="M50,14 L56,44 L86,50 L56,56 L50,86 L44,56 L14,50 L44,44 Z" fill="#E9A83A" stroke="#17212B" strokeWidth="1.5" />
              <circle cx="50" cy="50" r="5" fill="#17212B" />
              <text x="50" y="10" textAnchor="middle" fill="#005A36" fontSize="10" fontWeight="bold" fontFamily="monospace">N</text>
            </svg>
          </div>

          {/* Map Legend (Compact Top Left) */}
          <div className="absolute top-3 left-3 z-10 hidden md:flex items-center gap-2.5 rounded-lg bg-white/90 backdrop-blur-md px-3 py-1.5 border border-[#C5D9BF] text-[10px] font-mono font-bold text-[#17212B] shadow-sm">
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-2 rounded bg-[#121A24] inline-block border border-[#FFD166]" />
              <span>Main Road (STHANAM)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-0 border-b-2 border-dashed border-[#E9A83A]" />
              <span>Pilgrim Route</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2.5 grid place-items-center rounded bg-[#005A36] text-white text-[7px] font-black">P</span>
              <span>Sthaanam Parking</span>
            </div>
          </div>

          {/* SVG STREET-MAP TYPOGRAPHY & NASHIK ENVIRONMENT VISUAL */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/10] max-h-[580px]">
            <svg
              viewBox="0 0 1200 620"
              className="w-full h-full drop-shadow-md select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="roadShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#0F1722" floodOpacity="0.28" />
                </filter>
                <filter id="carGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <linearGradient id="godavariGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#247885" />
                  <stop offset="50%" stopColor="#31929D" />
                  <stop offset="100%" stopColor="#1E6570" />
                </linearGradient>
              </defs>

              {/* -------------------------------------------------------------
                  1. TOPOGRAPHY & GODAVARI RIVER (PERIMETER ONLY)
              ------------------------------------------------------------- */}
              {/* Soft Outer Hill Terrain Patches */}
              <path d="M 0,0 L 380,0 C 330,110 160,150 0,120 Z" fill="#D2E4CC" opacity="0.75" />
              <path d="M 820,0 L 1200,0 L 1200,200 C 1060,160 930,70 820,0 Z" fill="#C9DBC3" opacity="0.8" />
              <path d="M 0,470 C 160,500 300,620 420,620 L 0,620 Z" fill="#CFE2C9" opacity="0.75" />
              <path d="M 880,620 C 970,520 1100,500 1200,540 L 1200,620 Z" fill="#D5E6D0" opacity="0.75" />

              {/* TRIMBAKESHWAR BRAHMAGIRI HILLS (Far Bottom-West Perimeter) */}
              <g transform="translate(20, 500)">
                <path d="M 0,50 Q 35,10 70,50 Z" fill="#88A085" stroke="#1F2833" strokeWidth="1" />
                <path d="M 45,50 Q 80,15 115,50 Z" fill="#728A6F" stroke="#1F2833" strokeWidth="1" />
                <text x="60" y="62" textAnchor="middle" fill="#005A36" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">TRIMBAK HILLS</text>
              </g>

              {/* GODAVARI RIVER (Curving Teal Ribbon along upper map margin) */}
              <path
                d="M -20,50 C 180,30 350,75 520,55 C 690,35 850,75 1020,50 C 1130,35 1190,45 1220,70 L 1220,110 C 1170,85 1100,75 980,95 C 800,120 640,75 500,95 C 340,115 170,60 -20,80 Z"
                fill="url(#godavariGrad)"
              />

              {/* Small boats on Godavari River */}
              <g fill="#FAF7F2" stroke="#17212B" strokeWidth="1">
                <path d="M 280,50 L 293,50 L 288,56 L 284,56 Z" />
                <path d="M 720,65 L 733,65 L 728,71 L 724,71 Z" />
              </g>

              {/* -------------------------------------------------------------
                  2. PERIMETER SECONDARY ROADS & BRIDGES
              ------------------------------------------------------------- */}
              <g stroke="#2A3542" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
                {/* West Outer Bypass */}
                <path d="M -20,380 L 110,380 C 150,380 160,260 270,250" />
                {/* East Outer Bypass */}
                <path d="M 940,140 C 970,260 970,420 1220,440" />
                {/* South Ring */}
                <path d="M 120,510 L 480,510 L 900,510" />
                {/* Bridge across Godavari River */}
                <path d="M 320,25 L 320,85" stroke="#7A4E24" strokeWidth="14" />
                <path d="M 320,25 L 320,85" stroke="#1F2833" strokeWidth="8" />
              </g>

              {/* Outer Roundabouts */}
              <circle cx="110" cy="380" r="14" fill="#E0EBDC" stroke="#2A3542" strokeWidth="10" />
              <circle cx="110" cy="380" r="6" fill="#005A36" />
              <circle cx="940" cy="140" r="14" fill="#E0EBDC" stroke="#2A3542" strokeWidth="10" />
              <circle cx="940" cy="140" r="6" fill="#E9A83A" />

              {/* -------------------------------------------------------------
                  3. SAFFRON DOTTED PILGRIM ROUTE (SKIRTS AROUND TYPOGRAPHY)
              ------------------------------------------------------------- */}
              <path
                ref={pilgrimPathRef}
                d="M 920,85 C 750,85 640,25 500,25 C 340,25 180,75 100,160 C 50,220 50,340 110,380 C 150,480 300,530 480,530 L 900,530"
                fill="none"
                stroke="#E9A83A"
                strokeWidth="3.5"
                strokeDasharray="5 5"
                strokeLinecap="round"
              />

              {/* -------------------------------------------------------------
                  4. THE HERO STREET TYPOGRAPHY: STHANAM
                  - Same road style: dark asphalt strokes (#121A24, 28px width)
                  - Cream outer isolation stroke (#E0EBDC, 34px width)
                  - Yellow dashed center lane markings (#FFD166, 3.5px width, 9 9 dash)
                  - 2 balanced rows: S T H A / N A M
              ------------------------------------------------------------- */}
              <g filter="url(#roadShadow)">
                {/* LAYER A: Cream Outer Isolation Stroke */}
                <g stroke="#E0EBDC" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {sthanamPaths}
                </g>

                {/* LAYER B: Dark Charcoal Primary Road Base (28px width) */}
                <g stroke="#121A24" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {sthanamPaths}
                </g>

                {/* LAYER C: Warm Saffron Center Lane Markings (3.5px width) */}
                <g stroke="#FFD166" strokeWidth="3.5" strokeDasharray="9 9" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  {sthanamPaths}
                </g>
              </g>

              {/* -------------------------------------------------------------
                  5. PERIMETER LANDMARKS (POSITIONED AT OUTER MARGINS ONLY)
              ------------------------------------------------------------- */}
              {/* RAMKUND STEPPED GHAT (Top Right Perimeter) */}
              <g transform="translate(880, 75)">
                <path d="M 0,26 L 50,26 M 5,22 L 45,22 M 10,18 L 40,18" stroke="#FAF7F2" strokeWidth="1.2" />
                <path d="M 18,18 L 32,18 L 28,4 L 25,-2 L 22,4 Z" fill="#D48C6B" stroke="#17212B" strokeWidth="1" />
                <circle cx="25" cy="-3" r="2" fill="#E9A83A" />
                <text x="25" y="36" textAnchor="middle" fill="#005A36" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">RAMKUND GHAT</text>
              </g>

              {/* PANCHAVATI & SITA GUFA (Top Left Perimeter) */}
              <g transform="translate(70, 80)">
                <circle cx="0" cy="0" r="12" fill="#2E6B47" stroke="#17212B" strokeWidth="1" />
                <circle cx="-5" cy="-4" r="7" fill="#3B845A" />
                <circle cx="5" cy="-4" r="7" fill="#3B845A" />
                <text x="0" y="20" textAnchor="middle" fill="#005A36" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">PANCHAVATI</text>
                <text x="0" y="27" textAnchor="middle" fill="#7A4E24" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">SITA GUFA</text>
              </g>

              {/* KALARAM TEMPLE (Bottom Right Perimeter) */}
              <g transform="translate(900, 420)">
                <path d="M 0,24 L 22,24 L 19,6 L 11,-4 L 3,6 Z" fill="#2C353F" stroke="#17212B" strokeWidth="1" />
                <circle cx="11" cy="-6" r="2.5" fill="#E9A83A" />
                <text x="11" y="34" textAnchor="middle" fill="#17212B" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">KALARAM TEMPLE</text>
              </g>

              {/* -------------------------------------------------------------
                  6. VEHICLES ON ROAD NETWORK & SCROLL-DRIVEN PILGRIM CAR
              ------------------------------------------------------------- */}
              {/* Secondary static vehicles */}
              <g transform="translate(150, 160) rotate(90)">
                <rect x="-8" y="-4" width="16" height="8" rx="2" fill="#E9A83A" stroke="#17212B" strokeWidth="1" />
              </g>
              <g transform="translate(295, 380) rotate(90)">
                <rect x="-8" y="-4" width="16" height="8" rx="2" fill="#005A36" stroke="#FAF7F2" strokeWidth="1" />
              </g>

              {/* Dynamic Scroll-Driven Moving Top-Down Car Icon */}
              <g
                transform={`translate(${heroCarState.x}, ${heroCarState.y}) rotate(${heroCarState.angle})`}
                filter="url(#carGlow)"
                className="pointer-events-none transition-transform duration-100 ease-out"
              >
                {/* Yellow Headlight Glow */}
                <polygon points="0,-12 -16,-55 16,-55" fill="#FFD166" opacity="0.65" />

                {/* Tires */}
                <rect x="-11" y="-14" width="3" height="7" rx="1.5" fill="#121A24" />
                <rect x="8" y="-14" width="3" height="7" rx="1.5" fill="#121A24" />
                <rect x="-11" y="8" width="3" height="7" rx="1.5" fill="#121A24" />
                <rect x="8" y="8" width="3" height="7" rx="1.5" fill="#121A24" />

                {/* Main Body */}
                <rect x="-9" y="-16" width="18" height="32" rx="5" fill="#FAF7F2" stroke="#17212B" strokeWidth="1.5" />

                {/* Saffron Center Stripe */}
                <rect x="-1.5" y="-15" width="3" height="30" fill="#FFD166" />

                {/* Roof Cabin */}
                <rect x="-5" y="-7" width="10" height="13" rx="2.5" fill="#17212B" stroke="#FFD166" strokeWidth="0.6" />

                {/* Windshield */}
                <path d="M-4.5,-6 L4.5,-6 L3.5,-2 L-3.5,-2 Z" fill="#FFD166" opacity="0.9" />

                {/* Rear Window */}
                <path d="M-3.5,4 L3.5,4 L2.5,5.5 L-2.5,5.5 Z" fill="#FFD166" opacity="0.7" />

                {/* Headlights */}
                <circle cx="-6.5" cy="-14.5" r="1.8" fill="#FFFFFF" stroke="#17212B" strokeWidth="0.4" />
                <circle cx="6.5" cy="-14.5" r="1.8" fill="#FFFFFF" stroke="#17212B" strokeWidth="0.4" />

                {/* Taillights */}
                <circle cx="-6.5" cy="14.5" r="1.5" fill="#FF3B30" />
                <circle cx="6.5" cy="14.5" r="1.5" fill="#FF3B30" />

                {/* Mirrors */}
                <rect x="-11.5" y="-10" width="2" height="4" rx="0.8" fill="#FAF7F2" stroke="#17212B" strokeWidth="0.6" />
                <rect x="9.5" y="-10" width="2" height="4" rx="0.8" fill="#FAF7F2" stroke="#17212B" strokeWidth="0.6" />
              </g>

              {/* -------------------------------------------------------------
                  7. STHANAM INTERACTIVE PARKING PINS (PINS REDUCED SIZE 25%)
              ------------------------------------------------------------- */}
              {mapParkingSpots.map((spot) => {
                const isHovered = activeSpot?.id === spot.id
                return (
                  <g
                    key={spot.id}
                    transform={`translate(${spot.cx}, ${spot.cy})`}
                    className="cursor-pointer transition-transform duration-300"
                    onMouseEnter={() => setActiveSpot(spot)}
                    onMouseLeave={() => setActiveSpot(null)}
                    onClick={() => navigate('/search')}
                  >
                    <circle r={isHovered ? '15' : '11'} fill="#005A36" fillOpacity="0.25" className="animate-ping" />
                    <circle r={isHovered ? '11' : '9'} fill="#005A36" stroke="#FAF7F2" strokeWidth="2" className="shadow-md" />
                    <text x="0" y="3" textAnchor="middle" fill="#FFFFFF" fontSize={isHovered ? '10' : '8.5'} fontWeight="900" fontFamily="sans-serif">P</text>

                    {isHovered && (
                      <g transform="translate(0, -26)" filter="url(#roadShadow)">
                        <rect x="-65" y="-20" width="130" height="28" rx="6" fill="#17212B" stroke="#E9A83A" strokeWidth="1.2" />
                        <text x="0" y="-8" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">{spot.name}</text>
                        <text x="0" y="2" textAnchor="middle" fill="#FFD166" fontSize="8" fontWeight="bold">{spot.spots} • {spot.walk}</text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Map Footer Overlay Strip */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#C5D9BF] pt-3 px-2 text-[11px] sm:text-[12px] font-mono font-bold text-[#005A36]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#E9A83A]" />
              <span>STREET NETWORK = STHANAM CORRIDOR</span>
            </div>
            <div className="flex items-center gap-3 text-[#17212B]">
              <span>VERIFIED COMPOUND SPOTS: <strong>{totalAvailableBays}+ AVAILABLE</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- HERO COPY & HEADINGS (NO DUPLICATE BUTTONS) ----------------- */}
      <div className="mx-auto max-w-3xl px-4 text-center mt-8">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-[#17212B] font-heading leading-tight">
          SMART PARKING FOR <br className="hidden sm:block" />
          <span className="text-[#005A36]">NASHIK'S KUMBH JOURNEY</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[14px] sm:text-[16px] font-medium leading-relaxed text-[#4A5568]">
          Pre-book verified private compounds and driveways within walking distance of holy Snan points.
          Bypass police barricades with guaranteed entry passes.
        </p>
      </div>

      {/* ----------------- SCROLL CUE TO PILGRIM JOURNEY ----------------- */}
      <div className="mt-8 text-center flex flex-col items-center">
        <a
          href="#pilgrim-journey"
          className="group inline-flex flex-col items-center gap-1.5 text-[#005A36] hover:text-[#00472B] transition-colors cursor-pointer"
        >
          <span className="text-[12px] font-mono font-bold tracking-wider uppercase">
            Scroll to begin your journey ↓
          </span>
          <div className="w-0.5 h-6 bg-gradient-to-b from-[#005A36] to-transparent animate-pulse group-hover:h-8 transition-all" />
        </a>
      </div>
    </section>
  )
}
