import { haversineKm, walkMinutes } from './geo.js'
export { haversineKm, walkMinutes }

/**
 * Well-known transit entry points for Kumbh Mela pilgrims arriving in Nashik
 * Useful for demo/testing or fallback when browser GPS is denied.
 */
export const NASHIK_ENTRY_POINTS = [
  {
    id: 'station',
    name: 'Nashik Road Railway Station',
    shortName: 'Nashik Rd Station',
    latlng: [19.9535, 73.8344],
    description: 'Central train terminus for incoming pilgrims',
  },
  {
    id: 'dwarka',
    name: 'Dwarka Circle (Highway Entry)',
    shortName: 'Dwarka Circle',
    latlng: [19.9880, 73.7990],
    description: 'Mumbai-Agra Highway (NH3) intersection',
  },
  {
    id: 'cbs',
    name: 'CBS Central Bus Stand',
    shortName: 'CBS Bus Stand',
    latlng: [20.0012, 73.7845],
    description: 'State transport & interstate bus depot',
  },
]

/**
 * Normalizes any coordinate representation into consistent lat/lng objects.
 * Handles [lat, lng], [lng, lat], { lat, lng }, { latitude, longitude }, or objects with latlng property.
 */
export function normalizeCoords(input) {
  if (!input) return null

  // If object has latlng array or property
  if (input.latlng) return normalizeCoords(input.latlng)

  let lat = null
  let lng = null

  if (Array.isArray(input)) {
    const c0 = Number(input[0])
    const c1 = Number(input[1])
    if (isNaN(c0) || isNaN(c1)) return null

    // For coordinates in India / Nashik:
    // Longitude is ~72°–78°E, Latitude is ~18°–22°N
    if (c0 > 50 && c1 < 40) {
      // [lng, lat]
      lng = c0
      lat = c1
    } else if (c0 < 40 && c1 > 50) {
      // [lat, lng]
      lat = c0
      lng = c1
    } else {
      // Fallback: check if first looks like latitude (-90..90)
      lat = c0
      lng = c1
    }
  } else if (typeof input === 'object') {
    lat = Number(input.lat ?? input.latitude)
    lng = Number(input.lng ?? input.longitude)
    if (isNaN(lat) || isNaN(lng)) return null
  }

  if (lat == null || lng == null) return null

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    latLng: [Number(lat.toFixed(6)), Number(lng.toFixed(6))],
    lngLat: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
  }
}

/**
 * Generates an official universal Google Maps navigation URL.
 * Automatically opens in Google Maps App (iOS/Android) or Google Maps Web.
 */
export function formatGoogleMapsUrl(origin, destination, travelmode = 'driving') {
  const orig = normalizeCoords(origin)
  const dest = normalizeCoords(destination)
  if (!dest) return ''

  const destStr = `${dest.lat},${dest.lng}`
  if (!orig) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destStr}&travelmode=${travelmode}`
  }
  const origStr = `${orig.lat},${orig.lng}`
  return `https://www.google.com/maps/dir/?api=1&origin=${origStr}&destination=${destStr}&travelmode=${travelmode}`
}

/**
 * Converts degrees bearing into general compass direction string.
 */
export function getCompassDirection(bearing) {
  if (bearing == null) return 'north'
  const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
  const index = Math.round(((bearing % 360) + 360) % 360 / 45) % 8
  return directions[index]
}

/**
 * Maps OSRM maneuver type/modifier to clean UI icon name.
 */
export function getManeuverIcon(type = 'straight', modifier = '') {
  const mod = String(modifier).toLowerCase()
  const t = String(type).toLowerCase()

  if (t === 'arrive') return 'arrive'
  if (t === 'roundabout' || t === 'rotary') return 'roundabout'

  if (mod.includes('u-turn') || mod.includes('uturn')) return 'uturn'
  if (mod.includes('sharp left')) return 'sharpLeft'
  if (mod.includes('sharp right')) return 'sharpRight'
  if (mod.includes('slight left')) return 'slightLeft'
  if (mod.includes('slight right')) return 'slightRight'
  if (mod.includes('left')) return 'turnLeft'
  if (mod.includes('right')) return 'turnRight'

  return 'straight'
}

/**
 * Formats a maneuver into clear turn-by-turn guidance.
 */
