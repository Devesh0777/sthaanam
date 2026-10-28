import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { km, money } from '@/lib/format'
import { walkMinutes } from '@/lib/geo'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import { SpaceTypeIcon } from '@/components/parking/SpaceTypeIcon'
import { getSpaceType } from '@/lib/spaceTypes'

/**
 * Sthanam Compact Parking Listing Card
 * - Replaces stock photos with semantic 56px SpaceTypeIcon tiles.
 * - 4-row compact layout: Title & Price, Area/Landmark line, Availability meter, Feature chips.
 * - Footer: Rating & Verified Host tick on left, Route & Solid Gold Reserve on right.
 * - High density: fits ~4 visible cards on 1440x900 screens without vertical overflow.
 */
export function ParkingCard({
  spot,
  plan = 'hour',
  selected = false,
  onHover,
  onSelect,
  onNavigate,
  index = 0,
  animate = false,
  originLabel,
}) {
  if (!spot) return null

  const isFull = spot.spotsLeft <= 0
  const isLimited = spot.spotsLeft > 0 && spot.spotsLeft <= 3
  const displayPrice = plan === 'day' ? spot.priceDay : spot.priceHour

  // Space type mapping
  const spaceType = getSpaceType(spot)

  // Availability meter calculation
  const hasCapacity = typeof spot.capacity === 'number' && spot.capacity > 0
  const spotsLeft = Math.max(0, spot.spotsLeft ?? 0)
  const capacity = spot.capacity || 1
  const pctFree = hasCapacity ? Math.max(0, Math.min(100, Math.round((spotsLeft / capacity) * 100))) : null

  // Meter color per spec: >50% green, 20-50% amber, <20% red
  const meterBarColor =
    pctFree == null
      ? 'bg-gray-300'
      : isFull
        ? 'bg-gray-400'
        : pctFree > 50
          ? 'bg-[#006341]'
          : pctFree >= 20
            ? 'bg-[#E9A83A]'
            : 'bg-[#D9483B]'

  // Build Landmark & Walk distance line
  let landmarkText = null
  if (spot.ghat?.name) {
    const distStr = spot.ghat.distanceM ? `${spot.ghat.distanceM}m walk` : `${spot.walkM || 5} min walk`
    landmarkText = `${spot.ghat.name} · ${distStr}`
  } else if (originLabel && spot.distanceKm != null) {
    landmarkText = `${km(spot.distanceKm)} · ${walkMinutes(spot.distanceKm)} min walk`
  } else if (spot.address) {
    landmarkText = spot.address
  } else if (spot.zone?.name) {
    landmarkText = `${spot.zone.name} Sector`
  }

  // Gate operating hours (show only if present and non-default)
  let gateHoursText = null
  if (
    spot.checkInFrom &&
    spot.checkOutBy &&
    !(spot.checkInFrom === '00:00' && (spot.checkOutBy === '24:00' || spot.checkOutBy === '23:59'))
  ) {
    gateHoursText = `Open ${spot.checkInFrom} – ${spot.checkOutBy}`
  }

  // Chips: Max 3 neutral chips (vehicle type, covered/open, gated/cctv)
  const chips = []
  if (Array.isArray(spot.vehicles) && spot.vehicles.length > 0) {
    const vLabels = spot.vehicles.map((v) => (v === '2w' ? '2W' : v === 'car' ? 'Car' : 'Bus'))
    chips.push({
      id: 'vehicles',
      icon: spot.vehicles.includes('bus') ? 'bus' : spot.vehicles.includes('car') ? 'car' : 'bike',
      text: vLabels.join(' / '),
    })
  }

  if (spot.features?.includes('covered')) {
    chips.push({ id: 'covered', icon: 'shield', text: 'Covered' })
  } else if (spot.surface) {
    chips.push({ id: 'open', icon: 'layers', text: spot.surface.split('/')[0].trim() })
  }

  if (chips.length < 3 && spot.features?.includes('gate')) {
    chips.push({ id: 'gate', icon: 'lock', text: 'Gated' })
  } else if (chips.length < 3 && spot.features?.includes('cctv')) {
    chips.push({ id: 'cctv', icon: 'video', text: 'CCTV' })
  } else if (chips.length < 3 && spot.features?.includes('ev')) {
    chips.push({ id: 'ev', icon: 'bolt', text: 'EV Point' })
  }

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Parking spot: ${spot.title}, price ₹${displayPrice} per ${plan === 'day' ? 'day' : 'hour'}`}
      onMouseEnter={() => onHover?.(spot.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onSelect?.(spot)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(spot)
        }
      }}
      className={cn(
        'group relative flex items-stretch gap-3 rounded-2xl p-3 transition-all duration-200 cursor-pointer select-none text-left',
        'focus-visible:ring-2 focus-visible:ring-[#006341] focus-visible:ring-offset-2 focus-visible:outline-none',
        selected
          ? 'glass-panel-strong border-2 border-[#006341] shadow-sm'
          : 'glass-panel-strong border border-white/70 shadow-2xs hover:border-[#006341]/60 hover:shadow-xs',
        animate && 'card-enter',
      )}
      style={animate ? { '--d': `${Math.min(index, 6) * 30}ms` } : undefined}
    >
      {/* =====================================================================
          56px SPACE TYPE ICON TILE (No stock photos)
      ===================================================================== */}
      <SpaceTypeIcon
        listing={spot}
        size="default"
        className="mt-0.5"
      />

      {/* =====================================================================
          RIGHT COLUMN: 4 COMPACT ROWS + ACTION FOOTER
      ===================================================================== */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        {/* ----------------- ROW 1: TITLE & PRICE BLOCK ----------------- */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13.5px] font-black uppercase font-heading text-[#17212B] tracking-tight truncate leading-tight group-hover:text-[#006341] transition-colors">
              {spot.title}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#006341]">
              {spaceType.label}
            </span>
          </div>

          <div className="text-right shrink-0 leading-none">
            <span className="text-[17px] font-black font-mono text-[#17212B] tabular-nums">
              {money(displayPrice)}
            </span>
            <span className="text-[10px] font-bold text-[#717573] ml-0.5">
              /{plan === 'day' ? 'day' : 'hr'}
            </span>
          </div>
        </div>

        {/* ----------------- ROW 2: AREA / LANDMARK & GATE HOURS ----------------- */}
        {(landmarkText || gateHoursText) && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#66706B] truncate">
            {landmarkText && (
              <span className="inline-flex items-center gap-1 truncate font-medium">
                <Icon name="pin" size={11} className="text-[#006341] shrink-0" />
                <span className="truncate">{landmarkText}</span>
              </span>
            )}
            {landmarkText && gateHoursText && <span className="text-[#D2D3D1]">•</span>}
            {gateHoursText && (
              <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-mono font-medium text-[#717573]">
                <Icon name="clock" size={10} className="shrink-0 text-[#717573]" />
                <span>{gateHoursText}</span>
              </span>
            )}
          </div>
        )}

        {/* ----------------- ROW 3: AVAILABILITY METER ----------------- */}
        {hasCapacity && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-[#4A4A4A] tabular-nums">
                {isFull ? (
                  <strong className="text-[#9CA3AF]">Lot Full</strong>
                ) : (
                  <span>
                    <strong className="text-[#17212B] font-mono">{spotsLeft}</strong> of{' '}
                    <span className="font-mono">{capacity}</span> bays free
                  </span>
                )}
              </span>

              {isLimited && (
                <span className="rounded bg-[#FDE68A]/60 px-1.5 py-0.2 text-[9.5px] font-extrabold text-[#B45309] uppercase tracking-wide">
                  Only {spotsLeft} left
                </span>
              )}
            </div>

            {/* Meter Progress Track */}
            <div
              className="h-1.5 w-full rounded-full bg-[#E5E7EB] overflow-hidden"
              role="progressbar"
              aria-valuenow={spotsLeft}
              aria-valuemin={0}
              aria-valuemax={capacity}
            >
              <div
                className={cn('h-full rounded-full transition-all duration-300', meterBarColor)}
                style={{ width: `${pctFree}%` }}
              />
            </div>
          </div>
        )}

        {/* ----------------- ROW 4: FEATURE CHIPS (MAX 3) ----------------- */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1 rounded-md bg-[#F3F4F6] border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#4B5563]"
              >
                <Icon name={chip.icon} size={11} className="text-[#6B7280]" />
                <span>{chip.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* ----------------- FOOTER: RATINGS & ACTION BUTTONS ----------------- */}
        <div className="mt-1 flex items-center justify-between border-t border-[#E8E1D6]/70 pt-2">
          {/* Left: Star Rating + Verified Badge */}
          <div className="flex items-center gap-2 text-[11px]">
            {spot.rating != null && (
              <span className="inline-flex items-center gap-1 font-bold text-[#17212B] tabular-nums">
                <span className="text-[#E9A83A]">★</span>
                <span>{spot.rating}</span>
                {spot.reviews != null && (
                  <span className="text-[10px] font-normal text-[#8A908E]">({spot.reviews})</span>
                )}
              </span>
            )}

            {spot.verified && (
              <span className="inline-flex items-center gap-0.5 rounded bg-[#EAF2EC] border border-[#006341]/20 px-1.5 py-0.5 text-[9.5px] font-bold text-[#006341]">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Right: Route (Ghost Button) + Reserve (Solid Gold) */}
          <div className="flex items-center gap-1.5">
            {onNavigate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(spot)
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D2D3D1] bg-white px-2 py-1 text-[11px] font-bold text-[#17212B] hover:border-[#006341] hover:text-[#006341] transition-all cursor-pointer shadow-2xs active:scale-95"
                title="View turn-by-turn route to this spot"
              >
                <Icon name="navigation" size={12} className="text-[#006341]" />
                <span>Route</span>
              </button>
            )}

            <Link
              to={`/listing/${spot.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-block"
            >
              <Button
                size="sm"
                className="bg-[#E9A83A] hover:bg-[#D4932A] text-[#17212B] font-extrabold text-[11px] px-3.5 py-1 rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer border border-[#C5821F]"
              >
                Reserve →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Skeleton with matching 56px tile and row proportions (no spinners).
 */
export function ParkingCardSkeleton() {
  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-[#E2DDD3] bg-white p-3 shadow-2xs animate-pulse">
      {/* 56px Tile Placeholder */}
      <div className="size-14 rounded-2xl bg-[#E8E5DD] shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        {/* Row 1 Skeleton */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-44 rounded bg-[#E8E5DD]" />
          <div className="h-4 w-12 rounded bg-[#E8E5DD]" />
        </div>

        {/* Row 2 Skeleton */}
        <div className="h-3 w-32 rounded bg-[#E8E5DD]/70" />

        {/* Row 3 Meter Skeleton */}
        <div className="space-y-1">
          <div className="h-2.5 w-24 rounded bg-[#E8E5DD]" />
          <div className="h-1.5 w-full rounded-full bg-[#E8E5DD]" />
        </div>

        {/* Row 4 Chips Skeleton */}
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-14 rounded-md bg-[#E8E5DD]/60" />
          <div className="h-4 w-14 rounded-md bg-[#E8E5DD]/60" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between border-t border-[#E8E1D6]/70 pt-2">
          <div className="h-4 w-20 rounded bg-[#E8E5DD]" />
          <div className="h-6 w-18 rounded-lg bg-[#E8E5DD]" />
        </div>
      </div>
    </div>
  )
}

export function ParkingCardWide({ spot, index, animate, originLabel, plan, selected, onSelect, onNavigate }) {
  return (
    <ParkingCard
      spot={spot}
      plan={plan}
      selected={selected}
      index={index}
      animate={animate}
      originLabel={originLabel}
      onSelect={onSelect}
      onNavigate={onNavigate}
    />
  )
}

export default ParkingCard
