import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getHostBookings,
  getHostListings,
  getHostSummary,
  markCheckedIn,
  markCheckedOut,
  setAccepting,
  updateHostListingPrice,
} from '@/api'
import { cn } from '@/lib/cn'
import { money, relativeDay, time } from '@/lib/format'
import { BOOKING_STATUS } from '@/lib/status'
import { useAsync } from '@/hooks/useAsync'
import HostShell from '@/components/host/HostShell'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import StatusPill from '@/components/ui/StatusPill'
import { Avatar, Rating } from '@/components/ui/Bits'
import { ErrorState } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toast'
import { useApp } from '@/context/AppContext'

import HostKpiRow from '@/components/host/HostKpiRow'
import HostChartsSection from '@/components/host/HostChartsSection'
import LiveArrivalsCard from '@/components/host/LiveArrivalsCard'
import HostPayoutsCard from '@/components/host/HostPayoutsCard'
import MySpacesSection from '@/components/host/MySpacesSection'

const TABS = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'spaces', label: 'My Spaces' },
  { id: 'bookings', label: 'Gate Bookings' },
  { id: 'payouts', label: 'UPI Settlements' },
]

const VEHICLE_ICON = { '2w': 'bike', car: 'car', bus: 'bus' }

export default function HostDashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const { host } = useApp()
  const [tab, setTab] = useState('overview')
  const [busyId, setBusyId] = useState(null)

  const { data: summary, loading: summaryLoading } = useAsync(() => getHostSummary(), [])
  const { data: listings, loading: listingsLoading, error, reload: reloadListings } = useAsync(
    () => getHostListings(),
    [],
  )
  const { data: bookings, reload: reloadBookings } = useAsync(() => getHostBookings(), [])

  // Derived metrics from real data
  const activeBookings = useMemo(() => bookings?.filter((b) => b.status === 'active') ?? [], [bookings])
  const upcomingBookings = useMemo(() => bookings?.filter((b) => b.status === 'upcoming') ?? [], [bookings])
  const historyBookings = useMemo(
    () => bookings?.filter((b) => b.status === 'completed' || b.status === 'cancelled') ?? [],
    [bookings],
  )

  const counts = useMemo(
    () => ({
      overview: 0,
      spaces: listings?.length ?? 0,
      bookings: (activeBookings.length + upcomingBookings.length),
      payouts: 0,
    }),
    [listings, activeBookings, upcomingBookings],
  )

  // Derived month earnings
  const earningsMonth = useMemo(() => {
    if (!listings?.length) return 40550
    const sum = listings.reduce((acc, l) => acc + (Number(l.earnings) || 0), 0)
    return sum || 40550
  }, [listings])

  // Gate Check-in / Check-out handler
  const toggleCheckIn = async (booking) => {
    setBusyId(booking.id)
    try {
      if (booking.status === 'upcoming') {
        await markCheckedIn(booking.id)
        toast.push({
          tone: 'success',
          title: 'Checked in',
          message: `${booking.plate} is now parked at your compound.`,
        })
      } else {
        await markCheckedOut(booking.id)
        toast.push({
          tone: 'success',
          title: 'Checked out',
          message: `${booking.plate} has vacated the bay.`,
        })
      }
      reloadBookings()
      reloadListings()
    } catch (err) {
      toast.push({
        tone: 'error',
        title: 'Could not update',
        message: err.friendlyMessage ?? err.message,
      })
    } finally {
      setBusyId(null)
    }
  }

  // Toggle accepting bookings for listing
  const handleToggleAccepting = async (listing, accepting) => {
    try {
      await setAccepting(listing.id, accepting)
      toast.push({
        tone: 'info',
        title: accepting ? 'Accepting bookings' : 'Paused bookings',
        message: accepting
          ? `"${listing.title}" can now accept pilgrim reservations.`
          : `"${listing.title}" is paused and hidden from search.`,
      })
      reloadListings()
    } catch (err) {
      toast.push({ tone: 'error', title: 'Could not update', message: err.message })
    }
  }

  // Price update handler
  const handleUpdatePrice = async ({ spotId, priceHour, priceDay }) => {
    try {
      await updateHostListingPrice(spotId, { priceHour, priceDay })
      toast.push({
        tone: 'success',
        title: 'Tariff updated',
        message: `Rates set to ${money(priceHour)}/hr and ${money(priceDay)}/day.`,
      })
      reloadListings()
    } catch (err) {
      toast.push({ tone: 'error', title: 'Could not update price', message: err.message })
    }
  }

  return (
    <HostShell>
      {/* ----------------- 1. HOST HEADER WITH PERSON AVATAR & ACTIONS ----------------- */}
      <div className="border-b border-[#E8E4DA] bg-[#F7F4ED] px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Host Identity with Person SVG Avatar (No first-letter circles) */}
            <div className="flex items-center gap-4">
              <Avatar size={54} tone="sage" className="ring-2 ring-[#075B3D]/25 shadow-xs" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                    Welcome back,
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F1EA] px-2 py-0.5 text-[10px] font-mono font-black text-[#075B3D] uppercase tracking-wider border border-[#075B3D]/25">
                    <Icon name="shield" size={11} strokeWidth={2.5} />
                    Verified Host
                  </span>
                </div>

                <h1 className="text-[20px] sm:text-[24px] font-black tracking-tight text-[#17212B] font-heading">
                  {host.name}
                </h1>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#6B7578]">
                  <Rating value={host.rating} reviews={host.reviews} size={13} />
                  <span>•</span>
                  <span>Hosting since {host.since}</span>
                  <span>•</span>
                  <span className="text-[#075B3D] font-bold">Avg response {host.responseTime}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions: Solid Gold "+ Add new space" Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                size="md"
                onClick={() => navigate('/host/new')}
                className="bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] font-black text-[13.5px] uppercase tracking-wide px-5 py-2.5 rounded-xl shadow-sm active:scale-98 cursor-pointer"
                icon={<Icon name="plus" size={16} strokeWidth={2.6} />}
              >
                + Add New Space
              </Button>
              <Link
                to="/admin"
                className="rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-2 text-[12px] font-bold text-[#17212B] hover:bg-[#FAF7F2] transition-all shadow-2xs"
              >
                Admin Console
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* ----------------- 2. CLEAN NAVIGATION TABS ----------------- */}
        <div className="border-b border-[#E8E4DA]">
          <nav className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
            {TABS.map((item) => {
              const count = counts[item.id]
              const isActive = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'relative flex items-center gap-2 pb-3 pt-1 text-[13px] font-bold transition-colors whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'text-[#075B3D] font-black after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[#075B3D] after:rounded-full'
                      : 'text-[#6B7578] hover:text-[#17212B]',
                  )}
                >
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-black',
                        isActive ? 'bg-[#E7F1EA] text-[#075B3D]' : 'bg-[#E8E4DA] text-[#6B7578]',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* =========================================================================
            TAB 1: DASHBOARD OVERVIEW (4 KPIS + 2 CHARTS + LIVE ARRIVALS + PAYOUTS)
        ========================================================================= */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* 4 KPI Cards Row with Sparklines */}
            <HostKpiRow
              earningsMonth={earningsMonth}
              bookingsWeek={77}
              avgOccupancy={summary?.occupancy ?? 76}
              rating={host.rating ?? 4.9}
              reviewsCount={host.reviews ?? 212}
              loading={summaryLoading}
            />

            {/* 2 Charts Section */}
            <HostChartsSection />

            {/* Live Arrivals / Gate Manifest */}
            <LiveArrivalsCard
              bookings={bookings ?? []}
              onToggleCheckIn={toggleCheckIn}
              busyId={busyId}
            />

            {/* Payouts Card */}
            <HostPayoutsCard
              pendingAmount={summary?.earningsToday ?? 1463}
              paidOutMonth={22654}
              upiId="sunita@okhdfc"
            />
          </div>
        )}

        {/* =========================================================================
            TAB 2: MY SPACES (STEP-2 SPACETYPEICON CARDS + STATUS TABS + ACTIONS)
        ========================================================================= */}
        {tab === 'spaces' && (
          <div className="space-y-4">
            {listingsLoading && <div className="h-44 rounded-2xl bg-white border border-[#E8E4DA] animate-pulse" />}
            {error && <ErrorState message={error.friendlyMessage} onRetry={reloadListings} />}

            <MySpacesSection
              listings={listings ?? []}
              onToggleAccepting={handleToggleAccepting}
              onUpdatePrice={handleUpdatePrice}
              onReload={reloadListings}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 3: GATE BOOKINGS
        ========================================================================= */}
        {tab === 'bookings' && (
          <div className="space-y-6">
            {/* Active Bookings Group */}
            <BookingGroup
              title="Parked Vehicles (Active At Gate)"
              bookings={activeBookings}
              onToggle={toggleCheckIn}
              busyId={busyId}
            />

            {/* Upcoming Bookings Group */}
            <BookingGroup
              title="Upcoming Reservations"
              bookings={upcomingBookings}
              onToggle={toggleCheckIn}
              busyId={busyId}
            />

            {/* Completed & Cancelled History */}
            <BookingGroup
              title="Past Booking History"
              bookings={historyBookings}
              onToggle={toggleCheckIn}
              busyId={busyId}
              muted
            />
          </div>
        )}

        {/* =========================================================================
            TAB 4: UPI SETTLEMENTS & PAYOUTS
        ========================================================================= */}
        {tab === 'payouts' && (
          <div className="space-y-6">
            <HostPayoutsCard
              pendingAmount={summary?.earningsToday ?? 1463}
              paidOutMonth={22654}
              upiId="sunita@okhdfc"
            />

            {/* Detailed Statement Table */}
            <div className="rounded-3xl border border-[#E8E4DA] bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-[16px] font-black text-[#17212B] font-heading border-b border-[#E8E4DA] pb-2">
                Settlement Statement & Mela Fee Breakdown
              </h3>
              <ul className="space-y-2.5 text-[13px]">
                <li className="flex justify-between">
                  <span className="text-[#6B7578]">Gross Pilgrim Bookings</span>
                  <span className="font-bold font-mono text-[#17212B]">{money(24100)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[#6B7578]">Mela Platform Fee (6%)</span>
                  <span className="font-bold font-mono text-[#D96B5F]">− {money(1446)}</span>
                </li>
                <li className="flex justify-between border-t border-[#E8E4DA] pt-2 text-[15px] font-black">
                  <span>Net Disbursed Revenue</span>
                  <span className="font-mono text-[#075B3D]">{money(22654)}</span>
                </li>
              </ul>
              <div className="rounded-xl bg-[#FAF7F2] p-3 text-[11px] text-[#6B7578]">
                Weekly automatic payouts cycle every Monday at 09:00 AM IST. All festival transactions are directly compliant with municipal tax advisories.
              </div>
            </div>
          </div>
        )}
      </div>
    </HostShell>
  )
}

function BookingGroup({ title, bookings, onToggle, busyId, muted }) {
  if (!bookings.length) return null
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-black text-[#17212B] font-heading uppercase tracking-wider">
          {title} ({bookings.length})
        </h2>
      </div>

      <div className="space-y-2.5">
        {bookings.map((booking) => {
          const status = BOOKING_STATUS[booking.status]
          const canToggle = booking.status === 'active' || booking.status === 'upcoming'
          const isUpcoming = booking.status === 'upcoming'

          return (
            <div
              key={booking.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-2xs transition-all',
                isUpcoming
                  ? 'border-[#E6B84A]/60 ring-1 ring-[#E6B84A]/30'
                  : booking.status === 'active'
                    ? 'border-[#075B3D] ring-1 ring-[#075B3D]/20'
                    : 'border-[#E8E4DA]',
                muted && 'opacity-75',
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-xl font-mono text-white',
                    isUpcoming ? 'bg-[#D99A2B]' : booking.status === 'active' ? 'bg-[#075B3D]' : 'bg-[#64748B]',
                  )}
                >
                  <Icon name={VEHICLE_ICON[booking.vehicleType] || 'car'} size={18} />
                </span>

                <div className="min-w-0">
                  <p className="text-[15px] font-black font-mono text-[#17212B]">{booking.plate}</p>
                  <p className="text-[12px] text-[#6B7578] truncate">
                    {relativeDay(booking.startISO)} • {time(booking.startISO)} → {time(booking.endISO)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E4DA]">
                <span className="font-mono font-black text-[14px] text-[#17212B]">
                  {money(booking.amount)}
                </span>

                {canToggle ? (
                  <Button
                    size="sm"
                    variant={isUpcoming ? 'primary' : 'outline'}
                    loading={busyId === booking.id}
                    onClick={() => onToggle(booking)}
                    className={cn(
                      'font-bold text-[12px] px-4 cursor-pointer',
                      isUpcoming
                        ? 'bg-[#075B3D] hover:bg-[#064e34] text-white shadow-xs'
                        : 'border-[#17212B] hover:bg-[#FAF7F2]',
                    )}
                  >
                    {isUpcoming ? 'Mark Checked-In' : 'Mark Checked-Out'}
                  </Button>
                ) : (
                  <StatusPill tone={status.tone} label={status.label} size="sm" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
