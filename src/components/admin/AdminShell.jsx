import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import GlassNavbar from '@/components/layout/GlassNavbar'
import Icon from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'
import { cn } from '@/lib/cn'

const ADMIN_SECTIONS = [
  { id: 'verifications', label: 'Host Verifications', shortLabel: 'Verifications', icon: 'shield' },
  { id: 'live-ops', label: 'Live Operations & Map', shortLabel: 'Live Ops', icon: 'layers' },
  { id: 'analytics', label: 'Network Analytics', shortLabel: 'Analytics', icon: 'trendUp' },
  { id: 'zones', label: 'Zone Occupancy', shortLabel: 'Zones', icon: 'pin' },
  { id: 'issues', label: 'Incident Desk', shortLabel: 'Incidents', icon: 'alert' },
]

export default function AdminShell({
  currentTab = 'verifications',
  onSelectTab,
  pendingCount = 0,
  openIncidentsCount = 0,
  searchQuery = '',
  onSearchChange,
  dateRange = '7d',
  onDateRangeChange,
  onSyncTelemetry,
  isSyncing = false,
  lastSyncedAt,
  children,
}) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [tick, setTick] = useState(0)

  // Refresh relative time every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(timer)
  }, [])

  const syncTimeLabel = () => {
    void tick
    if (!lastSyncedAt) return 'Synced just now'
    return `Synced ${lastSyncedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  }

  const getBadgeCount = (sectionId) => {
    if (sectionId === 'verifications') return pendingCount
    if (sectionId === 'issues') return openIncidentsCount
    return 0
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#17212B] flex flex-col font-sans selection:bg-[#006B4F] selection:text-white">
      {/* Global Sthaanam Glass Navbar */}
      <GlassNavbar />

      {/* =========================================================================
          ADMIN COMMAND BAR (Glass Header, Positioned Below Floating Navbar)
      ========================================================================= */}
      <div className="pt-20 sm:pt-24 px-3 sm:px-6">
        <header className="glass-panel rounded-2xl border border-[#006B4F]/20 shadow-xs px-4 sm:px-6 py-2.5 max-w-[1720px] mx-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Section Title & Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:grid size-8 place-items-center rounded-xl border border-[#17212B]/10 bg-white/70 text-[#17212B] hover:text-[#006B4F] hover:bg-white transition-colors cursor-pointer"
                title={sidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
                aria-label="Toggle navigation sidebar"
              >
                <Icon name={sidebarCollapsed ? 'chevronRight' : 'chevronLeft'} size={15} />
              </button>

              <div className="flex items-center gap-2.5">
                <BrandLogo size={32} />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[14px] sm:text-[15px] font-black tracking-tight text-[#17212B] font-heading uppercase">
                      Operations Control Center
                    </h1>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#E7F1EA] px-2 py-0.5 text-[10px] font-mono font-bold text-[#006B4F]">
                      <span className="size-1.5 rounded-full bg-[#006B4F] animate-pulse" />
                      LIVE
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-[#6B7578] hidden sm:block">
                    Nashik • Trimbakeshwar • Kumbh 2027 Compound Telemetry
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Search Field */}
            <div className="flex-1 max-w-md mx-2 hidden md:block">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#8C827A]">
                  <Icon name="search" size={14} />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Search compounds, hosts, vehicles, alerts..."
                  className="w-full rounded-xl border border-[#17212B]/15 bg-white/80 pl-9 pr-3 py-1.5 text-xs text-[#17212B] placeholder-[#8C827A] focus:border-[#006B4F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/15 transition-all"
                />
              </div>
            </div>

            {/* Right: Date-Range + Sync Telemetry */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Date-Range Selector */}
              <div className="flex items-center rounded-xl bg-white/60 p-0.5 border border-[#17212B]/10">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7d' },
                  { id: '30d', label: '30d' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onDateRangeChange?.(r.id)}
                    className={cn(
                      'rounded-lg px-2 sm:px-2.5 py-1 text-[11px] font-mono font-bold transition-all cursor-pointer',
                      dateRange === r.id
                        ? 'bg-[#006B4F] text-white shadow-2xs'
                        : 'text-[#6B7578] hover:text-[#17212B]',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Sync Telemetry Button */}
              <button
                type="button"
                onClick={onSyncTelemetry}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#17212B]/15 bg-white/80 px-2.5 sm:px-3 py-1.5 text-[11.5px] font-bold text-[#17212B] hover:bg-white hover:border-[#006B4F]/30 transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-60"
                title="Synchronize telemetry state"
              >
                <Icon
                  name="refresh"
                  size={13}
                  className={cn('text-[#006B4F]', isSyncing && 'animate-spin')}
                />
                <span className="hidden xl:inline">{syncTimeLabel()}</span>
                <span className="xl:hidden">Sync</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* =========================================================================
          MOBILE TOP TABS (< lg screen size)
      ========================================================================= */}
      <div className="lg:hidden px-3 sm:px-6 mt-3">
        <div className="glass-panel rounded-2xl p-2 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5">
            {ADMIN_SECTIONS.map((sec) => {
              const isActive = currentTab === sec.id
              const badge = getBadgeCount(sec.id)
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectTab?.(sec.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border',
                    isActive
                      ? 'bg-[#006B4F] text-white border-[#006B4F] shadow-xs'
                      : 'bg-white/60 text-[#6B7578] border-[#17212B]/10 hover:text-[#17212B]',
                  )}
                >
                  <Icon name={sec.icon} size={14} />
                  <span>{sec.shortLabel}</span>
                  {badge > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[9.5px] font-mono font-black',
                        isActive ? 'bg-white text-[#006B4F]' : 'bg-[#E8E4DA] text-[#17212B]',
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* =========================================================================
          MAIN BODY LAYOUT: GLASS SIDEBAR + CONTENT VIEWPORT
      ========================================================================= */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto px-3 sm:px-6 py-4 gap-4">
        {/* DESKTOP GLASS SIDEBAR */}
        <aside
          className={cn(
            'hidden lg:flex flex-col shrink-0 glass-panel-strong rounded-2xl border border-[#17212B]/10 transition-all duration-300 py-4 px-3 sticky top-40 h-[calc(100vh-180px)] overflow-y-auto no-scrollbar shadow-xs',
            sidebarCollapsed ? 'w-18' : 'w-64',
          )}
        >
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 pb-2 pt-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C827A]">
                Operations Modules
              </div>
            )}

            {ADMIN_SECTIONS.map((sec) => {
              const isActive = currentTab === sec.id
              const badge = getBadgeCount(sec.id)
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectTab?.(sec.id)}
                  title={sidebarCollapsed ? `${sec.label}${badge > 0 ? ` (${badge})` : ''}` : undefined}
                  className={cn(
                    'w-full flex items-center rounded-xl font-bold transition-all cursor-pointer group',
                    sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5 text-xs font-mono tracking-wide',
                    isActive
                      ? 'bg-[#006B4F] text-white shadow-xs font-black'
                      : 'text-[#4A4A4A] hover:bg-[#17212B]/5 hover:text-[#17212B]',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'grid size-6 place-items-center rounded-lg shrink-0 transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-[#6B7578] group-hover:text-[#006B4F]',
                      )}
                    >
                      <Icon name={sec.icon} size={16} strokeWidth={2} />
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{sec.label}</span>}
                  </div>

                  {!sidebarCollapsed && badge > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-mono font-black shrink-0',
                        isActive
                          ? 'bg-[#E9A83A] text-[#17212B]'
                          : sec.id === 'issues'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300',
                      )}
                    >
                      {badge}
                    </span>
                  )}

                  {sidebarCollapsed && badge > 0 && (
                    <span
                      className="absolute top-1 right-1 size-2 rounded-full bg-[#E9A83A] ring-2 ring-white"
                      title={`${badge} pending`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className="mt-auto pt-4 border-t border-[#17212B]/10">
            {!sidebarCollapsed ? (
              <div className="rounded-xl bg-white/60 p-3 text-[11px] text-[#6B7578] space-y-1 border border-[#17212B]/8">
                <div className="flex items-center justify-between font-mono font-bold text-[#17212B]">
                  <span>Mela Authority</span>
                  <span className="text-[#006B4F]">Secure Node</span>
                </div>
                <p className="text-[10px]">Compound permit registry & live parking clearance.</p>
              </div>
            ) : (
              <div className="text-center text-[10px] font-mono font-bold text-[#8C827A]" title="Sthaanam Mela Node">
                S27
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT VIEWPORT */}
        <main className="flex-1 min-w-0 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
