import { Link } from 'react-router-dom'
import BrandLogo from '@/components/ui/BrandLogo'

export default function HomeFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 glass-panel-dark px-4 pt-14 pb-24 text-center sm:pb-14 text-[#FAF7F2]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row text-center md:text-left">
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <BrandLogo size={44} isDark />
            <div>
              <span className="text-[20px] font-black text-[#FAF7F2] font-heading tracking-tight block">
                Sthaanam
              </span>
              <p className="text-[12px] text-[#FAF7F2]/70 font-medium">
                Nashik–Trimbakeshwar Ghat Mobility Network
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[13.5px] font-bold text-[#FAF7F2]/85">
            <Link to="/search" className="hover:text-[#FFD166] transition-colors">
              Find Parking
            </Link>
            <Link to="/bookings" className="hover:text-[#FFD166] transition-colors">
              My Bookings
            </Link>
            <Link to="/host" className="hover:text-[#FFD166] transition-colors">
              Host Portal
            </Link>
            <Link to="/admin" className="hover:text-[#FFD166] transition-colors">
              Admin Console
            </Link>
          </div>
        </div>

        {/* Legal & Advisory Notice */}
        <div className="mt-10 border-t border-white/10 pt-6 text-[12px] text-[#FAF7F2]/60 space-y-2">
          <p>
            Dedicated Smart Mobility & Verified Private Parking System for Nashik-Trimbakeshwar Kumbh Mela 2027.
          </p>
          <p className="text-[11px] text-[#FAF7F2]/45">
            © {currentYear} Sthaanam. All verified private parking listings comply with local municipal guidelines and police traffic cordons.
          </p>
        </div>
      </div>
    </footer>
  )
}
