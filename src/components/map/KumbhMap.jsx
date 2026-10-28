import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  BASEMAPS,
  OSM_STYLE,
  CAVEAT,
  DEFAULT_ACTIVE_LAYER_IDS,
  LAYERS,
  LAYER_INFO,
  VERIFIED,
  featureName,
  loadGeoJson,
} from '@/map/nashikMonitorData'
import { cn } from '@/lib/cn'
import Icon from '@/components/ui/Icon'
import MapLayerToggle from '@/components/map/MapLayerToggle'
import { SpaceTypeIcon } from '@/components/parking/SpaceTypeIcon'
import { getSpaceType } from '@/lib/spaceTypes'

const NASHIK_CENTER_LNG_LAT = [73.7898, 19.9975]
const TERRAIN_SOURCE = 'nm-terrain-dem'
const HILLSHADE_LAYER = 'nm-terrain-hillshade'

function createCircleGeoJson(centerLngLat, radiusMeters, points = 48) {
  if (!centerLngLat || !radiusMeters || radiusMeters <= 0) return null
  const [lng, lat] = centerLngLat
  const coords = []
  const km = radiusMeters / 1000
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180))
  const distanceY = km / 110.574
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    coords.push([Number((lng + x).toFixed(6)), Number((lat + y).toFixed(6))])
  }
  coords.push(coords[0])
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}

const HIDDEN_POPUP_KEYS = new Set([
  'locationConfidence',
  'geocodeConfidence',
  'locationSource',
  'role',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'fill',
  'fill-opacity',
  'layer',
  'layerId',
])

function parseToLngLat(coords) {
  if (!coords) return NASHIK_CENTER_LNG_LAT
  if (Array.isArray(coords)) {
    const c0 = Number(coords[0])
    const c1 = Number(coords[1])
    if (isNaN(c0) || isNaN(c1)) return NASHIK_CENTER_LNG_LAT
    // If first element is > 50, it's longitude [lng, lat]
    if (c0 > 50) return [c0, c1]
    // Otherwise it's latitude [lat, lng] -> convert to [lng, lat]
    return [c1, c0]
  }
  if (coords.lng !== undefined && coords.lat !== undefined) {
    return [Number(coords.lng), Number(coords.lat)]
  }
  return NASHIK_CENTER_LNG_LAT
}

