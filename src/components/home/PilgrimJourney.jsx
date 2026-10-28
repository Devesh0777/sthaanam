import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * Authentic Nashik Pilgrimage Destinations with Real Path Fractions
 */
const DESTINATION_STOPS = [
  {
    id: 'stop-01',
    number: '01',
    title: 'Nashik Road Junction',
    subtitle: 'Gateway to Maha Kumbh • Transit Hub',
    category: 'ARRIVAL GATEWAY',
    distance: '0.0 KM',
    side: 'right',
    nodePos: { x: 500, y: 320 },
    cardLeft: 590,
    cardTop: 220,
    cardWidth: 370,
    connectorEnd: { x: 590, y: 320 },
    threshold: 0.0,
    photo: '/images/nashik-station.jpg',
    photoCaption: 'NASHIK ROAD STATION • TRANSIT TERMINAL',
    description:
      'Where high-speed express trains and state highways converge. Pilgrims transition into verified local transit and parking perimeter routes.',
    tip: 'Heavy festival traffic cordons start 4km ahead. Switch to pre-booked local parking.',
    parkingNotice: {
      zoneId: 'z6',
      zoneName: 'Nashik Station Hub',
      spotsAvail: 24,
      walkTime: '1 min walk',
    },
  },
  {
    id: 'stop-02',
    number: '02',
    title: 'Muktidham Temple',
    subtitle: 'Pure White Marble Sanctuary',
    category: 'MARBLE SHRINE',
    distance: '2.1 KM',
    side: 'left',
    nodePos: { x: 430, y: 720 },
    cardLeft: 40,
    cardTop: 620,
    cardWidth: 370,
    connectorEnd: { x: 410, y: 720 },
    threshold: 0.243,
    photo: '/images/muktidham-temple.jpg',
    photoCaption: 'MUKTIDHAM TEMPLE • NASHIK ROAD',
    description:
      'Renowned temple complex crafted entirely from pure Rajsamand marble, featuring replicas of the 12 Jyotirlinga shrines and Gita chapters.',
    tip: 'Located near Nashik Road. Ideal first stop for family pilgrims arriving by train.',
    parkingNotice: {
      zoneId: 'z6',
      zoneName: 'Muktidham Station Lot',
      spotsAvail: 18,
      walkTime: '2 min walk',
    },
  },
  {
    id: 'stop-03',
    number: '03',
    title: 'Ramkund & Godavari Ghat',
    subtitle: 'Sacred Shahi Snan Kund • Holy River Steps',
    category: 'SACRED GHAT',
    distance: '8.5 KM',
    side: 'right',
    nodePos: { x: 570, y: 1120 },
    cardLeft: 620,
    cardTop: 1020,
    cardWidth: 350,
    connectorEnd: { x: 620, y: 1120 },
    threshold: 0.498,
    photo: '/images/ramkund-ghat.jpg',
    photoCaption: 'RAMKUND GHAT • GODAVARI RIVER',
    description:
      'The sacred epicenter of Kumbh Mela where Lord Rama bathed during exile. Millions take holy dips on auspicious Shahi Snan dates.',
    tip: 'Inner 1.5 km is strictly sealed to private vehicles. Park at Ramkund North compound.',
    parkingNotice: {
      zoneId: 'z1',
      zoneName: 'Ramkund Central Ghats',
      spotsAvail: 8,
      walkTime: '3 min walk',
    },
  },
  {
    id: 'stop-04',
    number: '04',
    title: 'Panchavati & Sita Gufa',
    subtitle: 'Five Sacred Banyan Trees • Heritage Grove',
    category: 'HERITAGE GROVE',
    distance: '9.2 KM',
    side: 'left',
    nodePos: { x: 420, y: 1520 },
    cardLeft: 30,
    cardTop: 1420,
    cardWidth: 360,
    connectorEnd: { x: 390, y: 1520 },
    threshold: 0.756,
    photo: '/images/panchavati-grove.jpg',
    photoCaption: 'PANCHAVATI • SITA GUFA SHRINE',
    description:
      'The historic hermitage where Lord Rama, Sita, and Lakshmana resided. Five ancient Banyan trees provide shaded sanctuary for devotees.',
    tip: 'Narrow heritage lanes. Pre-booked ashram compounds allow hassle-free walking access.',
    parkingNotice: {
      zoneId: 'z2',
      zoneName: 'Panchavati East',
      spotsAvail: 12,
      walkTime: '5 min walk',
    },
  },
  {
    id: 'stop-05',
    number: '05',
    title: 'Shri Kalaram Mandir',
    subtitle: 'Architectural Marvel in Pure Black Basalt',
    category: 'ANCIENT TEMPLE',
    distance: '9.8 KM',
    side: 'right',
    nodePos: { x: 500, y: 1920 },
    cardLeft: 590,
    cardTop: 1820,
    cardWidth: 370,
    connectorEnd: { x: 590, y: 1920 },
    threshold: 1.0,
    photo: '/images/kalaram-temple.jpg',
    photoCaption: 'KALARAM TEMPLE • PANCHAVATI',
    description:
      'Ancient temple built in 1782 using 2,000 tonnes of black basalt stone from Ramshej hills with gold-plated kalash shikhara.',
    tip: 'Peak evening aarti sees heavy footfall. Reserve a spot in nearby verified private lot.',
    parkingNotice: {
      zoneId: 'z3',
      zoneName: 'Kalaram North Hub',
      spotsAvail: 9,
      walkTime: '4 min walk',
    },
  },
]

