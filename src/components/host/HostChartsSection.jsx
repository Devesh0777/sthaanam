import { useState } from 'react'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'

const EARNINGS_7D = [
  { day: 'Wed', date: 'Oct 01', amount: 840, bookings: 7, occupancy: 58 },
  { day: 'Thu', date: 'Oct 02', amount: 1120, bookings: 9, occupancy: 68 },
  { day: 'Fri', date: 'Oct 03', amount: 1450, bookings: 12, occupancy: 82 },
  { day: 'Sat', date: 'Oct 04', amount: 1980, bookings: 16, occupancy: 94, peak: true },
  { day: 'Sun', date: 'Oct 05', amount: 1850, bookings: 15, occupancy: 91 },
  { day: 'Mon', date: 'Oct 06', amount: 960, bookings: 8, occupancy: 60 },
  { day: 'Today', date: 'Oct 07', amount: 1274, bookings: 10, occupancy: 78, current: true },
]

const EARNINGS_30D = [
  { day: 'Week 1', date: 'Sep 10–16', amount: 7850, bookings: 62, occupancy: 64 },
  { day: 'Week 2', date: 'Sep 17–23', amount: 9474, bookings: 77, occupancy: 76 },
  { day: 'Week 3', date: 'Sep 24–30', amount: 14200, bookings: 114, occupancy: 95, peak: true, note: 'Shahi Snan Peak' },
  { day: 'Week 4', date: 'Oct 01–07', amount: 9026, bookings: 73, occupancy: 74, current: true },
]

const HOURLY_DEMAND = [
  { time: '4 AM', hour: '04:00', rate: 45, bookings: 4, note: 'Brahma Muhurta' },
  { time: '6 AM', hour: '06:00', rate: 88, bookings: 11, note: 'Morning Snan', peak: true },
  { time: '8 AM', hour: '08:00', rate: 94, bookings: 12, note: 'Mandir Darshan', peak: true },
  { time: '10 AM', hour: '10:00', rate: 76, bookings: 9 },
  { time: '12 PM', hour: '12:00', rate: 60, bookings: 7, note: 'Midday Lull' },
  { time: '2 PM', hour: '14:00', rate: 52, bookings: 6 },
  { time: '4 PM', hour: '16:00', rate: 70, bookings: 8 },
  { time: '6 PM', hour: '18:00', rate: 92, bookings: 11, note: 'Godavari Aarti', peak: true },
  { time: '8 PM', hour: '20:00', rate: 82, bookings: 10 },
  { time: '10 PM', hour: '22:00', rate: 38, bookings: 4 },
]

const WEEKDAY_DEMAND = [
  { time: 'Mon', bookings: 8, rate: 60 },
  { time: 'Tue', bookings: 7, rate: 55 },
  { time: 'Wed', bookings: 7, rate: 58 },
  { time: 'Thu', bookings: 9, rate: 68 },
  { time: 'Fri', bookings: 12, rate: 82 },
  { time: 'Sat', bookings: 16, rate: 94, peak: true, note: 'Pilgrim Influx' },
  { time: 'Sun', bookings: 15, rate: 91, peak: true },
]

