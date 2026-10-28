import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSpot, getSpotReviews, setSaved } from '@/api'
import { hostById } from '@/api/mock/hosts'
import { VEHICLE_TYPES } from '@/api/mock/spots'
import { cn } from '@/lib/cn'
import { metres, money } from '@/lib/format'
import { AVAILABILITY } from '@/lib/status'
import { useAsync } from '@/hooks/useAsync'
import { useGeolocation } from '@/hooks/useGeolocation'
import { calculateRoute, NASHIK_ENTRY_POINTS } from '@/lib/routing'
import { ghatPoints } from '@/api/mock/zones'
import { PageShell } from '@/components/layout/PageShell'
import KumbhMap from '@/components/map/KumbhMap'
import BookingSheet from '@/components/booking/BookingSheet'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import StatusPill from '@/components/ui/StatusPill'
import { Avatar, Rating, VerifiedBadge } from '@/components/ui/Bits'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { useApp } from '@/context/AppContext'

const FEATURE_ICON = {
  covered: 'home',
  gate: 'lock',
  cctv: 'video',
  floodlight: 'bulb',
  caretaker: 'user',
  water: 'droplet',
  ev: 'bolt',
  wide: 'wide',
}

const VEHICLE_ICON = { '2w': 'bike', car: 'car', bus: 'bus' }

export default function ListingDetail() {
  const { id } = useParams()
  return <ListingView key={id} id={id} />
}

