import { haversineKm } from '@/lib/geo'

export const NASHIK_LANDMARKS = [
  // GHATS & PILGRIMAGE
  {
    id: 'ramkund',
    name: 'Ramkund',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Godavari Ghat • Panchavati',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [19.9992, 73.7915],
  },
  {
    id: 'panchavati',
    name: 'Panchavati',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Panchavati Zone',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [20.004, 73.796],
  },
  {
    id: 'tapovan',
    name: 'Tapovan',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Godavari Bank • Tapovan',
    zone: 'Tapovan',
    city: 'Nashik',
    latlng: [19.9985, 73.8105],
  },
  {
    id: 'godavari-ghat',
    name: 'Godavari Ghat',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Main Ghat Area • Panchavati',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [19.9995, 73.792],
  },
  {
    id: 'kalaram-temple',
    name: 'Kalaram Temple',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Panchavati Area',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [20.0035, 73.7938],
  },
  {
    id: 'sita-gufa',
    name: 'Sita Gufa',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Near Kalaram Temple',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [20.0038, 73.7942],
  },
  {
    id: 'kapaleshwar-temple',
    name: 'Kapaleshwar Temple',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Ramkund Area',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [20.0005, 73.7912],
  },
  {
    id: 'sundarnarayan-temple',
    name: 'Sundarnarayan Temple',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Near Ahilyabai Holkar Bridge',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [19.9982, 73.7905],
  },
  {
    id: 'naroshankar-temple',
    name: 'Naroshankar Temple',
    category: 'GHATS & PILGRIMAGE',
    subtitle: 'Godavari Ghats',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [19.9978, 73.7928],
  },

  // KUMBH / MAJOR EVENT AREAS
  {
    id: 'sadhugram',
    name: 'Sadhugram',
    category: 'KUMBH / MAJOR EVENT AREAS',
    subtitle: 'Tapovan Camp Grounds',
    zone: 'Tapovan',
    city: 'Nashik',
    latlng: [19.9975, 73.815],
  },
  {
    id: 'kumbh-mela-ground',
    name: 'Kumbh Mela Ground',
    category: 'KUMBH / MAJOR EVENT AREAS',
    subtitle: 'Tapovan - Sadhugram Axis',
    zone: 'Tapovan',
    city: 'Nashik',
    latlng: [19.996, 73.818],
  },
  {
    id: 'trimbakeshwar',
    name: 'Trimbakeshwar',
    category: 'KUMBH / MAJOR EVENT AREAS',
    subtitle: 'Trimbak Town & Temple Zone',
    zone: 'Trimbakeshwar',
    city: 'Nashik',
    latlng: [19.932, 73.53],
  },
  {
    id: 'trimbakeshwar-temple',
    name: 'Trimbakeshwar Temple',
    category: 'KUMBH / MAJOR EVENT AREAS',
    subtitle: 'Jyotirlinga Temple Complex',
    zone: 'Trimbakeshwar',
    city: 'Nashik',
    latlng: [19.9325, 73.5308],
  },
  {
    id: 'trimbakeshwar-jyotirlinga',
    name: 'Trimbakeshwar Jyotirlinga',
    category: 'KUMBH / MAJOR EVENT AREAS',
    subtitle: 'Main Pilgrimage Site',
    zone: 'Trimbakeshwar',
    city: 'Nashik',
    latlng: [19.9326, 73.531],
  },

  // TRANSPORT
  {
    id: 'nashik-road-railway-station',
    name: 'Nashik Road Railway Station',
    category: 'TRANSPORT',
    subtitle: 'Central Railway Junction',
    zone: 'Nashik Road',
    city: 'Nashik',
    latlng: [19.9525, 73.8342],
  },
  {
    id: 'cbs-nashik',
    name: 'CBS Nashik',
    category: 'TRANSPORT',
    subtitle: 'Central Bus Stand • Old City',
    zone: 'CBS',
    city: 'Nashik',
    latlng: [19.9935, 73.7845],
  },
  {
    id: 'panchavati-bus-stand',
    name: 'Panchavati Bus Stand',
    category: 'TRANSPORT',
    subtitle: 'Panchavati Depot',
    zone: 'Panchavati',
    city: 'Nashik',
    latlng: [20.006, 73.7965],
  },
  {
    id: 'nashik-central-bus-stand',
    name: 'Nashik Central Bus Stand',
    category: 'TRANSPORT',
    subtitle: 'Thakkar Bazaar / CBS',
    zone: 'CBS',
    city: 'Nashik',
    latlng: [19.993, 73.784],
  },
  {
    id: 'mumbai-naka',
    name: 'Mumbai Naka',
    category: 'TRANSPORT',
    subtitle: 'Major Highway Transit Junction',
    zone: 'Mumbai Naka',
    city: 'Nashik',
    latlng: [19.9805, 73.781],
  },

  // CITY LANDMARKS
  {
    id: 'college-road',
    name: 'College Road',
    category: 'CITY LANDMARKS',
    subtitle: 'Commercial & Student Hub',
    zone: 'College Road',
    city: 'Nashik',
    latlng: [20.002, 73.765],
  },
  {
    id: 'gangapur-road',
    name: 'Gangapur Road',
    category: 'CITY LANDMARKS',
    subtitle: 'Western Residential Corridor',
    zone: 'Gangapur Road',
    city: 'Nashik',
    latlng: [20.012, 73.758],
  },
  {
    id: 'canada-corner',
    name: 'Canada Corner',
    category: 'CITY LANDMARKS',
    subtitle: 'Sharanpur Road Junction',
    zone: 'City Center',
    city: 'Nashik',
    latlng: [19.995, 73.774],
  },
  {
    id: 'shalimar',
    name: 'Shalimar',
    category: 'CITY LANDMARKS',
    subtitle: 'Old City Shopping Hub',
    zone: 'Old Nashik',
    city: 'Nashik',
    latlng: [19.9915, 73.7865],
  },
  {
    id: 'dwarka',
    name: 'Dwarka',
    category: 'CITY LANDMARKS',
    subtitle: 'Dwarka Circle • Highway Junction',
    zone: 'Dwarka',
    city: 'Nashik',
    latlng: [19.986, 73.796],
  },
  {
    id: 'indira-nagar',
    name: 'Indira Nagar',
    category: 'CITY LANDMARKS',
    subtitle: 'Southern Suburb',
    zone: 'Indira Nagar',
    city: 'Nashik',
    latlng: [19.965, 73.772],
  },
]

export const LANDMARK_CATEGORIES = [
  'GHATS & PILGRIMAGE',
  'KUMBH / MAJOR EVENT AREAS',
  'TRANSPORT',
  'CITY LANDMARKS',
]

/**
 * Finds the nearest landmark to given [lat, lng] coordinates and calculates distance.
 */
export function findNearestLandmark([lat, lng]) {
  if (lat == null || lng == null) return null

  let closest = null
  let minDistanceKm = Infinity

  for (const item of NASHIK_LANDMARKS) {
    if (!item.latlng) continue
    const distKm = haversineKm([lat, lng], item.latlng)
    if (distKm < minDistanceKm) {
      minDistanceKm = distKm
      closest = item
    }
  }

  if (!closest) return null

  const distanceMeters = Math.round(minDistanceKm * 1000)
  const distanceFormatted =
    minDistanceKm < 1
      ? `Approx. ${distanceMeters} m away`
      : `Approx. ${minDistanceKm.toFixed(1)} km away`

  return {
    ...closest,
    distanceKm: minDistanceKm,
    distanceMeters,
    distanceFormatted,
  }
}
