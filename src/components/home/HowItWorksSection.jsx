import Icon from '@/components/ui/Icon'

const STEPS = [
  {
    step: '01',
    title: 'Find Nearby Space',
    desc: 'Search by sacred ghat, temple, or mela sector. Compare walking times, tariffs, and amenities.',
    icon: 'search',
    badge: 'Real-time Radar',
  },
  {
    step: '02',
    title: 'Reserve & Pay (UPI QR)',
    desc: 'Hold your private bay for 5 minutes and settle instantly using any UPI app (GPay, PhonePe, Paytm).',
    icon: 'bolt',
    badge: 'Direct UPI Intent',
  },
  {
    step: '03',
    title: 'Scan & Park',
    desc: 'Show your digital QR pass at the compound gate for guaranteed, barrier-free festival entry.',
    icon: 'ticket',
    badge: 'Offline Pass',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-[#E8E2D5] text-[#17212B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#075B3D] block mb-1">
            Seamless Pilgrimage Access
          </span>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[#17212B] font-heading">
            How Sthaanam Works in 3 Steps
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-[#525B60] font-medium">
            From search to gated clearance in under two minutes. No waiting, no haggling, no police checkpoint confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((item, index) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-[#E2DDD3] bg-[#FAF7F2] p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 space-y-3"
            >
              {/* Step Number & Badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[22px] font-black text-[#075B3D]/30">
                  {item.step}
                </span>
                <span className="rounded-md bg-[#E7F1EA] px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#075B3D]">
                  {item.badge}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-3 pt-1">
                <div className="grid size-11 place-items-center rounded-xl bg-[#075B3D] text-white shadow-xs shrink-0">
                  <Icon name={item.icon} size={20} />
                </div>
                <h3 className="text-[17px] font-black text-[#17212B] tracking-tight">
                  {item.title}
                </h3>
              </div>

              {/* Description (one concise line/sentence) */}
              <p className="text-[13px] leading-relaxed text-[#525B60] font-medium pt-1">
                {item.desc}
              </p>

              {/* Decorative connector for desktop */}
              {index < 2 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-white border border-[#E2DDD3] text-[#075B3D] text-[11px] font-black grid place-items-center z-10 shadow-2xs">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
