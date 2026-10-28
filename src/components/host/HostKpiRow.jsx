import Icon from '@/components/ui/Icon'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'

export default function HostKpiRow({
  earningsMonth = 40550,
  bookingsWeek = 77,
  avgOccupancy = 76,
  rating = 4.9,
  reviewsCount = 212,
  loading = false,
}) {
  const kpis = [
    {
      id: 'earnings',
      label: 'Earnings This Month',
      value: loading ? '—' : money(earningsMonth),
      delta: '+14.2% vs last month',
      positive: true,
      sparkline: [20, 24, 22, 28, 32, 30, 38],
      tone: 'emerald',
    },
    {
      id: 'bookings',
      label: 'Bookings This Week',
      value: loading ? '—' : `${bookingsWeek}`,
      unit: 'reservations',
      delta: '+8% vs last week',
      positive: true,
      sparkline: [7, 9, 12, 16, 15, 8, 10],
      tone: 'emerald',
    },
    {
      id: 'occupancy',
      label: 'Average Occupancy',
      value: loading ? '—' : `${avgOccupancy}%`,
      unit: 'compound bays',
      delta: '+5% vs last week',
      positive: true,
      sparkline: [58, 68, 82, 94, 91, 60, 78],
      tone: 'emerald',
    },
    {
      id: 'rating',
      label: 'Host Rating',
      value: loading ? '—' : `${Number(rating).toFixed(1)} ★`,
      unit: `${reviewsCount} reviews`,
      delta: 'Top 5% in Nashik',
      positive: true,
      sparkline: [4.8, 4.8, 4.9, 4.9, 4.9, 4.9, 4.9],
      tone: 'amber',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="rounded-3xl border border-white/70 glass-panel-strong p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between"
        >
          {/* Header & Delta Pill */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578] truncate">
              {kpi.label}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9.5px] font-mono font-bold shrink-0',
                kpi.tone === 'amber'
                  ? 'bg-[#FFF8E7] text-[#B47C10] border border-[#E6B84A]/30'
                  : 'bg-[#E7F1EA] text-[#075B3D]',
              )}
            >
              {kpi.tone !== 'amber' && <Icon name="trendUp" size={10} strokeWidth={2.4} />}
              {kpi.delta}
            </span>
          </div>

          {/* Value + Sparkline Row */}
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div>
              <p className="text-[22px] sm:text-[26px] font-black font-mono text-[#17212B] leading-none tracking-tight">
                {kpi.value}
              </p>
              {kpi.unit && (
                <span className="text-[10.5px] font-medium text-[#6B7578] mt-1 block">
                  {kpi.unit}
                </span>
              )}
            </div>

            {/* Mini SVG Sparkline */}
            <div className="size-14 sm:w-16 sm:h-8 shrink-0 flex items-end pb-0.5" aria-hidden="true">
              <MiniSparkline data={kpi.sparkline} tone={kpi.tone} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniSparkline({ data = [], tone = 'emerald' }) {
  if (!data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 60
  const height = 24
  const padding = 2

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((val - min) / range) * (height - 2 * padding)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const strokeColor = tone === 'amber' ? '#D99A2B' : '#075B3D'
  const fillColor = tone === 'amber' ? '#E9A83A' : '#075B3D'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="size-full overflow-visible">
      <defs>
        <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${tone})`}
      />
      {/* Stroke line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest point dot */}
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
          r="2.5"
          fill={strokeColor}
        />
      )}
    </svg>
  )
}