// Reusable Destination Card Component
function DestinationCard({ stop, isActive, isApproached }) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl glass-panel-dark text-[#F5F3ED] p-4 shadow-2xl transition-all duration-300 flex flex-col justify-between border',
        isActive
          ? 'opacity-100 border-[#FFD900] ring-2 ring-[#FFD900]/40 shadow-[0_16px_36px_rgba(255,217,0,0.18)] scale-[1.02] z-30'
          : isApproached
            ? 'opacity-95 border-white/20 hover:border-[#FFD900]/60 z-20 shadow-xl'
            : 'opacity-75 border-white/10 z-10',
      )}
    >
      {/* Top Badge & Distance Row */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <span className="rounded bg-[#006341] px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-[#FFD900] tracking-wider border border-[#FFD900]/30">
          STOP {stop.number} • {stop.category}
        </span>
        <span className="text-[10px] font-mono font-black text-[#FFD900]">
          {stop.distance}
        </span>
      </div>

      {/* Main Content Grid (Thumbnail + Title & Description) */}
      <div className="mt-2 flex gap-2.5 items-start">
        {/* Landmark Photo Thumbnail */}
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/40 shadow-inner">
          <img
            src={stop.photo}
            alt={stop.title}
            className="size-full object-cover object-center"
            loading="lazy"
          />
        </div>

        {/* Title, Subtitle & Description */}
        <div className="min-w-0 flex-1 leading-tight">
          <h3 className="text-[13px] font-black uppercase text-white tracking-wide truncate">
            {stop.title}
          </h3>
          <p className="text-[9.5px] font-bold text-[#FFD900] uppercase tracking-wider mb-1 truncate">
            {stop.subtitle}
          </p>
          <p className="text-[10.5px] leading-snug text-[#D0D1CE] font-normal line-clamp-2">
            {stop.description}
          </p>
        </div>
      </div>

      {/* Tip Box */}
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/5 border border-white/10 p-1.5 text-[9.5px] text-[#D0D1CE] leading-tight">
        <span className="text-[10px] shrink-0">💡</span>
        <p className="line-clamp-1">
          <strong className="text-[#FFD900]">Tip:</strong> {stop.tip}
        </p>
      </div>

      {/* Verified Parking Notice & Action Button */}
      {stop.parkingNotice && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-[#006341] px-2.5 py-1.5 text-white border border-[#FFD900]/30 shadow-sm">
          <div className="leading-tight min-w-0">
            <span className="text-[8px] font-mono font-bold text-[#FFD900] uppercase block">
              VERIFIED PARKING
            </span>
            <span className="text-[9.5px] font-bold text-white truncate block">
              {stop.parkingNotice.zoneName} ({stop.parkingNotice.walkTime})
            </span>
          </div>
          <Link
            to={`/search?zone=${stop.parkingNotice.zoneId}`}
            className="rounded-lg bg-[#FFD900] px-2.5 py-1 text-[9px] font-black uppercase text-[#181B1A] hover:bg-[#ffe033] transition-colors shrink-0 ml-2"
          >
            Reserve Bay →
          </Link>
        </div>
      )}
    </div>
  )
}

