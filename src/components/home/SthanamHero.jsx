import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { BASEMAPS, OSM_STYLE } from '@/map/nashikMonitorData'
import { spots } from '@/api/mock/spots'
import Icon from '@/components/ui/Icon'
import sketch2000 from '@/assets/hero/nashik-sketch-2000.webp'
import sketch1000 from '@/assets/hero/nashik-sketch-1000.webp'

/**
 * Authentic 5 Stop Coordinates for Nashik Pilgrimage
 * Stop 01 -> 02 -> 03 -> 04 -> 05
 */
const PILGRIMAGE_STOPS = [
  {
    id: 'stop-01',
    num: '01',
    name: 'NASHIK ROAD',
    sub: 'RAIL TERMINUS',
    coords: [73.8342, 19.9525],
    labelAnchor: 'bottom-left',
    offset: [14, 18],
  },
  {
    id: 'stop-02',
    num: '02',
    name: 'MUKTIDHAM',
    sub: 'MARBLE SANCTUARY',
    coords: [73.8441, 19.9525],
    labelAnchor: 'top-left',
    offset: [14, -14],
  },
  {
    id: 'stop-03',
    num: '03',
    name: 'RAMKUND',
    sub: 'SHAHI SNAN GHAT',
    coords: [73.7915, 20.0075],
    isRamkund: true,
    labelAnchor: 'bottom-right',
    offset: [-18, -20],
  },
  {
    id: 'stop-04',
    num: '04',
    name: 'PANCHAVATI',
    sub: 'SITA GUFA GROVE',
    coords: [73.7945, 20.0055],
    labelAnchor: 'top-right',
    offset: [-16, 16],
  },
  {
    id: 'stop-05',
    num: '05',
    name: 'KALARAM MANDIR',
    sub: 'BLACK BASALT SHRINE',
    coords: [73.7963, 20.0042],
    labelAnchor: 'bottom-right',
    offset: [-16, 22],
  },
]

// Pilgrimage Route GeoJSON LineString (01 -> 02 -> 03 -> 04 -> 05)
const PILGRIMAGE_ROUTE_GEOJSON = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [73.8342, 19.9525], // 01 Nashik Road
      [73.8441, 19.9525], // 02 Muktidham
      [73.8240, 19.9720], // Dwarka Circle transit corridor
      [73.8050, 19.9920], // Old City corridor
      [73.7915, 20.0075], // 03 Ramkund
      [73.7945, 20.0055], // 04 Panchavati
      [73.7963, 20.0042], // 05 Kalaram Mandir
    ],
  },
}

// River Godavari Label Marker Position (along the river just west of Ramkund)
const GODAVARI_LABEL_COORDS = [73.7740, 20.0020]
// Historic City Center Label (Old Nashik / Panchavati fringe)
const NASHIK_CITY_LABEL_COORDS = [73.7820, 19.9880]

/**
 * Generates an 8x8 halftone dot pattern in an offscreen canvas
 */
function createHalftonePattern(color = '#141414', opacity = 0.22, dotRadius = 1.6, size = 8) {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = color
  ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, dotRadius, 0, Math.PI * 2)
  ctx.fill()
  return ctx.getImageData(0, 0, size, size)
}

/**
 * SthanamHero — Editorial Map Poster of Nashik with Framed City Corridor & Glass Title Panel
 */
