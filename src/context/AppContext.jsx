import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { currentHost } from '@/api/mock/hosts'
import { isMock } from '@/api'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export const DEFAULT_FILTERS = {
  zone: 'all',
  q: '',
  vehicle: 'all',
  features: [],
  maxPrice: null,
  plan: 'hour',
  instant: false,
  onlyAvailable: false,
  openNow: false,
  sort: 'recommended',
  origin: null,
  originLabel: null,
  radiusKm: null,
}

// Default Demo User Account "Devv"
const DEFAULT_DEMO_USER = {
  id: 'u_devv',
  name: 'Devv',
  initials: 'DV',
  phone: '+91 98200 12345',
  email: 'devv@sthanam.in',
  homeZone: 'ramkund',
  role: 'user',
  isDemo: true,
}

export function AppProvider({ children }) {
  const auth = useAuth()
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true'

  const [demoUserRole, setDemoUserRole] = useState('user')
  const [demoUser, setDemoUser] = useState(DEFAULT_DEMO_USER)
  const [host] = useState(() => currentHost)
  const [saved, setSaved] = useState(() => new Set(['s6']))
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const activeUser = auth?.user || (isDemo ? demoUser : null)
  const activeRole = auth?.user?.role?.toLowerCase() || (isDemo ? demoUserRole : null)

  const setUserRole = useCallback((role, userData) => {
    setDemoUserRole(role)
    if (userData) {
      setDemoUser((prev) => ({
        ...prev,
        ...userData,
        initials: userData.name
          ? userData.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
          : 'DV',
        role,
      }))
    }
  }, [])

  const toggleSaved = useCallback((spotId) => {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(spotId)) next.delete(spotId)
      else next.add(spotId)
      return next
    })
  }, [])

  const patchFilters = useCallback((patch) => {
    setFilters((current) => ({ ...current, ...patch }))
  }, [])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const value = useMemo(
    () => ({
      user: activeUser,
      setUser: setDemoUser,
      userRole: activeRole,
      setUserRole,
      host,
      saved,
      toggleSaved,
      isSaved: (id) => saved.has(id),
      filters,
      patchFilters,
      resetFilters,
      isMock,
    }),
    [activeUser, activeRole, setUserRole, host, saved, toggleSaved, filters, patchFilters, resetFilters],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
