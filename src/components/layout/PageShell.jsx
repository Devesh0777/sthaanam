import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import Icon from '@/components/ui/Icon'
import GlassNavbar from './GlassNavbar'

export { default as GlassNavbar } from './GlassNavbar'

/**
 * Global Top Navigation delegate to unified GlassNavbar
 */
export function TopNav({ transparentOnHero = false }) {
  return <GlassNavbar transparentOnHero={transparentOnHero} />
}

/** Sticky screen header with optional back affordance and right-side actions. */
export function PageHeader({ title, subtitle, back = true, backTo, actions, transparent = false, className }) {
  return (
    <header
      className={cn(
        'sticky top-16 z-[600] pt-safe',
        transparent ? 'bg-transparent' : 'glass-panel mx-3 sm:mx-6 my-2 rounded-2xl shadow-xs',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        {back && (
          <Link
            to={backTo ?? -1}
            aria-label="Back"
            className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full text-text transition-colors hover:bg-black/5"
          >
            <Icon name="chevronLeft" size={22} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold text-[#16191E]">{title}</h1>
          {subtitle && <p className="truncate text-[12px] text-[#6B6B6B]">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </header>
  )
}

/** Full-screen page wrapper: desktop top bar + safe bottom spacing. */
export function PageShell({ children, className, transparentOnHero = false }) {
  return (
    <div className="min-h-dvh bg-bg selection:bg-[#006B4F] selection:text-white">
      <GlassNavbar transparentOnHero={transparentOnHero} />
      <main className={cn(transparentOnHero ? 'pb-20 lg:pb-0' : 'pt-20 sm:pt-24 pb-20 lg:pb-8', className)}>
        {children}
      </main>
    </div>
  )
}

export default PageShell
