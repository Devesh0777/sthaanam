import { cn } from '@/lib/cn'
import { getSpaceType } from '@/lib/spaceTypes'

/**
 * 24x24 SVG line-art paths for authentic space types.
 * Styled with stroke 1.8 for clean, crisp rendering on high-DPI displays.
 */
const TYPE_SVG_PATHS = {
  garage: [
    'M3 10L12 3l9 7',
    'M4 10.5v9.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.5',
    'M7 14h10',
    'M7 17h10',
    'M7 20h10',
  ],
  open: [
    'M4 7V4h3',
    'M17 4h3v3',
    'M4 17v3h3',
    'M17 20h3v-3',
    'M9 12h6',
    'M12 9v6',
  ],
  driveway: [
    'M4 5v14',
    'M20 5v14',
    'M4 8.5h5',
    'M15 8.5h5',
    'M4 13.5h5',
    'M15 13.5h5',
    'M9 19.5l3-9 3 9',
  ],
  temple: [
    'M12 2l4 7H8l4-7z',
    'M12 2v3l2.5-1.5z',
    'M6 9h12v11H6z',
    'M10 20v-5a2 2 0 0 1 4 0v5',
  ],
  farmhouse: [
    'M3 13L8 9l5 4v7H3v-7z',
    'M6 20v-4h3v4',
    'M16.5 12a3 3 0 0 0-2.5-2.9 3.5 3.5 0 0 1 6.8-1 3 3 0 0 1 1.7 4.9h-6',
    'M18 19v-6',
  ],
  railway: [
    'M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V4z',
    'M8 6h8v4H8z',
    'M8.5 14.5h.01',
    'M15.5 14.5h.01',
    'M4 21l3-2',
    'M20 21l-3-2',
  ],
  dharamsala: [
    'M4 7l8-4 8 4',
    'M2 12l10-4 10 4',
    'M6 12v8',
    'M10 12v8',
    'M14 12v8',
    'M18 12v8',
    'M3 20h18',
  ],
  multilevel: [
    'M3 7l9-4 9 4-9 4-9-4z',
    'M3 12l9 4 9-4',
    'M3 17l9 4 9-4',
  ],
  parking: [
    'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
    'M9 17V7h4.5a3.5 3.5 0 0 1 0 7H9',
  ],
}

/**
 * 56px rounded-square tile with soft forest-green tint background,
 * dark-green line icon, and tiny gold corner accent for Instant QR listings.
 */
export function SpaceTypeIcon({
  listing,
  size = 'default', // 'default' (56px), 'lg' (64px), 'sm' (44px)
  className = '',
  showInstantDot = true,
}) {
  const typeInfo = getSpaceType(listing)
  const paths = TYPE_SVG_PATHS[typeInfo.icon] || TYPE_SVG_PATHS.parking
  const isInstant = Boolean(listing?.instantBook)

  const sizeClasses = {
    sm: 'size-11 rounded-xl',
    default: 'size-14 rounded-2xl', // 56px exactly
    lg: 'size-16 rounded-2xl',
  }[size] || 'size-14 rounded-2xl'

  const iconSize = {
    sm: 22,
    default: 26,
    lg: 30,
  }[size] || 26

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center bg-[#EAF2EC] border border-[#006B4F]/25 text-[#005A36] shadow-2xs transition-transform duration-200 group-hover:scale-102 select-none',
        sizeClasses,
        className,
      )}
      title={`${typeInfo.label}${isInstant ? ' • Instant QR Booking' : ''}`}
      aria-label={typeInfo.label}
    >
      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.85}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>

      {/* Tiny gold corner accent for Instant QR listings */}
      {showInstantDot && isInstant && (
        <span
          className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#E9A83A] border-2 border-white shadow-xs"
          title="Instant QR Booking Available"
          aria-label="Instant booking enabled"
        />
      )}
    </div>
  )
}

export default SpaceTypeIcon
