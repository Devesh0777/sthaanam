import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { SpaceTypeIcon } from '@/components/parking/SpaceTypeIcon'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import PriceModal from './PriceModal'
import HostQRCard from '@/components/qr/HostQRCard'

export default function MySpacesSection({
  listings = [],
  onToggleAccepting,
  onUpdatePrice,
  onReload,
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'live' | 'pending' | 'paused'
  const [priceEditingSpot, setPriceEditingSpot] = useState(null)
  const [selectedSpotForQr, setSelectedSpotForQr] = useState(null)

  // Derived filtered listings
  const filtered = useMemo(() => {
    return listings.filter((item) => {
      // Status filter
      const isLive = item.published && item.verification === 'verified' && item.accepting
      const isPaused = !item.accepting
      const isPending = item.verification === 'pending'
      const isRejected = item.verification === 'rejected'

      if (statusFilter === 'live' && !isLive) return false
      if (statusFilter === 'paused' && !isPaused) return false
      if (statusFilter === 'pending' && (!isPending && !isRejected)) return false

      // Search query
      if (search.trim()) {
        const needle = search.toLowerCase()
        const haystack = [
          item.title,
          item.address,
          item.zone?.name,
          item.zone?.short,
          item.ghat?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }

      return true
    })
  }, [listings, statusFilter, search])

  const counts = useMemo(() => {
    return {
      all: listings.length,
      live: listings.filter((l) => l.published && l.verification === 'verified' && l.accepting).length,
      pending: listings.filter((l) => l.verification === 'pending' || l.verification === 'rejected').length,
      paused: listings.filter((l) => !l.accepting).length,
    }
  }, [listings])

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#E8E4DA] bg-white p-3 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Spaces', count: counts.all },
            { id: 'live', label: 'Live & Accepting', count: counts.live },
            { id: 'pending', label: 'Pending / Review', count: counts.pending },
            { id: 'paused', label: 'Paused', count: counts.paused },
          ].map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-[#075B3D] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] text-[#6B7578] hover:text-[#17212B] hover:bg-[#E8E4DA]',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[9.5px] font-mono font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E2DDD3] text-[#17212B]',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Icon
            name="search"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7578]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spaces by name or zone…"
            className="w-full rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] pl-8 pr-7 py-1.5 text-[12px] text-[#17212B] placeholder:text-[#8E979B] focus:bg-white focus:outline-none focus:border-[#075B3D]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8E979B] hover:text-[#17212B]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Spaces List or Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center space-y-4">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#E7F1EA] text-[#075B3D]">
            <Icon name="home" size={26} />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-[16px] font-black text-[#17212B] font-heading">
              {search ? 'No spaces match your search' : 'No spaces in this status'}
            </h3>
            <p className="text-[12.5px] text-[#6B7578]">
              {search
                ? `No listings found matching "${search}". Try adjusting your keywords.`
                : 'List your private compound, driveway, or ashram plot to earn guaranteed Kumbh Mela tariffs.'}
            </p>
          </div>
          <Button
            size="md"
            onClick={() => navigate('/host/new')}
            className="bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] font-black text-[13px] uppercase tracking-wide px-5 py-2.5 rounded-xl cursor-pointer shadow-sm"
            icon={<Icon name="plus" size={15} strokeWidth={2.4} />}
          >
            List your first space
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((listing) => {
            const isLive = listing.published && listing.verification === 'verified' && listing.accepting
            const isPaused = !listing.accepting
            const isPending = listing.verification === 'pending'
            const isRejected = listing.verification === 'rejected'

            const spotsLeft = listing.spotsLeft ?? 0
            const capacity = listing.capacity || 1
            const pctFree = Math.max(0, Math.min(100, Math.round((spotsLeft / capacity) * 100)))

            return (
              <article
                key={listing.id}
                className="overflow-hidden rounded-3xl border border-[#E8E4DA] bg-white shadow-2xs hover:shadow-xs transition-all duration-200"
              >
                {/* Reviewer Note Warning Banner (if rejected or pending) */}
                {isRejected && (
                  <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-start gap-2.5 text-[11.5px] text-red-800">
                    <Icon name="alertCircle" size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black uppercase tracking-wider text-red-900 font-mono">
                        Verification Issue • Action Required
                      </strong>
                      <span>
                        Photo of driveway gate clearance missing. Please update details with a clear shot of the entrance road to complete approval.
                      </span>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="bg-[#FFF8E7] border-b border-[#E6B84A]/40 px-4 py-2.5 flex items-start gap-2.5 text-[11.5px] text-[#B47C10]">
                    <Icon name="info" size={16} className="text-[#D99A2B] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black uppercase tracking-wider text-[#916208] font-mono">
                        Pending Field Inspection
                      </strong>
                      <span>
                        Physical verification scheduled with the municipal traffic team. Listings typically approve within 2–4 hours during the mela.
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Space Type Icon + Title + Location */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Step-2 SpaceTypeIcon (56px authentic line-art tile, NO photos) */}
                    <SpaceTypeIcon listing={listing} size="default" />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/listing/${listing.id}`}
                          className="text-[16px] font-black text-[#17212B] font-heading hover:text-[#075B3D] transition-colors truncate"
                        >
                          {listing.title}
                        </Link>

                        {/* Status Pill */}
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/25 px-2 py-0.5 text-[10px] font-mono font-black uppercase">
                            <span className="size-1.5 rounded-full bg-[#075B3D] animate-pulse" />
                            Live
                          </span>
                        ) : isPaused ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E8E4DA] text-[#6B7578] px-2 py-0.5 text-[10px] font-mono font-black uppercase">
                            Paused
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[10px] font-mono font-black uppercase">
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF8E7] text-[#B47C10] border border-[#E9A83A]/30 px-2 py-0.5 text-[10px] font-mono font-black uppercase">
                            Pending Review
                          </span>
                        )}
                      </div>

                      <p className="text-[12px] font-medium text-[#6B7578] truncate">
                        {listing.address || `${listing.zone?.name} Zone`}
                        {listing.ghat?.name && (
                          <span className="text-[#075B3D] font-bold">
                            {' '}• Near {listing.ghat.name} ({listing.ghat.distanceM ? `${listing.ghat.distanceM}m` : '4 min walk'})
                          </span>
                        )}
                      </p>

                      {/* Bays Progress Meter */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-[#E7F1EA]">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              pctFree > 50 ? 'bg-[#075B3D]' : pctFree >= 20 ? 'bg-[#E9A83A]' : 'bg-[#D9483B]',
                            )}
                            style={{ width: `${pctFree}%` }}
                          />
                        </div>
                        <span className="text-[11.5px] font-bold font-mono text-[#17212B]">
                          {spotsLeft} of {capacity} bays free
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tariff & This Month Earnings */}
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#E8E4DA] shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#6B7578] block">
                        TARIFF RATE
                      </span>
                      <span className="text-[15px] font-black font-mono text-[#17212B]">
                        {money(listing.priceHour)}/hr
                      </span>
                      <span className="text-[11px] text-[#6B7578] block">
                        {money(listing.priceDay)}/day
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#6B7578] block">
                        THIS MONTH
                      </span>
                      <span className="text-[18px] font-black font-mono text-[#075B3D] block">
                        {money(listing.earnings || 18400)}
                      </span>
                      <span className="text-[10.5px] font-medium text-[#6B7578]">
                        settled earnings
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E4DA] bg-[#FAF7F2] px-4 py-2.5 text-[12px]">
                  {/* Left Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPriceEditingSpot(listing)}
                      className="bg-white hover:bg-[#FAF7F2] text-[#17212B] font-bold text-[11.5px] px-3 py-1 rounded-xl shadow-2xs border-[#E8E4DA]"
                      icon={<Icon name="wallet" size={13} />}
                    >
                      Change Price
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleAccepting?.(listing, !listing.accepting)}
                      className={cn(
                        'font-bold text-[11.5px] px-3 py-1 rounded-xl shadow-2xs border-[#E8E4DA]',
                        listing.accepting
                          ? 'bg-white hover:bg-red-50 text-[#6B7578] hover:text-red-700'
                          : 'bg-[#E7F1EA] text-[#075B3D] hover:bg-[#d8e9dc]',
                      )}
                    >
                      {listing.accepting ? 'Pause Space' : 'Resume Space'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSpotForQr(selectedSpotForQr?.id === listing.id ? null : listing)}
                      className="bg-white hover:bg-[#FAF7F2] text-[#17212B] font-bold text-[11.5px] px-3 py-1 rounded-xl shadow-2xs border-[#E8E4DA]"
                      icon={<Icon name="qr" size={13} />}
                    >
                      {selectedSpotForQr?.id === listing.id ? 'Close Plaque' : 'Gate QR Plaque'}
                    </Button>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/host/new?edit=${listing.id}`)}
                      className="bg-white hover:bg-[#FAF7F2] text-[#17212B] font-bold text-[11.5px] px-3 py-1 rounded-xl shadow-2xs border-[#E8E4DA]"
                      icon={<Icon name="edit" size={13} />}
                    >
                      Edit
                    </Button>

                    <Link to={`/listing/${listing.id}`} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        className="bg-[#075B3D] hover:bg-[#064e34] text-white font-bold text-[11.5px] px-3 py-1 rounded-xl shadow-2xs"
                      >
                        View As Driver →
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Gate QR Plaque Expansion */}
                {selectedSpotForQr?.id === listing.id && (
                  <div className="p-4 border-t-2 border-[#075B3D] bg-[#FAF7F2] animate-in fade-in">
                    <HostQRCard spot={listing} />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* Quick Price Modal */}
      {priceEditingSpot && (
        <PriceModal
          spot={priceEditingSpot}
          isOpen={Boolean(priceEditingSpot)}
          onClose={() => setPriceEditingSpot(null)}
          onSave={async (patch) => {
            await onUpdatePrice?.(patch)
            onReload?.()
          }}
        />
      )}
    </div>
  )
}