export default function HostChartsSection() {
  const [earningsView, setEarningsView] = useState('7d') // '7d' | '30d'
  const [demandView, setDemandView] = useState('hourly') // 'hourly' | 'weekday'
  const [hoveredEarnings, setHoveredEarnings] = useState(null)
  const [hoveredDemand, setHoveredDemand] = useState(null)

  const earningsData = earningsView === '7d' ? EARNINGS_7D : EARNINGS_30D
  const totalEarnings = earningsData.reduce((sum, item) => sum + item.amount, 0)
  const maxEarnings = Math.max(...earningsData.map((d) => d.amount)) * 1.15 || 2000

  const demandData = demandView === 'hourly' ? HOURLY_DEMAND : WEEKDAY_DEMAND
  const maxDemand = Math.max(...demandData.map((d) => d.rate)) || 100

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* =========================================================================
          CHART 1: EARNINGS CHART (7D / 30D TOGGLE)
      ========================================================================= */}
      <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 shadow-2xs lg:col-span-7 space-y-4">
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E4DA] pb-3">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
              REVENUE PERFORMANCE
            </span>
            <h3 className="text-[16px] font-black text-[#17212B] font-heading">
              Earnings Trajectory
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#E7F1EA] px-2.5 py-1 text-[12px] font-mono font-black text-[#075B3D]">
              {money(totalEarnings)} Total
            </span>

            {/* 7d / 30d Toggle Button */}
            <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E4DA]">
              <button
                type="button"
                onClick={() => setEarningsView('7d')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer',
                  earningsView === '7d'
                    ? 'bg-[#075B3D] text-white shadow-2xs'
                    : 'text-[#6B7578] hover:text-[#17212B]',
                )}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setEarningsView('30d')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer',
                  earningsView === '30d'
                    ? 'bg-[#075B3D] text-white shadow-2xs'
                    : 'text-[#6B7578] hover:text-[#17212B]',
                )}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Polished Visualizer */}
        <div className="pt-2">
          <div className="relative flex h-40 items-end justify-between gap-2 sm:gap-3 px-2">
            {/* Horizontal Guide Lines */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#E8E4DA]" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#E8E4DA]" />

            {earningsData.map((item) => {
              const heightPercent = Math.max(14, Math.round((item.amount / maxEarnings) * 100))
              const isHovered = hoveredEarnings?.day === item.day

              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setHoveredEarnings(item)}
                  onMouseLeave={() => setHoveredEarnings(null)}
                  className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer z-10"
                >
                  {/* Interactive Tooltip */}
                  {isHovered && (
                    <div className="pointer-events-none absolute -top-16 z-30 rounded-xl bg-[#17212B] p-2.5 text-white shadow-lg whitespace-nowrap animate-[pop-in_0.15s_ease-out]">
                      <p className="text-[10px] font-mono uppercase text-[#E9A83A] font-bold">
                        {item.day} • {item.date}
                      </p>
                      <p className="text-[13px] font-black font-mono mt-0.5">
                        {money(item.amount)}
                      </p>
                      <p className="text-[10px] text-white/80 font-mono">
                        {item.bookings} bookings • {item.occupancy}% occupancy
                      </p>
                    </div>
                  )}

                  {/* Bar with Kumbh Green + Gold Peak */}
                  <div className="w-full relative flex flex-col items-center justify-end h-full">
                    {item.peak && (
                      <span className="absolute -top-5 text-[9px] font-bold text-[#D99A2B] bg-[#FFF8E7] px-1 rounded border border-[#E9A83A]/30 whitespace-nowrap">
                        ★ Peak
                      </span>
                    )}
                    <div
                      className={cn(
                        'w-full rounded-t-xl transition-all duration-300',
                        item.peak
                          ? 'bg-gradient-to-t from-[#075B3D] to-[#E9A83A] shadow-xs'
                          : item.current
                            ? 'bg-[#075B3D] ring-2 ring-[#075B3D]/30'
                            : 'bg-[#DDE9E1] hover:bg-[#075B3D] group-hover:bg-[#075B3D]',
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span
                    className={cn(
                      'mt-2 text-[11px] font-mono font-bold transition-colors truncate',
                      item.current ? 'text-[#075B3D]' : 'text-[#6B7578]',
                    )}
                  >
                    {item.day}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between border-t border-[#E8E4DA] pt-2.5 text-[11px] text-[#6B7578]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#E9A83A]" />
              {earningsView === '7d'
                ? 'Saturday generated highest weekend revenue (+38% mela peak).'
                : 'Week 3 coincided with sacred Shahi Snan dates.'}
            </span>
            <span className="font-bold text-[#17212B] font-mono">
              Daily Avg: {money(Math.round(totalEarnings / (earningsView === '7d' ? 7 : 30)))}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CHART 2: BOOKINGS BY HOUR OR WEEKDAY CHART
      ========================================================================= */}
      <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 shadow-2xs lg:col-span-5 space-y-4">
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E4DA] pb-3">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
              PILGRIM DEMAND DYNAMICS
            </span>
            <h3 className="text-[16px] font-black text-[#17212B] font-heading">
              {demandView === 'hourly' ? 'Bookings by Hour' : 'Bookings by Weekday'}
            </h3>
          </div>

          <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E4DA]">
            <button
              type="button"
              onClick={() => setDemandView('hourly')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer',
                demandView === 'hourly'
                  ? 'bg-[#075B3D] text-white shadow-2xs'
                  : 'text-[#6B7578] hover:text-[#17212B]',
              )}
            >
              Hourly
            </button>
            <button
              type="button"
              onClick={() => setDemandView('weekday')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold uppercase transition-all cursor-pointer',
                demandView === 'weekday'
                  ? 'bg-[#075B3D] text-white shadow-2xs'
                  : 'text-[#6B7578] hover:text-[#17212B]',
              )}
            >
              Weekday
            </button>
          </div>
        </div>

        {/* Demand Bars & Milestones */}
        <div className="space-y-2 pt-1 max-h-[175px] overflow-y-auto no-scrollbar">
          {demandData.map((d) => {
            const isHovered = hoveredDemand?.time === d.time
            return (
              <div
                key={d.time}
                onMouseEnter={() => setHoveredDemand(d)}
                onMouseLeave={() => setHoveredDemand(null)}
                className={cn(
                  'flex items-center gap-2.5 text-[11px] p-1 rounded-lg transition-colors cursor-default',
                  isHovered ? 'bg-[#FAF7F2]' : '',
                )}
              >
                <span className="w-12 font-mono font-bold text-[#6B7578] shrink-0">
                  {d.time}
                </span>

                <div className="relative flex-1 h-3 rounded-full bg-[#E7F1EA] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      d.peak ? 'bg-[#075B3D]' : 'bg-[#075B3D]/70',
                    )}
                    style={{ width: `${Math.round((d.rate / maxDemand) * 100)}%` }}
                  />
                </div>

                <span className="w-10 text-right font-mono font-black text-[#17212B] shrink-0">
                  {d.rate}%
                </span>

                {d.note && (
                  <span
                    className={cn(
                      'hidden sm:inline text-[9.5px] font-bold shrink-0 truncate max-w-[105px] px-1.5 py-0.5 rounded',
                      d.peak
                        ? 'bg-[#FFF8E7] text-[#B47C10] border border-[#E9A83A]/30'
                        : 'text-[#6B7578] bg-[#FAF7F2]',
                    )}
                  >
                    {d.note}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[#E8E4DA] pt-2 text-[11px] text-[#6B7578]">
          <span className="font-semibold text-[#075B3D]">
            {demandView === 'hourly'
              ? 'Peak Windows: Morning Snan (6–8 AM) & Aarti (6 PM)'
              : 'Saturday & Sunday represent 40% of total weekly volume'}
          </span>
          <span className="font-mono font-bold text-[#17212B]">
            {demandView === 'hourly' ? '12 Bays Max' : '77 Total'}
          </span>
        </div>
      </div>
    </div>
  )
}
