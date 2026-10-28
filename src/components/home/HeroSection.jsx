import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'

const QUICK_LANDMARKS = ['Ramkund', 'Panchavati', 'Kalaram Mandir', 'Trimbakeshwar']

export default function HeroSection() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/search')
    }
  }

  const handleChipClick = (landmark) => {
    navigate(`/search?q=${encodeURIComponent(landmark)}`)
  }

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] text-[#17212B] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-[#E8E2D5]">
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #075B3D 1px, transparent 1px),
            linear-gradient(to bottom, #075B3D 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* =========================================================================
              LEFT COLUMN: HEADLINE, SEARCH BAR, CHIPS, TRUST ROW & CTAS
          ========================================================================= */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Sector / Identity Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F1EA] px-3.5 py-1.5 border border-[#075B3D]/25 text-[11px] sm:text-[12px] font-mono font-bold tracking-widest text-[#075B3D] uppercase shadow-2xs">
              <span className="size-2 rounded-full bg-[#E9A83A] animate-pulse motion-reduce:animate-none" />
              <span>STHAANAM • NASHIK KUMBH MOBILITY 2027</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#17212B] font-heading leading-[1.08]">
              Smart Parking For <br />
              <span className="text-[#075B3D]">Nashik's Kumbh Journey</span>
            </h1>

            {/* Sub-Copy */}
            <p className="text-[15px] sm:text-[17px] font-medium leading-relaxed text-[#525B60] max-w-2xl">
              Pre-book verified private driveways, gated compounds, and temple-side plots within walking distance of Godavari Snan ghats. Bypass festival barricades with instant UPI QR passes .
            </p>

            {/* Search Container: "Where are you headed?" */}
            <div className="rounded-2xl border-2 border-[#17212B] bg-white p-2 shadow-md">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0">
                  <Icon name="search" size={20} className="text-[#075B3D] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Where are you headed? (e.g. Ramkund, Panchavati)"
                    className="w-full bg-transparent text-[15px] font-bold text-[#17212B] placeholder:text-[#8E979B] placeholder:font-normal focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#8E979B] hover:text-[#17212B] text-[13px] font-bold px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="md"
                  className="bg-[#075B3D] hover:bg-[#064e34] text-white font-black text-[14px] uppercase tracking-wide px-6 py-3.5 shadow-sm active:scale-98 cursor-pointer rounded-xl shrink-0"
                >
                  Find Parking →
                </Button>
              </form>
            </div>

            {/* Quick Landmark Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578]">
                Direct Snan Access:
              </span>
              {QUICK_LANDMARKS.map((landmark) => (
                <button
                  key={landmark}
                  type="button"
                  onClick={() => handleChipClick(landmark)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white hover:bg-[#E7F1EA] hover:border-[#075B3D] border border-[#E2DDD3] px-3 py-1.5 text-[12px] font-bold text-[#17212B] transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Icon name="pin" size={13} className="text-[#075B3D]" />
                  <span>{landmark}</span>
                </button>
              ))}
            </div>

            {/* Small Trust Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t border-[#E8E2D5] pt-4 text-[12px] sm:text-[13px] font-semibold text-[#4A5568]">
              <div className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-[#E7F1EA] text-[#075B3D]">
                  <Icon name="shield" size={12} />
                </span>
                <span>Verified private hosts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-[#E7F1EA] text-[#075B3D]">
                  <Icon name="qr" size={12} />
                </span>
                <span>Instant UPI & QR pass</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-[#E7F1EA] text-[#075B3D]">
                  <Icon name="bolt" size={12} />
                </span>
                <span>2–6 min walk to ghats</span>
              </div>
            </div>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/search')}
                className="bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] font-black text-[15px] uppercase tracking-wider px-7 py-4 shadow-md active:scale-98 transition-all cursor-pointer rounded-2xl"
                icon={<Icon name="search" size={18} />}
              >
                Find Available Parking
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/host/new')}
                className="border-2 border-[#17212B]/30 bg-white hover:bg-[#FAF7F2] text-[#17212B] font-bold text-[14.5px] uppercase tracking-wider px-6 py-4 shadow-2xs active:scale-98 transition-all cursor-pointer rounded-2xl"
                icon={<Icon name="home" size={17} />}
              >
                List Your Space
              </Button>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: COMPACT PRODUCT PREVIEW CARD (PURE HTML/CSS - NO PHOTOS)
          ========================================================================= */}
          <div className="lg:col-span-5 w-full">
            <div className="relative mx-auto max-w-md rounded-3xl border-2 border-[#17212B] bg-[#FAF7F2] p-4 sm:p-5 shadow-xl space-y-4">
              {/* Header Strip with Live Radar Pill */}
              <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#075B3D] animate-ping motion-reduce:animate-none" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                    Live Bay Radar • Sector 1
                  </span>
                </div>
                <span className="rounded-md bg-[#E7F1EA] px-2 py-0.5 text-[10px] font-black uppercase text-[#075B3D] font-mono border border-[#075B3D]/30">
                  14 BAYS FREE
                </span>
              </div>

              {/* Simulated Micro Map Canvas */}
              <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-[#E2DDD3] bg-[#E0EBDC] shadow-inner select-none">
                {/* SVG Route & River Geometry */}
                <svg className="size-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="miniGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#075B3D" strokeWidth="0.5" strokeOpacity="0.12" />
                    </pattern>
                  </defs>
                  <rect width="400" height="200" fill="url(#miniGrid)" />

                  {/* Sacred Godavari River ribbon */}
                  <path
                    d="M 0,160 Q 150,130 250,170 T 400,150"
                    fill="none"
                    stroke="#94C5D6"
                    strokeWidth="24"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <text x="310" y="155" fill="#3D7B91" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    GODAVARI RIVER ~
                  </text>

                  {/* Main Pilgrim Access Corridor */}
                  <path
                    d="M 50,20 C 120,60 180,90 280,70"
                    fill="none"
                    stroke="#17212B"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50,20 C 120,60 180,90 280,70"
                    fill="none"
                    stroke="#FFD166"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Connecting walking path */}
                  <path
                    d="M 280,70 L 320,135"
                    fill="none"
                    stroke="#E9A83A"
                    strokeWidth="3"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* Simulated Interactive Price Pin */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 rounded-full bg-[#17212B] text-white px-3 py-1 shadow-lg border border-[#E9A83A]">
                    <span className="size-1.5 rounded-full bg-[#E9A83A] animate-pulse motion-reduce:animate-none" />
                    <span className="text-[12px] font-black font-mono">₹40/hr</span>
                    <span className="text-[10px] text-white/80 font-bold">• 4m walk</span>
                  </div>
                  {/* Pin stem */}
                  <div className="w-0.5 h-3 bg-[#17212B]" />
                  <div className="size-2 rounded-full bg-[#075B3D] ring-4 ring-[#075B3D]/30" />
                </div>

                {/* Destination Ghat Marker */}
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-[#075B3D] border border-[#075B3D]/30 shadow-xs">
                  <span>🏛 Ramkund Snan Ghat</span>
                </div>
              </div>

              {/* Real-time Spots Meter */}
              <div className="space-y-1.5 rounded-xl border border-[#E8E2D5] bg-white p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#17212B]">Driveway behind Sagar Petrol Pump</span>
                  <span className="font-extrabold text-[#075B3D]">14 of 20 bays open</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E4DA]">
                  <div className="h-full rounded-full bg-[#075B3D] transition-all" style={{ width: '70%' }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#6B7578] font-medium pt-0.5">
                  <span>Gated compound · CCTV · Covered</span>
                  <span className="font-bold text-amber-700">Filling fast</span>
                </div>
              </div>

              {/* Embedded Mini Parking Ticket QR Chip */}
              <div className="flex items-center justify-between rounded-2xl bg-[#E7F1EA] p-3 border border-[#075B3D]/30">
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="grid size-4 place-items-center rounded-full bg-[#075B3D] text-white text-[9px] font-black">
                      ✓
                    </span>
                    <span className="text-[11px] font-black text-[#17212B] uppercase tracking-tight truncate">
                      Gate Pass #NPC-7F3K9
                    </span>
                  </div>
                  <p className="text-[10px] text-[#075B3D] font-medium">
                    Verified entrance barcode · Instant mobile scan
                  </p>
                </div>

                {/* Mini SVG QR thumbnail representation */}
                <div className="size-11 shrink-0 rounded-lg bg-white p-1 border border-[#075B3D]/20 grid place-items-center shadow-2xs">
                  <Icon name="qr" size={28} className="text-[#17212B]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