function formatStepInstruction(maneuver, streetName, destinationName, isLast = false) {
  if (isLast || maneuver?.type === 'arrive') {
    return `Arrive at ${destinationName || 'destination'}`
  }

  const type = maneuver?.type || 'turn'
  const modifier = maneuver?.modifier || ''
  const street = streetName && streetName !== 'unnamed road' ? streetName : null

  if (type === 'depart') {
    return street ? `Head on ${street}` : 'Head towards destination'
  }

  if (type === 'roundabout' || type === 'rotary') {
    const exit = maneuver.exit ? `take exit ${maneuver.exit}` : 'take exit'
    return street ? `At roundabout, ${exit} onto ${street}` : `At roundabout, ${exit}`
  }

  if (modifier.includes('u-turn') || modifier.includes('uturn')) {
    return street ? `Make a U-turn onto ${street}` : 'Make a U-turn'
  }

  if (modifier.includes('sharp left')) {
    return street ? `Sharp left onto ${street}` : 'Sharp left'
  }

  if (modifier.includes('sharp right')) {
    return street ? `Sharp right onto ${street}` : 'Sharp right'
  }

  if (modifier.includes('slight left')) {
    return street ? `Bear slight left onto ${street}` : 'Slight left'
  }

  if (modifier.includes('slight right')) {
    return street ? `Bear slight right onto ${street}` : 'Slight right'
  }

  if (modifier.includes('left')) {
    return street ? `Turn left onto ${street}` : 'Turn left'
  }

  if (modifier.includes('right')) {
    return street ? `Turn right onto ${street}` : 'Turn right'
  }

  if (type === 'fork') {
    return street ? `Keep ${modifier || 'right'} at the fork onto ${street}` : `Keep ${modifier || 'right'} at fork`
  }

  if (type === 'merge') {
    return street ? `Merge onto ${street}` : 'Merge ahead'
  }

  return street ? `Continue onto ${street}` : 'Continue straight'
}

/**
 * Finds index of the coordinate in routeCoordinates that is closest to target [lng, lat].
 */
function findClosestCoordIndex(coordinates, target) {
  if (!coordinates || !target || coordinates.length === 0) return 0
  const [tLng, tLat] = target
  let bestIdx = 0
  let minDist = Infinity
  for (let i = 0; i < coordinates.length; i++) {
    const [cLng, cLat] = coordinates[i]
    const d = Math.hypot(cLng - tLng, cLat - tLat)
    if (d < minDist) {
      minDist = d
      bestIdx = i
    }
  }
  return bestIdx
}

/**
 * Normalizes OSRM raw steps into a consistent array for the navigation HUD.
 */
function normalizeOsrmSteps(rawSteps, routeCoordinates, destinationName) {
  if (!rawSteps || rawSteps.length === 0) return []

  return rawSteps.map((s, idx) => {
    const isLast = idx === rawSteps.length - 1
    const maneuver = s.maneuver || {}
    const loc = maneuver.location || [0, 0]
    const rawName = s.name ? s.name.trim() : ''
    const ref = s.ref ? ` (${s.ref.trim()})` : ''
    const streetName = rawName ? `${rawName}${ref}` : (isLast ? destinationName : 'road')
    const instruction = formatStepInstruction(maneuver, rawName, destinationName, isLast)
    const iconName = getManeuverIcon(maneuver.type, maneuver.modifier)
    const distanceMeters = Math.round(s.distance || 0)
    const durationSeconds = Math.round(s.duration || 0)
    const pathStartIndex = findClosestCoordIndex(routeCoordinates, loc)

    return {
      index: idx,
      type: maneuver.type || 'turn',
      modifier: maneuver.modifier || 'straight',
      streetName,
      instruction,
      iconName,
      distanceMeters,
      durationSeconds,
      location: loc,
      pathStartIndex,
    }
  })
}

/**
 * Generates synthetic realistic steps along an interpolated route.
 */
