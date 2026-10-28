import GlassNavbar from '@/components/layout/GlassNavbar'

export default function UserShell({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#17212B] flex flex-col font-sans selection:bg-[#006B4F] selection:text-white">
      {/* Sthaanam Global Glass Navbar */}
      <GlassNavbar />

      {/* Main Content Area with appropriate top spacing for floating glass navbar */}
      <main className="flex-1 pt-20 sm:pt-24 pb-16">{children}</main>
    </div>
  )
}