function ListingView({ id }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { isSaved, toggleSaved } = useApp()

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  const { data: spot, loading, error, reload } = useAsync(() => getSpot(id), [id])
  const { data: reviews } = useAsync(() => getSpotReviews(id), [id])

  const host = useMemo(() => hostById(spot?.hostId), [spot?.hostId])
  const availability = AVAILABILITY[spot?.availability] ?? AVAILABILITY.available

  const { locate } = useGeolocation()
  const [navRoute, setNavRoute] = useState(null)
  const [navLoading, setNavLoading] = useState(false)
  const [userCoords, setUserCoords] = useState(null)
  const [userLabel, setUserLabel] = useState('Your Location')

  const hasHostPhotos = useMemo(
    () => Array.isArray(spot?.photos) && spot.photos.length > 0,
    [spot?.photos],
  )

  const nearestLandmark = useMemo(() => {
    if (!spot) return null
    const found = ghatPoints.find(
      (g) => g.name.toLowerCase() === spot.ghat?.name?.toLowerCase(),
    )
    if (found) return found
    return ghatPoints[0] || { name: 'Ramkund', latlng: [20.0074, 73.7925] }
  }, [spot])

  const walkingTarget = useMemo(() => {
    if (!spot || !nearestLandmark) return null
    return {
      name: spot.ghat?.name || nearestLandmark.name,
      latlng: nearestLandmark.latlng,
      walkM: spot.walkM || 13,
      distanceM: spot.distanceM || 950,
    }
  }, [spot, nearestLandmark])

  const handleGetDirections = async (customOrigin = null) => {
    if (!spot) return
    setNavLoading(true)

    let origin = null
    let originTitle = 'Your Location'

    if (customOrigin) {
      origin = customOrigin.latlng
      originTitle = customOrigin.shortName || customOrigin.name
      setUserCoords(origin)
      setUserLabel(originTitle)
    } else {
      try {
        const pos = await locate()
        if (pos) {
          origin = pos
          originTitle = 'Your Location'
          setUserCoords(pos)
          setUserLabel('Your Location')
        }
      } catch {
        const fallback = NASHIK_ENTRY_POINTS[0]
        origin = fallback.latlng
        originTitle = fallback.shortName
        setUserCoords(origin)
        setUserLabel(fallback.shortName)
        toast.push({
          tone: 'info',
          title: 'Location Unavailable',
          message: `GPS permission unavailable. Showing route from ${fallback.name}.`,
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
      setNavRoute(routeRes)
      toast.push({
        tone: 'success',
        title: 'Route Plotted',
        message: `${routeRes.distanceLabel} · ${routeRes.drivingLabel} to compound`,
      })
    } catch (err) {
      toast.push({
        tone: 'danger',
        title: 'Routing Error',
        message: err.message || 'Unable to plot route.',
      })
    } finally {
      setNavLoading(false)
    }
  }

  if (error || (!loading && !spot)) {
    return (
      <PageShell>
        <ErrorState message="This parking listing is no longer available." onRetry={reload} className="pt-16" />
      </PageShell>
    )
  }

  if (!spot) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full" rounded="rounded-3xl" />
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-1/2" rounded="rounded-full" />
            <SkeletonText lines={4} />
          </div>
        </div>
      </PageShell>
    )
  }

  const isFilling = spot.availability === 'filling'
  const isFull = spot.availability === 'full'

  return (
    <PageShell>
      {/* -------------------- TOP ACTION BAR -------------------- */}
      <div className="sticky top-0 z-[600] border-b border-[#E8E1D6] bg-[#FAF7F2]/95 backdrop-blur-md px-4 py-2.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="flex items-center gap-1.5 rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-[13px] font-bold text-[#16191E] shadow-2xs hover:bg-[#F2EDE4] active:scale-95 transition-all"
          >
            <Icon name="chevronLeft" size={18} />
            <span>Back to listings</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const next = !isSaved(spot.id)
                toggleSaved(spot.id)
                await setSaved(spot.id, next)
                toast.push({ tone: 'success', title: next ? 'Saved' : 'Removed from saved', message: spot.title })
              }}
              aria-label="Save"
              className="grid size-9 place-items-center rounded-xl border border-[#E8E1D6] bg-white text-[#16191E] shadow-2xs hover:bg-[#F2EDE4] active:scale-95 transition-all"
            >
              <Icon
                name="heart"
                size={18}
                filled={isSaved(spot.id)}
                className={isSaved(spot.id) ? 'text-[#D9483B]' : ''}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href)
                toast.push({ tone: 'info', title: 'Listing link copied' })
              }}
              aria-label="Share"
              className="grid size-9 place-items-center rounded-xl border border-[#E8E1D6] bg-white text-[#16191E] shadow-2xs hover:bg-[#F2EDE4] active:scale-95 transition-all"
            >
              <Icon name="share" size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-8 pb-36">
        {/* =========================================================================
            PRIMARY HERO: LARGE PHYSICAL STHANAM PARKING SIGN
        ========================================================================= */}
        <div className="relative pt-2">
          {/* Subtle Suspension Mount Eyelets */}
          <div className="relative mx-auto flex w-[84%] justify-between px-6 sm:px-12 mb-[-8px]">
            <div className="flex flex-col items-center">
              <span className="size-3 rounded-full bg-[#8A95A5] border-2 border-[#1E293B]" />
              <div className="w-[2.5px] h-4 bg-gradient-to-b from-[#8A95A5] to-[#475569]" />
            </div>
            <div className="flex flex-col items-center">
              <span className="size-3 rounded-full bg-[#8A95A5] border-2 border-[#1E293B]" />
              <div className="w-[2.5px] h-4 bg-gradient-to-b from-[#8A95A5] to-[#475569]" />
            </div>
          </div>

          {/* Large Highway Green Signboard */}
          <div className="relative overflow-hidden rounded-3xl bg-[#006B4F] p-5 text-white shadow-2xl ring-4 ring-[#006B4F]/40 border-3 border-white sm:p-7">
            {/* Reflective Surface Sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/15" />

            {/* Heavy-Duty Corner Rivets */}
            <span className="absolute top-3 left-3 size-2.5 rounded-full bg-white/90 border border-[#003822] shadow-xs" />
            <span className="absolute top-3 right-3 size-2.5 rounded-full bg-white/90 border border-[#003822] shadow-xs" />
            <span className="absolute bottom-3 left-3 size-2.5 rounded-full bg-white/90 border border-[#003822] shadow-xs" />
            <span className="absolute bottom-3 right-3 size-2.5 rounded-full bg-white/90 border border-[#003822] shadow-xs" />

            {/* Sign Layout Content */}
            <div className="relative z-10 space-y-3.5">
              {/* Top Wayfinding Line */}
              <div className="flex items-center justify-between border-b border-white/30 pb-2 text-[11px] font-mono font-bold tracking-widest text-[#E9A83A] uppercase sm:text-[13px]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#FFD166] animate-pulse" />
                  STHAANAM • SECTOR {spot.zone?.short ?? 'NASHIK'}
                </span>
                <span>{spot.zone?.name?.toUpperCase()} ZONE</span>
              </div>

              {/* Main Spot Title & Address */}
              <div className="py-1">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase font-heading text-white drop-shadow-sm leading-tight">
                  {spot.title}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] sm:text-[14px] font-bold text-[#FAF7F2]/90">
                  <Icon name="pin" size={14} className="text-[#FFD166] shrink-0" />
                  <span>{spot.address}</span>
                </p>
              </div>

              {/* Highway Metrics Strip on Sign */}
              <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-3 border-t border-white/30">
                {/* Metric 1: Distance & Ghat */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-3.5 py-2.5 border border-white/40">
                  <span className="text-2xl font-black text-[#FFD166]">➔</span>
                  <div className="font-mono leading-tight">
                    <span className="text-[16px] sm:text-[18px] font-black tracking-tight text-white block">
                      {metres(spot.distanceM)}
                    </span>
                    <span className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase block">
                      TO {spot.ghat?.name?.toUpperCase() || 'RAMKUND'}
                    </span>
                  </div>
                </div>

                {/* Metric 2: Live Tariff Rate */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-3.5 py-2.5 border border-white/40">
                  <span className="text-xl font-black text-[#FFD166]">₹</span>
                  <div className="font-mono leading-tight">
                    <span className="text-[16px] sm:text-[18px] font-black tracking-tight text-white block">
                      {money(spot.priceHour)}
                      <span className="text-[11px] font-normal text-white/80">/HR</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase block">
                      OR {money(spot.priceDay)} / FULL DAY
                    </span>
                  </div>
                </div>

                {/* Metric 3: Live Availability Status */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-3.5 py-2.5 border border-white/40">
                  <span className={cn('size-3 rounded-full', isFull ? 'bg-red-400' : isFilling ? 'bg-[#FFD166]' : 'bg-emerald-400 animate-pulse')} />
                  <div className="font-mono leading-tight">
                    <span className="text-[14px] sm:text-[16px] font-black tracking-tight text-white block">
                      {spot.spotsLeft > 0 ? `${spot.spotsLeft} SPOTS FREE` : 'LOT FULL'}
                    </span>
                    <span className="text-[10px] font-bold text-[#FAF7F2]/80 uppercase block">
                      OF {spot.capacity} TOTAL BAYS
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Authority Tag */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Icon name="shield" size={13} className="text-[#FFD166]" />
                  100% VERIFIED PRIVATE COMPOUND
                </span>
                <span>GATE HOURS: {spot.checkInFrom} – {spot.checkOutBy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            STRUCTURED PARKING DETAILS & TRUST METRICS
        ========================================================================= */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column (Details, Amenities, Host, Map) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8E1D6] bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <Rating value={spot.rating} reviews={spot.reviews} size={15} />
                <span className="text-[#E8E1D6]">|</span>
                {spot.verified && <VerifiedBadge label="Verified Listing" />}
              </div>
              <StatusPill tone={availability.tone} label={availability.label} pulse={isFilling} />
            </div>

            {/* What this spot offers */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-2xs space-y-4">
              <h2 className="text-[16px] font-bold text-[#16191E] font-heading">
                Spot Amenities & Security Features
              </h2>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {(spot.features ?? []).map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 rounded-xl border border-[#E8E1D6] bg-[#FAF7F2] p-2.5"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#005A36] text-white shadow-2xs">
                      <Icon name={FEATURE_ICON[feature] ?? 'check'} size={14} />
                    </span>
                    <span className="text-[12px] font-bold text-[#16191E]">{featureLabelLocal(feature)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8E1D6]">
                {(spot.vehicles ?? []).map((vehicle) => {
                  const type = VEHICLE_TYPES.find((v) => v.id === vehicle)
                  return (
                    <span
                      key={vehicle}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-[12px] font-bold text-[#16191E]"
                    >
                      <Icon name={VEHICLE_ICON[vehicle]} size={14} className="text-[#005A36]" />
                      {type?.label ?? vehicle}
                    </span>
                  )
                })}
                {spot.clearanceM && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-[12px] font-bold text-[#16191E]">
                    <Icon name="ruler" size={14} className="text-[#005A36]" />
                    {spot.clearanceM}m clearance
                  </span>
                )}
                {spot.surface && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-[12px] font-bold text-[#16191E]">
                    <Icon name="layers" size={14} className="text-[#005A36]" />
                    {spot.surface}
                  </span>
                )}
              </div>
            </div>

            {/* About this spot & gate rules */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-2xs space-y-3">
              <h2 className="text-[16px] font-bold text-[#16191E] font-heading">
                About this Parking Compound
              </h2>
              <p className="text-[13px] leading-relaxed text-[#4A4A4A]">{spot.description}</p>
              {spot.rules?.length > 0 && (
                <div className="pt-2">
                  <p className="text-[12px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    Compound Rules & Guidelines
                  </p>
                  <ul className="space-y-1.5">
                    {spot.rules.map((rule) => (
                      <li key={rule} className="flex items-start gap-2 text-[12px] text-[#16191E]">
                        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-[#1B8347]" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Location & Approach Route (Phase 3 Requirement 2) */}
            <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-[#16191E] font-heading">
                  Location & Approach Route
                </h2>
                <div className="text-[11.5px] font-bold text-[#006341] flex items-center gap-1">
                  <Icon name="navigation" size={13} />
                  <span>{spot.zone?.name || 'Nashik'} Zone</span>
                </div>
              </div>

              {/* Find Parking Style Interactive Map Card (320-380px desktop, 260px mobile) */}
              <div className="relative h-[260px] sm:h-[350px] lg:h-[370px] overflow-hidden rounded-2xl border border-[#E8E1D6] shadow-2xs">
                <KumbhMap
                  spots={[{ ...spot, from: spot.priceHour }]}
                  center={spot.latlng}
                  zoom={15}
                  selectedId={spot.id}
                  interactive={true}
                  scrollZoomDisabledUntilFocus={true}
                  walkingTarget={walkingTarget}
                  route={navRoute}
                  userCoords={userCoords}
                  userLabel={userLabel}
                />

                {/* Small Glass Action Buttons on Map */}
                <div className="absolute top-3 right-3 z-[400] flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  {!navRoute ? (
                    <button
                      type="button"
                      onClick={() => handleGetDirections()}
                      disabled={navLoading}
                      className="inline-flex items-center gap-1.5 rounded-full glass-panel px-3 py-1.5 text-[11px] font-bold text-[#17212B] hover:bg-white shadow-xs border border-white/70 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {navLoading ? (
                        <span className="size-3 animate-spin rounded-full border-2 border-[#006341] border-t-transparent" />
                      ) : (
                        <Icon name="navigation" size={12} className="text-[#006341]" />
                      )}
                      <span>Directions to spot</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full glass-panel px-3 py-1 border border-white/70 shadow-xs">
                      <span className="text-[11px] font-bold text-[#006341]">🚗 {navRoute.drivingLabel}</span>
                      <span className="text-[#8C827A]">•</span>
                      <span className="text-[10px] font-mono font-bold text-[#17212B]">{navRoute.distanceLabel}</span>
                      <button
                        type="button"
                        onClick={() => setNavRoute(null)}
                        className="ml-1 text-[11px] font-bold text-[#D9483B] hover:underline cursor-pointer"
                        title="Clear Route"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <a
                    href={
                      navRoute?.googleMapsUrl ||
                      `https://www.google.com/maps/dir/?api=1&destination=${
                        Array.isArray(spot.latlng) ? spot.latlng[0] : spot.latlng?.lat
                      },${Array.isArray(spot.latlng) ? spot.latlng[1] : spot.latlng?.lng}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full glass-panel px-3 py-1.5 text-[11px] font-bold text-[#17212B] hover:bg-white shadow-xs border border-white/70 active:scale-95 transition-all"
                  >
                    <span>Open in Google Maps</span>
                    <Icon name="externalLink" size={11} className="text-[#006341]" />
                  </a>
                </div>
              </div>

              {/* Glass Info Row Below Map (Address, Walk Time, Approach Note) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-2xl glass-panel p-3.5 border border-white/60 shadow-xs text-[12px]">
                {/* Column 1: Address */}
                <div className="flex items-start gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#006341]/10 text-[#006341]">
                    <Icon name="pin" size={14} />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-bold text-[#17212B] leading-snug truncate">{spot.address}</span>
                    <span className="block text-[11px] text-[#6B6B6B]">{spot.zone?.name} Zone</span>
                  </div>
                </div>

                {/* Column 2: Walk to Landmark */}
                <div className="flex items-start gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#FFD900]/25 text-[#9E6A00]">
                    <Icon name="clock" size={14} />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-bold text-[#17212B] leading-snug">
                      {spot.walkM} min walk to {spot.ghat?.name || 'Panchavati'}
                    </span>
                    <span className="block text-[11px] text-[#6B6B6B]">{metres(spot.distanceM)} walking route</span>
                  </div>
                </div>

                {/* Column 3: Traffic / Mela Approach Note */}
                <div className="flex items-start gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#006341]/10 text-[#006341]">
                    <Icon name="layers" size={14} />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-bold text-[#17212B] leading-snug">
                      Approach: {spot.surface || 'Paved Road'}
                    </span>
                    <span className="block text-[11px] text-[#6B6B6B] truncate">
                      {spot.zone?.melaNote || 'Clear compound gate access'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Host Section */}
            {host && (
              <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={host.initials} size={46} />
                  <div>
                    <p className="text-[14px] font-bold text-[#16191E] flex items-center gap-1.5">
                      <span>{host.name}</span>
                      {host.verified && <Icon name="shield" size={14} className="text-[#1B8347]" />}
                    </p>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Verified Host since {host.since} • Responds {host.responseTime}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" icon={<Icon name="phone" size={14} />}>
                  Contact
                </Button>
              </div>
            )}
          </div>

          {/* Right Column (Secondary Photo Gallery & Booking Summary) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Gallery (Real Photos Only) OR Designed Space Card (Phase 3 Requirement 1) */}
            {hasHostPhotos ? (
              <div className="rounded-2xl border border-[#E8E1D6] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                    Compound & Gate Photos
                  </h3>
                  <span className="text-[11px] font-bold text-[#006341]">
                    {activePhotoIndex + 1} of {spot.photos.length}
                  </span>
                </div>

                {/* 16:10 Glass Gallery Display */}
                <div
                  onClick={() => setLightboxOpen(true)}
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#F2EDE4] border border-[#E8E1D6] cursor-zoom-in group"
                >
                  <img
                    src={spot.photos[activePhotoIndex]}
                    alt={`${spot.title} photo`}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 rounded-full glass-panel px-3 py-1 text-[11px] font-bold text-white transition-opacity shadow-md">
                      Click to Enlarge
                    </span>
                  </div>
                </div>

                {/* Thumbnails */}
                {spot.photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {spot.photos.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={cn(
                          'relative aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-pointer',
                          activePhotoIndex === idx
                            ? 'border-[#006341] ring-2 ring-[#006341]/30 scale-95'
                            : 'border-[#E8E1D6] opacity-75 hover:opacity-100',
                        )}
                      >
                        <img src={url} alt={`thumb-${idx}`} className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Designed Space Card (Phase 3 Requirement 1 when no host photos exist) */
              <div className="rounded-2xl border border-[#E8E1D6] bg-white p-5 shadow-2xs space-y-4">
                {/* Large Space-Type Icon Tile */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D6]">
                  <span className="grid size-13 shrink-0 place-items-center rounded-2xl bg-[#006341] text-[#FFD900] shadow-sm">
                    <Icon
                      name={
                        spot.vehicles?.includes('bus')
                          ? 'bus'
                          : spot.features?.includes('covered')
                            ? 'home'
                            : 'car'
                      }
                      size={26}
                    />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#006341] block">
                      Verified Parking Facility
                    </span>
                    <h3 className="text-[15px] font-black text-[#17212B] leading-snug">
                      {spot.vehicles?.includes('bus')
                        ? 'Heavy Vehicle & Bus Yard'
                        : spot.features?.includes('covered')
                          ? 'Covered Compound Bay'
                          : 'Private Gated Parking Compound'}
                    </h3>
                    <span className="text-[11px] text-[#6B6B6B] block">
                      {spot.surface || 'Paved surface'} •{' '}
                      {spot.clearanceM ? `${spot.clearanceM}m height clearance` : 'Open sky clearance'}
                    </span>
                  </div>
                </div>

                {/* Feature Chips from Spot Data */}
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6B6B6B] block mb-2">
                    Security & Facility Features
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(spot.features ?? []).map((feat) => (
                      <div
                        key={feat}
                        className="flex items-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-2.5 py-2 shadow-2xs text-[11.5px]"
                      >
                        <span className="grid size-5.5 shrink-0 place-items-center rounded-lg bg-[#006341]/10 text-[#006341]">
                          <Icon name={FEATURE_ICON[feat] ?? 'check'} size={12} />
                        </span>
                        <span className="font-bold text-[#17212B] truncate">{featureLabelLocal(feat)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bay-Grid Schematic with Free vs Occupied from Current Data */}
                <div className="rounded-xl border border-[#E8E1D6] bg-[#FAF7F2] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[12px] font-black uppercase tracking-wide text-[#17212B] font-heading">
                        Live Bay Schematic
                      </h4>
                      <p className="text-[10.5px] text-[#6B6B6B]">
                        {spot.spotsLeft} free of {spot.capacity} total bays
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-[#006341]">
                        <span className="size-2 rounded-full bg-[#006341]" /> Free ({spot.spotsLeft})
                      </span>
                      <span className="flex items-center gap-1 text-[#8C827A]">
                        <span className="size-2 rounded-full bg-[#D5CEBF]" /> Occupied (
                        {Math.max(0, spot.capacity - spot.spotsLeft)})
                      </span>
                    </div>
                  </div>

                  {/* Bay Grid Cells */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                    {Array.from({ length: Math.min(spot.capacity || 12, 24) }).map((_, idx) => {
                      const isFree = idx < spot.spotsLeft
                      return (
                        <div
                          key={idx}
                          title={isFree ? `Bay #${idx + 1} - Free` : `Bay #${idx + 1} - Occupied`}
                          className={cn(
                            'flex flex-col items-center justify-center py-2 rounded-lg border text-center transition-all',
                            isFree
                              ? 'bg-emerald-500/15 border-emerald-600/40 text-[#006341] shadow-2xs ring-1 ring-emerald-500/20'
                              : 'bg-[#EAE5DC]/60 border-[#D5CEBF] text-[#8C827A] opacity-60',
                          )}
                        >
                          <span className="text-[11px] font-black font-mono leading-none">
                            {isFree ? 'P' : '✕'}
                          </span>
                          <span className="text-[8.5px] font-bold uppercase mt-0.5 tracking-tight font-mono">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {spot.capacity > 24 && (
                    <p className="text-[10px] text-center text-[#8C827A] font-medium pt-0.5">
                      + {spot.capacity - 24} additional compound bays configured
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {reviews?.length > 0 && (
              <div className="rounded-2xl border border-[#E8E1D6] bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E1D6] pb-2.5">
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                    Pilgrim Reviews
                  </h3>
                  <span className="text-[12px] font-bold text-[#16191E] flex items-center gap-1">
                    <Icon name="star" size={13} filled className="text-[#FFD166]" />
                    {spot.rating} ({spot.reviews})
                  </span>
                </div>
                <div className="space-y-2.5">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="rounded-xl bg-[#FAF7F2] p-3 text-[12px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-[#16191E]">
                        <span>{review.author}</span>
                        <span className="text-[10px] font-normal text-[#6B6B6B]">{review.when}</span>
                      </div>
                      <p className="text-[#4A4A4A] leading-snug">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dominant Glass Sticky Book Now CTA Bar (Phase 3 Requirement 3) */}
      <div className="fixed inset-x-0 bottom-0 z-[750] border-t border-white/70 bg-[#FAF7F2]/90 shadow-2xl backdrop-blur-xl px-4 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
              Tariff from
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[24px] font-black text-[#16191E] leading-none">
                {money(spot.priceHour)}
              </span>
              <span className="text-[12px] font-bold text-[#6B6B6B]">/hr</span>
              <span className="text-[11px] text-[#6B6B6B] hidden sm:inline">• {money(spot.priceDay)}/day</span>
            </div>
          </div>

          <Button
            size="lg"
            variant="primary"
            disabled={isFull}
            onClick={() => setBookingOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 font-black text-[16px] uppercase tracking-wide bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] shadow-lg active:scale-[0.98] transition-all cursor-pointer"
            icon={<Icon name="bolt" size={18} strokeWidth={2.6} />}
          >
            {isFull ? 'Spot Full — Join Waitlist' : 'Book This Parking'}
          </Button>
        </div>
      </div>

      {/* Lightbox Modal for Real Host Photos */}
      {lightboxOpen && hasHostPhotos && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Close Lightbox"
          >
            <Icon name="x" size={24} />
          </button>
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={spot.photos[activePhotoIndex]}
              alt={`${spot.title} photo ${activePhotoIndex + 1}`}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
          <div className="mt-4 text-center text-white/90 text-sm font-bold">
            Photo {activePhotoIndex + 1} of {spot.photos.length}
          </div>
        </div>
      )}

      {/* Booking Sheet Modal */}
      <BookingSheet open={bookingOpen} onClose={() => setBookingOpen(false)} spot={spot} />
    </PageShell>
  )
}

function featureLabelLocal(id) {
  const map = {
    covered: 'Covered Bay',
    gate: 'Gated Compound',
    cctv: 'CCTV Surveillance',
    floodlight: 'Floodlights',
    caretaker: 'On-Site Caretaker',
    water: 'Drinking Water',
    ev: 'EV Charging',
    wide: 'Wide Bus Entry',
  }
  return map[id] ?? id
}