function generateFallbackSteps(routeCoordinates, destinationName) {
  if (!routeCoordinates || routeCoordinates.length < 2) return []

  const len = routeCoordinates.length
  const q1 = Math.floor(len * 0.25)
  const q2 = Math.floor(len * 0.6)
  const qEnd = len - 1

  return [
    {
      index: 0,
      type: 'depart',
      modifier: 'straight',
      streetName: 'Pilgrim Corridor',
      instruction: 'Head towards Kumbh Sector',
      iconName: 'straight',
      distanceMeters: 450,
      durationSeconds: 60,
      location: routeCoordinates[0],
      pathStartIndex: 0,
    },
    {
      index: 1,
      type: 'turn',
      modifier: 'right',
      streetName: 'Nashik Highway Link Rd',
      instruction: 'Turn right onto Nashik Highway Link Rd',
      iconName: 'turnRight',
      distanceMeters: 1200,
      durationSeconds: 150,
      location: routeCoordinates[q1],
      pathStartIndex: q1,
    },
    {
      index: 2,
      type: 'turn',
      modifier: 'left',
      streetName: 'Ghat Approach Marg',
      instruction: 'Turn left onto Ghat Approach Marg',
      iconName: 'turnLeft',
      distanceMeters: 850,
      durationSeconds: 110,
      location: routeCoordinates[q2],
      pathStartIndex: q2,
    },
    {
      index: 3,
      type: 'arrive',
      modifier: 'straight',
      streetName: destinationName,
      instruction: `Arrive at ${destinationName}`,
      iconName: 'arrive',
      distanceMeters: 0,
      durationSeconds: 0,
      location: routeCoordinates[qEnd],
      pathStartIndex: qEnd,
    },
  ]
}

/**
 * Generates a smooth, realistic multi-segment road-like polyline connecting origin and dest.
 * Used as an instant fallback when routing services are unreachable or offline.
 */
function generateFallbackPolyline(orig, dest) {
  const points = []
  const [oLng, oLat] = orig.lngLat
  const [dLng, dLat] = dest.lngLat

  points.push([oLng, oLat])

  // High-resolution curved intermediate road waypoints
  const steps = 24
  const dx = dLng - oLng
  const dy = dLat - oLat

  // Perpendicular deviation vector to simulate natural city road curvature
  const perpX = -dy * 0.15
  const perpY = dx * 0.15

  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const bend = Math.sin(t * Math.PI)
    const factor = Math.sin(t * Math.PI * 3) * 0.4 + 0.6
    const lng = oLng + dx * t + perpX * bend * factor
    const lat = oLat + dy * t + perpY * bend * factor
    points.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))])
  }

  points.push([dLng, dLat])
  return points
}

/**
 * Calculates cumulative meters along each segment of the polyline.
 */
export function computePolylineMetrics(coordinates) {
  if (!coordinates || coordinates.length < 2) {
    return { totalMeters: 0, cumulativeMeters: [0], segmentMeters: [0] }
  }

  const segmentMeters = []
  const cumulativeMeters = [0]
  let total = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i]
    const [lng2, lat2] = coordinates[i + 1]
    const km = haversineKm([lat1, lng1], [lat2, lng2])
    const meters = km * 1000
    segmentMeters.push(meters)
    total += meters
    cumulativeMeters.push(total)
  }

  return { totalMeters: total, cumulativeMeters, segmentMeters }
}

/**
 * Fetches driving route between origin and destination with step-by-step turn data.
 */
export async function calculateRoute({ origin, destination, originName = 'Your Location', destinationName = 'Parking Spot' }) {
  const orig = normalizeCoords(origin)
  const dest = normalizeCoords(destination)

  if (!orig || !dest) {
    throw new Error('Valid origin and destination coordinates are required')
  }

  const straightLineKm = haversineKm(orig.latLng, dest.latLng)
  let routeCoordinates = null
  let rawSteps = null
  let distanceKm = null
  let durationSeconds = null
  let isEstimated = false

  // Try real road routing via OSRM with steps=true and 3.5-second timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const url = `https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0]
        if (primary.geometry?.coordinates?.length > 1) {
          routeCoordinates = primary.geometry.coordinates
          distanceKm = Number((primary.distance / 1000).toFixed(1))
          durationSeconds = primary.duration
          if (primary.legs?.[0]?.steps?.length > 0) {
            rawSteps = primary.legs[0].steps
          }
        }
      }
    }
  } catch {
    isEstimated = true
  }

  // Fallback if network failed or OSRM had no route
  if (!routeCoordinates || !routeCoordinates.length) {
    isEstimated = true
    routeCoordinates = generateFallbackPolyline(orig, dest)
    distanceKm = Number((straightLineKm * 1.25).toFixed(1))
    const drivingMins = Math.max(2, Math.round((distanceKm / 28) * 60 + 2))
    durationSeconds = drivingMins * 60
  }

  // Normalize turn-by-turn steps
  const steps =
    rawSteps && rawSteps.length > 0
      ? normalizeOsrmSteps(rawSteps, routeCoordinates, destinationName)
      : generateFallbackSteps(routeCoordinates, destinationName)

  const drivingMinutes = Math.max(1, Math.round(durationSeconds / 60))
  const walkingMinutes = walkMinutes(distanceKm) ?? Math.max(2, Math.round((distanceKm / 4.5) * 60))
  const metrics = computePolylineMetrics(routeCoordinates)

  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: routeCoordinates,
    },
    properties: {
      distanceKm,
      drivingMinutes,
      walkingMinutes,
      originName,
      destinationName,
      isEstimated,
    },
  }

  return {
    success: true,
    distanceKm,
    distanceLabel: `${distanceKm.toFixed(1)} km`,
    totalDistanceMeters: Math.round(distanceKm * 1000),
    drivingMinutes,
    drivingLabel: `${drivingMinutes} min drive`,
    durationSeconds: Math.round(durationSeconds),
    walkingMinutes,
    walkingLabel: `${walkingMinutes} min walk`,
    origin: {
      lat: orig.lat,
      lng: orig.lng,
      latLng: orig.latLng,
      lngLat: orig.lngLat,
      name: originName,
    },
    destination: {
      lat: dest.lat,
      lng: dest.lng,
      latLng: dest.latLng,
      lngLat: dest.lngLat,
      name: destinationName,
    },
    routeCoordinates,
    steps,
    metrics,
    geojson,
    isEstimated,
    googleMapsUrl: formatGoogleMapsUrl(orig, dest, 'driving'),
    googleMapsWalkUrl: formatGoogleMapsUrl(orig, dest, 'walking'),
  }
}

