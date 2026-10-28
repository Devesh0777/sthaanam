import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * High-accuracy Geolocation hook for Sthanam.
 * Uses navigator.geolocation.watchPosition with high accuracy, tracks the reading
 * with the lowest accuracy (in meters), stops early once accuracy <= 30m, and
 * enforces a 15-second cap. Cleans up watchers cleanly on unmount.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null) // [lat, lng]
  const [accuracy, setAccuracy] = useState(null) // meters
  const [speed, setSpeed] = useState(null) // m/s
  const [heading, setHeading] = useState(null) // degrees
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)
  const [unsupported, setUnsupported] = useState(
    () => typeof navigator === 'undefined' || !navigator.geolocation,
  )
  const [error, setError] = useState(null)

  const watchIdRef = useRef(null)
  const timerIdRef = useRef(null)
  const bestReadingRef = useRef(null)

  const clear = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerIdRef.current != null) {
      clearTimeout(timerIdRef.current)
      timerIdRef.current = null
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    return () => {
      clear()
    }
  }, [clear])

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUnsupported(true)
      setLoading(false)
      const msg = 'Geolocation is not supported by your browser or connection is insecure (requires HTTPS/localhost).'
      setError(msg)
      return Promise.reject(new Error(msg))
    }

    clear()
    setLoading(true)
    setDenied(false)
    setError(null)
    bestReadingRef.current = null

    return new Promise((resolve, reject) => {
      let resolved = false

      const finishWithReading = (reading) => {
        if (resolved) return
        resolved = true
        clear()

        const lat = Number(reading.coords.latitude.toFixed(6))
        const lng = Number(reading.coords.longitude.toFixed(6))
        const userCoords = [lat, lng]
        const acc = Math.round(reading.coords.accuracy || 0)
        const spd = reading.coords.speed != null ? Number(reading.coords.speed.toFixed(1)) : null
        const hdg = reading.coords.heading != null ? Math.round(reading.coords.heading) : null

        setCoords(userCoords)
        setAccuracy(acc)
        setSpeed(spd)
        setHeading(hdg)
        setLoading(false)

        resolve({
          lat,
          lng,
          latlng: userCoords,
          accuracy: acc,
          speed: spd,
          heading: hdg,
          timestamp: reading.timestamp,
        })
      }

      // 15 second maximum wait for high accuracy lock
      timerIdRef.current = setTimeout(() => {
        if (bestReadingRef.current) {
          finishWithReading(bestReadingRef.current)
        } else {
          clear()
          const timeoutErr = new Error('Location request timed out. Please check your GPS signal or pick a starting point.')
          timeoutErr.name = 'TimeoutError'
          setError(timeoutErr.message)
          reject(timeoutErr)
        }
      }, 15000)

      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const acc = position.coords.accuracy || 9999
            // Update best reading if lower accuracy (lower number = tighter precision)
            if (!bestReadingRef.current || acc < bestReadingRef.current.coords.accuracy) {
              bestReadingRef.current = position
            }

            // Stop early if high precision fix (<= 30 meters)
            if (acc <= 30) {
              finishWithReading(position)
            }
          },
          (err) => {
            if (bestReadingRef.current) {
              // We have at least one previous reading, finish with it
              finishWithReading(bestReadingRef.current)
              return
            }
            clear()
            if (err.code === 1 || err.code === err.PERMISSION_DENIED) {
              setDenied(true)
              setError('Location permission denied. Please allow location in your browser settings or choose a preset entry point.')
            } else if (err.code === 2 || err.code === err.POSITION_UNAVAILABLE) {
              setError('GPS position is currently unavailable. Please turn on device location or pick a preset.')
            } else if (err.code === 3 || err.code === err.TIMEOUT) {
              setError('Location request timed out. Please retry or select a preset.')
            } else {
              setError(err.message || 'Unable to retrieve location')
            }
            reject(err)
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0, // Always get a fresh reading
          },
        )
      } catch (e) {
        clear()
        setError(e.message || 'Geolocation error')
        reject(e)
      }
    })
  }, [clear])

  return {
    coords,
    accuracy,
    speed,
    heading,
    isApproximate: accuracy != null && accuracy > 100,
    loading,
    denied,
    unsupported,
    error,
    locate,
    clear,
  }
}

export default useGeolocation
