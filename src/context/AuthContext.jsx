import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const API_BASE = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000'

export const SEED_ACCOUNTS = {
  'devv@sthanam.in': {
    id: '8d68c722-8016-4b87-a905-1ad980c68e57',
    name: 'Devv',
    email: 'devv@sthanam.in',
    phone: '+91 98200 12345',
    role: 'USER',
    status: 'ACTIVE',
    passwords: ['User@Sthanam2027', 'Driver@Sthanam2027', 'devv123'],
  },
  'sunita@sthanam.in': {
    id: 'h_sunita_host',
    name: 'Sunita Deshmukh',
    email: 'sunita@sthanam.in',
    phone: '+91 98200 54321',
    role: 'HOST',
    status: 'ACTIVE',
    passwords: ['Host@Sthanam2027', 'host123'],
  },
  'admin@sthanam.gov.in': {
    id: 'a_admin_controller',
    name: 'Kumbh Controller',
    email: 'admin@sthanam.gov.in',
    phone: '+91 94222 00001',
    role: 'ADMIN',
    status: 'ACTIVE',
    passwords: ['Admin@Sthanam2027', 'admin123'],
  },
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('sthanam_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(true)

  // Silently check current auth status via /auth/me on load
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('sthanam_token')
    const cachedUser = getStoredUser()

    if (!token && !cachedUser) {
      setUser(null)
      setLoading(false)
      return null
    }

    // Mock tokens skip backend network check
    if (token && token.startsWith('sthanam_mock_')) {
      if (cachedUser) {
        setUser(cachedUser)
        setLoading(false)
        return cachedUser
      }
    }

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      if (res.ok) {
        const body = await res.json()
        const userData = body.data?.user || body.user
        if (userData) {
          localStorage.setItem('sthanam_user', JSON.stringify(userData))
          setUser(userData)
          return userData
        }
      }

      // If backend explicitly rejected token (401 / 403) and not a mock token
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('sthanam_token')
        localStorage.removeItem('sthanam_user')
        setUser(null)
        return null
      }

      // If other server response error, fall back to cached session
      if (cachedUser) {
        setUser(cachedUser)
        return cachedUser
      }

      localStorage.removeItem('sthanam_token')
      localStorage.removeItem('sthanam_user')
      setUser(null)
      return null
    } catch {
      // Backend offline: keep cached session if available
      if (cachedUser) {
        setUser(cachedUser)
        return cachedUser
      }
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function initAuth() {
      const token = localStorage.getItem('sthanam_token')
      const cachedUser = getStoredUser()

      if (!token && !cachedUser) {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      if (cachedUser && mounted) {
        setUser(cachedUser)
      }

      // If mock token, already authenticated via cachedUser
      if (token && token.startsWith('sthanam_mock_')) {
        if (mounted) setLoading(false)
        return
      }

      // Verify with backend
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers,
          credentials: 'include',
        })

        if (!mounted) return

        if (res.ok) {
          const body = await res.json()
          const userData = body.data?.user || body.user
          if (userData) {
            localStorage.setItem('sthanam_user', JSON.stringify(userData))
            setUser(userData)
            setLoading(false)
            return
          }
        }

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sthanam_token')
          localStorage.removeItem('sthanam_user')
          setUser(null)
        }
      } catch {
        // Backend offline: retain cached user session
        if (cachedUser && mounted) {
          setUser(cachedUser)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()
    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const rawEmail = (email || '').trim()
    const cleanEmail = rawEmail.toLowerCase()
    const cleanPw = (password || '').trim()

    // 1. Attempt Live Backend Login First
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: rawEmail, password: cleanPw }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        const authData = data.data || data
        if (authData.accessToken) {
          localStorage.setItem('sthanam_token', authData.accessToken)
        }
        if (authData.user) {
          localStorage.setItem('sthanam_user', JSON.stringify(authData.user))
          setUser(authData.user)
        }
        return { success: true, user: authData.user }
      }
    } catch {
      // Backend offline / network error; continue to mock/seed fallback
    }

    // 2. Mock & Seed Fallback Authentication
    const seed = SEED_ACCOUNTS[cleanEmail]
    if (seed && seed.passwords.includes(cleanPw)) {
      const mockUser = {
        id: seed.id,
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        role: seed.role,
        status: seed.status,
      }
      const mockToken = `sthanam_mock_jwt_${seed.role.toLowerCase()}_${Date.now()}`
      localStorage.setItem('sthanam_token', mockToken)
      localStorage.setItem('sthanam_user', JSON.stringify(mockUser))
      setUser(mockUser)
      return { success: true, user: mockUser }
    }

    return {
      success: false,
      error: 'Invalid email or password. Use quick-fill buttons or registered credentials.',
    }
  }, [])

  const signup = useCallback(async ({ name, email, phone, password, role = 'USER' }) => {
    const rawEmail = (email || '').trim()
    const cleanPw = (password || '').trim()
    const assignedRole = (role || 'USER').toUpperCase()

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email: rawEmail, phone, password: cleanPw, role: assignedRole }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        const authData = data.data || data
        if (authData.accessToken) {
          localStorage.setItem('sthanam_token', authData.accessToken)
        }
        if (authData.user) {
          localStorage.setItem('sthanam_user', JSON.stringify(authData.user))
          setUser(authData.user)
        }
        return { success: true, user: authData.user }
      }

      // If backend returned an error (e.g. 400 validation, 409 email exists), report it
      return {
        success: false,
        error: data.error?.message || data.message || 'Registration failed with status ' + res.status,
      }
    } catch (err) {
      console.warn('Backend signup error:', err)
      return {
        success: false,
        error: 'Cannot connect to backend authentication server (http://localhost:4000). Ensure the backend is running.',
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('sthanam_token')
      localStorage.removeItem('sthanam_user')
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(user),
      userRole: user?.role?.toUpperCase() || null,
      login,
      signup,
      logout,
      checkAuth,
    }),
    [user, loading, login, signup, logout, checkAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
