import { useEffect, useState, useMemo } from 'react'
import { cn } from '@/lib/cn'

/**
 * BlueprintBackground — Consistent Faint Ink-on-Paper Nashik Map Background
 *
 * Replaces noisy wavy contour lines and terracotta floating labels with:
 * - Serene warm paper base (#FBFBF4)
 * - Tactile paper noise filter
 * - Very faint (8-10% opacity) vector ink-on-paper Nashik map image (/images/nashik-ink-map.svg)
 * - Zero WebGL overhead on data-dense dashboard & search pages
 */
export default function BlueprintBackground({ variant = 'calm', scrollY = 0, className }) {
  const isHero = variant === 'hero'

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mq.matches)
      const handler = (e) => setPrefersReducedMotion(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [])

  // Parallax offset for hero if requested
  const parallaxY = useMemo(() => {
    if (!isHero || prefersReducedMotion) return 0
    return Math.min(30, scrollY * 0.06)
  }, [isHero, prefersReducedMotion, scrollY])

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none overflow-hidden transition-opacity duration-700',
        isHero ? 'absolute inset-0 z-0' : 'fixed inset-0 z-0',
        mounted ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={{
        backgroundColor: '#FBFBF4',
        transform: parallaxY ? `translateY(${parallaxY}px)` : undefined,
      }}
    >
      {/* 1. Very faint (8-10% opacity) ink-on-paper Nashik map graphic */}
      <div
        className="absolute inset-0 size-full bg-center bg-cover pointer-events-none opacity-[0.09] mix-blend-multiply"
        style={{
          backgroundImage: "url('/images/nashik-ink-map.svg')",
        }}
      />

      {/* 2. Soft tactile grain overlay */}
      <div className="absolute inset-0 size-full pointer-events-none opacity-[0.05] mix-blend-multiply">
        <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="calm-paper-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#calm-paper-grain)" />
        </svg>
      </div>
    </div>
  )
}
