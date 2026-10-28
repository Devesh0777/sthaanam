import { useMemo, useState } from 'react'
import KumbhMap from '@/components/map/KumbhMap'
import Icon from '@/components/ui/Icon'
import { EmptyState } from '@/components/ui/Feedback'
import { cn } from '@/lib/cn'

const DEMO_LIVE_SESSIONS = [
  {
    id: 'ls1',
    plate: 'MH 15 BX 4022',
    space: 'Ramkund South Gate',
    zone: 'Ramkund',
    entryTime: '10:42 AM',
    plannedExit: '12:42 PM',
    status: 'overtime',
    overtimeMins: 32,
    surcharge: 20,
    vehicleType: 'car',
  },
  {
    id: 'ls2',
    plate: 'MH 15 AB 1234',
    space: 'Ramkund North Gate',
    zone: 'Ramkund',
    entryTime: '10:32 AM',
    plannedExit: '01:32 PM',
    status: 'active',
    vehicleType: 'car',
  },
  {
    id: 'ls3',
    plate: 'MH 04 ER 8890',
    space: 'Panchavati Courtyard',
    zone: 'Panchavati',
    entryTime: '10:18 AM',
    plannedExit: '02:18 PM',
    status: 'active',
    vehicleType: '2w',
  },
  {
    id: 'ls4',
    plate: 'MH 12 QP 5512',
    space: 'Tapovan Pilgrim Hub',
    zone: 'Tapovan',
    entryTime: '09:50 AM',
    plannedExit: '11:50 AM',
    status: 'completed',
    vehicleType: 'bus',
  },
  {
    id: 'ls5',
    plate: 'MH 15 KL 9901',
    space: 'Godavari Riverbank Bay',
    zone: 'Ramkund',
    entryTime: '09:15 AM',
    plannedExit: '11:15 AM',
    status: 'overtime',
    overtimeMins: 45,
    surcharge: 30,
    vehicleType: 'car',
  },
  {
    id: 'ls6',
    plate: 'MH 20 AZ 3341',
    space: 'Nilkanth Society Bay',
    zone: 'Panchavati',
    entryTime: '08:40 AM',
    plannedExit: '12:40 PM',
    status: 'active',
    vehicleType: 'car',
  },
  {
    id: 'ls7',
    plate: 'MH 14 TR 7720',
    space: 'Trimbak Highway Shaded Lot',
    zone: 'Trimbak Highway',
    entryTime: '08:15 AM',
    plannedExit: '01:15 PM',
    status: 'active',
    vehicleType: 'car',
  },
]

function maskPlate(plate = '') {
  const parts = plate.split(' ')
  if (parts.length >= 4) {
    return `${parts[0]} ${parts[1]} •• ${parts[3]}`
  }
  return plate.replace(/\b([A-Z0-9]{2})([A-Z0-9]{2})\b/g, '$1••')
}