// Map coordinate constants
const MAP_WIDTH = 1000
const MAP_HEIGHT = 2400

// Continuous editorial road path centered in the 420px - 570px corridor
const ROAD_PATH_D = `
  M 500,320
  C 460,450 430,580 430,720
  C 430,880 570,980 570,1120
  C 570,1280 420,1380 420,1520
  C 420,1680 480,1800 500,1920
`

export default function PilgrimJourney() {
  const containerRef = useRef(null)
  const viewportRef = useRef(null)
  const pathRef = useRef(null)

  const [targetProgress, setTargetProgress] = useState(0)
  const [smoothProgress, setSmoothProgress] = useState(0)
  const [carState, setCarState] = useState({ x: 500, y: 320, angle: 180 })
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 700 })
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return false
  }, [])

  // Track viewport dimensions for responsive camera translation and scaling
  useEffect(() => {
    const updateSize = () => {
      if (viewportRef.current) {
        const rect = viewportRef.current.getBoundingClientRect()
        setViewportSize({ width: rect.width || window.innerWidth, height: rect.height || 650 })
      } else {
        const headerOffset = window.innerWidth >= 1024 ? 81 : 0
        setViewportSize({ width: window.innerWidth, height: window.innerHeight - headerOffset })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Single source of truth: compute exact progress from section scroll bounding rect
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!containerRef.current) return

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return
          const rect = containerRef.current.getBoundingClientRect()
          const headerOffset = window.innerWidth >= 1024 ? 81 : 0
          const visibleHeight = window.innerHeight - headerOffset
          const maxScroll = rect.height - visibleHeight

          if (maxScroll <= 0) {
            setTargetProgress(0)
            ticking = false
            return
          }

          const currentScroll = headerOffset - rect.top
          if (currentScroll <= 0) {
            setTargetProgress(0)
          } else if (currentScroll >= maxScroll) {
            setTargetProgress(1)
          } else {
            const rawProgress = currentScroll / maxScroll
            setTargetProgress(Math.max(0, Math.min(1, rawProgress)))
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate car position and rotation tangent along SVG road path
  const calculateCarTransform = useCallback((progressVal) => {
    if (!pathRef.current) return { x: 500, y: 320, angle: 180 }
    try {
      const totalLength = pathRef.current.getTotalLength()
      if (!totalLength || isNaN(totalLength)) return { x: 500, y: 320, angle: 180 }

      const clamped = Math.max(0, Math.min(1, progressVal))
      const currentLength = clamped * totalLength
      const pt = pathRef.current.getPointAtLength(currentLength)

      const delta = 2.0
      const pt1 = pathRef.current.getPointAtLength(Math.max(0, currentLength - delta))
      const pt2 = pathRef.current.getPointAtLength(Math.min(totalLength, currentLength + delta))

      const dx = pt2.x - pt1.x
      const dy = pt2.y - pt1.y

      // Angle in degrees (+90 because car default top-down vector points UP)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90

      return { x: pt.x, y: pt.y, angle }
    } catch {
      return { x: 500, y: 320, angle: 180 }
    }
  }, [])

  // Smooth lerp loop (liquid 60fps car physics & reversible scroll response)
  useEffect(() => {
    let animationFrameId
    let isRunning = true

    const updatePhysics = () => {
      if (!isRunning) return

      if (prefersReducedMotion) {
        setSmoothProgress(targetProgress)
        setCarState(calculateCarTransform(targetProgress))
        return
      }

      setSmoothProgress((prev) => {
        const diff = targetProgress - prev
        const next = Math.abs(diff) < 0.0001 ? targetProgress : prev + diff * 0.2
        const transform = calculateCarTransform(next)
        setCarState(transform)
        return next
      })

      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    animationFrameId = requestAnimationFrame(updatePhysics)
    return () => {
      isRunning = false
      cancelAnimationFrame(animationFrameId)
    }
  }, [targetProgress, calculateCarTransform, prefersReducedMotion])

  // Active stop index derived consistently from single progress value
  const activeStopIndex = useMemo(() => {
    if (smoothProgress < 0.12) return 0
    if (smoothProgress < 0.37) return 1
    if (smoothProgress < 0.62) return 2
    if (smoothProgress < 0.88) return 3
    return 4
  }, [smoothProgress])

  // Responsive scale factor for screen widths below 1024px
  const responsiveScale = useMemo(() => {
    if (viewportSize.width >= 1024) return 1
    return Math.min(1, Math.max(0.35, (viewportSize.width - 20) / 1000))
  }, [viewportSize.width])

  // Camera Y translation: places the vehicle in the upper-middle of the visible camera viewport
  const cameraTranslateY = useMemo(() => {
    const effectiveViewportHeight = viewportSize.height / responsiveScale
    const targetScreenY = Math.max(160 / responsiveScale, effectiveViewportHeight * 0.38)
    const minTranslateY = Math.min(0, effectiveViewportHeight - MAP_HEIGHT)
    const maxTranslateY = 0
    const desiredTranslate = targetScreenY - carState.y
    return Math.max(minTranslateY, Math.min(maxTranslateY, desiredTranslate))
  }, [carState.y, viewportSize.height, responsiveScale])

  // Smooth scroll to specific destination when clicking dots or HUD
  const scrollToDestination = (stopIndex) => {
    if (!containerRef.current) return
    const targetStop = DESTINATION_STOPS[stopIndex]
    if (!targetStop) return

    const rect = containerRef.current.getBoundingClientRect()
    const headerOffset = window.innerWidth >= 1024 ? 81 : 0
    const visibleHeight = window.innerHeight - headerOffset
    const maxScroll = rect.height - visibleHeight
    const targetScrollY = window.scrollY + rect.top - headerOffset + targetStop.threshold * maxScroll

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    })
  }

  return (
    <section
      ref={containerRef}
      id="pilgrim-journey"
      className="relative bg-[#1D201F] text-[#F5F3ED] select-none font-sans h-[360vh]"
    >
      {/* Hidden SVG reference element for exact path geometry calculation */}
      <svg className="absolute size-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <path ref={pathRef} d={ROAD_PATH_D} />
      </svg>

      {/* =========================================================================
          STICKY INTERACTIVE ROAD TRIP VIEWPORT (NO CLIPPING UNDER HEADER)
      ========================================================================= */}
      <div className="sticky top-0 lg:top-[81px] h-screen lg:h-[calc(100vh-81px)] w-full overflow-hidden flex flex-col bg-[#1D201F]">
        {/* Subtle dark grid background texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #FAF7F2 1px, transparent 1px),
              linear-gradient(to bottom, #FAF7F2 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* ---------------------------------------------------------------------
            1. COMPACT TOP HEADER & HIGHWAY DASHBOARD HUD
        --------------------------------------------------------------------- */}
        <div className="relative z-40 glass-panel-dark border-b border-white/10 px-4 py-2.5 shrink-0 text-center shadow-lg">
          <div className="max-w-4xl mx-auto">
            {/* Header Title Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[9.5px] font-mono font-bold uppercase text-[#FFD900] tracking-wider border border-white/10">
                  <span className="size-1.5 rounded-full bg-[#006341] ring-1 ring-[#FFD900]" />
                  NASHIK PILGRIM ROUTE
                </span>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white font-heading">
                  WELCOME TO <span className="text-[#FFD900]">NASHIK</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#D0D1CE] italic">
                  Scroll down to explore stops along the route
                </span>
              </div>
            </div>

            {/* Highway Dashboard HUD Bar (Dark Glass Pill) */}
            <div className="flex items-center justify-between gap-3 rounded-2xl glass-panel-dark border border-white/20 px-3.5 py-2 shadow-xl">
              {/* Active Landmark Ticker */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#006341] text-[11px] font-black text-[#FFD900] border border-[#FFD900]/40">
                  📍
                </div>
                <div className="min-w-0 leading-tight text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-mono font-bold text-[#FFD900] uppercase tracking-wider block">
                      STOP {DESTINATION_STOPS[activeStopIndex].number} / 05
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#D0D1CE] bg-white/10 px-1.5 py-0.2 rounded">
                      {DESTINATION_STOPS[activeStopIndex].distance}
                    </span>
                  </div>
                  <span className="text-[12px] sm:text-[13px] font-black text-white truncate block font-heading">
                    {DESTINATION_STOPS[activeStopIndex].title}
                  </span>
                </div>
              </div>

                {/* Clickable Destination Dots (01 to 05) */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {DESTINATION_STOPS.map((stop, idx) => {
                    const isActive = idx === activeStopIndex
                    const isReached = smoothProgress >= stop.threshold - 0.05

                    return (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => scrollToDestination(idx)}
                        title={`Jump to ${stop.title}`}
                        className={cn(
                          'flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all duration-300 cursor-pointer',
                          isActive
                            ? 'bg-[#FFD900] text-[#181B1A] font-black scale-105 shadow-sm shadow-[#FFD900]/40'
                            : isReached
                              ? 'bg-[#006341] text-[#FFD900] font-bold'
                              : 'bg-white/10 text-[#D0D1CE]/60 hover:bg-white/20',
                        )}
                      >
                        <span className="text-[9.5px] font-mono font-bold">
                          {stop.number}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              2. CONTINUOUS CAMERA VIEWPORT (CONTAINER ANCHORED AT TOP)
          --------------------------------------------------------------------- */}
          <div
            ref={viewportRef}
            className="relative flex-1 w-full overflow-hidden"
          >
            {/* 1000px Moving World Canvas with Smooth Vertical Gliding */}
            <div
              className="absolute left-1/2"
              style={{
                width: `${MAP_WIDTH}px`,
                height: `${MAP_HEIGHT}px`,
                top: 0,
                transform: `translate3d(-50%, ${cameraTranslateY}px, 0) scale(${responsiveScale})`,
                transformOrigin: 'top center',
                transition: 'transform 75ms ease-out',
              }}
            >
              {/* SVG EDITORIAL ROAD & MAP ILLUSTRATION */}
              <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                className="absolute inset-0 size-full overflow-visible pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  {/* Drop shadow filter for vehicle */}
                  <filter id="carShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.7" />
                  </filter>

                  {/* Headlights beam gradient */}
                  <radialGradient id="headlightBeam" cx="50%" cy="100%" r="100%">
                    <stop offset="0%" stopColor="#FFD900" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#FFD900" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFD900" stopOpacity="0" />
                  </radialGradient>

                  {/* Active Pin Glow */}
                  <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* ---------------------------------------------------------------
                    CLEAN CONNECTOR LINES TO DESTINATION CARDS
                --------------------------------------------------------------- */}
                {DESTINATION_STOPS.map((stop, i) => {
                  const isActive = i === activeStopIndex

                  return (
                    <line
                      key={`connector-${stop.id}`}
                      x1={stop.nodePos.x}
                      y1={stop.nodePos.y}
                      x2={stop.connectorEnd.x}
                      y2={stop.connectorEnd.y}
                      stroke={isActive ? '#FFD900' : '#D0D1CE'}
                      strokeWidth={isActive ? '2.5' : '1.5'}
                      strokeDasharray={isActive ? 'none' : '4 5'}
                      opacity={isActive ? 0.95 : 0.4}
                      className="transition-all duration-300"
                    />
                  )
                })}

                {/* ---------------------------------------------------------------
                    MAIN HIGHWAY ROAD TRACK (CENTER CORRIDOR x: 420 - 570)
                --------------------------------------------------------------- */}
                {/* Outer Road Edge (#D0D1CE) */}
                <path
                  d={ROAD_PATH_D}
                  fill="none"
                  stroke="#D0D1CE"
                  strokeWidth="32"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Inner Charcoal Asphalt (#141615) */}
                <path
                  d={ROAD_PATH_D}
                  fill="none"
                  stroke="#141615"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Center Yellow Dashed Lane Stripe (#FFD900) */}
                <path
                  d={ROAD_PATH_D}
                  fill="none"
                  stroke="#FFD900"
                  strokeWidth="3"
                  strokeDasharray="12 14"
                  strokeLinecap="round"
                  className="opacity-90"
                />

                {/* ---------------------------------------------------------------
                    MILESTONE PINS ALONG THE ROAD
                --------------------------------------------------------------- */}
                {DESTINATION_STOPS.map((stop, i) => {
                  const isActive = i === activeStopIndex
                  const isReached = smoothProgress >= stop.threshold - 0.05

                  return (
                    <g key={stop.id} transform={`translate(${stop.nodePos.x}, ${stop.nodePos.y})`}>
                      {/* Active Node Pulsing Ring */}
                      {isActive && (
                        <circle
                          r="22"
                          fill="#006341"
                          fillOpacity="0.4"
                          filter="url(#pinGlow)"
                          className="animate-pulse"
                        />
                      )}

                      {/* Milestone Disc */}
                      <circle
                        r={isActive ? 15 : 12}
                        fill={isActive ? '#006341' : isReached ? '#111312' : '#1D201F'}
                        stroke={isActive ? '#FFD900' : isReached ? '#006341' : '#D0D1CE'}
                        strokeWidth="3"
                        className="transition-all duration-300"
                      />

                      {/* Number Inside Disc (Clean, never struck through by road line) */}
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill={isActive ? '#FFD900' : isReached ? '#FFFFFF' : '#D0D1CE'}
                        fontSize="9.5"
                        fontWeight="900"
                        fontFamily="monospace"
                      >
                        {stop.number}
                      </text>
                    </g>
                  )
                })}

                {/* ---------------------------------------------------------------
                    TOP-DOWN VECTOR CAR VEHICLE FOLLOWING ROAD TANGENT
                --------------------------------------------------------------- */}
                <g
                  transform={`translate(${carState.x}, ${carState.y}) rotate(${carState.angle})`}
                  style={{ filter: 'url(#carShadow)' }}
                  className="pointer-events-none transition-transform duration-75 ease-out"
                >
                  {/* Headlight Beam Cone */}
                  <polygon
                    points="0,-18 -20,-70 20,-70"
                    fill="url(#headlightBeam)"
                    className="opacity-90 pointer-events-none"
                  />

                  {/* Tires (Four Black Rubber Tires) */}
                  <rect x="-13" y="-18" width="4" height="9" rx="2" fill="#121A24" />
                  <rect x="9" y="-18" width="4" height="9" rx="2" fill="#121A24" />
                  <rect x="-13" y="10" width="4" height="9" rx="2" fill="#121A24" />
                  <rect x="9" y="10" width="4" height="9" rx="2" fill="#121A24" />

                  {/* Main Chassis (Warm Off-White with Charcoal Outline) */}
                  <rect
                    x="-11"
                    y="-21"
                    width="22"
                    height="42"
                    rx="7"
                    fill="#FAF7F2"
                    stroke="#17212B"
                    strokeWidth="1.8"
                  />

                  {/* Saffron Sport Accent Center Stripe */}
                  <rect x="-2" y="-20" width="4" height="40" fill="#FFD900" opacity="0.95" />

                  {/* Dark Tinted Glass Roof Cabin */}
                  <path
                    d="M-7,-9 Q0,-13 7,-9 L6,9 Q0,12 -6,9 Z"
                    fill="#17212B"
                    stroke="#FFD900"
                    strokeWidth="0.8"
                  />

                  {/* Front Windshield Reflection (Warm Gold) */}
                  <path
                    d="M-6,-8 Q0,-11 6,-8 L5,-3 Q0,-5 -5,-3 Z"
                    fill="#FFD900"
                    opacity="0.85"
                  />

                  {/* Rear Glass Window */}
                  <path
                    d="M-5,6 Q0,8 5,6 L4,8 Q0,9 -4,8 Z"
                    fill="#FFD900"
                    opacity="0.65"
                  />

                  {/* Headlights (Bright White) */}
                  <circle cx="-8" cy="-19.5" r="2.2" fill="#FFFFFF" stroke="#17212B" strokeWidth="0.5" />
                  <circle cx="8" cy="-19.5" r="2.2" fill="#FFFFFF" stroke="#17212B" strokeWidth="0.5" />

                  {/* Taillights (Vibrant Crimson Red) */}
                  <circle cx="-8" cy="19.5" r="1.8" fill="#FF3B30" />
                  <circle cx="8" cy="19.5" r="1.8" fill="#FF3B30" />

                  {/* Side Mirrors */}
                  <rect x="-14" y="-13" width="3" height="5" rx="1" fill="#FAF7F2" stroke="#17212B" strokeWidth="0.8" />
                  <rect x="11" y="-13" width="3" height="5" rx="1" fill="#FAF7F2" stroke="#17212B" strokeWidth="0.8" />
                </g>
              </svg>

              {/* ---------------------------------------------------------------
                  ALTERNATING HTML DESTINATION CARDS (EXACT COORDINATES)
              --------------------------------------------------------------- */}
              <div className="absolute inset-0 size-full pointer-events-none">
                {DESTINATION_STOPS.map((stop, idx) => {
                  const isActive = idx === activeStopIndex
                  const isApproached =
                    smoothProgress >= stop.threshold - 0.15 || idx <= activeStopIndex

                  return (
                    <div
                      key={`card-${stop.id}`}
                      style={{
                        position: 'absolute',
                        left: `${stop.cardLeft}px`,
                        top: `${stop.cardTop}px`,
                        width: `${stop.cardWidth}px`,
                      }}
                      className="pointer-events-auto transition-transform duration-300"
                    >
                      <DestinationCard
                        stop={stop}
                        isActive={isActive}
                        isApproached={isApproached}
                      />
                    </div>
                  )
                })}
              </div>

              {/* ---------------------------------------------------------------
                  3. FINAL DESTINATION COMPLETION PANEL (END OF ROAD)
              --------------------------------------------------------------- */}
              <div
                style={{ top: '2060px' }}
                className="absolute left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-auto text-center z-30"
              >
                <div className="rounded-3xl glass-panel-dark p-6 sm:p-8 text-white shadow-2xl border-2 border-[#FFD900]/70 ring-1 ring-[#FFD900]/30 backdrop-blur-xl">
                  <span className="inline-block rounded-full bg-[#FFD900] px-3.5 py-1 text-[10px] font-mono font-black uppercase tracking-widest text-[#181B1A] mb-2.5">
                    JOURNEY COMPLETE • 5/5 STOPS REACHED
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight font-heading">
                    YOUR JOURNEY. YOUR PARKING. SIMPLIFIED.
                  </h3>

                  <p className="mt-2 text-[12.5px] sm:text-[14px] font-medium text-[#F5F3ED]/90 max-w-md mx-auto leading-relaxed">
                    Find convenient parking near your destination and book your spot before you arrive.
                  </p>

                  <div className="mt-5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-6 py-2.5 text-xs font-mono font-bold tracking-widest uppercase text-white hover:bg-white hover:text-[#181B1A] shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Back to top</span>
                      <span aria-hidden="true">↑</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  )
}

