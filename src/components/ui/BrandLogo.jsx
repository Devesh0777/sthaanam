import { useMemo } from 'react'
import { cn } from '@/lib/cn'

// High-DPI Brand Logo Assets
import emblemSmall16Png from '@/assets/brand/emblem-small-16.png'
import emblemSmall32Png from '@/assets/brand/emblem-small-32.png'
import emblemSmall48Png from '@/assets/brand/emblem-small-48.png'
import emblemSmall48Webp from '@/assets/brand/emblem-small-48.webp'
import emblemSmall96Png from '@/assets/brand/emblem-small-96.png'
import emblemSmall96Webp from '@/assets/brand/emblem-small-96.webp'

import emblemFull128Png from '@/assets/brand/emblem-full-128.png'
import emblemFull256Png from '@/assets/brand/emblem-full-256.png'
import emblemFull512Png from '@/assets/brand/emblem-full-512.png'
import emblemFull512Webp from '@/assets/brand/emblem-full-512.webp'

/**
 * BrandLogo — Official Sthaanam Topographical Compass Emblem & Wordmark Component
 *
 * @param {number|string} size - Pixel size (default: 40)
 * @param {boolean} withWordmark - Whether to display the "Sthaanam" wordmark lockup
 * @param {string} variant - 'auto' | 'small' | 'full' | 'print'
 * @param {boolean} isDark - Dark context styling for wordmark & badges
 * @param {boolean} withTagline - Display sub-tagline under wordmark
 * @param {string} badge - Optional badge text (e.g. '2027')
 * @param {string} className - Wrapper container class
 * @param {string} imgClassName - Image element class
 * @param {string} alt - Alt text (default: 'Sthaanam logo')
 */
export default function BrandLogo({
  size = 40,
  withWordmark = false,
  variant = 'auto',
  isDark = false,
  withTagline = false,
  badge,
  className = '',
  imgClassName = '',
  alt = 'Sthaanam logo',
  ...props
}) {
  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 40

  const resolvedVariant = useMemo(() => {
    if (variant !== 'auto') return variant
    return numericSize <= 56 ? 'small' : 'full'
  }, [variant, numericSize])

  // Select optimal image asset and 2x Retina srcSet based on resolution
  const { src, srcSet } = useMemo(() => {
    if (resolvedVariant === 'small' || resolvedVariant === 'print') {
      if (numericSize <= 24) {
        return {
          src: emblemSmall32Png,
          srcSet: `${emblemSmall16Png} 1x, ${emblemSmall32Png} 2x`,
        }
      }
      if (numericSize <= 48) {
        return {
          src: emblemSmall48Webp || emblemSmall48Png,
          srcSet: `${emblemSmall48Webp} 1x, ${emblemSmall96Webp} 2x`,
        }
      }
      return {
        src: emblemSmall96Webp || emblemSmall96Png,
        srcSet: `${emblemSmall96Webp} 1x`,
      }
    }

    if (numericSize <= 128) {
      return {
        src: emblemFull128Png,
        srcSet: `${emblemFull128Png} 1x, ${emblemFull256Png} 2x`,
      }
    }
    if (numericSize <= 256) {
      return {
        src: emblemFull256Png,
        srcSet: `${emblemFull256Png} 1x, ${emblemFull512Webp} 2x`,
      }
    }
    return {
      src: emblemFull512Webp || emblemFull512Png,
      srcSet: `${emblemFull512Webp} 1x`,
    }
  }, [resolvedVariant, numericSize])

  // Responsive emblem image
  const emblemElement = (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center overflow-hidden transition-transform duration-200',
        numericSize <= 48 ? 'rounded-[11px]' : 'rounded-2xl',
        'border border-white/25 shadow-xs',
        className,
      )}
      style={{
        width: `${numericSize}px`,
        height: `${numericSize}px`,
      }}
      {...props}
    >
      <picture className="w-full h-full flex items-center justify-center">
        <source srcSet={srcSet} type="image/webp" />
        <img
          src={src}
          srcSet={srcSet}
          alt={alt}
          width={numericSize}
          height={numericSize}
          loading="eager"
          decoding="async"
          className={cn(
            'w-full h-full object-cover select-none pointer-events-none',
            imgClassName,
          )}
        />
      </picture>
    </div>
  )

  if (!withWordmark) {
    return emblemElement
  }

  // Wordmark lockup
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {emblemElement}

      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[17px] font-serif italic font-bold tracking-tight',
              isDark ? 'text-white' : 'text-[#17212B]',
            )}
            style={{
              fontFamily: "var(--font-serif, 'Playfair Display', 'Cormorant Garamond', Georgia, serif)",
            }}
          >
            Sthaanam
          </span>
          {badge !== null && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[8.5px] font-mono font-black uppercase tracking-wider',
                isDark ? 'bg-[#E9A83A]/20 text-[#FFD166]' : 'bg-[#006B4F]/10 text-[#006B4F]',
              )}
            >
              {badge || '2027'}
            </span>
          )}
        </div>

        {withTagline && (
          <p
            className={cn(
              'text-[8.5px] font-medium tracking-wider uppercase hidden sm:block',
              isDark ? 'text-white/60' : 'text-[#66706B]',
            )}
          >
            Nashik–Trimbakeshwar Ghat Mobility
          </p>
        )}
      </div>
    </div>
  )
}
