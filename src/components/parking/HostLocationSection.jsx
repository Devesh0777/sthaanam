import { useState, useCallback, useMemo } from 'react'
import { NASHIK_LANDMARKS, findNearestLandmark } from '@/data/landmarks'
import LandmarkPicker from '@/components/parking/LandmarkPicker'
import KumbhMap from '@/components/map/KumbhMap'
import { Field, Input, Select } from '@/components/ui/Field'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export default function HostLocationSection({
  form,
  setForm,
  zones = [],
  errors = {},
}) {
  const [gpsState, setGpsState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'success' | 'denied' | 'error'
    message: '',
    userCoords: null, // [lat, lng] from GPS
    accuracy: null, // in meters
  })

  const currentLat = form.latlng?.[0] ?? 19.9975
  const currentLng = form.latlng?.[1] ?? 73.7918
  const currentSource = form.locationSource || 'manual' // 'gps' | 'manual'

  // Recalculate nearest landmark when coordinates change
  const nearestInfo = useMemo(() => {
    return findNearestLandmark([currentLat, currentLng])
  }, [currentLat, currentLng])

  // Sync nearest landmark to form if nearestInfo changes and form landmark was not manually locked
  const handleCoordsChange = useCallback(
    (newLat, newLng, source = 'manual', accuracy = null) => {
      const nearest = findNearestLandmark([newLat, newLng])

      setForm((prev) => {
        const patch = {
          latlng: [newLat, newLng],
          locationSource: source,
          locationAccuracy: accuracy,
        }

        if (nearest) {
          patch.nearestLandmark = nearest
          patch.landmark = nearest.name
        }

        return { ...prev, ...patch }
      })

      // Try reverse geocoding if address is blank
      if (!form.address) {
        reverseGeocode(newLat, newLng).then((addr) => {
          if (addr) {
            setForm((prev) => (prev.address ? prev : { ...prev, address: addr }))
          }
        })
      }
    },
    [form.address, setForm],
  )

  // Geolocation trigger
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState({
        status: 'error',
        message: 'Unable to detect your location. Geolocation is not supported by your browser.',
        userCoords: null,
        accuracy: null,
      })
      return
    }

    setGpsState((prev) => ({ ...prev, status: 'loading', message: 'Detecting your location…' }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const lat = Number(latitude.toFixed(6))
        const lng = Number(longitude.toFixed(6))
        const accMeters = Math.round(accuracy)

        setGpsState({
          status: 'success',
          message: 'Location detected · Using your current location',
          userCoords: [lat, lng],
          accuracy: accMeters,
        })

        handleCoordsChange(lat, lng, 'gps', accMeters)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        if (err.code === err.PERMISSION_DENIED) {
          setGpsState({
            status: 'denied',
            message: 'Location permission is required to automatically detect your position.',
            userCoords: null,
            accuracy: null,
          })
        } else {
          setGpsState({
            status: 'error',
            message: 'Unable to detect your location. Please select the location manually on the map.',
            userCoords: null,
            accuracy: null,
          })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }, [handleCoordsChange])

  // Map focus configuration
  const mapFocus = useMemo(
    () => ({ latlng: [currentLat, currentLng], zoom: 17 }),
    [currentLat, currentLng],
  )

  // Map marker spot object
  const mapSpots = useMemo(() => {
    return [
      {
        id: 'host-pin',
        latlng: [currentLat, currentLng],
        priceHour: form.priceHour || 30,
        availability: 'available',
      },
    ]
  }, [currentLat, currentLng, form.priceHour])

  return (
    <div className="space-y-5">
      {/* 1. Zone Selector */}
      <Field label="Which zone is the spot in?" required>
        <Select
          value={form.zoneId}
          onChange={(event) => setForm((prev) => ({ ...prev, zoneId: event.target.value }))}
        >
          {(zones ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>

      {/* 2. Full Address */}
      <Field label="Full address" required error={errors.address} hint="Pilgrims see this after booking only.">
        <Input
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          placeholder="House no, street, landmark"
        />
      </Field>

      {/* 3. Nearest Famous Location & Compact Landmark Chip */}
      <div className="space-y-2">
        <LandmarkPicker
          value={form.nearestLandmark || nearestInfo}
          onChange={(landmark) =>
            setForm((prev) => ({
              ...prev,
              nearestLandmark: landmark,
              landmark: landmark?.name || '',
            }))
          }
          error={errors.nearestLandmark}
        />

        {(form.nearestLandmark || nearestInfo) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] font-mono font-bold uppercase text-[#6B7578]">
              Chosen Landmark:
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F1EA] border border-[#075B3D]/30 px-3 py-1 text-[11.5px] font-bold text-[#075B3D] shadow-2xs">
              <Icon name="pin" size={13} className="text-[#075B3D]" />
              <span>{(form.nearestLandmark || nearestInfo).name}</span>
              <span className="text-[10.5px] font-mono font-medium text-[#075B3D]/80">
                • {nearestInfo?.distanceFormatted || 'Direct walking access'} from gate pin
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Use My Current Location & Map Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] font-semibold text-text">Parking Location Pin</p>
            <p className="text-[12px] text-muted">
              Tap or drag on the map to place the exact gate pin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Main Use Current Location Button */}
            <button
              type="button"
              onClick={requestLocation}
              disabled={gpsState.status === 'loading'}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-brand bg-white px-3.5 py-2 text-[12px] font-bold text-brand shadow-sm transition-all active:scale-95 hover:bg-brand-soft disabled:opacity-50',
                gpsState.status === 'success' && 'bg-brand/10 border-brand',
              )}
            >
              {gpsState.status === 'loading' ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              ) : (
                <Icon name="navigation" size={15} className="shrink-0 text-brand" />
              )}
              <span>{gpsState.status === 'loading' ? 'Detecting...' : '📍 Use My Current Location'}</span>
            </button>

            {/* Recenter on me button if GPS coords exist */}
            {gpsState.userCoords && (
              <button
                type="button"
                onClick={() =>
                  handleCoordsChange(
                    gpsState.userCoords[0],
                    gpsState.userCoords[1],
                    'gps',
                    gpsState.accuracy,
                  )
                }
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-2 text-[12px] font-semibold text-muted shadow-sm transition-all hover:text-text active:scale-95"
                title="Recenter map on your GPS coordinates"
              >
                <Icon name="target" size={14} />
                <span>Recenter</span>
              </button>
            )}
          </div>
        </div>

        {/* GPS Status Notification Banner */}
        {gpsState.status !== 'idle' && (
          <div
            className={cn(
              'flex items-center justify-between rounded-[12px] p-3 text-[12px] font-semibold transition-all animate-[pop-in_0.2s_var(--ease-out-expo)]',
              gpsState.status === 'loading' && 'bg-accent-soft text-accent border border-accent/20',
              gpsState.status === 'success' && 'bg-brand-soft text-brand border border-brand/20',
              gpsState.status === 'denied' && 'bg-warning-soft text-warning border border-warning/30',
              gpsState.status === 'error' && 'bg-danger-soft text-danger border border-danger/30',
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                name={
                  gpsState.status === 'success'
                    ? 'checkCircle'
                    : gpsState.status === 'loading'
                    ? 'info'
                    : 'alertCircle'
                }
                size={16}
                className="shrink-0"
              />
              <span>{gpsState.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setGpsState((prev) => ({ ...prev, status: 'idle' }))}
              className="text-muted hover:text-text"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )}

        {/* Map Box Container */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line card-shadow">
          <div className="relative h-72">
            <KumbhMap
              spots={mapSpots}
              center={[currentLat, currentLng]}
              focus={mapFocus}
              onMapClick={(clickCoords) => {
                const lat = Number(clickCoords[0].toFixed(6))
                const lng = Number(clickCoords[1].toFixed(6))
                handleCoordsChange(lat, lng, 'manual', null)
              }}
            />

            {/* Custom Google-Maps Style Marker Pin */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-brand animate-[pop-in_0.2s_var(--ease-out-expo)]">
              <div className="flex flex-col items-center">
                <span className="grid size-8 place-items-center rounded-full bg-brand text-white shadow-lg ring-4 ring-white">
                  <Icon name="pin" size={18} filled />
                </span>
                <span className="size-2 rounded-full bg-brand/60" />
              </div>
            </div>

            {/* Source Tag Badge */}
            <div className="absolute bottom-3 left-3 z-[400]">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-md backdrop-blur-md',
                  currentSource === 'gps'
                    ? 'bg-brand text-white'
                    : 'bg-surface/90 text-text border border-line',
                )}
              >
                <Icon name={currentSource === 'gps' ? 'navigation' : 'pin'} size={12} />
                <span>{currentSource === 'gps' ? 'GPS Detected' : 'Manual Map Pin'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Coordinates and Distance Summary Display */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-surface-sunken p-3 text-[12px]">
          <div className="flex items-center gap-2 text-text font-semibold">
            <Icon name="target" size={15} className="text-brand" />
            <span>
              {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
            </span>
            {form.locationAccuracy && (
              <span className="text-muted font-normal">
                (Accuracy: ±{form.locationAccuracy}m)
              </span>
            )}
          </div>

          {nearestInfo && (
            <div className="text-right text-brand font-bold">
              📍 {nearestInfo.name} ({nearestInfo.distanceFormatted})
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * OpenStreetMap Nominatim reverse geocoding fallback
 */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.display_name) {
      // Pick address short parts if available
      const a = data.address || {}
      const parts = [
        a.house_number || a.building,
        a.road || a.pedestrian,
        a.suburb || a.neighbourhood || a.residential,
        a.city || a.town || 'Nashik',
      ].filter(Boolean)
      return parts.length ? parts.join(', ') : data.display_name
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err)
  }
  return null
}
