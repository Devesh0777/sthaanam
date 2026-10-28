import { useMemo } from 'react'
import { ParkingCard } from '@/components/parking/ParkingCard'
import Icon from '@/components/ui/Icon'

export default function LiveListingPreview({
  form,
  zone,
}) {
  // Construct dynamic spot object mirroring Find Parking card shape
  const previewSpot = useMemo(() => {
    const title = form.title?.trim() || 'Your Gated Parking Compound'
    const address = form.address?.trim() || `${zone?.name || 'Ramkund'} Sector`
    const landmarkName = form.nearestLandmark?.name || form.landmark || 'Ramkund Snan Ghat'
    const distanceM = form.nearestLandmark?.distanceMeters || 240
    const walkM = Math.max(1, Math.round((distanceM / 80))) // ~80m/min walk

    return {
      id: 'preview-spot',
      title,
      address,
      zoneId: form.zoneId || 'ramkund',
      zone: zone || { name: 'Ramkund', short: 'Ramkund' },
      ghat: {
        name: landmarkName,
        distanceM,
      },
      walkM,
      vehicles: form.vehicles?.length ? form.vehicles : ['2w', 'car'],
      capacity: Number(form.capacity) || 8,
      spotsLeft: Number(form.capacity) || 8,
      priceHour: Number(form.priceHour) || 30,
      priceDay: Number(form.priceDay) || 200,
      surface: form.surface || 'Cement',
      clearanceM: form.clearanceM || 2.5,
      features: form.features || ['gate', 'floodlight'],
      instantBook: true,
      verified: false,
      rating: 5.0,
      reviews: 0,
      checkInFrom: '00:00',
      checkOutBy: '24:00',
    }
  }, [form, zone])

  return (
    <div className="sticky top-24 rounded-3xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 shadow-sm space-y-3">
      {/* Eyebrow Label */}
      <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
          <span className="size-2 rounded-full bg-[#E9A83A] animate-pulse" />
          <span>LIVE DRIVER PREVIEW</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#6B7578] uppercase">
          FIND PARKING VIEW
        </span>
      </div>

      <p className="text-[11.5px] text-[#6B7578] leading-tight">
        Here is how visiting pilgrims will see your space in search results and on the sector radar:
      </p>

      {/* Render the actual Step-2 ParkingCard component */}
      <div className="pointer-events-none select-none">
        <ParkingCard
          spot={previewSpot}
          plan="hour"
          originLabel="Your Gate"
        />
      </div>

      {/* Helper Feature Badges */}
      <div className="rounded-xl bg-white p-3 border border-[#E8E4DA] space-y-1.5 text-[11px] text-[#6B7578]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#17212B]">Assigned Space Icon:</span>
          <span className="font-mono text-[#075B3D] font-bold">Auto-derived from title</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#17212B]">Ghat Proximity:</span>
          <span className="font-mono font-bold text-[#17212B]">
            {previewSpot.ghat.name} ({previewSpot.walkM} min walk)
          </span>
        </div>
      </div>
    </div>
  )
}
