import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import Icon from '@/components/ui/Icon'

/**
 * Sthanam Turn-by-Turn Navigation HUD.
 * Features:
 * 1. Maneuver card (top-left) with turn icon, distance countdown, street name, and "Then" chip.
 * 2. Indian highway signboard banner (top-center) with green board, white border, and bay badge.
 * 3. Trip progress bar (bottom) with remaining distance, ETA clock, controls (Pause/Resume, Stop, Voice, Maps).
 * 4. Recenter & speed chip controls (right).
 * 5. Integrated SpeechSynthesis voice guidance (default off).
 */
export default function NavHud({
  route,
  spot,
  journeyStatus = 'idle', // 'idle' | 'running' | 'paused' | 'arrived'
  hudState,
  travelMode = 'driving',
  onTravelModeChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onClose,
  onRecenter,
  voiceEnabled = false,
  onToggleVoice,
  isLiveTracking = false,
  onToggleLiveTracking,
  currentSpeed = null, // km/h
  playbackSpeed = 1,
  onToggleSpeed,
  userLabel = 'Your Location',
  onOpenOriginPicker,
  onReserve,
  googleMapsUrl,
  geoStatus,
  onDismissGeoStatus,
  onSetStartOnMap,
  settingStartOnMap = false,
}) {
  const spokenRef = useRef(new Set())

  // SpeechSynthesis voice announcement effect
  useEffect(() => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    if (journeyStatus === 'arrived') {
      const arriveKey = `arrive-${spot?.id}`
      if (!spokenRef.current.has(arriveKey)) {
        spokenRef.current.add(arriveKey)
        const utterance = new SpeechSynthesisUtterance(`You have arrived at ${spot?.title || 'your destination'}.`)
        utterance.rate = 1.0
        utterance.lang = 'en-IN'
        window.speechSynthesis.speak(utterance)
      }
      return
    }

    if (journeyStatus !== 'running' || !hudState) return

    const { nextStep, distToNextManeuver } = hudState
    if (!nextStep) return

    const stepIdx = nextStep.index

    // Announce at ~300m
    if (distToNextManeuver <= 350 && distToNextManeuver > 150) {
      const key300 = `step-${stepIdx}-300m`
      if (!spokenRef.current.has(key300)) {
        spokenRef.current.add(key300)
        const text = `In 300 meters, ${nextStep.instruction || 'prepare to turn'}`
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.05
        utterance.lang = 'en-IN'
        window.speechSynthesis.speak(utterance)
      }
    }

    // Announce close to maneuver (< 80m)
    if (distToNextManeuver <= 80 && distToNextManeuver > 10) {
      const keyClose = `step-${stepIdx}-close`
      if (!spokenRef.current.has(keyClose)) {
        spokenRef.current.add(keyClose)
        const text = nextStep.instruction || 'Turn now'
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.05
        utterance.lang = 'en-IN'
        window.speechSynthesis.speak(utterance)
      }
    }
  }, [voiceEnabled, journeyStatus, hudState, spot])

  // Clear spoken cache on journey stop/reset
  useEffect(() => {
    if (journeyStatus === 'idle') {
      spokenRef.current.clear()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [journeyStatus])

  if (!route || !spot) return null

  const isNavigating = journeyStatus === 'running' || journeyStatus === 'paused'
  const isArrived = journeyStatus === 'arrived'

  const activeStep = hudState?.activeStep
  const nextStep = hudState?.nextStep || activeStep
  const thenStep = hudState?.thenStep
  const distToNext = hudState?.distToNextManeuver ?? 300
  const isCloseManeuver = distToNext <= 100

  return (
    <div className="pointer-events-none absolute inset-0 z-[460] flex flex-col justify-between overflow-hidden p-2.5 sm:p-3.5">
      {/* =========================================================================
          TOP ROW: MANEUVER CARD (LEFT) + SIGNBOARD BANNER (CENTER) + RECENTER (RIGHT)
      ========================================================================= */}
      <div className="flex w-full items-start justify-between gap-2">
        {/* 1. TOP-LEFT: MANEUVER CARD */}
        {isNavigating ? (
          <div className="pointer-events-auto flex max-w-[290px] sm:max-w-xs flex-col gap-1.5 rounded-2xl border border-white/20 glass-panel-dark p-3 text-white shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center gap-3">
              {/* Maneuver Turn Icon with close-proximity nudge animation */}
              <div
                className={cn(
                  'grid size-12 shrink-0 place-items-center rounded-xl bg-[#006341] text-[#FFD900] shadow-md transition-transform duration-300 border border-[#FFD900]/30',
                  isCloseManeuver && 'animate-bounce scale-105 ring-2 ring-[#FFD900]',
                )}
              >
                <Icon name={nextStep?.iconName || 'straight'} size={28} strokeWidth={2.4} />
              </div>

              {/* Distance to Turn + Street Name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-[22px] font-black tracking-tight text-white font-mono">
                    {hudState?.nextDistLabel || `${distToNext} m`}
                  </span>
                  {isCloseManeuver && (
                    <span className="animate-pulse rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-[#FFD900]">
                      NOW
                    </span>
                  )}
                </div>
                <p className="truncate text-[12px] font-bold text-gray-200 leading-tight">
                  {nextStep?.instruction || 'Continue straight'}
                </p>
                {nextStep?.streetName && nextStep.streetName !== nextStep.instruction && (
                  <p className="truncate text-[10.5px] font-medium text-gray-400">
                    onto {nextStep.streetName}
                  </p>
                )}
              </div>
            </div>

            {/* "Then" Chip: Preview following maneuver when within 500m */}
            {thenStep && (
              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[10.5px] font-bold text-gray-300 border border-white/5">
                <span className="text-gray-400 text-[10px]">Then</span>
                <Icon name={thenStep.iconName || 'straight'} size={13} className="text-[#FFD900]" />
                <span className="truncate">
                  {thenStep.distanceMeters > 0 ? `${thenStep.distanceMeters} m` : ''} {thenStep.instruction}
                </span>
              </div>
            )}
          </div>
        ) : journeyStatus === 'idle' ? (
          /* IDLE PREVIEW CARD (Destination & Route Summary) */
          <div className="pointer-events-auto max-w-[340px] sm:max-w-md rounded-2xl border border-white/20 glass-panel-dark p-3.5 text-white shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FFD900]">
                  <Icon name="navigation" size={13} className="shrink-0 text-[#FFD900]" />
                  <span className="truncate">Navigating to {spot.title}</span>
                </div>

                {/* Driving & Walking Times */}
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-heading text-[17px] font-black tracking-tight text-white">
                    {travelMode === 'walking' ? '🚶' : '🚗'} {travelMode === 'walking' ? route.walkingLabel : route.drivingLabel}
                  </span>
                  <span className="font-mono text-[12.5px] font-bold text-[#FFD900]">
                    {route.distanceLabel}
                  </span>
                </div>

                {/* Origin Selector Pill */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                  <span className="text-gray-400">From:</span>
                  <button
                    type="button"
                    onClick={onOpenOriginPicker}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 font-bold text-gray-200 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{userLabel || route.origin?.name || 'Your Location'}</span>
                    <Icon name="chevronDown" size={11} />
                  </button>
                  {route.isEstimated && (
                    <span className="text-[9.5px] text-[#FFD900]/80">· Estimated route</span>
                  )}
                </div>
              </div>

              {/* Stop / Exit */}
              <button
                type="button"
                onClick={onClose || onStop}
                className="grid size-6 place-items-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Exit navigation"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            {/* Geolocation Notification Banner (if any) */}
            {geoStatus?.message && (
              <div className="mt-2 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 text-[11px] text-amber-200 flex items-start gap-1.5">
                <Icon name="info" size={13} className="shrink-0 text-amber-400 mt-0.5" />
                <span className="flex-1 leading-snug">{geoStatus.message}</span>
                {onSetStartOnMap && (
                  <button
                    type="button"
                    onClick={onSetStartOnMap}
                    className="underline text-[10px] font-bold text-amber-300 hover:text-white shrink-0 cursor-pointer"
                  >
                    {settingStartOnMap ? 'Cancel' : 'Set start on map'}
                  </button>
                )}
                {onDismissGeoStatus && (
                  <button type="button" onClick={onDismissGeoStatus} className="text-amber-400 hover:text-white">
                    <Icon name="x" size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Mode & Action Row */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-gray-700/60 pt-2">
              <div className="flex items-center rounded-lg bg-white/10 p-0.5 text-[10.5px] font-bold">
                <button
                  type="button"
                  onClick={() => onTravelModeChange?.('driving')}
                  className={cn(
                    'rounded-md px-2 py-0.5 transition-all cursor-pointer',
                    travelMode === 'driving' ? 'bg-[#006341] text-white shadow-xs' : 'text-gray-300 hover:text-white',
                  )}
                >
                  🚗 Drive
                </button>
                <button
                  type="button"
                  onClick={() => onTravelModeChange?.('walking')}
                  className={cn(
                    'rounded-md px-2 py-0.5 transition-all cursor-pointer',
                    travelMode === 'walking' ? 'bg-[#006341] text-white shadow-xs' : 'text-gray-300 hover:text-white',
                  )}
                >
                  🚶 Walk
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#006341] hover:bg-[#004e33] px-3.5 py-1.5 text-[12px] font-black text-white shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Icon name="play" size={13} />
                  <span>Start Journey</span>
                </button>

                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 text-[11px] font-bold text-gray-200 hover:text-white transition-all cursor-pointer"
                    title="Open in Google Maps"
                  >
                    <span>Maps</span>
                    <Icon name="externalLink" size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* 2. TOP-CENTER: INDIAN HIGHWAY ROAD SIGNBOARD */}
        {isNavigating && (
          <div className="pointer-events-auto hidden md:flex items-center gap-2 rounded-xl border-2 border-white/90 bg-[#005A36] px-3.5 py-1.5 text-white shadow-2xl backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex items-center gap-1.5">
              <span className="text-[#FFD900] text-[13px]">➔</span>
              <span className="font-heading font-black text-[12.5px] uppercase tracking-wider text-white">
                Towards {spot.zone?.name || 'Adgaon'} · {spot.title}
              </span>
            </div>
            <div className="rounded bg-[#0B3B60] border border-white/60 px-1.5 py-0.2 text-[9.5px] font-black font-mono tracking-tight text-white">
              P · {spot.spotsLeft || 7} BAYS
            </div>
          </div>
        )}

        {/* 3. TOP-RIGHT: RECENTER & SPEED CONTROLS */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          {onRecenter && isNavigating && (
            <button
              type="button"
              onClick={onRecenter}
              className="grid size-9 place-items-center rounded-xl bg-[#181B1A]/95 text-[#FFD900] border border-[#FFD900]/30 shadow-xl backdrop-blur-md hover:bg-[#006341] hover:text-white transition-all active:scale-95 cursor-pointer"
              title="Recenter camera on navigation arrow"
            >
              <Icon name="recenter" size={16} />
            </button>
          )}

          {isNavigating && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-[#181B1A]/95 px-2 py-1 text-[11px] font-black font-mono text-[#FFD900] border border-[#FFD900]/30 shadow-lg backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentSpeed != null ? `${currentSpeed} km/h` : '36 km/h'}</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ROW: TRIP PROGRESS BAR & ARRIVAL CARD
      ========================================================================= */}
      <div className="flex w-full flex-col items-center gap-2">
        {/* ACTIVE NAVIGATION TRIP BAR */}
        {isNavigating && (
          <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-white/20 glass-panel-dark p-3.5 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Countdown Metrics Header */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-[18px] font-black tracking-tight text-white">
                  {hudState?.remainingTimeLabel || '5 min'}
                </span>
                <span className="font-mono text-[12.5px] font-bold text-[#FFD900]">
                  {hudState?.remainingDistLabel || route.distanceLabel}
                </span>
                <span className="text-[11px] font-medium text-gray-400">
                  · ETA {hudState?.etaClock || '5:30 PM'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9.5px] font-bold text-[#FFD900]">
                  {journeyStatus === 'paused' ? 'Paused' : isLiveTracking ? 'Live GPS' : 'Simulated'}
                </span>
              </div>
            </div>

            {/* Thin Gold Progress Bar */}
            <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-[#FFD900] transition-all duration-150 rounded-full"
                style={{ width: `${Math.round((hudState?.progressRatio ?? 0) * 100)}%` }}
              />
            </div>

            {/* Navigation Action Buttons Row */}
            <div className="mt-2.5 flex items-center justify-between border-t border-gray-700/60 pt-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                {journeyStatus === 'running' ? (
                  <button
                    type="button"
                    onClick={onPause}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 font-bold text-white transition-colors cursor-pointer"
                  >
                    <Icon name="pause" size={12} />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onResume}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#006341] hover:bg-[#004e33] px-2.5 py-1 font-bold text-white transition-colors cursor-pointer"
                  >
                    <Icon name="play" size={12} />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onStop}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-300 px-2.5 py-1 font-bold text-gray-300 transition-colors cursor-pointer"
                  title="Stop navigation"
                >
                  <Icon name="stop" size={12} />
                  <span>Stop</span>
                </button>

                {/* Voice Guidance Toggle */}
                {onToggleVoice && (
                  <button
                    type="button"
                    onClick={onToggleVoice}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-colors cursor-pointer',
                      voiceEnabled ? 'bg-[#006341] text-[#FFD900]' : 'bg-white/10 text-gray-300 hover:text-white',
                    )}
                    title={voiceEnabled ? 'Mute voice instructions' : 'Enable turn-by-turn voice guidance'}
                  >
                    <Icon name={voiceEnabled ? 'volume' : 'volumeX'} size={12} />
                    <span>{voiceEnabled ? 'Voice' : 'Mute'}</span>
                  </button>
                )}

                {/* Live GPS tracking toggle */}
                {onToggleLiveTracking && (
                  <button
                    type="button"
                    onClick={onToggleLiveTracking}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition-colors cursor-pointer hidden sm:inline-flex',
                      isLiveTracking ? 'bg-[#006341] text-white' : 'bg-white/10 text-gray-300 hover:text-white',
                    )}
                  >
                    <Icon name="locate" size={11} />
                    <span>{isLiveTracking ? 'GPS Live' : 'Follow GPS'}</span>
                  </button>
                )}

                {/* 1x / 2x Speed Toggle (Phase 1 Requirement 5) */}
                {onToggleSpeed && (
                  <button
                    type="button"
                    onClick={onToggleSpeed}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2 py-1 text-[11px] font-mono font-bold text-[#FFD900] transition-colors cursor-pointer"
                    title="Toggle journey animation speed"
                  >
                    <Icon name="bolt" size={11} />
                    <span>{playbackSpeed}x</span>
                  </button>
                )}
              </div>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-gray-300 hover:text-[#FFD900] transition-colors"
                >
                  <span>Google Maps</span>
                  <Icon name="externalLink" size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ARRIVAL CELEBRATION CARD */}
        {isArrived && (
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border-2 border-[#FFD900] glass-panel-dark p-4 text-white shadow-2xl animate-in zoom-in-95 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <h4 className="font-heading text-[16px] font-black text-white leading-tight">
                    You&apos;ve Arrived!
                  </h4>
                  <p className="text-[11.5px] text-gray-300">
                    Reached {spot.title} · Verified Kumbh bay ready
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onStop}
                className="grid size-6 place-items-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <Icon name="x" size={13} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-gray-700/60 pt-2.5">
              <button
                type="button"
                onClick={onReserve}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#006341] hover:bg-[#004e33] px-4 py-2 text-[12.5px] font-black text-white shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>Reserve Bay Now</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={onStop}
                className="rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-[12px] font-bold text-gray-200 transition-colors cursor-pointer"
              >
                Done
              </button>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-[11.5px] font-bold text-gray-200 transition-colors"
                  title="Open in Google Maps"
                >
                  <Icon name="externalLink" size={13} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
