import Icon from '@/components/ui/Icon'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function AdminKpiRow({
  pendingCount = 3,
  liveBookingsCount = 28,
  openIncidentsCount = 2,
  grossToday = 24500,
  onKpiClick,
}) {
  const kpis = [
    {
      id: 'pending',
      targetTab: 'verifications',
      filterValue: 'pending',
      label: 'Pending Verifications',
      value: `${pendingCount}`,
      delta: pendingCount > 0 ? '+2 submitted today' : 'Queue clear',
      statusNote: pendingCount > 0 ? 'Requires Inspector Review' : 'Up to date',
      tone: 'amber',
      icon: 'shield',
      sparkline: [1, 2, 1, 3, 2, 4, pendingCount],
    },
    {
      id: 'live',
      targetTab: 'live-ops',
      filterValue: 'all',
      label: 'Live Bookings',
      value: `${liveBookingsCount}`,
      delta: '+18% vs morning snan',
      statusNote: 'Active in Compounds',
      tone: 'emerald',
      icon: 'car',
      pulse: true,
      sparkline: [14, 18, 22, 26, 24, 28, liveBookingsCount],
    },
    {
      id: 'incidents',
      targetTab: 'issues',
      filterValue: 'open',
      label: 'Open Incidents',
      value: `${openIncidentsCount}`,
      delta: openIncidentsCount > 0 ? '2 high priority' : 'All clear',
      statusNote: openIncidentsCount > 0 ? 'Action Required' : 'Zero unresolved',
      tone: openIncidentsCount > 0 ? 'coral' : 'emerald',
      icon: 'alert',
      sparkline: [3, 2, 4, 3, 2, 2, openIncidentsCount],
    },
    {
      id: 'gross',
      targetTab: 'analytics',
      filterValue: '7d',
      label: 'Gross Booked (Today)',
      value: money(grossToday),
      delta: '+14% daily velocity',
      statusNote: '₹1.73L 7-day cumulative',
      tone: 'emerald',
      icon: 'trendUp',
      sparkline: [14200, 18600, 26400, 38900, 34200, 16800, grossToday],
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => (
        <button
          key={kpi.id}
          type="button"
          onClick={() => onKpiClick?.(kpi.targetTab, kpi.filterValue)}
          className="rounded-3xl border border-white/70 glass-panel-strong p-4 shadow-sm hover:shadow-md hover:border-[#006B4F]/40 transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578] truncate">
              {kpi.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-mono font-bold shrink-0',
                kpi.tone === 'amber'
                  ? 'bg-[#FFF8E7] text-[#B47C10] border border-[#E9A83A]/30'
                  : kpi.tone === 'coral'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-[#E7F1EA] text-[#075B3D]',
              )}
            >
              {kpi.pulse && <span className="size-1.5 rounded-full bg-[#075B3D] animate-pulse" />}
              {kpi.delta}
            </span>
          </div>

          {/* Value + Sparkline */}
          <div className="mt-2.5 flex items-end justify-between gap-2 w-full">
            <div>
              <p className="text-[22px] sm:text-[26px] font-black font-mono text-[#17212B] leading-none tracking-tight">
                {kpi.value}
              </p>
              <span className="text-[10.5px] font-bold text-[#6B7578] mt-1.5 block group-hover:text-[#075B3D] transition-colors">
                {kpi.statusNote} →
              </span>
            </div>

            {/* Sparkline Graphic */}
            <div className="w-16 h-8 shrink-0 flex items-end pb-0.5" aria-hidden="true">
              <SparklineSvg data={kpi.sparkline} tone={kpi.tone} />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function SparklineSvg({ data = [], tone = 'emerald' }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 64
  const height = 24
  const padding = 2

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((val - min) / range) * (height - 2 * padding)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const strokeColor =
    tone === 'amber' ? '#D99A2B' : tone === 'coral' ? '#DC2626' : '#075B3D'
  const fillColor =
    tone === 'amber' ? '#E9A83A' : tone === 'coral' ? '#EF4444' : '#075B3D'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="size-full overflow-visible">
      <defs>
        <linearGradient id={`kpi-spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#kpi-spark-${tone})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width - padding}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
        r="2"
        fill={strokeColor}
      />
    </svg>
  )
}
