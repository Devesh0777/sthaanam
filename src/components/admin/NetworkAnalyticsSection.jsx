import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'

const TREND_DATA_7D = [
  { day: 'Wed', date: 'Oct 01', revenue: 14200, bookings: 42 },
  { day: 'Thu', date: 'Oct 02', revenue: 18600, bookings: 56 },
  { day: 'Fri', date: 'Oct 03', revenue: 26400, bookings: 78 },
  { day: 'Sat', date: 'Oct 04', revenue: 38900, bookings: 114, peak: true },
  { day: 'Sun', date: 'Oct 05', revenue: 34200, bookings: 98 },
  { day: 'Mon', date: 'Oct 06', revenue: 16800, bookings: 48 },
  { day: 'Today', date: 'Oct 07', revenue: 24500, bookings: 72, current: true },
]

const TREND_DATA_30D = [
  { day: 'W1', date: 'Sep 10-16', revenue: 98400, bookings: 280 },
  { day: 'W2', date: 'Sep 17-23', revenue: 112000, bookings: 320 },
  { day: 'W3', date: 'Sep 24-30', revenue: 148500, bookings: 410 },
  { day: 'W4', date: 'Oct 01-07', revenue: 173600, bookings: 508, peak: true, current: true },
]

const TREND_DATA_MELA = [
  { day: 'Phase 1', date: 'Prep Week', revenue: 165000, bookings: 480 },
  { day: 'Phase 2', date: '1st Shahi Snan', revenue: 420000, bookings: 1240, peak: true },
  { day: 'Phase 3', date: 'Mid Mela Flow', revenue: 280000, bookings: 820 },
  { day: 'Phase 4', date: '2nd Shahi Snan', revenue: 510000, bookings: 1520, peak: true },
  { day: 'Phase 5', date: 'Valedictory', revenue: 195000, bookings: 590, current: true },
]

const DEMO_HOST_LEADERBOARD = [
  {
    rank: 1,
    name: 'Ganesh Wagh',
    spaces: 'Ramkund South Gate',
    bays: 30,
    rating: 4.9,
    gross: 40550,
    status: 'Settled',
  },
  {
    rank: 2,
    name: 'Ramesh Bhosale',
    spaces: 'School ground lease, Tapovan',
    bays: 45,
    rating: 4.8,
    gross: 36800,
    status: 'Settled',
  },
  {
    rank: 3,
    name: 'Suresh Patil',
    spaces: 'Panchavati Courtyard Lot',
    bays: 24,
    rating: 4.9,
    gross: 28400,
    status: 'Scheduled',
  },
  {
    rank: 4,
    name: 'Imran Shaikh',
    spaces: 'Godavari Ghat Overflow',
    bays: 20,
    rating: 4.7,
    gross: 22100,
    status: 'Scheduled',
  },
]

