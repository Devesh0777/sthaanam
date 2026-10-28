import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGhatPoints, getZones, searchSpots } from '@/api'
import { useApp } from '@/context/AppContext'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useGeolocation } from '@/hooks/useGeolocation'
import { NASHIK_CENTER } from '@/config/map'
import {
  calculateRoute,
  formatGoogleMapsUrl,
  getPointAlongPolyline,
  calculateJourneyHudState,
  haversineKm,
  NASHIK_ENTRY_POINTS,
} from '@/lib/routing'
import { cn } from '@/lib/cn'
import { PageShell } from '@/components/layout/PageShell'
import KumbhMap from '@/components/map/KumbhMap'
import NavHud from '@/components/map/NavHud'
import { DEFAULT_OVERLAY_IDS } from '@/components/map/MapLayerToggle'
import FilterSheet from '@/components/parking/FilterSheet'
import ParkingCard from '@/components/parking/ParkingCard'
import ParkingCardSkeleton from '@/components/parking/ParkingCardSkeleton'
import Chip from '@/components/ui/Chip'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'

const QUICK_FILTERS = [
  { id: 'within1km', label: 'Within 1 km' },
  { id: 'under20', label: 'Under ₹20' },
  { id: '20to40', label: '₹20–₹40' },
  { id: 'above40', label: 'Above ₹40' },
  { id: 'instant', label: 'Instant QR' },
  { id: 'onlyAvailable', label: 'Open Bays' },
  { id: 'openNow', label: 'Open Now' },
]