export default function SthanamHero() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const animFrameRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  // Motion preference detection
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return false
  }, [])

  // Calculate real verified bays from listings data
  const verifiedBaysCount = useMemo(() => {
    const total = spots
      .filter((s) => s.verified)
      .reduce((sum, s) => sum + (s.capacity || 0), 0)
    return total > 0 ? total : 140
  }, [])


  // Initialize MapLibre instance with precise Nashik city framing
  useEffect(() => {
    let isCancelled = false
    let observer = null
    const container = mapContainerRef.current
    if (!container) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const isMobile = window.innerWidth <= 768

    const initTimer = setTimeout(() => {
      if (isCancelled) return

      try {
        const primaryStyle = BASEMAPS[0]?.light || 'https://tiles.openfreemap.org/styles/positron'

        // Center on the midpoint between Ramkund (NW) and Nashik Road (SE): [73.815, 19.980]
        // On desktop, slight screen-space offset so the Godavari & stops frame AROUND the centered glass panel
        const initialCenter = isMobile ? [73.818, 19.972] : [73.815, 19.982]
        const initialZoom = isMobile ? 12.3 : 12.85

        const map = new maplibregl.Map({
          container,
          style: primaryStyle,
          center: initialCenter,
          zoom: initialZoom,
          minZoom: 12.0, // Clamp so it never zooms out to Maharashtra regional level
          maxZoom: 14.2,
          interactive: false,
          attributionControl: false,
          fadeDuration: 0,
          renderWorldCopies: false,
          maxCanvasWidth: Math.round(window.innerWidth * dpr),
        })

        mapInstanceRef.current = map

        // Automatic fallback to OSM style if vector tiles fail
        map.on('error', (e) => {
          if (
            e.error &&
            (e.error.status === 404 ||
              e.error.status === 403 ||
              e.error.message?.includes('Failed to fetch'))
          ) {
            console.warn('[HeroMap] Style issue, falling back to OSM:', e.error)
            try {
              map.setStyle(OSM_STYLE)
            } catch {
              setMapError(true)
            }
          }
        })

        // Apply authentic "ink on paper" styling overrides
        map.on('style.load', () => {
          if (isCancelled) return

          try {
            // 1. Register Halftone Dot Patterns (~15-20% opacity)
            if (!map.hasImage('halftone-urban')) {
              const urbanData = createHalftonePattern('#1B1B1B', 0.18, 1.4, 6)
              if (urbanData) map.addImage('halftone-urban', urbanData)
            }
            if (!map.hasImage('halftone-green')) {
              const greenData = createHalftonePattern('#1B1B1B', 0.12, 1.1, 8)
              if (greenData) map.addImage('halftone-green', greenData)
            }

            const style = map.getStyle()
            if (style?.layers) {
              for (const layer of style.layers) {
                const id = layer.id.toLowerCase()

                // PHASE 1: Completely delete/hide every text and symbol layer across all zooms
                if (
                  layer.type === 'symbol' ||
                  id.includes('label') ||
                  id.includes('shield') ||
                  id.includes('place') ||
                  id.includes('poi')
                ) {
                  map.setLayoutProperty(layer.id, 'visibility', 'none')
                  continue
                }

                // PHASE 1: Remove aeroway/airport/runway polygons that render as white blobs
                if (
                  id.includes('aeroway') ||
                  id.includes('airport') ||
                  id.includes('runway') ||
                  id.includes('helipad') ||
                  id.includes('taxiway') ||
                  id.includes('apron')
                ) {
                  map.setLayoutProperty(layer.id, 'visibility', 'none')
                  continue
                }

                // Hide 3D/2D building footprints to prevent clutter
                if (id.includes('building')) {
                  map.setLayoutProperty(layer.id, 'visibility', 'none')
                  continue
                }

                // 2. Background: Warm Architectural Paper (#D8D4BF)
                if (layer.type === 'background') {
                  map.setPaintProperty(layer.id, 'background-color', '#D8D4BF')
                  continue
                }

                // 3. Urban Fabric: Built-up residential areas filled with halftone pattern
                if (id.includes('landuse_residential') || id.includes('residential') || id.includes('urban')) {
                  if (layer.type === 'fill') {
                    if (map.hasImage('halftone-urban')) {
                      map.setPaintProperty(layer.id, 'fill-pattern', 'halftone-urban')
                    } else {
                      map.setPaintProperty(layer.id, 'fill-color', '#CEC8B0')
                      map.setPaintProperty(layer.id, 'fill-opacity', 0.2)
                    }
                  }
                  continue
                }

                // 4. Parks, Wood, Landcover: Lighter halftone green
                if (
                  id.includes('park') ||
                  id.includes('forest') ||
                  id.includes('wood') ||
                  id.includes('green') ||
                  id.includes('landcover')
                ) {
                  if (layer.type === 'fill') {
                    if (map.hasImage('halftone-green')) {
                      map.setPaintProperty(layer.id, 'fill-pattern', 'halftone-green')
                    } else {
                      map.setPaintProperty(layer.id, 'fill-color', '#D0CBB5')
                      map.setPaintProperty(layer.id, 'fill-opacity', 0.12)
                    }
                  }
                  continue
                }

                // 5. River Godavari & Waterbodies: Thinner (1.8px), desaturated (#6F8A90 at .55)
                if (id.includes('water') || id.includes('ocean') || id.includes('river')) {
                  if (layer.type === 'fill') {
                    map.setPaintProperty(layer.id, 'fill-color', '#CAD8DC')
                    map.setPaintProperty(layer.id, 'fill-opacity', 0.4)
                    map.setPaintProperty(layer.id, 'fill-outline-color', '#6F8A90')
                  } else if (layer.type === 'line') {
                    map.setPaintProperty(layer.id, 'line-color', '#6F8A90')
                    map.setPaintProperty(layer.id, 'line-width', 1.8)
                    map.setPaintProperty(layer.id, 'line-opacity', 0.55)
                  }
                  continue
                }

                // 6. Roads: Soft ink (#1B1B1B at .40), Major 1.2px, Secondary 0.6px, Minor hidden
                if (id.includes('road') || id.includes('highway') || id.includes('transportation')) {
                  if (id.includes('casing') || id.includes('case')) {
                    map.setLayoutProperty(layer.id, 'visibility', 'none')
                    continue
                  }

                  if (layer.type === 'line') {
                    // Major arterial corridors (Mumbai-Agra Highway, Trimbak Rd, Nashik Rd, Dindori Rd)
                    if (
                      id.includes('motorway') ||
                      id.includes('trunk') ||
                      id.includes('primary') ||
                      id.includes('major')
                    ) {
                      map.setPaintProperty(layer.id, 'line-color', '#1B1B1B')
                      map.setPaintProperty(layer.id, 'line-width', 1.2)
                      map.setPaintProperty(layer.id, 'line-opacity', 0.40)
                    } else if (id.includes('secondary') || id.includes('tertiary')) {
                      map.setPaintProperty(layer.id, 'line-color', '#1B1B1B')
                      map.setPaintProperty(layer.id, 'line-width', 0.6)
                      map.setPaintProperty(layer.id, 'line-opacity', 0.35)
                    } else {
                      // PHASE 2: Minor roads hidden completely so map never competes with title
                      map.setLayoutProperty(layer.id, 'visibility', 'none')
                    }
                  }
                  continue
                }

                // 7. Central Railway Line: Very faint dashed ink
                if (id.includes('railway') || id.includes('rail')) {
                  map.setLayerZoomRange(layer.id, 10, 24)
                  if (layer.type === 'line') {
                    map.setPaintProperty(layer.id, 'line-color', '#1B1B1B')
                    map.setPaintProperty(layer.id, 'line-width', 0.8)
                    map.setPaintProperty(layer.id, 'line-opacity', 0.25)
                    map.setPaintProperty(layer.id, 'line-dasharray', [3, 4])
                  }
                  continue
                }
              }
            }

            // 8. Faint Pilgrimage Corridor Dashed Route Layer (opacity <= 0.25)
            if (!map.getSource('pilgrim-route')) {
              map.addSource('pilgrim-route', {
                type: 'geojson',
                data: PILGRIMAGE_ROUTE_GEOJSON,
              })

              map.addLayer({
                id: 'pilgrim-route-line',
                type: 'line',
                source: 'pilgrim-route',
                paint: {
                  'line-color': '#1B1B1B',
                  'line-width': 1.0,
                  'line-dasharray': [3, 3],
                  'line-opacity': 0.20,
                },
              })
            }
          } catch (styleErr) {
            console.warn('[HeroMap] Style override warning:', styleErr)
          }

          // Clear previous markers
          markersRef.current.forEach((m) => m.remove())
          markersRef.current = []

          // PHASE 1: Keep the 5 stops ONLY as tiny unlabeled markers (6px ink dots, Ramkund in muted red/gold at 8px)
          // No text, no numbers, no leader lines, no chips
          PILGRIMAGE_STOPS.forEach((stop) => {
            const dotEl = document.createElement('div')
            dotEl.className = 'pointer-events-none select-none z-10'

            if (stop.isRamkund) {
              // Ramkund: 8px muted red/gold concentric dot, low opacity
              dotEl.innerHTML = `
                <div class="relative flex items-center justify-center">
                  <span class="size-2.5 rounded-full border border-[#C44D34]/50 bg-[#C44D34] opacity-75 shadow-2xs"></span>
                </div>
              `
            } else {
              // Standard Stop: 6px soft ink dot, low opacity
              dotEl.innerHTML = `
                <div class="relative flex items-center justify-center">
                  <span class="size-1.5 rounded-full bg-[#1B1B1B] opacity-35 ring-1 ring-[#1B1B1B]/15"></span>
                </div>
              `
            }

            const stopMarker = new maplibregl.Marker({
              element: dotEl,
              anchor: 'center',
            })
              .setLngLat(stop.coords)
              .addTo(map)
            markersRef.current.push(stopMarker)
          })

          setMapLoaded(true)

          // 12. Slow Cinematic Drift (<= 10px total, paused when off-screen)
          if (!prefersReducedMotion) {
            let lastTimestamp = performance.now()
            let isVisible = true
            let driftDistance = 0
            const MAX_DRIFT = 8.0 // capped to <= 10px total drift

            const step = (timestamp) => {
              if (!mapInstanceRef.current || isCancelled) return
              const dt = (timestamp - lastTimestamp) / 1000
              lastTimestamp = timestamp

              if (isVisible && dt > 0 && dt < 0.1 && driftDistance < MAX_DRIFT) {
                const dx = 0.25 * dt * 60
                const dy = -0.08 * dt * 60
                map.panBy([dx, dy], { animate: false })
                driftDistance += Math.hypot(dx, dy)
              }
              animFrameRef.current = requestAnimationFrame(step)
            }

            animFrameRef.current = requestAnimationFrame(step)

            if (heroRef.current && typeof IntersectionObserver !== 'undefined') {
              observer = new IntersectionObserver(
                ([entry]) => {
                  isVisible = entry.isIntersecting
                  if (isVisible) lastTimestamp = performance.now()
                },
                { threshold: 0.05 },
              )
              observer.observe(heroRef.current)
            }
          }
        })
      } catch (err) {
        console.warn('[HeroMap] WebGL initialization failed, fallback to paper poster:', err)
        setMapError(true)
      }
    }, 60)

    return () => {
      isCancelled = true
      clearTimeout(initTimer)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (observer) observer.disconnect()
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // Ignore teardown errors
        }
        mapInstanceRef.current = null
      }
    }
  }, [prefersReducedMotion])

  const scrollToJourney = () => {
    const el = document.getElementById('pilgrim-journey')
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'instant' : 'smooth' })
    }
  }

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col justify-between selection:bg-[#0F2A1E] selection:text-[#F5F3ED] bg-[#D8D4BF]"
    >
      {/* =========================================================================
          LAYER 1A: REAL NASHIK MAP ENGINE (MASKED WITH RADIAL FADE AT BORDERS)
      ========================================================================= */}
      <div
        ref={mapContainerRef}
        aria-hidden="true"
        className={`absolute inset-0 z-0 size-full pointer-events-none transition-opacity duration-1000 ${
          mapLoaded && !mapError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          filter: 'contrast(1.02) brightness(0.99)',
          maskImage:
            'radial-gradient(ellipse 75% 70% at 50% 48%, #000 35%, rgba(0,0,0,0.55) 60%, transparent 92%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 70% at 50% 48%, #000 35%, rgba(0,0,0,0.55) 60%, transparent 92%)',
        }}
      />

      {/* =========================================================================
          LAYER 1B: PAPER WASH FILTER (35% OPACITY PAPER MIX TOWARD #D8D4BF)
      ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] size-full bg-[#D8D4BF]/35 mix-blend-multiply"
      />

      {/* =========================================================================
          LAYER 1C: SOFT PAPER VIGNETTE BORDER DISSOLVE (NO HARD CUT AT BORDERS)
      ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] size-full"
        style={{
          background:
            'radial-gradient(ellipse 85% 80% at 50% 48%, transparent 50%, rgba(216, 212, 191, 0.55) 75%, #D8D4BF 98%)',
        }}
      />


      {/* =========================================================================
          LAYER 3: TACTILE PAPER GRAIN OVERLAY (ON TOP OF MAP & SKETCH, 5% OPACITY)
      ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[3] size-full mix-blend-multiply opacity-[0.05]"
      >
        <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="hero-paper-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-paper-grain)" />
        </svg>
      </div>

      {/* =========================================================================
          LAYER 4: EDITORIAL POSTER OVERLAY (CROSSHAIRS, REGISTRATION MARKS, PAPER-BACKED LABELS)
      ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4] size-full overflow-hidden"
      >
        <svg
          className="size-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dashed Center Crosshairs */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="100"
            stroke="#141414"
            strokeWidth="0.1"
            strokeDasharray="1.5 1.5"
            strokeOpacity="0.25"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="#141414"
            strokeWidth="0.1"
            strokeDasharray="1.5 1.5"
            strokeOpacity="0.25"
          />

          {/* Geodetic Coordinate Rings (Clipped cleanly behind center title card) */}
          <circle
            cx="32"
            cy="30"
            r="12"
            fill="none"
            stroke="#141414"
            strokeWidth="0.12"
            strokeDasharray="0.8 0.8"
            strokeOpacity="0.3"
          />
          <circle
            cx="32"
            cy="30"
            r="24"
            fill="none"
            stroke="#141414"
            strokeWidth="0.08"
            strokeOpacity="0.2"
          />
        </svg>

        {/* Paper-backed Micro-Labels (2px paper halo so no road line cuts through text) */}
        {/* Top-Left: Site & Registration */}
        <div className="absolute top-20 left-4 sm:left-8 text-[10px] sm:text-[11px] font-mono tracking-[0.08em] text-[#141414] uppercase space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#D8D4BF]/92 border border-[#141414]/25 shadow-2xs">
            <span className="size-1.5 bg-[#141414] inline-block" />
            <span className="font-bold">SITE / NASHIK</span>
            <span className="opacity-50">•</span>
            <span>REG #016</span>
          </div>
          <p className="px-2 py-0.5 rounded bg-[#D8D4BF]/85 text-[9px] text-[#141414]/75 w-fit border border-[#141414]/15">
            DATUM: WGS-84 • MAHA KUMBH 2027
          </p>
        </div>

        {/* Top-Right: Stops & Survey Grid */}
        <div className="hidden sm:block absolute top-20 right-8 text-right text-[10px] sm:text-[11px] font-mono tracking-[0.08em] text-[#141414] uppercase space-y-1">
          <div className="inline-flex items-center justify-end gap-1.5 px-2 py-0.5 rounded bg-[#D8D4BF]/92 border border-[#141414]/25 shadow-2xs">
            <span>5 PILGRIMAGE STOPS</span>
            <span className="size-1.5 bg-[#141414] inline-block" />
          </div>
          <p className="px-2 py-0.5 rounded bg-[#D8D4BF]/85 text-[9px] text-[#141414]/75 border border-[#141414]/15">
            ELEVATION ~565 M • GODAVARI GHATS
          </p>
        </div>

        {/* Left Edge: Real Geographic Coordinates with Paper Halo */}
        <div className="hidden md:flex absolute top-1/2 left-3 -translate-y-1/2 -rotate-90 origin-left">
          <span className="text-[9.5px] font-mono tracking-[0.14em] text-[#141414] uppercase px-2 py-0.5 rounded bg-[#D8D4BF]/92 border border-[#141414]/20 shadow-2xs">
            N 19.9975°  E 73.7898° • GODAVARI CORRIDOR
          </span>
        </div>

        {/* Right Edge: Sacred Pilgrimage Sector with Paper Halo */}
        <div className="hidden md:flex absolute top-1/2 right-3 -translate-y-1/2 rotate-90 origin-right">
          <span className="text-[9.5px] font-mono tracking-[0.14em] text-[#141414] uppercase px-2 py-0.5 rounded bg-[#D8D4BF]/92 border border-[#141414]/20 shadow-2xs">
            RAMKUND • PANCHAVATI • KALARAM AXIS
          </span>
        </div>

        {/* Edge Black Registration Squares (4 corners) */}
        <div className="absolute top-20 left-2 size-2 border border-[#141414] bg-[#141414]/60" />
        <div className="absolute top-20 right-2 size-2 border border-[#141414] bg-[#141414]/60" />
        <div className="absolute bottom-8 left-2 size-2 border border-[#141414] bg-[#141414]/60" />
        <div className="absolute bottom-8 right-2 size-2 border border-[#141414] bg-[#141414]/60" />

        {/* Subtle Map Tile Attribution with Paper Backing */}
        <div className="absolute bottom-2 left-4 text-[9px] font-mono text-[#141414]/60 tracking-wider px-2 py-0.5 rounded bg-[#D8D4BF]/90 border border-[#141414]/15">
          MAP © OPENFREEMAP • OPENSTREETMAP CONTRIBUTORS
        </div>
      </div>

      {/* =========================================================================
          LAYER 4: MAIN GLASS TITLE PANEL (~70% COMPACT PROPORTIONS, CENTERED)
      ========================================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 pt-20 sm:pt-24 pb-6 flex-1 flex flex-col items-center justify-center">
        
        {/* =========================================================================
            HERO GLASS TITLE PANEL WITH INTEGRATED SKETCH ILLUSTRATION BAND
            - Position: relative; overflow: hidden; rounded-[20px]
            - Width: clamp(320px, 56vw, 820px) desktop; calc(100vw - 32px) mobile
            - Paper-tinted glass at .88 opacity: rgba(232, 229, 214, 0.88) (map not visible inside)
            - Backdrop blur: 18px
            - 1px light border and soft shadow
            - Two zones:
              ZONE A: Text & CTA buttons on clean paper background (no sketch behind)
              ZONE B: Nashik sketch illustration band anchored to the bottom
        ========================================================================= */}
        <div
          className="relative w-[calc(100vw-32px)] sm:w-[clamp(320px,56vw,820px)] max-w-[820px] rounded-[20px] overflow-hidden shadow-[0_20px_50px_-12px_rgba(15,42,30,0.18),0_4px_16px_rgba(0,0,0,0.04)] border border-white/80 transition-all flex flex-col"
          style={{
            backgroundColor: 'rgba(232, 229, 214, 0.88)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {/* ZONE A: Content Zone (Top ~62% of panel, clean paper only) */}
          <div className="w-full flex flex-col items-center text-center px-4 pt-5 pb-0 sm:px-7 sm:pt-6 sm:pb-0 select-none">
            {/* 1. Thin Meta Row: Arrow Icon + Checker Icon + Barcode Strip + NASHIK KUMBH MELA 2027 */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[#0F2A1E] mb-2 select-none">
              <span className="text-[11px] leading-none">→</span>

              {/* 4-Box Checker Icon */}
              <span
                className="inline-grid grid-cols-2 size-2.5 sm:size-3 border border-[#0F2A1E]/80 shrink-0"
                aria-hidden="true"
              >
                <span className="bg-[#0F2A1E]" />
                <span className="bg-transparent" />
                <span className="bg-transparent" />
                <span className="bg-[#0F2A1E]" />
              </span>

              {/* Micro Barcode Strip */}
              <span
                className="inline-flex items-center gap-[1.5px] h-2.5 sm:h-3 px-1 bg-[#0F2A1E]/5 rounded-xs shrink-0"
                aria-hidden="true"
              >
                <span className="w-[1.5px] h-2 sm:h-2.5 bg-[#0F2A1E]" />
                <span className="w-[1px] h-2 sm:h-2.5 bg-[#0F2A1E]" />
                <span className="w-[2px] h-2 sm:h-2.5 bg-[#0F2A1E]" />
                <span className="w-[1px] h-2 sm:h-2.5 bg-[#0F2A1E]" />
                <span className="w-[1.5px] h-2 sm:h-2.5 bg-[#0F2A1E]" />
                <span className="w-[2px] h-2 sm:h-2.5 bg-[#0F2A1E]" />
              </span>

              <span>NASHIK • KUMBH MELA 2027</span>
            </div>

            {/* 2. SINGLE DOMINANT WORDMARK: "Sthaanam" (High-contrast italic display serif) */}
            <div className="w-full max-w-full flex justify-center items-center overflow-hidden my-0.5 px-1">
              <h1
                className="select-none font-normal italic tracking-[-0.03em] text-[#0F2A1E] max-w-full text-center leading-[0.96] whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-serif, 'Playfair Display', 'Cormorant Garamond', Georgia, serif)",
                  fontSize: 'clamp(38px, 5.8vw, 84px)',
                  textShadow: '0 2px 20px rgba(15, 42, 30, 0.08)',
                }}
              >
                Sthaanam
              </h1>
            </div>

            {/* 3. Moody Title Card Tagline: Wide letter-spaced light serif capitals */}
            <p
              className="mt-1.5 sm:mt-2 text-[10.5px] sm:text-[12px] md:text-[13px] font-serif font-light tracking-[0.24em] sm:tracking-[0.36em] text-[#0F2A1E]/95 uppercase text-center"
              style={{
                fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)",
              }}
            >
              A PLACE FOR EVERY JOURNEY
            </p>

            {/* 4. One short line of copy (max 2 lines) */}
            <p className="mt-2 sm:mt-2.5 text-[11.5px] sm:text-[13px] font-normal text-[#0F2A1E]/80 max-w-md leading-relaxed text-center font-sans">
              Verified private parking within walking distance of the sacred ghats. Reserved, monitored, and confirmed by UPI.
            </p>

            {/* 5. EXACTLY ONE PAIR OF BUTTONS: FIND PARKING (GOLD) & LIST YOUR SPACE (OUTLINE) */}
            {/* mb-4 sm:mb-5 provides 16-24px clear paper space between buttons and illustration band */}
            <div className="mt-4 sm:mt-5 mb-4 sm:mb-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#E9A83A] hover:bg-[#dc9b2e] text-[#141414] font-bold text-xs sm:text-sm tracking-wide px-5 sm:px-6 py-2.5 sm:py-3 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
              >
                <Icon name="search" size={15} />
                <span>Find Parking</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/host/new')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0F2A1E]/80 bg-white/40 hover:bg-white text-[#0F2A1E] font-bold text-xs sm:text-sm tracking-wide px-4 sm:px-5 py-2 sm:py-2.5 shadow-xs hover:shadow-md transition-all transform active:scale-95 cursor-pointer backdrop-blur-xs"
              >
                <span>List Your Space</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* ZONE B: Sketch Illustration Band (Bottom ~38% of panel) */}
          {/* Anchored to panel bottom, spanning full width inside panel, clean paper space above */}
          <div className="relative w-full h-[120px] sm:h-[145px] md:h-[165px] min-h-[110px] mt-auto flex flex-col justify-end overflow-hidden select-none pointer-events-none">
            {/* Illustration with top fade (~25%) and side fade (~8%) */}
            <div
              className="relative w-full h-full flex items-end justify-center px-2 sm:px-4"
              style={{
                // Fade out top 25% smoothly
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)',
              }}
            >
              <div
                className="w-full h-full flex items-end justify-center"
                style={{
                  // Fade out sides over ~8%
                  maskImage:
                    'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
                }}
              >
                <picture className="w-full h-full flex items-end justify-center">
                  <source media="(max-width: 640px)" srcSet={sketch1000} />
                  <img
                    src={sketch2000}
                    alt="Nashik Ghats illustration"
                    className="w-full h-full object-contain object-bottom select-none"
                    style={{
                      opacity: 0.58,
                      mixBlendMode: 'multiply',
                    }}
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              </div>
            </div>

            {/* Thin ground line along the bottom: 1px ink at .25 */}
            <div className="w-full h-[1px] bg-[#141414]/25 shrink-0" />
          </div>
        </div>

        {/* =========================================================================
            BOTTOM-RIGHT GLASS INFORMATION CARD (FOREST GREEN TINT + HAZARD ACCENT)
        ========================================================================= */}
        <div className="w-full mt-5 sm:mt-6 flex justify-center sm:justify-end">
          {/* Editorial Info Card (Forest Green Glass Tint, sits on clean map/paper) */}
          <div
            className="w-full sm:w-auto min-w-[260px] sm:max-w-xs rounded-2xl p-3 sm:p-3.5 border border-[#0F2A1E]/20 text-[#0F2A1E] shadow-md flex flex-col gap-2 transition-all"
            style={{
              backgroundColor: 'rgba(15, 42, 30, 0.08)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            {/* Top row with Zone and Stop Count */}
            <div className="flex items-center justify-between border-b border-[#0F2A1E]/15 pb-1.5 text-[9.5px] font-mono font-bold tracking-wider uppercase">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#E9A83A]" />
                <span>ZONE 01 • RAMKUND</span>
              </span>
              <span>STOPS: 05</span>
            </div>

            {/* Middle row: Computed Verified Bays */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[8.5px] font-mono tracking-widest text-[#0F2A1E]/70 uppercase block">
                  NETWORK CAPACITY
                </span>
                <span className="text-[16px] font-black font-mono tracking-tight text-[#0F2A1E]">
                  {verifiedBaysCount}+ BAYS VERIFIED
                </span>
              </div>
              <span className="text-[9.5px] font-mono font-bold text-[#0F2A1E]/80">
                LIVE STATUS
              </span>
            </div>

            {/* Poster Reference Hazard-Stripe Accent Bar (Black on Gold, 45deg) */}
            <div
              className="h-1.5 w-full rounded-xs shadow-2xs"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #141414, #141414 6px, #E9A83A 6px, #E9A83A 12px)',
              }}
              title="Pilgrim Traffic Transit Cordon Active"
            />
          </div>

        </div>

      </div>

      {/* =========================================================================
          LAYER 5: SCROLL CUE AT BOTTOM (OWN GLASS PILL, DOES NOT OVERLAP MAP)
      ========================================================================= */}
      <div className="relative z-10 pb-4 pt-1 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={scrollToJourney}
          aria-label="Scroll to begin your road journey"
          className="group inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-mono font-bold tracking-widest text-[#141414] hover:text-[#0F2A1E] shadow-sm hover:shadow-md border border-white/80 transition-all cursor-pointer backdrop-blur-md"
        >
          <span className="uppercase text-[10px] font-bold">Scroll to begin your journey</span>
          <span className="grid size-5 place-items-center rounded-full bg-[#0F2A1E]/10 text-[#0F2A1E] group-hover:bg-[#0F2A1E] group-hover:text-white transition-all transform group-hover:translate-y-0.5">
            <Icon name="chevronDown" size={12} />
          </span>
        </button>
      </div>
    </section>
  )
}
