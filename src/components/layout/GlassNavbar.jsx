import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import Icon from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'

/**
 * Sthaanam Unified Glass Navigation Bar
 * Shared across ALL public pages and role shells (Driver, Host, Admin, Auth, Error).
 * Features:
 * - 4 core items ALWAYS visible: HOME, FIND PARKING, MY BOOKINGS, SCAN QR
 * - Role-specific items: HOST DASHBOARD (Host/Admin), ADMIN (Admin)
 * - Seamless redirect to /login?from=... for protected links when clicked by logged-out visitors
 * - Adaptive dark glass tint when scrolling over dark road journey section (#pilgrim-journey)
 * - Mobile responsive glass drawer
 * - Minimal, ultra-modern glass aesthetics with WCAG AA compliant text contrast
 */
export default function GlassNavbar({ transparentOnHero = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const { user: appUser, userRole: appUserRole, setUserRole } = useApp()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isDarkSection, setIsDarkSection] = useState(false)
  const userMenuRef = useRef(null)

  // Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Adaptive Dark Section Observer (#pilgrim-journey)
  useEffect(() => {
    const darkTarget = document.getElementById('pilgrim-journey')
    if (!darkTarget) {
      setIsDarkSection(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsDarkSection(entry.isIntersecting)
      },
      {
        rootMargin: '-60px 0px -70% 0px',
        threshold: 0,
      }
    )

    observer.observe(darkTarget)
    return () => observer.disconnect()
  }, [location.pathname])

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false)
        setMobileMenuOpen(false)
      }
    }
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setShowUserMenu(false)
  }, [location.pathname])

  // Real auth state takes strict precedence. Demo mode only if explicitly enabled.
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
  const currentUser = authUser || (isDemoMode ? appUser : null)
  const isUserLoggedIn = Boolean(authUser) || (isDemoMode && Boolean(appUser))
  const currentRole = (authUser?.role || (isDemoMode ? appUserRole : null) || 'USER').toUpperCase()

  // 4 Primary Items ALWAYS Visible to Everyone + Role-specific Items
  const navItems = useMemo(() => {
    const items = [
      {
        key: 'home',
        label: 'HOME',
        to: '/',
        isActive: location.pathname === '/',
        requireAuth: false,
      },
      {
        key: 'find-parking',
        label: 'FIND PARKING',
        to: '/search',
        isActive: location.pathname === '/search' || location.pathname.startsWith('/listing'),
        requireAuth: false,
      },
      {
        key: 'my-bookings',
        label: 'MY BOOKINGS',
        to: isUserLoggedIn ? '/app' : '/login?from=%2Fapp',
        isActive: location.pathname === '/app' || location.pathname === '/bookings',
        requireAuth: !isUserLoggedIn,
      },
      {
        key: 'scan-qr',
        label: 'SCAN QR',
        to: '/scan',
        isActive: location.pathname === '/scan',
        requireAuth: false,
      },
    ]

    // Role-specific additions
    if (isUserLoggedIn && (currentRole === 'HOST' || currentRole === 'ADMIN')) {
      items.push({
        key: 'host-dashboard',
        label: 'HOST DASHBOARD',
        to: '/host',
        isActive: location.pathname.startsWith('/host'),
        requireAuth: false,
      })
    }

    if (isUserLoggedIn && currentRole === 'ADMIN') {
      items.push({
        key: 'admin',
        label: 'ADMIN',
        to: '/admin',
        isActive: location.pathname.startsWith('/admin'),
        requireAuth: false,
      })
    }

    return items
  }, [location.pathname, isUserLoggedIn, currentRole])

  const handleLogout = async () => {
    setShowUserMenu(false)
    setMobileMenuOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  const isDark = isDarkSection

  return (
    <>
      {/* Top Demo Switcher (Strictly if VITE_DEMO_MODE=true) */}
      {isDemoMode && (
        <aside aria-label="Prototype Demo Controls" className="fixed top-0 inset-x-0 z-[750] bg-[#17212B] text-white text-[11px] font-mono px-4 py-1 flex items-center justify-between border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#E9A83A] animate-pulse" />
            <span className="font-bold text-[#FFD166] uppercase tracking-widest hidden sm:inline">
              PROTOTYPE DEMO MODE:
            </span>
            <span className="text-white/80">Switch persona:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setUserRole('user', { name: 'Devv', id: 'u_devv' })
                navigate('/search')
              }}
              className={cn(
                'px-2 py-0.5 rounded font-bold uppercase transition-all cursor-pointer',
                currentRole === 'USER' ? 'bg-[#006B4F] text-white shadow-xs' : 'bg-white/10 text-white/70 hover:bg-white/20',
              )}
            >
              USER
            </button>
            <button
              type="button"
              onClick={() => {
                setUserRole('host', { name: 'Sunita Deshmukh', id: 'h1' })
                navigate('/host')
              }}
              className={cn(
                'px-2 py-0.5 rounded font-bold uppercase transition-all cursor-pointer',
                currentRole === 'HOST' ? 'bg-[#E9A83A] text-[#17212B] shadow-xs' : 'bg-white/10 text-white/70 hover:bg-white/20',
              )}
            >
              HOST
            </button>
            <button
              type="button"
              onClick={() => {
                setUserRole('admin', { name: 'Kumbh Controller', id: 'admin_1' })
                navigate('/admin')
              }}
              className={cn(
                'px-2 py-0.5 rounded font-bold uppercase transition-all cursor-pointer',
                currentRole === 'ADMIN' ? 'bg-[#8B2E21] text-white shadow-xs' : 'bg-white/10 text-white/70 hover:bg-white/20',
              )}
            >
              ADMIN
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================================
          MAIN FLOATING GLASS NAVBAR
      ========================================================================= */}
      <header
        role="banner"
        className={cn(
          'fixed inset-x-0 z-[700] px-3 sm:px-6 pointer-events-none transition-all duration-300',
          isDemoMode ? 'top-8 sm:top-9' : 'top-2 sm:top-3',
        )}
      >
        <div
          className={cn(
            'pointer-events-auto mx-auto max-w-7xl h-14 rounded-2xl transition-all duration-300 flex items-center justify-between px-3.5 sm:px-5',
            isDark
              ? 'glass-panel-dark text-white shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
              : transparentOnHero && !scrolled
                ? 'bg-white/40 border border-white/60 backdrop-blur-md shadow-[0_2px_12px_rgba(23,33,43,0.04)] text-[#17212B]'
                : 'glass-panel text-[#17212B] shadow-[0_2px_16px_rgba(23,33,43,0.06)]',
          )}
        >
          {/* LEFT: Sthaanam Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer shrink-0 select-none"
            aria-label="Sthaanam Home"
          >
            <BrandLogo
              size={40}
              withWordmark
              isDark={isDark}
              withTagline
            />
          </Link>

          {/* CENTER: Navigation Links (Desktop) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl"
          >
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all duration-150 cursor-pointer',
                  item.isActive
                    ? isDark
                      ? 'bg-[#E9A83A] text-[#17212B] shadow-xs'
                      : 'bg-[#006B4F] text-white shadow-xs'
                    : isDark
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-[#17212B]/85 hover:text-[#006B4F] hover:bg-[#17212B]/5',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Actions & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isUserLoggedIn ? (
              /* LOGGED IN: Profile pill + Dropdown */
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs border',
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                      : 'bg-white/80 hover:bg-white border-[#006B4F]/25 text-[#17212B]',
                  )}
                >
                  <div
                    className={cn(
                      'grid size-5 place-items-center rounded-full text-[10px] font-black',
                      isDark ? 'bg-[#E9A83A] text-[#17212B]' : 'bg-[#006B4F] text-white',
                    )}
                  >
                    {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline">
                    {currentUser?.name || 'Devv'}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase',
                      currentRole === 'ADMIN'
                        ? 'bg-red-500/20 text-red-300'
                        : currentRole === 'HOST'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-[#006B4F]/15 text-[#006B4F] dark:text-[#7ce5c2]',
                    )}
                  >
                    {currentRole === 'USER' ? 'DRIVER' : currentRole}
                  </span>
                  <Icon name="chevronDown" size={11} className="opacity-70" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-56 rounded-2xl bg-white text-[#17212B] border border-[#E2DDD3] shadow-2xl p-2 z-50 animate-fadeIn"
                  >
                    <div className="px-3 py-2 border-b border-[#E2DDD3] mb-1">
                      <p className="text-xs font-black truncate">{currentUser?.name}</p>
                      <p className="text-[11px] font-mono text-[#66706B] truncate">
                        {currentUser?.email}
                      </p>
                      <span className="inline-block mt-1 text-[9px] font-mono font-bold bg-[#EAF2EC] text-[#006B4F] px-1.5 py-0.5 rounded uppercase">
                        Active Role: {currentRole === 'USER' ? 'DRIVER' : currentRole}
                      </span>
                    </div>

                    <Link
                      to="/app"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors"
                    >
                      <Icon name="ticket" size={14} className="text-[#006B4F]" />
                      <span>My Bookings</span>
                    </Link>

                    {currentRole === 'ADMIN' ? (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors"
                      >
                        <Icon name="shield" size={14} className="text-[#8B2E21]" />
                        <span>Admin Console</span>
                      </Link>
                    ) : (
                      <Link
                        to="/host"
                        role="menuitem"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors"
                      >
                        <Icon name="wallet" size={14} className="text-[#E9A83A]" />
                        <span>{currentRole === 'HOST' ? 'Host Dashboard' : 'Host a Compound'}</span>
                      </Link>
                    )}

                    <Link
                      to="/scan"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-[#FAF7F2] transition-colors"
                    >
                      <Icon name="qr" size={14} className="text-[#17212B]" />
                      <span>Gate Permit Scanner</span>
                    </Link>

                    <div className="border-t border-[#E2DDD3] my-1" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Icon name="logout" size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* LOGGED OUT: Login + Sign Up */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className={cn(
                    'px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    isDark
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-[#17212B] hover:bg-[#17212B]/5',
                  )}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black bg-[#E9A83A] text-[#17212B] hover:bg-[#d8972e] shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileMenuOpen}
              className={cn(
                'lg:hidden grid size-9 place-items-center rounded-xl border transition-colors cursor-pointer',
                isDark
                  ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                  : 'border-[#17212B]/10 bg-white/60 text-[#17212B] hover:bg-white',
              )}
            >
              <Icon name={mobileMenuOpen ? 'close' : 'menu'} size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE GLASS SLIDE-DOWN DRAWER
      ========================================================================= */}
      {mobileMenuOpen && (
        <aside
          aria-label="Mobile Navigation"
          className="lg:hidden fixed inset-x-3 top-20 z-[690] rounded-3xl glass-panel-strong shadow-2xl p-5 border border-white/60 animate-fadeIn"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 pb-3 mb-1 border-b border-[#17212B]/10">
              <BrandLogo size={32} withWordmark withTagline />
            </div>
            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#66706B] px-3 pb-1 border-b border-[#17212B]/10">
              Navigation
            </p>

            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-colors',
                  item.isActive
                    ? 'bg-[#006B4F] text-white shadow-xs'
                    : 'text-[#17212B] hover:bg-[#17212B]/5',
                )}
              >
                <span>{item.label}</span>
                {item.requireAuth && (
                  <span className="text-[9px] font-sans font-bold bg-[#E9A83A]/20 text-[#96630f] px-1.5 py-0.5 rounded">
                    Login required
                  </span>
                )}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-[#17212B]/10 flex flex-col gap-2">
              {isUserLoggedIn ? (
                <>
                  <div className="px-3 py-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17212B]">{currentUser?.name}</span>
                    <span className="text-[9px] font-mono font-black bg-[#006B4F]/10 text-[#006B4F] px-2 py-0.5 rounded uppercase">
                      {currentRole === 'USER' ? 'DRIVER' : currentRole}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 rounded-xl bg-red-50/80 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Icon name="logout" size={14} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl text-xs font-bold border border-[#17212B]/15 text-[#17212B] hover:bg-white transition-all text-center"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl text-xs font-black bg-[#E9A83A] text-[#17212B] hover:bg-[#d8972e] shadow-xs text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
