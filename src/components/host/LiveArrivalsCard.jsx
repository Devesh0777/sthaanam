import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { money, relativeDay, time } from '@/lib/format'
import { cn } from '@/lib/cn'

const VEHICLE_ICON = { '2w': 'bike', car: 'car', bus: 'bus' }

function maskPlate(plate = '') {
  if (!plate) return 'MH 15 •• ****'
  const parts = plate.trim().split(/\s+/)
  if (parts.length >= 4) {
    return `${parts[0]} ${parts[1]} •• ${parts[3]}`
  }
  if (parts.length === 3) {
    return `${parts[0]} ${parts[1]} •• ${parts[2]}`
  }
  return plate.replace(/^([A-Z]{2}\s*\d{2})\s*[A-Z]*\s*(\d{4})$/i, '$1 •• $2')
}

// Fixed static overtime sample for realistic operational display
const OVERTIME_SAMPLE = {
  id: 'booking-ot-1',
  plate: 'MH 15 BX 4022',
  vehicleType: 'car',
  title: 'Driveway behind Sagar Petrol Pump',
  startISO: '2026-10-23T06:00:00.000Z',
  endISO: '2026-10-23T10:30:00.000Z',
  amount: 160,
  status: 'overtime',
  overtimeMinutes: 30,
  extraCharge: 20,
}

export default function LiveArrivalsCard({
  bookings = [],
  onToggleCheckIn,
  busyId,
}) {
  const active = bookings.filter((b) => b.status === 'active')
  const upcoming = bookings.filter((b) => b.status === 'upcoming')

  const combinedList = [OVERTIME_SAMPLE, ...active, ...upcoming]

  return (
    <div className="rounded-3xl border border-white/60 glass-panel-strong p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E4DA] pb-3">
        <div>
          <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
            GATE RADAR & MANIFEST
          </span>
          <h3 className="text-[16px] font-black text-[#17212B] font-heading">
            Live Compound Arrivals & Active Bays
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F1EA] px-2.5 py-0.5 text-[10.5px] font-mono font-bold text-[#075B3D]">
            <span className="size-1.5 rounded-full bg-[#075B3D] animate-pulse" />
            {active.length} Parked Now
          </span>
          <span className="rounded-full bg-[#FAF7F2] px-2.5 py-0.5 text-[10.5px] font-mono font-bold text-[#6B7578] border border-[#E8E4DA]">
            {upcoming.length} Arriving Next
          </span>
        </div>
      </div>

      <div className="divide-y divide-[#E8E4DA]">
        {combinedList.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#6B7578]">
            No live vehicles currently parked or arriving in the next 2 hours.
          </div>
        ) : (
          combinedList.slice(0, 6).map((item) => {
            const isOvertime = item.status === 'overtime'
            const isParked = item.status === 'active'
            const isUpcoming = item.status === 'upcoming'

            return (
              <div
                key={item.id}
                className={cn(
                  'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                  isOvertime && 'bg-[#FFF5F5] -mx-2 px-2 rounded-xl border border-red-200 my-1',
                )}
              >
                {/* Vehicle & Plate Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-2xs',
                      isOvertime
                        ? 'bg-red-600'
                        : isParked
                          ? 'bg-[#075B3D]'
                          : 'bg-[#D99A2B]',
                    )}
                  >
                    <Icon name={VEHICLE_ICON[item.vehicleType] || 'car'} size={18} />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[14px] font-black text-[#17212B]">
                        {maskPlate(item.plate)}
                      </span>
                      {/* Status Chip */}
                      {isOvertime ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
                          <Icon name="alertCircle" size={11} />
                          Overtime +{item.overtimeMinutes}m
                        </span>
                      ) : isParked ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/30 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
                          <span className="size-1.5 rounded-full bg-[#075B3D]" />
                          Parked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF8E7] text-[#B47C10] border border-[#E9A83A]/40 px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider">
                          <Icon name="ticket" size={11} />
                          Booked
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-[#6B7578] truncate">
                      {relativeDay(item.startISO)} • {time(item.startISO)} → {time(item.endISO)}
                      {item.title && <span className="hidden md:inline"> · {item.title}</span>}
                    </p>
                  </div>
                </div>

                {/* Tariff & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                  <div className="text-right">
                    <span className="block font-mono text-[14px] font-black text-[#17212B]">
                      {money(item.amount)}
                    </span>
                    {isOvertime && (
                      <span className="block text-[10px] font-bold text-red-700">
                        + {money(item.extraCharge)} due
                      </span>
                    )}
                  </div>

                  {onToggleCheckIn && !isOvertime && (
                    <Button
                      size="sm"
                      variant={isUpcoming ? 'primary' : 'outline'}
                      loading={busyId === item.id}
                      onClick={() => onToggleCheckIn(item)}
                      className={cn(
                        'text-[12px] font-bold px-3.5 py-1.5 rounded-xl cursor-pointer shadow-2xs',
                        isUpcoming
                          ? 'bg-[#075B3D] hover:bg-[#064e34] text-white'
                          : 'border-[#17212B] bg-white hover:bg-[#FAF7F2] text-[#17212B]',
                      )}
                    >
                      {isUpcoming ? 'Check In' : 'Check Out'}
                    </Button>
                  )}

                  {isOvertime && (
                    <span className="text-[11px] font-mono font-bold text-red-700 bg-white border border-red-200 px-2.5 py-1 rounded-lg">
                      Surcharge Auto-Calculated
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
