import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Forbidden from '@/pages/Forbidden'

/**
 * Route guard that ensures the user is logged in, and optionally validates their role.
 * Redirects unauthenticated users to /login?from=...
 * Displays 403 Forbidden page on role mismatch.
 */
export function RouteGuard({ allowedRoles, children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="relative grid size-12 place-items-center rounded-2xl bg-[#006B4F] text-white shadow-md animate-pulse">
          <span className="font-mono text-xl font-black">S</span>
        </div>
        <p className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-[#66706B]">
          Verifying security session...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?from=${returnUrl}`} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user?.role || '').toUpperCase()
    const allowed = allowedRoles.map((r) => r.toUpperCase())
    if (!allowed.includes(userRole)) {
      return <Forbidden requiredRole={allowedRoles.join(' or ')} />
    }
  }

  return children
}

export default RouteGuard