export default function LiveOperationsSection({ spots = [] }) {
  const [selectedZone, setSelectedZone] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all') // all, active, overtime, completed
  const [selectedSpotId, setSelectedSpotId] = useState(null)

  // Zones from spots
  const zones = useMemo(() => {
    const set = new Set()
    for (const s of spots) {
      if (s.zone?.name) set.add(s.zone.name)
    }
    return Array.from(set)
  }, [spots])

  // Filtered spots for map
  const filteredSpots = useMemo(() => {
    if (selectedZone === 'all') return spots
    return spots.filter((s) => s.zone?.name === selectedZone)
  }, [spots, selectedZone])

  // Capacity calculations
  const stats = useMemo(() => {
    let totalBays = 0
    let freeBays = 0
    for (const s of filteredSpots) {
      totalBays += s.capacity || 10
      freeBays += s.spotsLeft ?? 0
    }
    const occupied = Math.max(0, totalBays - freeBays)
    const rate = totalBays > 0 ? Math.round((occupied / totalBays) * 100) : 0
    return { totalBays, freeBays, occupied, rate }
  }, [filteredSpots])

  // Filtered live sessions
  const filteredSessions = useMemo(() => {
    return DEMO_LIVE_SESSIONS.filter((sess) => {
      if (selectedZone !== 'all' && sess.zone !== selectedZone) return false
      if (sessionFilter === 'active' && sess.status !== 'active') return false
      if (sessionFilter === 'overtime' && sess.status !== 'overtime') return false
      if (sessionFilter === 'completed' && sess.status !== 'completed') return false
      return true
    })
  }, [selectedZone, sessionFilter])

  return (
    <div className="space-y-4">
      {/* =========================================================================
          CONTROL & FILTER BAR
      ========================================================================= */}
      <div className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578]">
            Sector Filter:
          </span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] px-3 py-1.5 text-[12px] font-bold text-[#17212B] focus:border-[#075B3D] focus:outline-none cursor-pointer"
          >
            <option value="all">All Sectors ({spots.length} plots)</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                Sector {z}
              </option>
            ))}
          </select>
        </div>

        {/* Live Capacity Quick Ticker */}
        <div className="flex items-center gap-3 text-[12px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#075B3D] animate-pulse" />
            <span className="font-bold text-[#17212B]">{stats.occupied} Bays Occupied</span>
          </div>
          <span className="text-[#8C827A]">•</span>
          <span className="font-bold text-[#075B3D]">{stats.freeBays} Available</span>
          <span className="text-[#8C827A]">•</span>
          <span className="text-[#6B7578]">{stats.rate}% Network Load</span>
        </div>
      </div>

      {/* =========================================================================
          GRID: MAP (LEFT) + LIVE GATE CHECKPOINT STREAM (RIGHT)
      ========================================================================= */}
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* Live Interactive Map Stream */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-2xs lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                SECTOR TELEMETRY STREAM
              </span>
              <h3 className="text-[15px] font-black text-[#17212B] font-heading">
                Compound Inventory & Bay Status
              </h3>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7578]">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#075B3D]" /> &gt;5 Free
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-[#E9A83A]" /> Filling
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" /> Full
              </span>
            </div>
          </div>

          {/* Interactive Map Component */}
          <div className="overflow-hidden rounded-xl border border-[#E8E4DA]">
            <div className="relative h-[380px] sm:h-[440px]">
              <KumbhMap
                spots={filteredSpots}
                selectedId={selectedSpotId}
                onSelectSpot={(s) => setSelectedSpotId(s?.id || null)}
                zoom={13}
                showZoom
              />
            </div>
          </div>

          <p className="text-[11px] text-[#6B7578] font-mono pt-1">
            Displaying {filteredSpots.length} verified compounds with automatic gate status sync.
          </p>
        </div>

        {/* Live Sessions Stream */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 shadow-2xs lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                REAL-TIME VEHICLE SESSIONS
              </span>
              <h3 className="text-[15px] font-black text-[#17212B] font-heading">
                Live Checkpoint Stream
              </h3>
            </div>

            {/* Session Filter */}
            <div className="flex items-center rounded-lg bg-[#FAF7F2] p-0.5 border border-[#E8E4DA] text-[10px] font-bold font-mono">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Parked' },
                { id: 'overtime', label: 'Overtime' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSessionFilter(f.id)}
                  className={cn(
                    'rounded-md px-2 py-0.5 transition-all cursor-pointer',
                    sessionFilter === f.id
                      ? 'bg-[#075B3D] text-white'
                      : 'text-[#6B7578] hover:text-[#17212B]',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session Cards List */}
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto no-scrollbar pr-0.5">
            {filteredSessions.length === 0 ? (
              <EmptyState
                icon="car"
                title="No Active Sessions"
                message="No vehicles matching the filter criteria currently tracked."
              />
            ) : (
              filteredSessions.map((sess) => {
                const isOvertime = sess.status === 'overtime'
                const isCompleted = sess.status === 'completed'

                return (
                  <div
                    key={sess.id}
                    className={cn(
                      'rounded-xl border p-3 transition-all space-y-1.5',
                      isOvertime
                        ? 'border-amber-300 bg-[#FFF8E7]/60'
                        : isCompleted
                          ? 'border-[#E8E4DA] bg-[#FAF7F2]'
                          : 'border-[#E8E4DA] bg-white hover:border-[#075B3D]/40',
                    )}
                  >
                    {/* Header: Masked Plate + Status Chip */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[13px] text-[#17212B]">
                          {maskPlate(sess.plate)}
                        </span>
                        <span className="rounded bg-[#FAF7F2] border border-[#E8E4DA] px-1 py-0.2 text-[9.5px] font-mono uppercase text-[#6B7578]">
                          {sess.vehicleType}
                        </span>
                      </div>

                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase border',
                          isOvertime
                            ? 'bg-amber-100 text-[#B47C10] border-amber-300'
                            : isCompleted
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-[#E7F1EA] text-[#075B3D] border-[#075B3D]/20',
                        )}
                      >
                        {isOvertime
                          ? `Overtime +${sess.overtimeMins}m`
                          : isCompleted
                            ? 'Exit Verified'
                            : 'Active Bay'}
                      </span>
                    </div>

                    {/* Location & Time */}
                    <div className="flex items-center justify-between text-[11.5px] text-[#6B7578]">
                      <span className="font-medium truncate max-w-[170px]">{sess.space}</span>
                      <span className="font-mono text-[10.5px]">In: {sess.entryTime}</span>
                    </div>

                    {/* Overtime Notice if applicable */}
                    {isOvertime && (
                      <div className="flex items-center justify-between rounded-lg bg-amber-100/70 px-2 py-1 text-[11px] font-mono font-bold text-amber-950">
                        <span>Window Ended: {sess.plannedExit}</span>
                        <span className="text-[#075B3D]">+₹{sess.surcharge} Surcharge</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
