import Icon from '@/components/ui/Icon'

const FEATURES = [
  {
    id: 'verified',
    title: 'Verified Private Spaces',
    desc: 'Society compounds, bungalows & ashram plots personally inspected for clearance, security gates, and level surface.',
    icon: 'shield',
    accentColor: '#075B3D',
  },
  {
    id: 'snan',
    title: 'Near Sacred Snan Points',
    desc: 'Guaranteed 2 to 6 minutes walking distance from Ramkund, Godavari Ghats, and Trimbakeshwar temple shrines.',
    icon: 'pin',
    accentColor: '#075B3D',
  },
  {
    id: 'qr',
    title: 'Instant QR Gate Entry',
    desc: '100% digital check-in passes. Fully accessible and scan-ready even when festival cell towers are congested.',
    icon: 'qr',
    accentColor: '#075B3D',
  },
  {
    id: 'host',
    title: 'Fair Host Earnings',
    desc: 'Local Nashik residents and ashrams earn transparent daily festival tariffs with zero middlemen and instant UPI settlement.',
    icon: 'wallet',
    accentColor: '#075B3D',
  },
]

export default function WhySthanamSection() {
  return (
    <section className="bg-[#FAF7F2] py-12 sm:py-16 border-b border-[#E8E2D5] text-[#17212B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#075B3D] block mb-1">
            Built For Pilgrims & City Residents
          </span>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[#17212B] font-heading">
            Why Pilgrims Choose Sthaanam
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-[#525B60] font-medium">
            Nashik's first municipal-compliant smart parking network, resolving the 3 km walking detour on festival days.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#E2DDD3] bg-white p-5 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 space-y-3"
            >
              {/* Feature Icon Container */}
              <div className="grid size-12 place-items-center rounded-2xl bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/15 shadow-2xs">
                <Icon name={item.icon} size={22} />
              </div>

              {/* Title */}
              <h3 className="text-[16px] font-black text-[#17212B] tracking-tight">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-[13px] leading-relaxed text-[#525B60] font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