export default function KumbhMap({
  spots = [],
  center,
  zoom = 12,
  focus = null,
  selectedId = null,
  hoveredId = null,
  overlayIds = DEFAULT_ACTIVE_LAYER_IDS,
  onOverlayChange = null,
  onSelect,
  onMapClick,
  onReady,
  onViewportChange,
  interactive = true,
  className,
  onOpenLayers,
  route = null,
  userCoords = null,
  userAccuracy = null,
  userLabel = 'Your Location',
  onNavigate = null,
  journeyCar = null,
  traveledCoords = null,
  journeyStatus = 'idle',
  settingStartOnMap = false,
  onSetStartCoords = null,
  followLocation = true,
  onUserPan = null,
  walkingTarget = null,
  scrollZoomDisabledUntilFocus = false,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const popupRef = useRef(null)
  const spotMarkersRef = useRef(new Map())
  const userMarkerRef = useRef(null)
  const carMarkerRef = useRef(null)
  const startDotMarkerRef = useRef(null)
  const landmarkMarkerRef = useRef(null)
  const loadedSourcesRef = useRef(new Set())
  const activeNoticeRef = useRef(new Set())
  const handlersRef = useRef({
    onSelect,
    onMapClick,
    onReady,
    onViewportChange,
    settingStartOnMap,
    onSetStartCoords,
    onUserPan,
  })
  const syncLayersRef = useRef()
  const syncRouteRef = useRef()
  const syncTraveledRouteRef = useRef()
  const syncWalkingTargetRef = useRef()

  const [basemap, setBasemap] = useState('positron')
  const [terrainOn, setTerrainOn] = useState(false)
  const [mapTheme, setMapTheme] = useState('light')
  const [notice, setNotice] = useState(null)
  const [showLayersMenu, setShowLayersMenu] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(zoom)

  useEffect(() => {
    handlersRef.current = {
      onSelect,
      onMapClick,
      onReady,
      onViewportChange,
      settingStartOnMap,
      onSetStartCoords,
      onUserPan,
    }
  })

  const activeOverlaySet = useMemo(() => new Set(overlayIds), [overlayIds])

  const selectedSpot = useMemo(
    () => spots.find((s) => s.id === selectedId),
    [spots, selectedId],
  )

  // Style definition calculation
  const currentStyleDef = useMemo(() => {
    const def = BASEMAPS.find((b) => b.id === basemap) ?? BASEMAPS[0]
    return mapTheme === 'dark' ? def.dark : def.light
  }, [basemap, mapTheme])

  // Initialize MapLibre GL
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initialLngLat = parseToLngLat(center)

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: currentStyleDef,
      center: initialLngLat,
      zoom: zoom,
      maxPitch: 80,
      fadeDuration: 0,
      maxParallelImageRequests: 32,
      renderWorldCopies: false,
      trackResize: true,
      attributionControl: false, // Unified legal attribution rendered in bottom overlay stack
    })

    mapRef.current = map

    // If style fails, automatically fall back to standard OSM raster style
    map.on('error', (e) => {
      if (
        e.error &&
        (e.error.status === 404 ||
          e.error.status === 403 ||
          e.error.message?.includes('Failed to fetch'))
      ) {
        console.warn('[MapLibre] Style load issue, falling back to OSM raster:', e.error)
        try {
          map.setStyle(OSM_STYLE)
        } catch {
          // Ignore fallback setStyle errors
        }
      }
    })

    if (interactive) {
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        'top-right',
      )
      map.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), 'bottom-left')
    }

    const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '340px' })
    popupRef.current = popup

    const handleReady = () => {
      map.resize()
      handlersRef.current.onReady?.(map)
    }

    map.on('load', handleReady)
    map.on('style.load', () => {
      syncLayersRef.current?.()
      syncRouteRef.current?.()
      syncWalkingTargetRef.current?.()
    })
    map.on('zoom', () => {
      setCurrentZoom(map.getZoom())
    })
    map.on('moveend', () => {
      handlersRef.current.onViewportChange?.({
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom(),
      })
    })

    map.on('dragstart', () => {
      handlersRef.current.onUserPan?.()
    })

    // Click handler for data layers or manual start point selection
    map.on('click', (e) => {
      const lat = Number(e.lngLat.lat.toFixed(6))
      const lng = Number(e.lngLat.lng.toFixed(6))

      // If user is manually placing start point
      if (handlersRef.current.settingStartOnMap) {
        handlersRef.current.onSetStartCoords?.([lat, lng])
        return
      }

      const clickCoords = [lat, lng]
      clickCoords.lat = lat
      clickCoords.lng = lng

      handlersRef.current.onMapClick?.(clickCoords)

      const pickableLayers = LAYERS.flatMap((l) => [
        `${l.id}-point`,
        `${l.id}-circle`,
        `${l.id}-fill`,
        `${l.id}-line`,
      ]).filter((id) => map.getLayer(id))

      if (!pickableLayers.length) return

      const hits = map.queryRenderedFeatures(e.point, { layers: pickableLayers })
      if (!hits || !hits.length) return

      const hit = hits[0]
      const sourceId = hit.source
      const def = LAYERS.find((l) => l.id === sourceId)
      if (!def) return

      const props = hit.properties || {}
      const info = LAYER_INFO[def.id]
      const title = featureName(props) || def.label
      const confidence = props.locationConfidence ?? props.geocodeConfidence
      const caveat = typeof confidence === 'string' ? CAVEAT[confidence] : null

      const popupNode = document.createElement('div')
      popupNode.className = 'nm-popup'

      const h3 = document.createElement('h3')
      h3.className = 'nm-popup-title'
      h3.textContent = title
      popupNode.appendChild(h3)

      const layerBadge = document.createElement('div')
      layerBadge.className = 'nm-popup-layer'
      layerBadge.innerHTML = `<span class="map-layer-swatch" style="background:${def.color}"></span><span>${def.group} · ${def.label}</span>`
      popupNode.appendChild(layerBadge)

      if (info?.summary) {
        const sumEl = document.createElement('div')
        sumEl.className = 'nm-popup-summary'
        sumEl.textContent = info.summary
        popupNode.appendChild(sumEl)
      }

      if (confidence === VERIFIED) {
        const verEl = document.createElement('div')
        verEl.className = 'nm-popup-verified'
        verEl.innerHTML = '✓ Verified position'
        popupNode.appendChild(verEl)
      } else if (caveat) {
        const cavEl = document.createElement('div')
        cavEl.className = caveat.tone === 'warn' ? 'nm-popup-warn' : 'nm-popup-note'
        cavEl.textContent = caveat.text
        popupNode.appendChild(cavEl)
      } else if (info?.caveat) {
        const cavEl = document.createElement('div')
        cavEl.className = 'nm-popup-note'
        cavEl.textContent = info.caveat
        popupNode.appendChild(cavEl)
      }

      const entries = Object.entries(props).filter(
        ([k, v]) => v !== null && v !== undefined && v !== '' && !HIDDEN_POPUP_KEYS.has(k),
      )

      if (entries.length > 0) {
        const dl = document.createElement('dl')
        dl.className = 'nm-popup-table'
        for (const [key, val] of entries.slice(0, 8)) {
          const label = info?.fieldNotes?.[key] || key
          const dt = document.createElement('dt')
          dt.textContent = label
          dt.title = key
          const dd = document.createElement('dd')
          dd.textContent = String(val)
          dl.appendChild(dt)
          dl.appendChild(dd)
        }
        popupNode.appendChild(dl)
      }

      popup.setLngLat(e.lngLat).setDOMContent(popupNode).addTo(map)
    })

    // Pointer cursor on hover
    map.on('mousemove', (e) => {
      const pickableLayers = LAYERS.flatMap((l) => [
        `${l.id}-point`,
        `${l.id}-circle`,
        `${l.id}-fill`,
        `${l.id}-line`,
      ]).filter((id) => map.getLayer(id))

      if (!pickableLayers.length) {
        map.getCanvas().style.cursor = ''
        return
      }

      const hits = map.queryRenderedFeatures(e.point, { layers: pickableLayers })
      map.getCanvas().style.cursor = hits.length ? 'pointer' : ''
    })

    const timer = setTimeout(() => map.resize(), 100)
    const raf = requestAnimationFrame(() => map.resize())
    const observer = new ResizeObserver(() => {
      map.resize()
    })
    observer.observe(containerRef.current)

    const markers = spotMarkersRef.current
    const sources = loadedSourcesRef.current

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      observer.disconnect()
      markers.forEach((m) => m.remove())
      markers.clear()
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      if (carMarkerRef.current) {
        carMarkerRef.current.remove()
        carMarkerRef.current = null
      }
      map.remove()
      mapRef.current = null
      sources.clear()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync 3D Terrain
  const syncTerrain = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    try {
      if (!terrainOn) {
        map.setTerrain(null)
        if (map.getLayer(HILLSHADE_LAYER)) map.removeLayer(HILLSHADE_LAYER)
        return
      }

      if (!map.getSource(TERRAIN_SOURCE)) {
        map.addSource(TERRAIN_SOURCE, {
          type: 'raster-dem',
          tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium',
          tileSize: 256,
          maxzoom: 13,
          attribution: 'Elevation © Tilezen',
        })
      }

      if (!map.getLayer(HILLSHADE_LAYER)) {
        map.addLayer({
          id: HILLSHADE_LAYER,
          type: 'hillshade',
          source: TERRAIN_SOURCE,
          paint: {
            'hillshade-exaggeration': 0.35,
            'hillshade-shadow-color': mapTheme === 'dark' ? '#000000' : '#4a3c33',
            'hillshade-highlight-color': mapTheme === 'dark' ? '#5c4e42' : '#ffffff',
          },
        })
      }

      map.setTerrain({ source: TERRAIN_SOURCE, exaggeration: 1.25 })
    } catch (err) {
      console.warn('[map] 3D Terrain sync error:', err)
    }
  }, [terrainOn, mapTheme])

  const prevStyleRef = useRef(currentStyleDef)

  // Sync style changes when basemap or theme changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (prevStyleRef.current === currentStyleDef) return
    prevStyleRef.current = currentStyleDef

    loadedSourcesRef.current.clear()
    try {
      map.setStyle(currentStyleDef)
      map.once('style.load', () => {
        syncTerrain()
        syncLayersRef.current?.()
        syncRouteRef.current?.()
        syncTraveledRouteRef.current?.()
      })
    } catch (err) {
      console.warn('[MapLibre] setStyle error:', err)
    }
  }, [currentStyleDef, syncTerrain])

  useEffect(() => {
    syncTerrain()
    const map = mapRef.current
    if (map) {
      map.easeTo({ pitch: terrainOn ? 55 : 0, duration: 600 })
    }
  }, [terrainOn, syncTerrain])

  // Mount GeoJSON layers
  const mountLayer = useCallback((def, geojson) => {
    const map = mapRef.current
    if (!map || !geojson || map.getSource(def.id)) return

    try {
      map.addSource(def.id, { type: 'geojson', data: geojson })
      loadedSourcesRef.current.add(def.id)

      map.addLayer({
        id: `${def.id}-fill`,
        type: 'fill',
        source: def.id,
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': ['case', ['has', 'fill'], ['to-string', ['get', 'fill']], def.color],
          'fill-opacity': [
            'case',
            ['has', 'fill-opacity'],
            ['to-number', ['get', 'fill-opacity']],
            0.2,
          ],
        },
      })

      map.addLayer({
        id: `${def.id}-line`,
        type: 'line',
        source: def.id,
        filter: ['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['case', ['has', 'stroke'], ['to-string', ['get', 'stroke']], def.color],
          'line-width': [
            'case',
            ['has', 'stroke-width'],
            ['to-number', ['get', 'stroke-width']],
            2.5,
          ],
          'line-opacity': [
            'case',
            ['has', 'stroke-opacity'],
            ['to-number', ['get', 'stroke-opacity']],
            0.85,
          ],
        },
      })

      map.addLayer({
        id: `${def.id}-circle`,
        type: 'circle',
        source: def.id,
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 6.5,
          'circle-color': def.color,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      })
    } catch (err) {
      console.warn(`[map] mountLayer error for "${def.id}":`, err)
    }
  }, [])

  // Sync active layers
  const syncLayers = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    for (const def of LAYERS) {
      const isWanted = activeOverlaySet.has(def.id)

      if (isWanted) {
        if (LAYER_INFO[def.id]?.notice && !activeNoticeRef.current.has(def.id)) {
          activeNoticeRef.current.add(def.id)
          setNotice({ label: def.label, text: LAYER_INFO[def.id].notice })
          setTimeout(() => setNotice((n) => (n?.label === def.label ? null : n)), 8000)
        }

        if (!map.getSource(def.id)) {
          loadGeoJson(def).then((geojson) => {
            if (geojson && activeOverlaySet.has(def.id) && mapRef.current) {
              mountLayer(def, geojson)
            }
          })
        } else {
          for (const sub of [`${def.id}-fill`, `${def.id}-line`, `${def.id}-circle`]) {
            if (map.getLayer(sub)) map.setLayoutProperty(sub, 'visibility', 'visible')
          }
        }
      } else {
        for (const sub of [`${def.id}-fill`, `${def.id}-line`, `${def.id}-circle`]) {
          if (map.getLayer(sub)) map.setLayoutProperty(sub, 'visibility', 'none')
        }
      }
    }
  }, [activeOverlaySet, mountLayer])

  useEffect(() => {
    syncLayersRef.current = syncLayers
    syncLayers()
  }, [syncLayers])

  // Sync User Location Beacon & Accuracy Label
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      return
    }

    const lngLat = parseToLngLat(userCoords)
    const accLabel = userAccuracy ? ` <span class="kp-user-beacon__acc">±${Math.round(userAccuracy)}m</span>` : ''

    if (!userMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'kp-user-beacon'
      el.innerHTML = `
        <div class="kp-user-beacon__pulse"></div>
        <div class="kp-user-beacon__dot"></div>
        <div class="kp-user-beacon__label">${userLabel || 'Your Location'}${accLabel}</div>
      `
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map)
      userMarkerRef.current = marker
    } else {
      userMarkerRef.current.setLngLat(lngLat)
      const labelEl = userMarkerRef.current.getElement()?.querySelector('.kp-user-beacon__label')
      if (labelEl) labelEl.innerHTML = `${userLabel || 'Your Location'}${accLabel}`
    }
  }, [userCoords, userLabel, userAccuracy])

  // Sync Translucent Accuracy Circle Layer (Phase B Requirement)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const ACC_SOURCE = 'kp-user-acc-source'
    const ACC_FILL = 'kp-user-acc-fill'
    const ACC_LINE = 'kp-user-acc-line'

    if (!userCoords || !userAccuracy || userAccuracy <= 0) {
      if (map.getLayer(ACC_LINE)) map.removeLayer(ACC_LINE)
      if (map.getLayer(ACC_FILL)) map.removeLayer(ACC_FILL)
      if (map.getSource(ACC_SOURCE)) map.removeSource(ACC_SOURCE)
      return
    }

    const lngLat = parseToLngLat(userCoords)
    const circleGeoJson = createCircleGeoJson(lngLat, userAccuracy)
    if (!circleGeoJson) return

    try {
      if (map.getSource(ACC_SOURCE)) {
        map.getSource(ACC_SOURCE).setData(circleGeoJson)
      } else {
        map.addSource(ACC_SOURCE, {
          type: 'geojson',
          data: circleGeoJson,
        })

        map.addLayer({
          id: ACC_FILL,
          type: 'fill',
          source: ACC_SOURCE,
          paint: {
            'fill-color': '#2563EB',
            'fill-opacity': 0.14,
          },
        })

        map.addLayer({
          id: ACC_LINE,
          type: 'line',
          source: ACC_SOURCE,
          paint: {
            'line-color': '#3B82F6',
            'line-width': 1.5,
            'line-opacity': 0.45,
          },
        })
      }
    } catch (err) {
      console.warn('[map] Error syncing user accuracy circle:', err)
    }
  }, [userCoords, userAccuracy])

  // Set map crosshair cursor when manual start selection is active
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const canvas = map.getCanvas()
    if (canvas) {
      canvas.style.cursor = settingStartOnMap ? 'crosshair' : ''
    }
  }, [settingStartOnMap])

  // Sync Route Polyline Layer & Clear Start Dot
  const syncRoute = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const ROUTE_SOURCE = 'kp-nav-route'
    const CASING_LAYER = 'kp-nav-route-casing'
    const GLOW_LAYER = 'kp-nav-route-glow'
    const LINE_LAYER = 'kp-nav-route-line'

    const geojson = route?.geojson ?? (route?.type === 'Feature' ? route : null)
    const coords = geojson?.geometry?.coordinates

    if (!geojson || !coords || coords.length < 2) {
      if (map.getLayer(LINE_LAYER)) map.removeLayer(LINE_LAYER)
      if (map.getLayer(CASING_LAYER)) map.removeLayer(CASING_LAYER)
      if (map.getLayer(GLOW_LAYER)) map.removeLayer(GLOW_LAYER)
      if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE)

      if (startDotMarkerRef.current) {
        startDotMarkerRef.current.remove()
        startDotMarkerRef.current = null
      }
      return
    }

    try {
      if (map.getSource(ROUTE_SOURCE)) {
        map.getSource(ROUTE_SOURCE).setData(geojson)
      } else {
        map.addSource(ROUTE_SOURCE, {
          type: 'geojson',
          data: geojson,
        })

        // Ambient Gold Glow underneath
        map.addLayer({
          id: GLOW_LAYER,
          type: 'line',
          source: ROUTE_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#006341',
            'line-width': 10,
            'line-opacity': 0.2,
            'line-blur': 2,
          },
        })

        // Thin White Casing (Phase 1 Requirement 4)
        map.addLayer({
          id: CASING_LAYER,
          type: 'line',
          source: ROUTE_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 6.5,
            'line-opacity': 0.95,
          },
        })

        // Remaining Route Line = Forest Green (Phase 1 Requirement 4)
        map.addLayer({
          id: LINE_LAYER,
          type: 'line',
          source: ROUTE_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#006341',
            'line-width': 4.5,
            'line-opacity': 1.0,
          },
        })
      }

      // Start Dot Marker at route origin (Phase 1 Requirement 3)
      const startPt = coords[0]
      if (startPt) {
        if (!startDotMarkerRef.current) {
          const el = document.createElement('div')
          el.className = 'kp-route-start-marker'
          el.innerHTML = `
            <div style="position:relative; width:22px; height:22px; display:grid; place-items:center;">
              <div style="position:absolute; inset:-4px; border-radius:9999px; background:rgba(0,99,65,0.35); animation:pulse 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="width:14px; height:14px; border-radius:9999px; background:#006341; border:2.5px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>
            </div>
          `
          startDotMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(startPt)
            .addTo(map)
        } else {
          startDotMarkerRef.current.setLngLat(startPt)
        }
      }

      // Auto-fit camera bounds to route with desktop panel padding (Phase 1 Requirement 6)
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
      const bounds = new maplibregl.LngLatBounds()
      coords.forEach((coord) => bounds.extend(coord))
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 90, left: isDesktop ? 480 : 50, right: 50 },
        maxZoom: 16,
        duration: 800,
      })
    } catch (err) {
      console.warn('[map] Error syncing navigation route:', err)
    }
  }, [route])

  useEffect(() => {
    syncRouteRef.current = syncRoute
    syncRoute()
  }, [syncRoute])

  // Sync Traveled Polyline (Progressive gold path during journey - no layer churn)
  const syncTraveledRoute = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const TRAVELED_SOURCE = 'kp-nav-traveled-route'
    const TRAVELED_LINE = 'kp-nav-traveled-line'

    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: traveledCoords && traveledCoords.length >= 2 ? traveledCoords : [],
      },
    }

    try {
      if (map.getSource(TRAVELED_SOURCE)) {
        // Direct setData update at 30-60 fps without recreating layer
        map.getSource(TRAVELED_SOURCE).setData(geojson)
      } else if (traveledCoords && traveledCoords.length >= 2) {
        map.addSource(TRAVELED_SOURCE, {
          type: 'geojson',
          data: geojson,
        })

        // Traveled Route = Gold (Phase 1 Requirement 4)
        map.addLayer({
          id: TRAVELED_LINE,
          type: 'line',
          source: TRAVELED_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFD900',
            'line-width': 5.2,
            'line-opacity': 1.0,
          },
        })
      }
    } catch (err) {
      console.warn('[map] Error syncing traveled route:', err)
    }
  }, [traveledCoords])

  useEffect(() => {
    syncTraveledRouteRef.current = syncTraveledRoute
    syncTraveledRoute()
  }, [syncTraveledRoute])

  // Scroll Zoom Disabled Until Focus UX pattern
  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    if (!map || !container || !scrollZoomDisabledUntilFocus) return

    map.scrollZoom.disable()

    const handleFocus = () => {
      map.scrollZoom.enable()
    }
    const handleBlur = () => {
      map.scrollZoom.disable()
    }

    container.addEventListener('click', handleFocus)
    container.addEventListener('focus', handleFocus)
    container.addEventListener('mouseenter', handleFocus)
    container.addEventListener('mouseleave', handleBlur)

    return () => {
      container.removeEventListener('click', handleFocus)
      container.removeEventListener('focus', handleFocus)
      container.removeEventListener('mouseenter', handleFocus)
      container.removeEventListener('mouseleave', handleBlur)
    }
  }, [scrollZoomDisabledUntilFocus])

  // Sync Walking Target & Dashed Approach Line (Phase 3 Requirement 2)
  const syncWalkingTarget = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const WALKING_SOURCE = 'kp-walking-path'
    const WALKING_CASING = 'kp-walking-casing'
    const WALKING_LINE = 'kp-walking-line'

    if (!walkingTarget || !spots[0]?.latlng) {
      if (landmarkMarkerRef.current) {
        landmarkMarkerRef.current.remove()
        landmarkMarkerRef.current = null
      }
      try {
        if (map.getLayer(WALKING_LINE)) map.removeLayer(WALKING_LINE)
        if (map.getLayer(WALKING_CASING)) map.removeLayer(WALKING_CASING)
        if (map.getSource(WALKING_SOURCE)) map.removeSource(WALKING_SOURCE)
      } catch {
        // Safe cleanup
      }
      return
    }

    const spotLngLat = parseToLngLat(spots[0].latlng)
    const landmarkLngLat = parseToLngLat(walkingTarget.latlng)

    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [spotLngLat, landmarkLngLat],
      },
    }

    try {
      if (map.getSource(WALKING_SOURCE)) {
        map.getSource(WALKING_SOURCE).setData(geojson)
      } else {
        map.addSource(WALKING_SOURCE, {
          type: 'geojson',
          data: geojson,
        })

        // High-contrast white casing
        map.addLayer({
          id: WALKING_CASING,
          type: 'line',
          source: WALKING_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 5.5,
            'line-opacity': 0.85,
          },
        })

        // Sthaanam forest green dashed line
        map.addLayer({
          id: WALKING_LINE,
          type: 'line',
          source: WALKING_SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#006341',
            'line-width': 3.2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        })
      }

      // Landmark Marker with temple icon and walk time badge
      if (!landmarkMarkerRef.current) {
        const el = document.createElement('div')
        el.className = 'kp-landmark-marker-node'
        el.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.22)); cursor:default;">
            <div style="background:#FAF7F2; border:2px solid #006341; border-radius:12px; padding:4px 9px; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12);">
              <span style="font-size:14px; line-height:1;">🛕</span>
              <div style="display:flex; flex-direction:column; line-height:1.15;">
                <span style="font-size:11px; font-weight:800; color:#17212B; letter-spacing:-0.2px;">${walkingTarget.name}</span>
                <span style="font-size:9.5px; font-weight:800; color:#006341;">${walkingTarget.walkM || 13} min walk</span>
              </div>
            </div>
            <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #006341; margin-top:-1px;"></div>
          </div>
        `
        landmarkMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(landmarkLngLat)
          .addTo(map)
      } else {
        landmarkMarkerRef.current.setLngLat(landmarkLngLat)
        const label = landmarkMarkerRef.current.getElement().querySelector('span:first-child + div')
        if (label) {
          label.innerHTML = `
            <span style="font-size:11px; font-weight:800; color:#17212B; letter-spacing:-0.2px;">${walkingTarget.name}</span>
            <span style="font-size:9.5px; font-weight:800; color:#006341;">${walkingTarget.walkM || 13} min walk</span>
          `
        }
      }

      // If no route is active, auto-fit camera to frame both spot and landmark
      if (!route) {
        const bounds = new maplibregl.LngLatBounds()
        bounds.extend(spotLngLat)
        bounds.extend(landmarkLngLat)
        map.fitBounds(bounds, {
          padding: { top: 55, bottom: 55, left: 55, right: 55 },
          maxZoom: 16,
          duration: 650,
        })
      }
    } catch (err) {
      console.warn('[map] Error syncing walking target:', err)
    }
  }, [walkingTarget, spots, route])

  useEffect(() => {
    syncWalkingTargetRef.current = syncWalkingTarget
    syncWalkingTarget()
  }, [syncWalkingTarget])

  // Top-Down SVG Car Graphic following route with map bearing alignment
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (!journeyCar || journeyCar.lng == null || journeyCar.lat == null) {
      if (carMarkerRef.current) {
        carMarkerRef.current.remove()
        carMarkerRef.current = null
      }
      return
    }

    const lngLat = [journeyCar.lng, journeyCar.lat]
    const mapBearing = map.getBearing() || 0
    const visualRotation = ((journeyCar.angle || 0) - mapBearing + 360) % 360

    if (!carMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'kp-nav-car-marker'
      el.style.pointerEvents = 'none'
      el.innerHTML = `
        <div class="kp-nav-car-inner" style="width:40px; height:40px; display:grid; place-items:center; filter: drop-shadow(0 4px 7px rgba(0,0,0,0.5)); transform: rotate(${visualRotation}deg); transform-origin: center center; transition: transform 0.08s linear;">
          <svg viewBox="-20 -25 40 50" width="40" height="40" style="display:block;">
            <!-- Tires (Four Black Rubber Tires) -->
            <rect x="-13" y="-18" width="4" height="9" rx="2" fill="#121A24" />
            <rect x="9" y="-18" width="4" height="9" rx="2" fill="#121A24" />
            <rect x="-13" y="10" width="4" height="9" rx="2" fill="#121A24" />
            <rect x="9" y="10" width="4" height="9" rx="2" fill="#121A24" />

            <!-- Main Chassis (Warm Off-White with Charcoal Outline) -->
            <rect
              x="-11"
              y="-21"
              width="22"
              height="42"
              rx="7"
              fill="#FAF7F2"
              stroke="#17212B"
              stroke-width="1.8"
            />

            <!-- Saffron Sport Accent Center Stripe -->
            <rect x="-2" y="-20" width="4" height="40" fill="#FFD900" opacity="0.95" />

            <!-- Dark Tinted Glass Roof Cabin -->
            <path
              d="M-7,-9 Q0,-13 7,-9 L6,9 Q0,12 -6,9 Z"
              fill="#17212B"
              stroke="#FFD900"
              stroke-width="0.8"
            />

            <!-- Front Windshield Reflection (Warm Gold) -->
            <path
              d="M-6,-8 Q0,-11 6,-8 L5,-3 Q0,-5 -5,-3 Z"
              fill="#FFD900"
              opacity="0.85"
            />

            <!-- Rear Glass Window -->
            <path
              d="M-5,6 Q0,8 5,6 L4,8 Q0,9 -4,8 Z"
              fill="#FFD900"
              opacity="0.75"
            />
          </svg>
        </div>
      `
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map)
      carMarkerRef.current = marker

      // Map rotation listener to maintain road alignment
      const updateRotationOnMapRotate = () => {
        if (!carMarkerRef.current) return
        const currentMapBearing = map.getBearing() || 0
        const rot = ((journeyCar.angle || 0) - currentMapBearing + 360) % 360
        const inner = carMarkerRef.current.getElement()?.querySelector('.kp-nav-car-inner')
        if (inner) inner.style.transform = `rotate(${rot}deg)`
      }
      map.on('rotate', updateRotationOnMapRotate)
    } else {
      carMarkerRef.current.setLngLat(lngLat)
      const inner = carMarkerRef.current.getElement()?.querySelector('.kp-nav-car-inner')
      if (inner) {
        inner.style.transform = `rotate(${visualRotation}deg)`
      }
    }
  }, [journeyCar])

  // Camera follow along the car (gentle easing, 14.5-15.5 zoom, Phase 1 Requirement 6)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (journeyStatus === 'running' && followLocation && journeyCar?.lng != null && journeyCar?.lat != null) {
      map.easeTo({
        center: [journeyCar.lng, journeyCar.lat],
        zoom: 15.2,
        duration: 350,
        easing: (t) => t,
      })
    } else if (journeyStatus === 'arrived' && (selectedSpot?.latlng || route?.destination?.latLng)) {
      // Ease out at arrival to show destination pin
      const destLngLat = parseToLngLat(selectedSpot?.latlng || route.destination.latLng)
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
      map.easeTo({
        center: destLngLat,
        zoom: 15.0,
        padding: { top: 70, bottom: 70, left: isDesktop ? 380 : 30, right: 30 },
        duration: 750,
      })
    }
  }, [journeyCar, journeyStatus, followLocation, selectedSpot, route])

  // Sync Individual Price Pins (Clustering only when zoomed out < 12.8)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const existingMarkers = spotMarkersRef.current

    // Cluster threshold: < 12.8 groups dense parking clusters (Adgaon, Panchavati)
    const clusters = []
    const visited = new Set()
    const radius = currentZoom < 12.8 ? 0.018 : 0

    if (radius > 0) {
      for (let i = 0; i < spots.length; i++) {
        if (visited.has(i)) continue
        const spotA = spots[i]
        const [lngA, latA] = parseToLngLat(spotA.latlng)
        const group = [spotA]
        visited.add(i)

        for (let j = i + 1; j < spots.length; j++) {
          if (visited.has(j)) continue
          const spotB = spots[j]
          const [lngB, latB] = parseToLngLat(spotB.latlng)
          const dist = Math.hypot(lngA - lngB, latA - latB)

          if (dist < radius) {
            group.push(spotB)
            visited.add(j)
          }
        }

        if (group.length > 1) {
          const avgLng =
            group.reduce((sum, s) => sum + parseToLngLat(s.latlng)[0], 0) / group.length
          const avgLat =
            group.reduce((sum, s) => sum + parseToLngLat(s.latlng)[1], 0) / group.length
          const minPrice = Math.min(...group.map((s) => s.from ?? s.priceHour))
          clusters.push({
            type: 'cluster',
            id: `cluster-${group.map((s) => s.id).join('-')}`,
            lngLat: [avgLng, avgLat],
            count: group.length,
            minPrice,
          })
        } else {
          clusters.push({ type: 'spot', id: spotA.id, spot: spotA })
        }
      }
    } else {
      // One individual price pin per listing
      spots.forEach((s) => clusters.push({ type: 'spot', id: s.id, spot: s }))
    }

    const activeItemIds = new Set(clusters.map((c) => c.id))

    // Remove obsolete markers
    for (const [id, marker] of existingMarkers) {
      if (!activeItemIds.has(id)) {
        marker.remove()
        existingMarkers.delete(id)
      }
    }

    // Render individual or cluster markers
    for (const item of clusters) {
      let marker = existingMarkers.get(item.id)

      if (item.type === 'cluster') {
        if (!marker) {
          const el = document.createElement('div')
          el.className = 'kp-marker-container'

          el.addEventListener('click', (e) => {
            e.stopPropagation()
            map.flyTo({
              center: item.lngLat,
              zoom: Math.min(map.getZoom() + 2.5, 15),
              duration: 600,
            })
          })

          marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(item.lngLat)
            .addTo(map)

          existingMarkers.set(item.id, marker)
        } else {
          marker.setLngLat(item.lngLat)
        }

        const el = marker.getElement()
        el.innerHTML = `
          <div class="kp-cluster-chip">
            <span class="kp-cluster-chip__badge">${item.count} Spots</span>
            <span>From ₹${item.minPrice}</span>
          </div>
        `
      } else {
        // Individual Price Pill Marker
        const spot = item.spot
        const lngLat = parseToLngLat(spot.latlng)
        const isSelected = spot.id === selectedId
        const isHovered = spot.id === hoveredId
        const isFull = spot.spotsLeft <= 0 || spot.availability === 'full'
        const isLimited = spot.spotsLeft > 0 && spot.spotsLeft <= 3
        const showPerHr = currentZoom >= 14

        const dotColor = isFull ? '#9CA3AF' : isLimited ? '#F2B544' : '#006341'

        if (!marker) {
          const el = document.createElement('div')
          el.className = 'kp-marker-wrapper'

          el.addEventListener('click', (e) => {
            e.stopPropagation()
            handlersRef.current.onSelect?.(spot)
          })

          marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat(lngLat)
            .addTo(map)

          existingMarkers.set(item.id, marker)
        } else {
          marker.setLngLat(lngLat)
        }

        const el = marker.getElement()
        el.className = `kp-marker-wrapper ${isSelected ? 'z-[600]' : isHovered ? 'z-[500]' : 'z-[100]'}`

        if (isSelected) {
          // Selected Pin: Black pill with gold text, raised z-index, pulse on arrival
          const isArrived = journeyStatus === 'arrived'
          el.innerHTML = `
            <div class="kp-price-chip kp-price-chip--selected ${isArrived ? 'kp-arrived-pulse ring-4 ring-[#FFD900] ring-offset-2' : ''}">
              <span class="kp-price-chip__dot" style="background:#FFD900;"></span>
              <span>₹${spot.from ?? spot.priceHour}</span>
              ${showPerHr ? '<span style="font-size:10px; opacity:0.85; font-weight:600;">/hr</span>' : ''}
              ${isArrived ? '<span style="font-size:11px; margin-left:2px;">🎉</span>' : ''}
            </div>
          `
        } else {
          // Default Pin: Rounded gold pill with dark text
          el.innerHTML = `
            <div class="kp-price-chip ${isHovered ? 'scale-110 shadow-lg' : ''}" style="background:#FFD900; color:#181B1A; border:1.5px solid #181B1A; font-weight:800;">
              <span class="kp-price-chip__dot" style="background:${dotColor};"></span>
              <span>₹${spot.from ?? spot.priceHour}</span>
              ${showPerHr ? '<span style="font-size:10px; opacity:0.75; font-weight:600;">/hr</span>' : ''}
              ${spot.verified ? '<span style="font-size:10px;" title="Verified">✓</span>' : ''}
            </div>
          `
        }
      }
    }
  }, [spots, selectedId, hoveredId, currentZoom, journeyStatus])

  // Focus effect with desktop offset for floating glass listings panel
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focus) return
    const targetLngLat = parseToLngLat(focus.latlng)
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    map.flyTo({
      center: targetLngLat,
      zoom: focus.zoom ?? Math.max(map.getZoom(), 14),
      duration: 700,
      padding: isDesktop ? { left: 460, right: 40, top: 40, bottom: 40 } : undefined,
    })
  }, [focus])

  // Selected spot panning with desktop offset
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const spot = spots.find((s) => s.id === selectedId)
    if (spot) {
      const lngLat = parseToLngLat(spot.latlng)
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
      map.easeTo({
        center: lngLat,
        duration: 500,
        padding: isDesktop ? { left: 460, right: 40, top: 40, bottom: 40 } : undefined,
      })
    }
  }, [selectedId, spots])

  return (
    <div className={cn('relative size-full min-h-[300px] overflow-hidden bg-[#F5F3ED]', className)}>
      {/* MapLibre Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 size-full" />

      {/* Simplified Floating Map Controls Bar (Top Left / Right of floating panel) */}
      <div className="absolute top-3 left-3 lg:left-[468px] z-[400] flex items-center gap-2 transition-all duration-300">
        {/* Base-Layer Toggle: Standard / Satellite */}
        <div className="flex items-center rounded-full border border-white/60 glass-panel p-0.5 shadow-md">
          <button
            type="button"
            onClick={() => setBasemap('positron')}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer',
              basemap === 'positron'
                ? 'bg-[#181B1A] text-white shadow-xs'
                : 'text-[#292C2B]/70 hover:text-[#292C2B]',
            )}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer',
              basemap === 'satellite'
                ? 'bg-[#181B1A] text-white shadow-xs'
                : 'text-[#292C2B]/70 hover:text-[#292C2B]',
            )}
          >
            Satellite
          </button>
        </div>

        {/* Unified Layers Popover Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayersMenu((p) => !p)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-[#D2D3D1] px-3 py-1.5 text-[11px] font-bold card-shadow backdrop-blur-md transition-all active:scale-95 cursor-pointer',
              terrainOn || showLayersMenu
                ? 'bg-[#181B1A] text-[#FFD900] border-[#181B1A] shadow-md'
                : 'bg-[#FAF7F2]/95 text-[#292C2B] hover:bg-white',
            )}
          >
            <Icon name="sliders" size={12} className="text-[#006341]" />
            <span>Layers</span>
            {terrainOn && <span className="size-1.5 rounded-full bg-[#FFD900]" />}
          </button>

          {showLayersMenu && (
            <div className="absolute top-9 left-0 z-[500] w-56 rounded-2xl border border-[#D2D3D1] bg-white p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
              {/* 3D Terrain */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#292C2B]">3D Terrain</span>
                <button
                  type="button"
                  onClick={() => setTerrainOn((t) => !t)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10.5px] font-bold cursor-pointer transition-colors',
                    terrainOn ? 'bg-[#006341] text-white' : 'bg-gray-100 text-[#717573]',
                  )}
                >
                  {terrainOn ? 'Active' : 'Off'}
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-[12px] font-bold text-[#292C2B]">Map Mode</span>
                <button
                  type="button"
                  onClick={() => setMapTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                  className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-gray-100 text-[#292C2B] cursor-pointer"
                >
                  {mapTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>

              {/* Open Nashik Layers Drawer */}
              {onOpenLayers && (
                <div className="border-t border-gray-100 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLayersMenu(false)
                      onOpenLayers()
                    }}
                    className="w-full text-left text-[11.5px] font-bold text-[#006341] hover:underline cursor-pointer"
                  >
                    Nashik Layers ({overlayIds.length}) →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dataset Notice Banner */}
      {notice && (
        <div className="nm-notice-banner absolute top-14 left-3 z-[450] max-w-sm rounded-2xl border border-warning/30 bg-surface p-3.5 card-shadow backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-warning">
              <Icon name="checkCircle" size={14} />
              <span>{notice.label} Dataset Note</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-muted hover:text-text"
              aria-label="Dismiss notice"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{notice.text}</p>
        </div>
      )}

      {/* =========================================================================
          UNIFIED BOTTOM-OF-MAP OVERLAYS CONTAINER (PHASE 4: OFFSET TO RIGHT OF PANEL)
          Order (bottom-up):
            1. Row 3 (Top of stack): Layers Button ("Nashik Monitor Layers")
            2. Row 2 (Middle): Selected Parking Card (collapses to 1-line in journey)
            3. Row 1 (Lowest): Compact Legend + Legal Attribution (never overlaps)
      ========================================================================= */}
      <div className="absolute left-0 right-0 lg:left-[464px] lg:right-6 bottom-0 z-[450] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-start gap-2 pointer-events-none transition-all duration-300">
        {/* Top of bottom stack: Layers Button */}
        {onOverlayChange && (
          <div className="pointer-events-auto">
            <MapLayerToggle
              active={overlayIds}
              onChange={onOverlayChange}
              className="!static"
            />
          </div>
        )}

        {/* Middle: Selected Parking Card */}
        {selectedSpot && (
          <div className="pointer-events-auto w-full max-w-sm">
            {journeyStatus !== 'idle' ? (
              <div className="kp-floating-card-enter flex items-center justify-between gap-2.5 rounded-full border border-[#D2D3D1] bg-[#181B1A]/95 text-white px-3.5 py-1.5 shadow-xl backdrop-blur-md border-l-4 border-l-[#FFD900]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2 rounded-full bg-[#FFD900] animate-pulse shrink-0" />
                  <span className="text-[12px] font-bold text-white truncate max-w-[170px]">
                    {selectedSpot.title}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#FFD900] shrink-0">
                    ₹{selectedSpot.from ?? selectedSpot.priceHour}/hr
                  </span>
                </div>
                <Link
                  to={`/listing/${selectedSpot.id}`}
                  className="text-[11px] font-bold text-white bg-[#006341] hover:bg-[#004e33] px-2.5 py-0.5 rounded-full transition-colors shrink-0 cursor-pointer"
                >
                  Reserve →
                </Link>
              </div>
            ) : (
              <div className="kp-floating-card-enter rounded-3xl border border-white/70 glass-panel-strong p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                  <SpaceTypeIcon listing={selectedSpot} size="default" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-black uppercase font-heading text-[#17212B] truncate leading-tight">
                          {selectedSpot.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#006341]">
                          {getSpaceType(selectedSpot).label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlersRef.current.onSelect?.(null)}
                        className="grid size-6 place-items-center rounded-full text-[#717573] hover:bg-[#F5F3ED] hover:text-[#17212B] cursor-pointer shrink-0 -mt-0.5"
                        aria-label="Close card"
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>

                    {/* Landmark / Sector Row */}
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[#66706B] truncate">
                      <Icon name="pin" size={11} className="text-[#006341] shrink-0" />
                      <span className="truncate">
                        {selectedSpot.ghat?.name
                          ? `${selectedSpot.ghat.name} · ${selectedSpot.ghat.distanceM ? `${selectedSpot.ghat.distanceM}m walk` : '5 min walk'}`
                          : selectedSpot.address || selectedSpot.zone?.name || 'Nashik Kumbh Sector'}
                      </span>
                    </div>

                    {/* Availability Meter */}
                    {selectedSpot.capacity > 0 && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-[#4A4A4A] tabular-nums">
                            <strong className="text-[#17212B] font-mono">{Math.max(0, selectedSpot.spotsLeft ?? 0)}</strong> of{' '}
                            <span className="font-mono">{selectedSpot.capacity}</span> bays free
                          </span>
                          {selectedSpot.spotsLeft > 0 && selectedSpot.spotsLeft <= 3 && (
                            <span className="rounded bg-[#FDE68A]/60 px-1 py-0.2 text-[9px] font-extrabold text-[#B45309] uppercase">
                              Only {selectedSpot.spotsLeft} left
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              selectedSpot.spotsLeft <= 0
                                ? 'bg-gray-400'
                                : (selectedSpot.spotsLeft / selectedSpot.capacity) > 0.5
                                  ? 'bg-[#006341]'
                                  : (selectedSpot.spotsLeft / selectedSpot.capacity) >= 0.2
                                    ? 'bg-[#E9A83A]'
                                    : 'bg-[#D9483B]'
                            )}
                            style={{
                              width: `${Math.max(0, Math.min(100, Math.round(((selectedSpot.spotsLeft ?? 0) / selectedSpot.capacity) * 100)))}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[#17212B]/10 pt-2">
                  <div>
                    <span className="text-[17px] font-black text-[#17212B] font-mono tabular-nums">
                      ₹{selectedSpot.from ?? selectedSpot.priceHour}
                    </span>
                    <span className="text-[10px] font-bold text-[#717573] ml-0.5">/hr</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate(selectedSpot)}
                        className="inline-flex items-center gap-1 rounded-xl bg-white border border-[#17212B]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#17212B] hover:border-[#006341] hover:text-[#006341] transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="Navigate from your location"
                      >
                        <Icon name="navigation" size={12} className="text-[#006341]" />
                        <span>Route</span>
                      </button>
                    )}

                    <Link to={`/listing/${selectedSpot.id}`}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-xl bg-[#E9A83A] hover:bg-[#D4932A] px-3.5 py-1.5 text-[11.5px] font-extrabold text-[#17212B] shadow-xs transition-all cursor-pointer border border-[#C5821F] active:scale-95"
                      >
                        <span>Reserve Bay</span>
                        <span>→</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lowest Row: Compact Legend + Legal Map Attribution */}
        <div className="pointer-events-auto flex w-full flex-wrap items-center justify-between gap-2">
          {/* Compact Map Legend (Single Row, Small Dots) */}
          <div className="flex items-center gap-2.5 rounded-full border border-white/60 glass-panel px-3 py-1 text-[10px] font-bold text-[#292C2B] shadow-sm">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#006341]" /> Avail
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#F2B544]" /> Limited
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#9CA3AF]" /> Full
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#181B1A] ring-1 ring-[#FFD900]" /> Selected
            </span>
          </div>

          {/* Legal Attribution Chip */}
          <div className="rounded-full border border-white/50 glass-panel px-2.5 py-0.5 text-[9.5px] font-medium text-[#717573] shadow-2xs">
            © <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a>
          </div>
        </div>
      </div>
    </div>
  )
}
