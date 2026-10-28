import { Skeleton } from '@/components/ui/Skeleton'

/**
 * Result-card placeholder matching the 56px SpaceTypeIcon + 4-row card layout.
 * No spinners, smooth pulse animation with identical proportions.
 */
export default function ParkingCardSkeleton() {
  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-[#E2DDD3] bg-white p-3 shadow-2xs">
      {/* 56px SpaceTypeIcon Tile Placeholder */}
      <Skeleton className="size-14 rounded-2xl shrink-0" />

      {/* Right Column Rows */}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
        {/* Row 1: Title & Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/3 rounded" />
          </div>
          <Skeleton className="h-5 w-14 rounded shrink-0" />
        </div>

        {/* Row 2: Landmark & Hours */}
        <Skeleton className="h-3 w-1/2 rounded" />

        {/* Row 3: Availability Meter */}
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-24 rounded" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>

        {/* Row 4: Chips */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>

        {/* Footer: Rating & Action Button */}
        <div className="mt-1 flex items-center justify-between border-t border-[#E8E1D6]/70 pt-2">
          <Skeleton className="h-3.5 w-16 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-14 rounded-lg" />
            <Skeleton className="h-6 w-18 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
