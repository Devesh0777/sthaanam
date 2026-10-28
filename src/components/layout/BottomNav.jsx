import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'

export default function BottomNav() {
  const { pathname } = useLocation()
  const { user, isAuthenticated } = useAuth()
  const role = (user?.role || '').toUpperCase()

  const hidden =
    pathname.startsWith('/listing/') ||
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/signup'

  const tabs = useMemo(() => {
    if (!isAuthenticated) {
      return [
        { to: '/', label: 'Home', icon: 'home', end: true },
        { to: '/search', label: 'Find Parking', icon: 'search' },
        { to: '/login?from=%2Fapp', label: 'Bookings', icon: 'ticket' },
        { to: '/scan', label: 'Scan QR', icon: 'qr' },
        { to: '/login', label: 'Sign in', icon: 'user' },
      ]
    }

    const list = [
      { to: '/', label: 'Home', icon: 'home', end: true },
      { to: '/search', label: 'Find Parking', icon: 'search' },
      { to: '/scan', label: 'Scan QR', icon: 'qr' },
    ]

    if (role === 'ADMIN') {
      list.push({ to: '/admin', label: 'Admin', icon: 'shield' })
    } else if (role === 'HOST') {
      list.push({ to: '/host', label: 'Host', icon: 'wallet' })
    } else {
      list.push({ to: '/app', label: 'Bookings', icon: 'ticket' })
    }

    return list
  }, [isAuthenticated, role])

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-[800] border-t border-[#17212B]/10 glass-panel shadow-[0_-2px_16px_rgba(23,33,43,0.06)]',
        'pb-[max(0.25rem,env(safe-area-inset-bottom))] transition-transform duration-300',
        'lg:hidden',
        hidden && 'translate-y-full',
      )}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 pt-2 pb-1.5 text-[10px] font-bold transition-colors',
                  isActive ? 'text-[#006B4F]' : 'text-[#66706B] hover:text-[#17212B]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors duration-200',
                      isActive ? 'bg-[#006B4F]/10 text-[#006B4F]' : '',
                    )}
                  >
                    <Icon name={tab.icon} size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                  </span>
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