export default function NetworkAnalyticsSection({ overview }) {
  const [range, setRange] = useState('7d')
  const [hoveredTrend, setHoveredTrend] = useState(null)

  const activeTrendData =
    range === '30d' ? TREND_DATA_30D : range === 'mela' ? TREND_DATA_MELA : TREND_DATA_7D

  const maxVal = Math.max(...activeTrendData.map((d) => d.revenue), 1)
  const totalRevenue = activeTrendData.reduce((acc, d) => acc + d.revenue, 0)
  const totalBookings = activeTrendData.reduce((acc, d) => acc + d.bookings, 0)

  return (
    <div className="space-y-5">
      {/* =========================================================================
          ROW 1: BOOKINGS & REVENUE TRAJECTORY CHART (PALETTE: FOREST GREEN + GOLD + GRAYS)
      ========================================================================= */}
      <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E4DA] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                NETWORK DEMAND TRAJECTORY
              </span>
              <span className="rounded-full bg-[#E7F1EA] px-2 py-0.2 text-[9.5px] font-mono font-bold text-[#075B3D]">
                Verified Bookings
              </span>
            </div>
            <h3 className="text-[16px] font-black text-[#17212B] font-heading mt-0.5">
              Gross Bookings & Tariff Revenue
            </h3>
          </div>

          {/* Range Switcher */}
          <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E4DA]">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'mela', label: 'Full Mela' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  'rounded-lg px-3 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer',
                  range === r.id
                    ? 'bg-[#075B3D] text-white shadow-2xs'
                    : 'text-[#6B7578] hover:text-[#17212B]',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Visualizer */}
        <div className="pt-4">
          <div className="relative flex h-48 items-end justify-between gap-2 sm:gap-4 px-2">
            {/* Grid Guideline lines */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#E8E4DA]" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#E8E4DA]" />
            <div className="absolute inset-x-0 bottom-0 border-t border-[#E8E4DA]" />

            {activeTrendData.map((item) => {
              const heightPercent = Math.round((item.revenue / maxVal) * 100)
              const isHovered = hoveredTrend?.day === item.day

              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setHoveredTrend(item)}
                  onMouseLeave={() => setHoveredTrend(null)}
                  className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer z-10"
                >
                  {/* Floating Hover Tooltip */}
                  {isHovered && (
                    <div className="pointer-events-none absolute -top-18 z-30 rounded-xl bg-[#17212B] p-2.5 text-white shadow-xl whitespace-nowrap animate-in fade-in duration-100">
                      <p className="text-[10px] font-mono uppercase text-[#E9A83A] font-bold">
                        {item.day} • {item.date}
                      </p>
                      <p className="text-[14px] font-black font-mono mt-0.5">
                        {money(item.revenue)}
                      </p>
                      <p className="text-[10.5px] text-white/80 font-mono">
                        {item.bookings} vehicle reservations
                      </p>
                    </div>
                  )}

                  {/* Peak Tag */}
                  {item.peak && (
                    <span className="absolute -top-6 text-[9px] font-mono font-bold text-[#B47C10] bg-[#FFF8E7] px-1.5 py-0.2 rounded border border-[#E9A83A]/40 shadow-2xs">
                      ★ Peak
                    </span>
                  )}

                  {/* Bar */}
                  <div className="w-full max-w-[48px] relative flex flex-col items-center justify-end h-full">
                    <div
                      className={cn(
                        'w-full rounded-t-xl transition-all duration-300',
                        item.peak
                          ? 'bg-gradient-to-t from-[#075B3D] to-[#E9A83A] shadow-xs'
                          : item.current
                            ? 'bg-[#075B3D] ring-2 ring-[#075B3D]/30'
                            : 'bg-[#DDE9E1] hover:bg-[#0B7651] group-hover:bg-[#075B3D]',
                      )}
                      style={{ height: `${Math.max(12, heightPercent)}%` }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'mt-2.5 text-[11px] font-mono font-bold truncate max-w-full',
                      item.current ? 'text-[#075B3D]' : 'text-[#6B7578]',
                    )}
                  >
                    {item.day}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Metric Summary Footnotes */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E4DA] pt-3 text-[12px] text-[#6B7578]">
            <span>
              Period Aggregate Revenue:{' '}
              <strong className="text-[#17212B] font-mono font-bold">{money(totalRevenue)}</strong>
            </span>
            <span>
              Total Reservations:{' '}
              <strong className="text-[#075B3D] font-mono font-bold">
                {totalBookings} vehicles
              </strong>
            </span>
            <span>
              Average Velocity:{' '}
              <strong className="text-[#17212B] font-mono font-bold">
                {money(Math.round(totalRevenue / activeTrendData.length))} / interval
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: SECTOR LOAD (LEFT) + SNAN DEMAND WINDOWS & PAYMENT SPLIT (RIGHT)
      ========================================================================= */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Sector Load Progress Distribution */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-2xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                SECTOR MOBILITY DISTRIBUTION
              </span>
              <h3 className="text-[15px] font-black text-[#17212B] font-heading">
                Top Zone Volume & Pricing Load
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#6B7578]">
              {(overview?.zoneLoad || []).length} Sectors
            </span>
          </div>

          <div className="space-y-3">
            {(overview?.zoneLoad || []).map((zone) => (
              <div
                key={zone.id}
                className="rounded-xl bg-[#FAF7F2] border border-[#E8E4DA] p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-[#17212B]">{zone.name} Sector</span>
                  <span className="font-mono font-bold text-[11.5px] text-[#075B3D]">
                    {zone.rate}% Load • {zone.open} plots free
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#E8E4DA]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      zone.rate >= 80
                        ? 'bg-red-500'
                        : zone.rate >= 50
                          ? 'bg-[#075B3D]'
                          : 'bg-[#64748B]',
                    )}
                    style={{ width: `${zone.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Snan Demand Windows + Payment Status Split */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-2xs lg:col-span-5 space-y-4">
          {/* Snan Demand Windows */}
          <div className="space-y-2.5">
            <div className="border-b border-[#E8E4DA] pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                PEAK HOLY SNAN LOAD
              </span>
              <h3 className="text-[15px] font-black text-[#17212B] font-heading">
                Demand Windows
              </h3>
            </div>

            <div className="rounded-xl bg-[#E7F1EA] border border-[#075B3D]/20 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold uppercase text-[#075B3D]">
                  Morning Snan (04:00 – 09:00)
                </span>
                <span className="rounded bg-white/70 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#075B3D]">
                  94% Load
                </span>
              </div>
              <p className="text-[11.5px] text-[#4A4A4A]">
                Maximum demand along Ramkund & Panchavati Kund corridors.
              </p>
            </div>

            <div className="rounded-xl bg-[#FFF8E7] border border-[#E9A83A]/30 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold uppercase text-[#B47C10]">
                  Evening Aarti (17:30 – 20:30)
                </span>
                <span className="rounded bg-white/70 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#B47C10]">
                  88% Load
                </span>
              </div>
              <p className="text-[11.5px] text-[#4A4A4A]">
                Heavy pedestrian & 2W influx on Godavari Left Bank bridges.
              </p>
            </div>
          </div>

          {/* Payment Status Split */}
          <div className="border-t border-[#E8E4DA] pt-3 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
              Payment Settlement Distribution
            </span>

            {/* Segmented Bar */}
            <div className="h-2.5 rounded-full overflow-hidden flex bg-[#E8E4DA]">
              <div className="bg-[#075B3D]" style={{ width: '88%' }} title="88% Paid via UPI" />
              <div
                className="bg-[#E9A83A]"
                style={{ width: '8%' }}
                title="8% Pending Verification"
              />
              <div className="bg-red-400" style={{ width: '4%' }} title="4% Expired/Refunded" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7578] pt-1">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#075B3D]" />
                88% UPI Settled
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#E9A83A]" />
                8% Pending
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-400" />
                4% Expired
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: HOST LEADERBOARD (NO FIRST-LETTER AVATAR)
      ========================================================================= */}
      <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
              COMPOUND OPERATOR BENCHMARK
            </span>
            <h3 className="text-[15px] font-black text-[#17212B] font-heading">
              Host Leaderboard
            </h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#6B7578]">Top Rated Spaces</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#E8E4DA] text-[10.5px] font-mono font-bold uppercase text-[#6B7578]">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Host Operator</th>
                <th className="py-2 px-3">Primary Compound</th>
                <th className="py-2 px-3">Capacity</th>
                <th className="py-2 px-3">Rating</th>
                <th className="py-2 px-3">Gross Booked</th>
                <th className="py-2 px-3 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DA]/60">
              {DEMO_HOST_LEADERBOARD.map((host) => (
                <tr key={host.rank} className="hover:bg-[#FAF7F2]/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#6B7578]">#{host.rank}</td>
                  {/* Host Name with Person Icon */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/20 grid place-items-center shrink-0">
                        <Icon name="user" size={13} strokeWidth={2.2} />
                      </div>
                      <span className="font-bold text-[#17212B]">{host.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#4A4A4A]">{host.spaces}</td>
                  <td className="py-3 px-3 font-mono">{host.bays} bays</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-[#17212B]">
                      <Icon name="star" size={12} className="text-[#E9A83A]" filled />
                      {host.rating}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-[#075B3D]">
                    {money(host.gross)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase',
                        host.status === 'Settled'
                          ? 'bg-[#E7F1EA] text-[#075B3D]'
                          : 'bg-[#FFF8E7] text-[#B47C10]',
                      )}
                    >
                      {host.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
