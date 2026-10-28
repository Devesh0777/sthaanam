import { useMemo } from 'react'
import { spots } from '@/api/mock/spots'
import { zones } from '@/api/mock/zones'
import { NASHIK_LANDMARKS } from '@/data/landmarks'
import { money } from '@/lib/format'

export default function LiveSnapshotStrip() {
  const metrics = useMemo(() => {
    const verifiedSpotsCount = spots.filter((s) => s.verified).length || spots.length
    const totalBays = spots.reduce((sum, s) => sum + Number(s.capacity || 0), 0)
    const zonesCount = zones.length
    const landmarksCount = NASHIK_LANDMARKS.length
    const minTariff = Math.min(...spots.map((s) => s.priceHour || 999))

    return [
      {
        id: 'spots',
        value: `${verifiedSpotsCount}`,
        label: 'Verified Compounds',
        subtext: 'Inspected residential lots',
      },
      {
        id: 'bays',
        value: `${totalBays}+`,
        label: 'Mela Parking Bays',
        subtext: 'Dedicated 2W, Car & Bus slots',
      },
      {
        id: 'zones',
        value: `${zonesCount}`,
        label: 'Festival Sectors',
        subtext: 'From Ramkund to Trimbak',
      },
      {
        id: 'landmarks',
        value: `${landmarksCount}`,
        label: 'Indexed Pilgrimage Points',
        subtext: 'Near Ghats & Mandir gates',
      },
      {
        id: 'tariff',
        value: `${money(minTariff)}/hr`,
        label: 'Starting Tariff',
        subtext: 'Regulated festival pricing',
      },
    ]
  }, [])

  return (
    <section className="bg-white py-10 border-b border-[#E8E2D5] text-[#17212B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E2DDD3] bg-[#FAF7F2] p-6 shadow-2xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D5] pb-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#075B3D] animate-pulse motion-reduce:animate-none" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#075B3D]">
                Verified Network Snapshot • Live Data
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#6B7578]">
              Nashik–Trimbakeshwar Kumbh Mela 2027
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="space-y-1">
                <span className="block font-mono text-2xl sm:text-3xl font-black text-[#075B3D] tracking-tight">
                  {metric.value}
                </span>
                <span className="block text-[13px] font-black text-[#17212B] leading-tight">
                  {metric.label}
                </span>
                <span className="block text-[11px] font-medium text-[#6B7578]">
                  {metric.subtext}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
