import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getPostLoginPath } from '@/lib/authNav'
import GlassNavbar from '@/components/layout/GlassNavbar'
import Icon from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    const result = await login(email.trim(), password)
    setLoading(false)

    if (result.success) {
      const destination = getPostLoginPath(result.user?.role, from)
      navigate(destination, { replace: true })
    } else {
      setError(result.error || 'Invalid email or password')
    }
  }

  const handleQuickFill = (demoEmail, demoPw) => {
    setEmail(demoEmail)
    setPassword(demoPw)
    setError('')
    setFieldErrors({})
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center pt-24 pb-12 sm:px-6 lg:px-8 font-sans selection:bg-[#006B4F] selection:text-white">
      <GlassNavbar />
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Sthaanam Logo & Lockup */}
        <Link to="/" className="flex flex-col items-center group cursor-pointer">
          <BrandLogo size={56} className="group-hover:scale-105 shadow-md" />
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-serif italic font-bold tracking-tight text-[#17212B]">
                Sthaanam
              </span>
              <span className="rounded bg-[#EAF2EC] px-2 py-0.5 text-[10px] font-mono font-black text-[#006B4F] uppercase tracking-wider">
                2027
              </span>
            </div>
            <p className="text-xs font-bold text-[#66706B] tracking-wider uppercase mt-0.5">
              Nashik–Trimbakeshwar Ghat Mobility
            </p>
          </div>
        </Link>

        <h2 className="mt-6 text-center text-xl sm:text-2xl font-bold tracking-tight text-[#17212B]">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-[#66706B]">
          Or{' '}
          <Link
            to={from ? `/signup?from=${encodeURIComponent(from)}` : '/signup'}
            className="font-bold text-[#006B4F] hover:text-[#004D38] underline decoration-[#006B4F]/40 hover:decoration-[#006B4F] underline-offset-4 transition-colors"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="glass-panel py-8 px-6 shadow-md border border-white/60 rounded-3xl sm:px-10">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-800 flex items-start gap-3 animate-fadeIn"
            >
              <div className="shrink-0 mt-0.5 text-red-600">
                <Icon name="alert" size={18} />
              </div>
              <div className="text-xs sm:text-sm font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }))
                  }}
                  placeholder="name@example.com"
                  className={`block w-full rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#17212B] placeholder-[#9AA39E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/30 transition-all ${fieldErrors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E2DDD3]'
                    }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                  Password
                </label>
              </div>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }))
                  }}
                  placeholder="••••••••"
                  className={`block w-full rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 pr-10 text-sm text-[#17212B] placeholder-[#9AA39E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/30 transition-all ${fieldErrors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E2DDD3]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#66706B] hover:text-[#17212B] cursor-pointer"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#006B4F] hover:bg-[#004D38] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006B4F] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in to Sthaanam'
                )}
              </button>
            </div>
          </form>

          {/* Seed demo quick-fill helper */}
          <div className="mt-6 pt-5 border-t border-[#E2DDD3]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#66706B] font-bold text-center mb-2.5">
              Quick Fill Seed Credentials
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickFill('devv@sthanam.in', 'User@Sthanam2027')}
                className="py-1.5 px-1 rounded-lg border border-[#006B4F]/20 bg-[#EAF2EC] text-[#006B4F] font-bold hover:bg-[#006B4F] hover:text-white transition-all text-center cursor-pointer"
              >
                Driver (Devv)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sunita@sthanam.in', 'Host@Sthanam2027')}
                className="py-1.5 px-1 rounded-lg border border-[#E9A83A]/30 bg-[#FFF5DF] text-[#8C5E00] font-bold hover:bg-[#E9A83A] hover:text-white transition-all text-center cursor-pointer"
              >
                Host (Sunita)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@sthanam.gov.in', 'Admin@Sthanam2027')}
                className="py-1.5 px-1 rounded-lg border border-red-200 bg-red-50 text-red-800 font-bold hover:bg-red-800 hover:text-white transition-all text-center cursor-pointer"
              >
                Admin (Gov)
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] font-mono text-[#66706B]">
              Driver: <span className="font-bold text-[#17212B]">devv@sthanam.in</span> | Host: <span className="font-bold text-[#17212B]">sunita@sthanam.in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
