import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getPostLoginPath } from '@/lib/authNav'
import GlassNavbar from '@/components/layout/GlassNavbar'
import Icon from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get('from')
  const { signup } = useAuth()

  const [role, setRole] = useState('USER') // 'USER' (Driver) or 'HOST'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errors = {}

    if (!name.trim()) {
      errors.name = 'Full name is required'
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    if (phone.trim() && !/^[+0-9\s-]{10,15}$/.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number (10 digits)'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)
    const result = await signup({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      password,
      role,
    })
    setLoading(false)

    if (result.success) {
      const destination = getPostLoginPath(result.user?.role || role, from)
      navigate(destination, { replace: true })
    } else {
      setError(result.error || 'Registration failed')
    }
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
          Create your Sthaanam account
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-[#66706B]">
          Already have an account?{' '}
          <Link
            to={from ? `/login?from=${encodeURIComponent(from)}` : '/login'}
            className="font-bold text-[#006B4F] hover:text-[#004D38] underline decoration-[#006B4F]/40 hover:decoration-[#006B4F] underline-offset-4 transition-colors"
          >
            Sign in here
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
            {/* Role Choice: Driver (User) vs Host */}
            <div>
              <span className="block text-xs sm:text-sm font-bold text-[#17212B] mb-2">
                I want to register as:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${role === 'USER'
                      ? 'border-[#006B4F] bg-[#EAF2EC] text-[#006B4F] shadow-xs'
                      : 'border-[#E2DDD3] bg-[#FAF7F2] text-[#66706B] hover:border-[#006B4F]/40'
                    }`}
                >
                  <Icon name="car" size={20} className={role === 'USER' ? 'text-[#006B4F]' : 'text-[#66706B]'} />
                  <span className="mt-1 text-xs sm:text-sm font-bold">Driver / Pilgrim</span>
                  <span className="text-[10px] text-center opacity-80 mt-0.5">Find & book parking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('HOST')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${role === 'HOST'
                      ? 'border-[#E9A83A] bg-[#FFF5DF] text-[#8C5E00] shadow-xs'
                      : 'border-[#E2DDD3] bg-[#FAF7F2] text-[#66706B] hover:border-[#E9A83A]/40'
                    }`}
                >
                  <Icon name="wallet" size={20} className={role === 'HOST' ? 'text-[#E9A83A]' : 'text-[#66706B]'} />
                  <span className="mt-1 text-xs sm:text-sm font-bold">Parking Host</span>
                  <span className="text-[10px] text-center opacity-80 mt-0.5">Rent out my driveway/plot</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                Full Name
              </label>
              <div className="mt-1.5">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }))
                  }}
                  placeholder="e.g. Ramesh Joshi"
                  className={`block w-full rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#17212B] placeholder-[#9AA39E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/30 transition-all ${fieldErrors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E2DDD3]'
                    }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                Email address
              </label>
              <div className="mt-1.5">
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
                  placeholder="ramesh@example.com"
                  className={`block w-full rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#17212B] placeholder-[#9AA39E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/30 transition-all ${fieldErrors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E2DDD3]'
                    }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                Phone Number <span className="text-[#66706B] font-normal text-xs">(for SMS gate permits)</span>
              </label>
              <div className="mt-1.5">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }))
                  }}
                  placeholder="+91 98200 00000"
                  className={`block w-full rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#17212B] placeholder-[#9AA39E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/30 transition-all ${fieldErrors.phone ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E2DDD3]'
                    }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }))
                  }}
                  placeholder="At least 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-bold text-[#17212B]">
                Confirm Password
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }))
                  }}
                  placeholder="Re-enter password"
                  className={`block w-full rounded-xl border bg-[#FAF7F2] px-3.5 py-2.5 pr-10 text-sm text-[#17212B] placeholder-[#9AA39E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006B4F]/30 transition-all ${fieldErrors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E2DDD3]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#66706B] hover:text-[#17212B] cursor-pointer"
                >
                  <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.confirmPassword}</p>
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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  `Register as ${role === 'HOST' ? 'Host' : 'Driver'}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
