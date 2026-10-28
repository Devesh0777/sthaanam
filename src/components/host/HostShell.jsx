import { NavLink } from 'react-router-dom'
import GlassNavbar from '@/components/layout/GlassNavbar'
import Icon from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'
import { cn } from '@/lib/cn'

export default function HostShell({ children }) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#17212B] flex flex-col font-sans selection:bg-[#E9A83A] selection:text-[#17212B]">
      {/* Sthaanam Global Glass Navbar */}
      <GlassNavbar />

      {/* Host Thin Glass Sub-bar (Gold / Amber Accent) */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-6">
        <div className="mx-auto max-w-7xl glass-panel rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 border border-[#E9A83A]/30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={24} />
            <div className="leading-none">
              <span className="text-xs font-mono font-black uppercase text-[#17212B] tracking-wide">
                HOST OPERATIONS PORTAL
              </span>
              <p className="text-[10px] text-[#66706B] font-medium hidden sm:block">
                Property & Bay Monetization • Kumbh 2027
              </p>
            </div>
          </div>

          {/* Host Sub Navigation */}
          <nav className="flex items-center gap-1.5">
            <NavLink
              to="/host"
              end
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 text-xs font-bold rounded-xl transition-all',
                  isActive
                    ? 'bg-[#E9A83A] text-[#17212B] shadow-xs'
                    : 'text-[#17212B]/80 hover:text-[#17212B] hover:bg-black/5',
                )
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/host/new"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border',
                  isActive
                    ? 'bg-[#006B4F] text-white border-[#006B4F] shadow-xs'
                    : 'border-[#E9A83A]/40 text-[#96630f] hover:bg-[#E9A83A]/10',
                )
              }
            >
              <Icon name="plus" size={13} />
              <span>List New Compound</span>
            </NavLink>
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                cn(
                  'px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1',
                  isActive
                    ? 'bg-[#17212B] text-white shadow-xs'
                    : 'text-[#17212B]/80 hover:text-[#17212B] hover:bg-black/5',
                )
              }
            >
              <Icon name="qr" size={13} />
              <span className="hidden sm:inline">Gate Scanner</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">{children}</main>
    </div>
  )
}
