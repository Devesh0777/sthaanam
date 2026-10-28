import { useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import Landing from './pages/Landing'
import Search from './pages/Search'
import ListingDetail from './pages/ListingDetail'
import UserDashboard from './pages/UserDashboard'
import HostDashboard from './pages/HostDashboard'
import HostNewListing from './pages/HostNewListing'
import ScanPage from './pages/ScanPage'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'
import RouteGuard from './components/auth/RouteGuards'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/find-parking" element={<Search />} />
        <Route path="/parking" element={<Search />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected User Dashboard (/app) */}
        <Route
          path="/app"
          element={
            <RouteGuard allowedRoles={['USER']}>
              <UserDashboard />
            </RouteGuard>
          }
        />
        <Route path="/bookings" element={<Navigate to="/app" replace />} />

        {/* Protected Host Dashboard (/host) */}
        <Route
          path="/host"
          element={
            <RouteGuard allowedRoles={['HOST']}>
              <HostDashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/host/new"
          element={
            <RouteGuard allowedRoles={['HOST']}>
              <HostNewListing />
            </RouteGuard>
          }
        />

        {/* Protected Admin Console (/admin) */}
        <Route
          path="/admin"
          element={
            <RouteGuard allowedRoles={['ADMIN']}>
              <Admin />
            </RouteGuard>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  )
}
