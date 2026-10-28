import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getPostLoginPath } from '@/lib/authNav'
import GlassNavbar from '@/components/layout/GlassNavbar'
import Icon from '@/components/ui/Icon'

export default function Forbidden({ requiredRole = 'appropriate' }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleGoToMyDashboard = () => {
    navigate(getPostLoginPath(user?.role), { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#006B4F] selection:text-white pt-24">
      <GlassNavbar />
      <div className="w-full max-w-lg rounded-3xl glass-panel border border-white/60 shadow-xl p-8 sm:p-10 text-center">
        {/* Shield Icon */}
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-100 text-red-600 mb-6 shadow-xs">
          <Icon name="shield" size={32} />
        </div>

        <div className="inline-block rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          403 Access Forbidden
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#17212B] font-serif tracking-tight">
          Role Permission Required
        </h1>

        <p className="mt-3 text-sm text-[#66706B] leading-relaxed max-w-md mx-auto">
          You are currently signed in as{' '}
          <span className="font-bold text-[#17212B]">{user?.name || 'User'}</span> with the role{' '}
          <span className="font-mono font-bold text-[#006B4F] bg-[#EAF2EC] px-2 py-0.5 rounded uppercase">
            {user?.role || 'Guest'}
          </span>
          . This portal requires <span className="font-bold text-red-700">{requiredRole}</span> permissions.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleGoToMyDashboard}
            className="px-5 py-2.5 rounded-xl bg-[#006B4F] text-white font-bold text-sm hover:bg-[#004D38] shadow-sm transition-all cursor-pointer"
          >
            Go to My Dashboard →
          </button>

          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="px-5 py-2.5 rounded-xl border border-[#E2DDD3] bg-[#FAF7F2] text-[#17212B] font-bold text-sm hover:bg-white transition-all cursor-pointer"
          >
            Switch Account / Logout
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-[#E2DDD3]">
          <Link to="/" className="text-xs font-bold text-[#66706B] hover:text-[#006B4F] transition-colors">
            ← Return to Sthaanam Home
          </Link>
        </div>
      </div>
    </div>
  )
}