export default function Search() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { filters, patchFilters } = useApp()
  const { locate, loading: geoLoading } = useGeolocation()

  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [stagger, setStagger] = useState(false)
  const [overlayIds, setOverlayIds] = useState(DEFAULT_OVERLAY_IDS)
  const [viewport, setViewport] = useState(null)
  const [navSpot, setNavSpot] = useState(null)
  const [navRoute, setNavRoute] = useState(null)
  const [navLoading, setNavLoading] = useState(false)
  const [userCoords, setUserCoords] = useState(null)
  const [userAccuracy, setUserAccuracy] = useState(null)
  const [userSpeed, setUserSpeed] = useState(null)
  const [userLabel, setUserLabel] = useState('Your Location')
  const [originMenuOpen, setOriginMenuOpen] = useState(false)
  const [settingStartOnMap, setSettingStartOnMap] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [followLocation, setFollowLocation] = useState(true)
  const [mapFocus, setMapFocus] = useState(null)

  // Journey state machine
  const [journeyStatus, setJourneyStatus] = useState('idle') // 'idle' | 'running' | 'paused' | 'arrived'
  const [journeyProgress, setJourneyProgress] = useState(0) // 0 to 1
  const [journeyCar, setJourneyCar] = useState(null) // { lng, lat, angle }
  const [traveledCoords, setTraveledCoords] = useState(null)
  const [travelMode, setTravelMode] = useState('driving') // 'driving' | 'walking'
  const [isLiveTracking, setIsLiveTracking] = useState(false)
  const [geoStatus, setGeoStatus] = useState({ state: 'idle', message: null })

  const cardRefs = useRef(new Map())
  const animFrameRef = useRef(null)
  const animStartTimeRef = useRef(null)
  const animElapsedRef = useRef(0)
  const lastTimestampRef = useRef(null)
  const pausedProgressRef = useRef(0)
  const watchIdRef = useRef(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1x or 2x
  const playbackSpeedRef = useRef(1)
  playbackSpeedRef.current = playbackSpeed

  // Reads zone/q deep link exactly once
  const appliedDeepLink = useRef(false)
  useEffect(() => {
    if (appliedDeepLink.current) return
    appliedDeepLink.current = true
    const zone = params.get('zone')
    const q = params.get('q')
    if (zone || q) patchFilters({ zone: zone ?? 'all', q: q ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: zones } = useAsync(() => getZones(), [])
  const { data: ghats } = useAsync(() => getGhatPoints(), [])

  const debouncedQuery = useDebouncedValue(filters.q)

  const areaDirty = useMemo(() => {
    if (!viewport?.center) return false
    if (!filters.origin) return true
    const [vLat, vLng] = viewport.center
    const [oLat, oLng] = filters.origin
    return Math.abs(vLat - oLat) > 0.001 || Math.abs(vLng - oLng) > 0.001
  }, [viewport, filters.origin])

  const filterKey = [
    filters.zone,
    debouncedQuery,
    filters.vehicle,
    filters.plan,
    filters.sort,
    filters.minPrice ?? '',
    filters.maxPrice ?? '',
    filters.features.join(','),
    filters.instant,
    filters.onlyAvailable,
    filters.openNow,
    filters.origin ? filters.origin.join(',') : '',
    filters.radiusKm ?? '',
  ].join('|')

  const { data: spots, loading, error, reload } = useAsync(
    () => searchSpots({ ...filters, q: debouncedQuery }),
    [filterKey],
  )

  const [fallback1kmCount, setFallback1kmCount] = useState(null)

  // Derive effective selected spot without synchronous effect setState
  const effectiveSelectedId = useMemo(() => {
    if (!selectedId || !spots) return null
    return spots.some((s) => s.id === selectedId) ? selectedId : null
  }, [selectedId, spots])

  useEffect(() => {
    let active = true
    if (!loading && spots && spots.length === 0 && filters.radiusKm !== 1) {
      searchSpots({ ...filters, q: debouncedQuery, radiusKm: 1, features: [], maxPrice: null })
        .then((res) => {
          if (active) setFallback1kmCount(res ? res.length : 0)
        })
        .catch(() => {
          if (active) setFallback1kmCount(0)
        })
    } else {
      queueMicrotask(() => {
        if (active) setFallback1kmCount(null)
      })
    }
    return () => {
      active = false
    }
  }, [loading, spots, filters, debouncedQuery])

  useEffect(() => {
    if (!spots) return
    const timer = setTimeout(() => setStagger(true), 40)
    return () => clearTimeout(timer)
  }, [spots])

  const activeCount = useMemo(() => {
    let count = 0
    if (filters.zone !== 'all') count += 1
    if (filters.vehicle !== 'all') count += 1
    if (filters.minPrice != null || filters.maxPrice != null) count += 1
    if (filters.radiusKm != null) count += 1
    count += filters.features.length
    if (filters.instant) count += 1
    if (filters.onlyAvailable) count += 1
    if (filters.openNow) count += 1
    return count
  }, [filters])

  const zoneLabel = zones?.find((z) => z.id === filters.zone)?.name ?? 'All Mela Sectors'

  const focus = useMemo(() => {
    if (filters.zone === 'all') return null
    const zone = zones?.find((z) => z.id === filters.zone)
    return { latlng: zone?.latlng ?? NASHIK_CENTER, zoom: 14 }
  }, [filters.zone, zones])

  const toggleQuick = (id) => {
    if (id === 'within1km') {
      const nextRadius = filters.radiusKm === 1 ? null : 1
      patchFilters({ radiusKm: nextRadius })
      toast.push({
        tone: 'info',
        title: nextRadius === 1 ? '1 km Radius Applied' : 'Radius Cleared',
        message: nextRadius === 1 ? 'Showing spots within 1 km walking distance.' : 'Showing all distances.',
      })
      return
    }
    if (id === 'under20') {
      if (filters.maxPrice === 20 && filters.minPrice == null) {
        patchFilters({ minPrice: null, maxPrice: null })
      } else {
        patchFilters({ minPrice: null, maxPrice: 20 })
      }
      return
    }
    if (id === '20to40') {
      if (filters.minPrice === 20 && filters.maxPrice === 40) {
        patchFilters({ minPrice: null, maxPrice: null })
      } else {
        patchFilters({ minPrice: 20, maxPrice: 40 })
      }
      return
    }
    if (id === 'above40') {
      if (filters.minPrice === 40 && filters.maxPrice == null) {
        patchFilters({ minPrice: null, maxPrice: null })
      } else {
        patchFilters({ minPrice: 40, maxPrice: null })
      }
      return
    }
    if (id === 'instant' || id === 'onlyAvailable' || id === 'openNow') {
      patchFilters({ [id]: !filters[id] })
    }
  }

  // Cancel running journey when switching spots or unmounting
  const handleSpotChange = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setJourneyStatus('idle')
    setJourneyProgress(0)
    setJourneyCar(null)
    setTraveledCoords(null)
    setIsLiveTracking(false)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  const onMarkerSelect = (spot) => {
    if (!spot) {
      setSelectedId(null)
      return
    }
    if (spot.id !== selectedId) {
      handleSpotChange()
    }
    setSelectedId(spot.id)
    const node = cardRefs.current.get(spot.id)
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const searchThisArea = () => {
    if (!viewport?.center) return
    patchFilters({
      origin: viewport.center,
      originLabel: 'Map area',
      sort: filters.sort === 'distance' ? 'distance' : filters.sort,
    })
    toast.push({
      tone: 'info',
      title: 'Sector Updated',
      message: 'Showing verified parking spots around current map center.',
    })
    reload()
  }

  const handleSetStartCoords = (coords) => {
    setSettingStartOnMap(false)
    setUserCoords(coords)
    setUserAccuracy(null)
    setUserLabel('Custom Map Pin')
    toast.push({
      tone: 'success',
      title: 'Start Point Placed',
      message: 'Starting location set from map click.',
    })

    const targetSpot = navSpot || (effectiveSelectedId ? spots?.find((s) => s.id === effectiveSelectedId) : null)
    if (targetSpot) {
      handleStartNavigation(targetSpot, { latlng: coords, shortName: 'Custom Map Pin' })
    }
  }

  const handleLocate = async () => {
    setGeoStatus({ state: 'locating', message: 'Locating… acquiring high-accuracy GPS signal' })
    try {
      const pos = await locate()
      if (pos) {
        setUserCoords(pos.latlng)
        setUserAccuracy(pos.accuracy)
        setUserSpeed(pos.speed)
        setUserLabel('My Location')
        setMapFocus({ latlng: pos.latlng, zoom: 16 })
        patchFilters({ origin: pos.latlng, originLabel: 'Near me', sort: 'distance' })

        // Check if user is far from Nashik (> 50 km)
        const distFromNashik = haversineKm(pos.latlng, NASHIK_CENTER)
        if (distFromNashik > 50) {
          toast.push({
            tone: 'warning',
            title: 'Outside Nashik',
            message:
              'You are currently outside Nashik. Route starts from your current position — tap Gateway Presets if you want to preview parking from city entry.',
          })
        }

        if (pos.accuracy > 100) {
          setGeoStatus({
            state: 'approximate',
            message: `Location is approximate (±${Math.round(pos.accuracy)}m). For best accuracy use a phone GPS with Location turned on.`,
          })
        } else {
          setGeoStatus({ state: 'idle', message: null })
        }

        // If a parking spot is currently selected, recalculate route from real GPS
        const targetSpot = navSpot || (effectiveSelectedId ? spots?.find((s) => s.id === effectiveSelectedId) : null)
        if (targetSpot) {
          handleStartNavigation(targetSpot, { latlng: pos.latlng, shortName: 'My Location' })
        } else {
          toast.push({
            tone: 'success',
            title: 'Location Acquired',
            message: `GPS location locked (±${Math.round(pos.accuracy)}m).`,
          })
        }
      }
    } catch (err) {
      const isDenied = err?.code === 1 || err?.message?.toLowerCase().includes('denied')
      setGeoStatus({
        state: isDenied ? 'denied' : 'error',
        message: isDenied
          ? 'Location permission blocked. Enable it in browser settings, pick a gateway preset, or tap "Set start on map".'
          : "Couldn't acquire GPS location. Choose a gateway preset below or tap \"Set start on map\".",
      })
      toast.push({
        tone: 'warning',
        title: isDenied ? 'Location Permission Blocked' : 'Location Unavailable',
        message: isDenied
          ? 'Enable location in settings, pick a preset, or set start on map.'
          : "Couldn't retrieve GPS location. Pick a preset or set start on map.",
      })
    }
  }

  const handleSort = async (newSort) => {
    if (newSort === 'distance' && !filters.origin) {
      toast.push({
        tone: 'info',
        title: 'Locating…',
        message: 'Locating… sorting nearest first',
      })
      try {
        const pos = await locate()
        if (pos) {
          setUserCoords(pos.latlng)
          setUserAccuracy(pos.accuracy)
          patchFilters({ origin: pos.latlng, originLabel: 'Near me', sort: 'distance' })
          return
        }
      } catch {
        toast.push({
          tone: 'warning',
          title: 'Location Error',
          message: 'Location permission denied or unavailable.',
        })
      }
    }
    patchFilters({ sort: newSort })
  }

  const handleStartNavigation = async (spot, customOrigin = null) => {
    if (!spot) return
    handleSpotChange()
    setNavLoading(true)
    setSelectedId(spot.id)

    let origin = null
    let originTitle = 'Your Location'

    if (customOrigin) {
      origin = customOrigin.latlng
      originTitle = customOrigin.shortName || customOrigin.name
      setUserCoords(origin)
      setUserLabel(originTitle)
    } else if (userCoords) {
      origin = userCoords
      originTitle = userLabel || 'Your Location'
    } else {
      try {
        toast.push({
          tone: 'info',
          title: 'Detecting Location…',
          message: 'Acquiring GPS location for route planning…',
        })
        const pos = await locate()
        if (pos) {
          origin = pos.latlng
          originTitle = 'My Location'
          setUserCoords(pos.latlng)
          setUserAccuracy(pos.accuracy)
          setUserLabel('My Location')
          const dist = haversineKm(pos.latlng, NASHIK_CENTER)
          if (dist > 50) {
            toast.push({
              tone: 'warning',
              title: 'Outside Nashik',
              message:
                'You are currently outside Nashik. Route starts from your current position — tap Gateway Presets if you want to preview parking from city entry.',
            })
          }
        }
      } catch {
        // Fallback to Nashik Road Railway Station preset if GPS is denied or unavailable
        // Clearly inform user and do not silently pretend this is user GPS
        const fallback = NASHIK_ENTRY_POINTS[0]
        origin = fallback.latlng
        originTitle = `${fallback.shortName} (Preset)`
        setUserCoords(fallback.latlng)
        setUserAccuracy(null)
        setUserLabel(`${fallback.shortName} (Preset)`)
        setGeoStatus({
          state: 'error',
          message: `Location unavailable. Showing route from ${fallback.name}. Tap 'From' to choose another start point or set pin on map.`,
        })
      }
    }

    if (!origin) {
      const fallback = NASHIK_ENTRY_POINTS[0]
      origin = fallback.latlng
      originTitle = fallback.shortName
      setUserCoords(origin)
      setUserLabel(fallback.shortName)
    }

    try {
      const routeRes = await calculateRoute({
        origin,
        destination: spot.latlng,
        originName: originTitle,
        destinationName: spot.title,
      })
      setNavSpot(spot)
      setNavRoute(routeRes)
      toast.push({
        tone: 'success',
        title: `Route to ${spot.title}`,
        message: `${routeRes.distanceLabel} · ${routeRes.drivingLabel} (or ${routeRes.walkingLabel})`,
      })
    } catch (err) {
      toast.push({
        tone: 'danger',
        title: 'Route Error',
        message: err.message || 'Unable to compute route.',
      })
    } finally {
      setNavLoading(false)
    }
  }

  const handleClearNavigation = () => {
    handleSpotChange()
    setNavSpot(null)
    setNavRoute(null)
    setOriginMenuOpen(false)
  }

  // Start Journey Animation driven by single source of truth (journeyProgress)
  const handleStartJourney = () => {
    const coords = navRoute?.routeCoordinates || navRoute?.geojson?.geometry?.coordinates
    if (!coords || coords.length < 2) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // prefers-reduced-motion: directly show full route and arrival card (Phase 1 Requirement 9)
    if (prefersReducedMotion) {
      setJourneyProgress(1)
      setTraveledCoords(coords)
      const lastPt = getPointAlongPolyline(coords, 1, navRoute.metrics)
      setJourneyCar(lastPt)
      setJourneyStatus('arrived')
      return
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)

    setJourneyStatus('running')
    setJourneyProgress(0)
    setIsLiveTracking(false)
    setFollowLocation(true)

    const initialPt = getPointAlongPolyline(coords, 0, navRoute.metrics)
    setJourneyCar(initialPt)
    setTraveledCoords(initialPt?.traveledCoords || [])

    animElapsedRef.current = 0
    lastTimestampRef.current = performance.now()
    pausedProgressRef.current = 0

    // Scale total duration to route distance (clamped 8-14s, Phase 1 Requirement 5)
    const totalMeters = navRoute?.metrics?.totalMeters || (navRoute.distanceKm ? navRoute.distanceKm * 1000 : 1500)
    const baseDurationMs = Math.min(14000, Math.max(8000, (totalMeters / 140) * 1000))

    const step = (timestamp) => {
      const delta = (timestamp - lastTimestampRef.current) * playbackSpeedRef.current
      lastTimestampRef.current = timestamp
      animElapsedRef.current += delta

      const rawProgress = Math.min(1, animElapsedRef.current / baseDurationMs)
      // Ease-in at start, ease-out near end (smooth quad)
      const easedProgress =
        rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2

      const currentProgress = Math.max(0, Math.min(1, easedProgress))
      const pt = getPointAlongPolyline(coords, currentProgress, navRoute.metrics)

      if (pt) {
        setJourneyCar(pt)
        setTraveledCoords(pt.traveledCoords)
      }
      setJourneyProgress(currentProgress)

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        // Full journey completed: car stops on destination, arrival card appears (Phase 1 Requirement 5 & 7)
        setJourneyProgress(1)
        const finalPt = getPointAlongPolyline(coords, 1, navRoute.metrics)
        if (finalPt) {
          setJourneyCar(finalPt)
          setTraveledCoords(finalPt.traveledCoords)
        }
        setJourneyStatus('arrived')
        toast.push({
          tone: 'success',
          title: "You've Arrived! 🎉",
          message: `Reached ${navSpot?.title || 'destination'}. Ready to reserve bay.`,
        })
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }

  const handlePauseJourney = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    pausedProgressRef.current = journeyProgress
    setJourneyStatus('paused')
  }

  const handleResumeJourney = () => {
    const coords = navRoute?.routeCoordinates || navRoute?.geojson?.geometry?.coordinates
    if (!coords) return
    setJourneyStatus('running')
    setFollowLocation(true)
    lastTimestampRef.current = performance.now()

    const totalMeters = navRoute?.metrics?.totalMeters || (navRoute.distanceKm ? navRoute.distanceKm * 1000 : 1500)
    const baseDurationMs = Math.min(14000, Math.max(8000, (totalMeters / 140) * 1000))

    const step = (timestamp) => {
      const delta = (timestamp - lastTimestampRef.current) * playbackSpeedRef.current
      lastTimestampRef.current = timestamp
      animElapsedRef.current += delta

      const rawProgress = Math.min(1, animElapsedRef.current / baseDurationMs)
      const easedProgress =
        rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2

      const currentProgress = Math.max(0, Math.min(1, easedProgress))
      const pt = getPointAlongPolyline(coords, currentProgress, navRoute.metrics)

      if (pt) {
        setJourneyCar(pt)
        setTraveledCoords(pt.traveledCoords)
      }
      setJourneyProgress(currentProgress)

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        setJourneyProgress(1)
        const finalPt = getPointAlongPolyline(coords, 1, navRoute.metrics)
        if (finalPt) {
          setJourneyCar(finalPt)
          setTraveledCoords(finalPt.traveledCoords)
        }
        setJourneyStatus('arrived')
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }

  const handleStopJourney = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setJourneyStatus('idle')
    setJourneyProgress(0)
    setJourneyCar(null)
    setTraveledCoords(null)
    setIsLiveTracking(false)
    animElapsedRef.current = 0
    pausedProgressRef.current = 0
    handleSpotChange()
  }

  const handleToggleSpeed = () => {
    setPlaybackSpeed((prev) => {
      const next = prev === 1 ? 2 : 1
      playbackSpeedRef.current = next
      toast.push({
        tone: 'info',
        title: `Animation Speed: ${next}x`,
      })
      return next
    })
  }

  const handleToggleLiveTracking = () => {
    if (isLiveTracking) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      setIsLiveTracking(false)
      handleResumeJourney()
    } else {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        toast.push({ tone: 'warning', title: 'GPS Not Supported' })
        return
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      setIsLiveTracking(true)
      setJourneyStatus('running')
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6))
          const lng = Number(pos.coords.longitude.toFixed(6))
          const acc = Math.round(pos.coords.accuracy || 0)

          // Ignore readings with accuracy > 100m in live journey mode (Phase B7 requirement)
          if (acc > 100) return

          setUserCoords([lat, lng])
          setUserAccuracy(acc)
          if (pos.coords.speed != null) {
            setUserSpeed(pos.coords.speed)
          }

          setJourneyCar({
            lng,
            lat,
            angle: pos.coords.heading || journeyCar?.angle || 0,
          })
        },
        (err) => console.warn('[GPS] watchPosition error:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    }
  }

  // Single source of truth for journey HUD metrics (Phase C3 requirement)
  const hudState = useMemo(() => {
    return calculateJourneyHudState(navRoute, journeyProgress)
  }, [navRoute, journeyProgress])

  // Realistic vehicle speed calculation
  const simulatedSpeed = useMemo(() => {
    if (isLiveTracking && userSpeed != null) {
      return Math.round(userSpeed * 3.6) // m/s to km/h
    }
    if (journeyStatus === 'running') {
      return Math.round(36 + Math.sin(journeyProgress * Math.PI * 6) * 4)
    }
    return null
  }, [isLiveTracking, userSpeed, journeyStatus, journeyProgress])

  const handleRecenter = () => {
    setFollowLocation(true)
    if (journeyCar?.lat && journeyCar?.lng) {
      setMapFocus({ latlng: [journeyCar.lat, journeyCar.lng], zoom: 16 })
    } else if (userCoords) {
      setMapFocus({ latlng: userCoords, zoom: 16 })
    }
  }

  const googleMapsDirectionsUrl = useMemo(() => {
    if (!navSpot) return '#'
    return formatGoogleMapsUrl(
      userCoords || navRoute?.origin?.latLng,
      navSpot.latlng,
      travelMode,
    )
  }, [userCoords, navRoute, navSpot, travelMode])

  return (
    <PageShell className="lg:pb-0 h-full">
      <div className="relative w-full h-[calc(100dvh-76px)] overflow-hidden flex flex-col lg:block">
        {/* =========================================================================
            MAP PANE (FULL-BLEED UNDERLAY ON DESKTOP)
        ========================================================================= */}
        <section className="relative h-[44dvh] shrink-0 lg:h-full lg:w-full lg:absolute lg:inset-0 overflow-hidden">
          <KumbhMap
            spots={spots ?? []}
            ghatPoints={ghats ?? []}
            overlayIds={overlayIds}
            onOverlayChange={setOverlayIds}
            center={NASHIK_CENTER}
            zoom={filters.zone === 'all' ? 12 : 14}
            focus={mapFocus || focus}
            selectedId={effectiveSelectedId}
            hoveredId={hoveredId}
            onSelect={onMarkerSelect}
            onViewportChange={setViewport}
            onOpenLayers={() => setFilterOpen(true)}
            route={navRoute}
            userCoords={userCoords}
            userAccuracy={userAccuracy}
            userLabel={userLabel}
            onNavigate={handleStartNavigation}
            journeyCar={journeyCar}
            traveledCoords={traveledCoords}
            journeyStatus={journeyStatus}
            settingStartOnMap={settingStartOnMap}
            onSetStartCoords={handleSetStartCoords}
            followLocation={followLocation}
            onUserPan={() => setFollowLocation(false)}
          />

          {/* Centered Safe Search This Area Pill (Only when not in active navigation) */}
          {areaDirty && !navRoute && (
            <div className="absolute inset-x-0 top-3 flex justify-center px-4 pointer-events-none z-[400]">
              <button
                type="button"
                onClick={searchThisArea}
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full glass-panel-dark px-4 py-2 text-[12px] font-bold text-[#FFD900] shadow-xl hover:bg-[#006341] hover:text-white transition-all active:scale-95 border border-[#FFD900]/40 cursor-pointer"
              >
                <Icon name="refresh" size={13} />
                <span>Search this area</span>
              </button>
            </div>
          )}

          {/* Live Navigation Route Loading Indicator */}
          {navLoading && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[450] inline-flex items-center gap-2 rounded-full border border-white/20 glass-panel-dark px-4 py-2 text-[12px] font-bold text-white shadow-xl">
              <span className="size-3.5 animate-spin rounded-full border-2 border-[#FFD900] border-t-transparent" />
              <span>Plotting route to spot…</span>
            </div>
          )}

          {/* Turn-by-Turn Navigation HUD (Phase C Requirement) */}
          {navRoute && navSpot && (
            <NavHud
              route={navRoute}
              spot={navSpot}
              journeyStatus={journeyStatus}
              hudState={hudState}
              travelMode={travelMode}
              onTravelModeChange={setTravelMode}
              onStart={handleStartJourney}
              onPause={handlePauseJourney}
              onResume={handleResumeJourney}
              onStop={handleStopJourney}
              onClose={handleClearNavigation}
              onRecenter={handleRecenter}
              voiceEnabled={voiceEnabled}
              onToggleVoice={() => setVoiceEnabled((v) => !v)}
              isLiveTracking={isLiveTracking}
              onToggleLiveTracking={handleToggleLiveTracking}
              currentSpeed={simulatedSpeed}
              playbackSpeed={playbackSpeed}
              onToggleSpeed={handleToggleSpeed}
              userLabel={userLabel}
              onOpenOriginPicker={() => setOriginMenuOpen((o) => !o)}
              onReserve={() => navigate(`/listing/${navSpot.id}`)}
              googleMapsUrl={googleMapsDirectionsUrl}
              geoStatus={geoStatus}
              onDismissGeoStatus={() => setGeoStatus({ state: 'idle', message: null })}
              onSetStartOnMap={() => setSettingStartOnMap((s) => !s)}
              settingStartOnMap={settingStartOnMap}
            />
          )}

          {/* Origin Starting Point Dropdown / Modal */}
          {originMenuOpen && (
            <div className="absolute top-20 left-4 z-[500] w-72 rounded-2xl border border-white/20 glass-panel-dark p-3 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-2">
              <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                  Select Starting Point
                </span>
                <button
                  type="button"
                  onClick={() => setOriginMenuOpen(false)}
                  className="grid size-5 place-items-center rounded-full text-gray-400 hover:text-white cursor-pointer"
                >
                  <Icon name="x" size={13} />
                </button>
              </div>

              {/* 1. 📍 My Current Location */}
              <button
                type="button"
                onClick={async () => {
                  setOriginMenuOpen(false)
                  await handleLocate()
                }}
                className={cn(
                  'w-full text-left rounded-xl p-2 text-[11.5px] font-bold transition-colors flex items-center justify-between cursor-pointer',
                  userLabel === 'My Location' ? 'bg-[#006341] text-white' : 'text-gray-200 hover:bg-white/10',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon name="locate" size={14} className="text-[#FFD900]" />
                  <span>📍 My current location</span>
                </div>
                {userAccuracy && (
                  <span className="text-[9.5px] font-mono text-[#FFD900]">±{Math.round(userAccuracy)}m</span>
                )}
              </button>

              {/* 2. 🗺️ Set Start On Map */}
              <button
                type="button"
                onClick={() => {
                  setOriginMenuOpen(false)
                  setSettingStartOnMap(true)
                  toast.push({
                    tone: 'info',
                    title: 'Set Start on Map',
                    message: 'Click anywhere on the map to set starting point.',
                  })
                }}
                className={cn(
                  'w-full text-left rounded-xl p-2 text-[11.5px] font-bold transition-colors flex items-center gap-2 cursor-pointer',
                  settingStartOnMap ? 'bg-[#006341] text-white' : 'text-gray-200 hover:bg-white/10',
                )}
              >
                <Icon name="pin" size={14} className="text-amber-400" />
                <span>🗺️ Set start point on map</span>
              </button>

              <div className="border-t border-gray-700/60 pt-1">
                <p className="px-1 text-[9.5px] font-bold uppercase text-gray-400">Gateway Presets:</p>
                {NASHIK_ENTRY_POINTS.map((pt) => {
                  const isSelected = userLabel === pt.shortName || userLabel === `${pt.shortName} (Preset)`
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => {
                        setOriginMenuOpen(false)
                        setUserCoords(pt.latlng)
                        setUserAccuracy(null)
                        setUserLabel(pt.shortName)
                        handleStartNavigation(navSpot, pt)
                      }}
                      className={cn(
                        'w-full text-left rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors flex items-center justify-between cursor-pointer',
                        isSelected ? 'bg-white/20 text-[#FFD900]' : 'text-gray-300 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <span>{pt.name}</span>
                      <span className="text-[9px] text-gray-400">Entry</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            LISTING PANE (LEFT FLOATING GLASS PANEL ON DESKTOP, w-[440px])
        ========================================================================= */}
        <section className="flex-1 flex min-h-0 flex-col lg:absolute lg:top-3 lg:bottom-3 lg:left-4 lg:w-[440px] lg:z-30 glass-panel rounded-t-3xl lg:rounded-3xl overflow-hidden shadow-2xl border border-white/70">
          {/* Top Search & Filter Header */}
          <div className="sticky top-0 z-[500] border-b border-[#17212B]/10 glass-panel-strong pt-safe">
            {/* Search Input Row with Inside Locate Icon & Single Filters Button */}
            <div className="flex items-center gap-2 px-3.5 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2 transition-all focus-within:border-[#006B4F] focus-within:ring-2 focus-within:ring-[#006B4F]/20 shadow-xs">
                <Icon name="search" size={15} className="shrink-0 text-[#006341]" />
                <input
                  value={filters.q}
                  onChange={(event) => {
                    patchFilters({ q: event.target.value })
                    setParams((current) => {
                      const next = new URLSearchParams(current)
                      if (event.target.value) next.set('q', event.target.value)
                      else next.delete('q')
                      return next
                    })
                  }}
                  placeholder="Where are you headed? (e.g. Ramkund, Panchavati...)"
                  className="min-w-0 flex-1 bg-transparent text-[13.5px] font-bold text-[#111B27] placeholder:text-[#6B6B6B]/70 focus:outline-none"
                />
                {filters.q && (
                  <button
                    type="button"
                    onClick={() => patchFilters({ q: '' })}
                    aria-label="Clear search"
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[#6B6B6B] hover:bg-[#F2EDE4]"
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}

                {/* Integrated Locate Me Button inside Search Field */}
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={geoLoading || geoStatus.state === 'locating'}
                  aria-label="Use my location"
                  title={geoStatus.state === 'locating' ? 'Locating…' : 'Use my current location'}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-[#006341] hover:bg-[#F2EDE4] transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {geoLoading || geoStatus.state === 'locating' ? (
                    <span className="size-3.5 animate-spin rounded-full border-2 border-[#006341] border-t-transparent" />
                  ) : (
                    <Icon name="locate" size={15} />
                  )}
                </button>
              </div>

              {/* Single Consistent Filters Button */}
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-label="Open Filters"
                className="flex items-center gap-1.5 rounded-xl bg-white border border-[#E8E1D6] px-3 py-2 text-[12px] font-bold text-[#292C2B] hover:bg-[#F2EDE4] transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <Icon name="sliders" size={14} className="text-[#006341]" />
                <span>Filters</span>
                {activeCount > 0 && (
                  <span className="grid size-4.5 place-items-center rounded-full bg-[#006341] text-[9.5px] font-mono font-black text-white">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>

            {/* Single Row of Compact Horizontally Scrollable Filter Chips */}
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3.5 pb-2.5">
              {filters.originLabel && (
                <Chip
                  active
                  onClick={() => patchFilters({ origin: null, originLabel: null })}
                  icon={<Icon name="locate" size={12} />}
                  className="font-bold text-[11.5px] py-1.5 px-3 rounded-lg transition-all bg-[#006341] border-[#006341] text-white cursor-pointer"
                >
                  <span>{filters.originLabel}</span>
                  <Icon name="x" size={12} className="ml-1 shrink-0" />
                </Chip>
              )}

              {QUICK_FILTERS.map((item) => {
                let active = false
                if (item.id === 'within1km') active = filters.radiusKm === 1
                else if (item.id === 'under20') active = filters.maxPrice === 20 && filters.minPrice == null
                else if (item.id === '20to40') active = filters.minPrice === 20 && filters.maxPrice === 40
                else if (item.id === 'above40') active = filters.minPrice === 40 && filters.maxPrice == null
                else if (item.id === 'instant') active = Boolean(filters.instant)
                else if (item.id === 'onlyAvailable') active = Boolean(filters.onlyAvailable)
                else if (item.id === 'openNow') active = Boolean(filters.openNow)

                return (
                  <Chip
                    key={item.id}
                    active={active}
                    onClick={() => toggleQuick(item.id)}
                    className={cn(
                      'font-bold text-[11.5px] py-1.5 px-3 rounded-lg transition-all cursor-pointer shrink-0',
                      active
                        ? 'bg-[#006341] border-[#006341] text-white shadow-xs'
                        : 'bg-white border-[#E2DDD3] text-[#292C2B] hover:border-[#006341]',
                    )}
                  >
                    {item.label}
                  </Chip>
                )
              })}
            </div>
          </div>

          {/* Small Result Count + Sector Line */}
          <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#E2DDD3] bg-[#F7F3EA] text-[11px] font-bold text-[#292C2B]">
            <span>
              {loading
                ? 'Searching spots…'
                : `${spots?.length ?? 0} parking spots · ${zoneLabel} · Kumbh 2027`}
            </span>
          </div>

          {/* Compact List of Distinct Sthaanam Parking Signs */}
          <div
            onMouseLeave={() => setHoveredId(null)}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 pb-24 lg:pb-8"
          >
            {filters.radiusKm === 1 && spots?.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-[#006341]/10 border border-[#006341]/30 p-2.5 text-[#006341] text-[12px] font-bold shadow-2xs">
                <Icon name="navigation" size={15} className="shrink-0 text-[#006341]" />
                <span className="flex-1">
                  <strong>1 km Smart Radius Active</strong> — Spots within ~12 min walk.
                </span>
                <button
                  type="button"
                  onClick={() => patchFilters({ radiusKm: null })}
                  className="text-[11px] font-bold text-[#006341] underline hover:opacity-80 cursor-pointer"
                >
                  Show All
                </button>
              </div>
            )}

            {loading && (
              <>
                {[0, 1, 2, 3, 4].map((key) => (
                  <ParkingCardSkeleton key={key} />
                ))}
              </>
            )}

            {error && <ErrorState message={error.friendlyMessage} onRetry={reload} />}

            {!loading && !error && spots?.length === 0 && (
              <div className="space-y-4">
                {fallback1kmCount != null && fallback1kmCount > 0 ? (
                  <div className="rounded-2xl border-2 border-[#E9A83A] bg-[#FFFBEB] p-4 text-center space-y-3 shadow-sm">
                    <div className="inline-flex size-11 items-center justify-center rounded-full bg-[#E9A83A]/20 text-[#D97706] font-bold">
                      <Icon name="navigation" size={22} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black text-[#17212B] font-heading">
                        1 km Smart Radius Suggestion Available!
                      </h4>
                      <p className="text-[12.5px] text-[#6B6B6B] mt-1 leading-snug">
                        No exact match for your strict filter criteria, but we found{' '}
                        <strong className="text-[#006341] font-mono">
                          {fallback1kmCount} verified spot{fallback1kmCount > 1 ? 's' : ''}
                        </strong>{' '}
                        within a <strong>1 km radius (~12 min walk)</strong>.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          patchFilters({ radiusKm: 1, features: [], maxPrice: null })
                          toast.push({
                            tone: 'success',
                            title: '1 km Radius Applied',
                            message: `Showing ${fallback1kmCount} spot(s) within 1 km radius.`,
                          })
                        }}
                        className="bg-[#006341] hover:bg-[#004e33] text-white font-bold cursor-pointer"
                      >
                        Show {fallback1kmCount} Spot{fallback1kmCount > 1 ? 's' : ''} Within 1 km
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          patchFilters({
                            features: [],
                            onlyAvailable: false,
                            instant: false,
                            maxPrice: null,
                            minPrice: null,
                            radiusKm: null,
                          })
                        }
                        className="cursor-pointer"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon="pin"
                    title="No spaces match"
                    message="No parking spots match your current filter settings. Try clearing active filters or exploring a wider search radius."
                    action={
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          onClick={() =>
                            patchFilters({
                              features: [],
                              onlyAvailable: false,
                              instant: false,
                              maxPrice: null,
                              minPrice: null,
                              radiusKm: null,
                            })
                          }
                          className="bg-[#006341] hover:bg-[#004e33] text-white font-bold cursor-pointer"
                        >
                          Clear filters
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            patchFilters({ radiusKm: 1, features: [], maxPrice: null })
                            toast.push({
                              tone: 'info',
                              title: '1 km Radius Activated',
                              message: 'Searching for parking spots within 1 km radius.',
                            })
                          }}
                          className="text-[#006341] font-bold cursor-pointer"
                        >
                          Try 1 km Radius
                        </Button>
                      </div>
                    }
                  />
                )}
              </div>
            )}

            {(spots ?? []).map((spot, index) => (
              <div
                key={spot.id}
                ref={(node) => {
                  if (node) cardRefs.current.set(spot.id, node)
                  else cardRefs.current.delete(spot.id)
                }}
              >
                <ParkingCard
                  spot={spot}
                  plan={filters.plan}
                  selected={effectiveSelectedId === spot.id}
                  index={index}
                  animate={stagger}
                  originLabel={filters.originLabel}
                  onSelect={() => onMarkerSelect(spot)}
                  onHover={() => setHoveredId(spot.id)}
                  onNavigate={handleStartNavigation}
                />
              </div>
            ))}

            {!loading && spots?.length > 0 && (
              <p className="py-6 text-center text-[12px] text-[#6B6B6B]">
                You have reached the end of verified spots for this sector.{' '}
                <button
                  type="button"
                  className="font-bold text-[#006341] hover:underline ml-1 cursor-pointer"
                  onClick={() => navigate('/host/new')}
                >
                  List your compound?
                </button>
              </p>
            )}
          </div>
        </section>
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        resultCount={spots?.length ?? 0}
        zones={zones ?? []}
        sort={filters.sort}
        onSort={handleSort}
      />
    </PageShell>
  )
}