/**
 * Calculate forward bearing between two geographic coordinates in degrees (0..360, 0 = North).
 */
function calculateBearing(lng1, lat1, lng2, lat2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  return (brng + 360) % 360
}

/**
 * Interpolates coordinate position along polyline at a given distance in meters.
 */
function getCoordAtDistance(coordinates, cumulativeMeters, targetDist) {
  if (targetDist <= 0) return coordinates[0]
  const total = cumulativeMeters[cumulativeMeters.length - 1]
  if (targetDist >= total) return coordinates[coordinates.length - 1]

  for (let i = 0; i < cumulativeMeters.length - 1; i++) {
    const startM = cumulativeMeters[i]
    const endM = cumulativeMeters[i + 1]
    if (targetDist >= startM && targetDist <= endM) {
      const segLen = endM - startM
      const t = segLen > 0 ? (targetDist - startM) / segLen : 0
      const [x1, y1] = coordinates[i]
      const [x2, y2] = coordinates[i + 1]
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]
    }
  }
  return coordinates[coordinates.length - 1]
}

/**
 * Calculates the interpolated point, smoothed heading angle, traveled trail,
 * and remaining route along a GeoJSON coordinates array at a given progress (0 to 1).
 * Uses precomputed cumulative metric distances and a ~25m lookahead for corner smoothing.
 */
export function getPointAlongPolyline(coordinates, progress = 0, precomputedMetrics = null) {
  if (!coordinates || coordinates.length < 2) return null
  const p = Math.max(0, Math.min(1, progress))

  const metrics = precomputedMetrics || computePolylineMetrics(coordinates)
  const { totalMeters, cumulativeMeters } = metrics

  if (totalMeters === 0) {
    return {
      lng: coordinates[0][0],
      lat: coordinates[0][1],
      angle: 0,
      traveledCoords: coordinates,
      remainingCoords: coordinates,
      distMeters: 0,
      totalMeters: 0,
    }
  }

  const targetDist = p * totalMeters

  // Find active segment
  let segIndex = 0
  let segT = 0
  for (let i = 0; i < cumulativeMeters.length - 1; i++) {
    const startM = cumulativeMeters[i]
    const endM = cumulativeMeters[i + 1]
    if (targetDist >= startM && targetDist <= endM) {
      segIndex = i
      const segLen = endM - startM
      segT = segLen > 0 ? (targetDist - startM) / segLen : 0
      break
    }
    if (i === cumulativeMeters.length - 2) {
      segIndex = i
      segT = 1
    }
  }

  const [x1, y1] = coordinates[segIndex]
  const [x2, y2] = coordinates[segIndex + 1]
  const curLng = x1 + (x2 - x1) * segT
  const curLat = y1 + (y2 - y1) * segT

  // Smoothed heading: look ahead ~25 meters along the route so corners transition gently
  const lookaheadDist = Math.min(totalMeters, targetDist + 25)
  let angle = 0
  if (lookaheadDist > targetDist + 1) {
    const [aheadLng, aheadLat] = getCoordAtDistance(coordinates, cumulativeMeters, lookaheadDist)
    angle = calculateBearing(curLng, curLat, aheadLng, aheadLat)
  } else {
    // Near the end: use the bearing of the final segment
    angle = calculateBearing(x1, y1, x2, y2)
  }

  // Traveled polyline slice: up to segIndex, plus current interpolated point
  const traveledCoords = coordinates.slice(0, segIndex + 1)
  traveledCoords.push([curLng, curLat])

  const remainingCoords = [[curLng, curLat], ...coordinates.slice(segIndex + 1)]

  return {
    lng: Number(curLng.toFixed(6)),
    lat: Number(curLat.toFixed(6)),
    angle: Math.round((angle + 360) % 360),
    segIndex,
    traveledCoords,
    remainingCoords,
    distMeters: Math.round(targetDist),
    totalMeters: Math.round(totalMeters),
  }
}

