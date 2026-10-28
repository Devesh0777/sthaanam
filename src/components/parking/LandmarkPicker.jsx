import { useState, useRef, useEffect, useMemo } from 'react'
import { NASHIK_LANDMARKS, LANDMARK_CATEGORIES } from '@/data/landmarks'
import Icon from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

export default function LandmarkPicker({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter landmarks based on search query
  const filteredLandmarks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return NASHIK_LANDMARKS

    return NASHIK_LANDMARKS.filter((item) => {
      const haystack = `${item.name} ${item.subtitle} ${item.category} ${item.zone} ${item.city}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [searchQuery])

  // Group filtered landmarks by category
  const groupedLandmarks = useMemo(() => {
    const groups = {}
    LANDMARK_CATEGORIES.forEach((cat) => {
      const items = filteredLandmarks.filter((item) => item.category === cat)
      if (items.length > 0) {
        groups[cat] = items
      }
    })
    return groups
  }, [filteredLandmarks])

  const selectedItem = useMemo(() => {
    if (!value) return null
    if (typeof value === 'object') return value
    return NASHIK_LANDMARKS.find((item) => item.id === value) || null
  }, [value])

  const handleSelect = (item) => {
    onChange(item)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      <div>
        <label className="block text-[13px] font-semibold text-text">
          Nearest Famous Location <span className="text-danger">*</span>
        </label>
        <p className="mt-1 text-[12px] text-muted">
          Select the landmark, ghat, temple or major area closest to your parking space.
        </p>
      </div>

      <div className="relative">
        {/* Input box */}
        <div
          onClick={() => {
            setIsOpen(true)
            inputRef.current?.focus()
          }}
          className={cn(
            'flex items-center gap-2.5 rounded-[14px] border bg-surface px-3.5 py-3 transition-all cursor-text',
            isOpen
              ? 'border-brand ring-2 ring-brand/10 shadow-sm'
              : error
              ? 'border-danger bg-danger-soft/20'
              : 'border-line hover:border-muted/50',
          )}
        >
          <Icon name="search" size={18} className="shrink-0 text-muted" />

          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-[14px] font-medium text-text placeholder:text-muted/70 focus:outline-none"
            placeholder="Search or select a nearby landmark"
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setSearchQuery('')
                inputRef.current?.focus()
              }}
              className="grid size-5 shrink-0 place-items-center rounded-full bg-muted/20 text-muted hover:bg-muted/30"
            >
              <Icon name="x" size={12} />
            </button>
          ) : (
            <Icon
              name="chevron"
              size={18}
              className={cn('shrink-0 text-muted transition-transform duration-200', isOpen && 'rotate-180')}
            />
          )}
        </div>

        {error && <p className="mt-1 text-[12px] font-medium text-danger">{error}</p>}

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-[600] mt-1.5 max-h-72 overflow-y-auto rounded-[16px] border border-line bg-surface p-2 shadow-lg card-shadow animate-[pop-in_0.18s_var(--ease-out-expo)]">
            {Object.keys(groupedLandmarks).length === 0 ? (
              <div className="p-4 text-center text-[13px] text-muted">
                No matching landmarks found for "{searchQuery}"
              </div>
            ) : (
              Object.entries(groupedLandmarks).map(([category, items]) => (
                <div key={category} className="mb-2 last:mb-0">
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
                    {category}
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => {
                      const isSelected = selectedItem?.id === item.id

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className={cn(
                            'group flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left transition-all',
                            isSelected
                              ? 'bg-brand/10 text-brand border border-brand/20 font-semibold'
                              : 'hover:bg-surface-sunken/80 text-text',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] shrink-0">📍</span>
                              <span
                                className={cn(
                                  'text-[14px] font-semibold',
                                  isSelected ? 'text-brand' : 'text-text',
                                )}
                              >
                                {item.name}
                              </span>
                            </div>
                            <p className="mt-0.5 pl-6 text-[12px] text-muted">
                              {item.subtitle}
                            </p>
                          </div>

                          {isSelected && (
                            <span className="ml-2 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white">
                              <Icon name="check" size={12} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected location confirmation card */}
      {selectedItem && (
        <div className="rounded-[14px] border border-brand/20 bg-surface-sunken p-3.5 transition-all">
          <p className="text-[10px] font-bold tracking-wider text-muted uppercase">
            NEAREST LANDMARK
          </p>
          <div className="mt-1 flex items-center justify-between">
            <h4 className="text-[15px] font-bold text-text flex items-center gap-1.5">
              <span>📍</span> {selectedItem.name}
            </h4>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
              <Icon name="check" size={11} strokeWidth={2.5} /> Selected
            </span>
          </div>
          <p className="mt-1 text-[12px] text-muted font-medium">
            {selectedItem.subtitle} • {selectedItem.city}
          </p>
          {selectedItem.distanceFormatted && (
            <p className="mt-1 flex items-center gap-1 text-[12px] font-bold text-brand">
              <Icon name="navigation" size={13} />
              <span>{selectedItem.distanceFormatted}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

