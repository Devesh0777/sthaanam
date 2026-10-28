import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'

export default function HostCtaBand() {
  const navigate = useNavigate()

  return (
    <section className="bg-[#075B3D] py-14 sm:py-18 text-white relative overflow-hidden border-t-4 border-[#E9A83A]">
      {/* Background Architectural Accent */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(#FAF7F2 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-mono font-bold uppercase tracking-widest text-[#FFD166] border border-white/20">
          <span>HOST COMMONS • NASHIK RESIDENTS & ASHRAMS</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-heading leading-tight max-w-3xl mx-auto">
          Have a Driveway Near the Ghats? <br className="hidden sm:block" />
          <span className="text-[#FFD166]">List It on Sthaanam.</span>
        </h2>

        <p className="text-[15px] sm:text-[17px] text-white/85 font-medium max-w-2xl mx-auto leading-relaxed">
          Help visiting pilgrims bypass blocked roads while earning guaranteed festival tariffs. Sthaanam provides verified QR gate passes, automated 5-minute hold management, and direct UPI settlements.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <Button
            size="lg"
            onClick={() => navigate('/host/new')}
            className="bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] font-black text-[15px] uppercase tracking-wider px-8 py-4 shadow-xl active:scale-98 transition-all cursor-pointer rounded-2xl"
            icon={<Icon name="home" size={18} />}
          >
            List Your Space Now →
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/host')}
            className="border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 font-bold text-[14.5px] uppercase tracking-wider px-6 py-4 cursor-pointer rounded-2xl"
          >
            Explore Host Dashboard
          </Button>
        </div>

        {/* 3 Host Trust Highlights */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto border-t border-white/15 text-[12px] font-semibold text-white/80">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#FFD166]">✓</span>
            <span>Zero listing or commission fees</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#FFD166]">✓</span>
            <span>Pilgrim identity verified via vehicle plate</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#FFD166]">✓</span>
            <span>Full gate PIN and scan control</span>
          </div>
        </div>
      </div>
    </section>
  )
}