/**
 * Single source of truth for journey HUD state derived from progressRatio (0 to 1).
 */
export function calculateJourneyHudState(route, progressRatio = 0) {
  if (!route || !route.routeCoordinates || route.routeCoordinates.length < 2) {
    return null
  }

  const p = Math.max(0, Math.min(1, progressRatio))
  const totalMeters = route.totalDistanceMeters || Math.round((route.distanceKm || 5) * 1000)
  const totalSecs = route.durationSeconds || Math.round((route.drivingMinutes || 10) * 60)

  const currentDistMeters = Math.round(p * totalMeters)
  const remainingMeters = Math.max(0, totalMeters - currentDistMeters)
  const remainingSecs = Math.max(0, Math.round(totalSecs * (1 - p)))

  // Calculate ETA clock time string
  const now = new Date()
  const etaDate = new Date(now.getTime() + remainingSecs * 1000)
  const hours = etaDate.getHours()
  const minutes = String(etaDate.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const etaClock = `${displayHours}:${minutes} ${ampm}`

  // Format remaining distance
  const remainingDistLabel = remainingMeters >= 1000
    ? `${(remainingMeters / 1000).toFixed(1)} km`
    : `${remainingMeters} m`

  const remainingTimeLabel = remainingSecs >= 60
    ? `${Math.max(1, Math.round(remainingSecs / 60))} min`
    : `${remainingSecs} sec`

  // Current interpolated position
  const pt = getPointAlongPolyline(route.routeCoordinates, p)

  // Map to steps
  const steps = route.steps || []
  let activeStepIdx = 0
  let nextStepIdx = 0

  if (steps.length > 0) {
    // Find step corresponding to current coord index
    const curCoordIdx = pt?.segIndex || 0
    for (let i = 0; i < steps.length; i++) {
      if (curCoordIdx >= steps[i].pathStartIndex) {
        activeStepIdx = i
      } else {
        break
      }
    }
    nextStepIdx = Math.min(steps.length - 1, activeStepIdx + 1)
  }

  const activeStep = steps[activeStepIdx] || null
  const nextStep = steps[nextStepIdx] || activeStep

  // Distance to next maneuver
  let distToNextManeuver = 0
  if (route.metrics?.cumulativeMeters && nextStep) {
    const nextCoordIdx = Math.min(
      route.metrics.cumulativeMeters.length - 1,
      nextStep.pathStartIndex,
    )
    const targetMeters = route.metrics.cumulativeMeters[nextCoordIdx] || 0
    distToNextManeuver = Math.max(0, Math.round(targetMeters - currentDistMeters))
  } else if (nextStep) {
    distToNextManeuver = Math.max(0, Math.round((nextStep.distanceMeters || 300) * (1 - (p % 0.25) * 4)))
  }

  const nextDistLabel = distToNextManeuver >= 1000
    ? `${(distToNextManeuver / 1000).toFixed(1)} km`
    : `${distToNextManeuver} m`

  // Then step (the one after next) when within 500m
  const thenStep = distToNextManeuver <= 500 && nextStepIdx + 1 < steps.length
    ? steps[nextStepIdx + 1]
    : null

  return {
    progressRatio: p,
    currentDistMeters,
    remainingMeters,
    remainingDistLabel,
    remainingSecs,
    remainingTimeLabel,
    etaClock,
    pt,
    activeStep,
    nextStep,
    thenStep,
    distToNextManeuver,
    nextDistLabel,
    isArrived: p >= 0.99,
  }
}
