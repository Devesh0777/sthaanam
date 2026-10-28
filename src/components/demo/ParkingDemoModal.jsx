import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import QRCode from '@/components/ui/QRCode'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'
import DigitalParkingTicket from '@/components/booking/DigitalParkingTicket'
import BrandLogo from '@/components/ui/BrandLogo'

/**
 * Demo States Machine:
 * 1. BOOKED
 * 2. ENTRY_SCANNING
 * 3. ENTRY_VERIFIED (PARKING_ACTIVE) - Ticket punched
 * 4. TIME_EXPIRED (Overtime Warning)
 * 5. OVERTIME (Active Overtime counter & charge)
 * 6. EXIT_SCANNING
 * 7. COMPLETED - Ticket exit cut & final breakdown
 */

export default function ParkingDemoModal({ booking, spot, onClose }) {
  const navigate = useNavigate()
  const [demoMode, setDemoMode] = useState('normal') // 'normal' | 'overtime'
  const [demoState, setDemoState] = useState('BOOKED')
  const [scanProgress, setScanProgress] = useState(0)
  const [overtimeMinutes, setOvertimeMinutes] = useState(30)

  // Dynamic ticket details
  const passCode = booking?.code || 'NPC-CFLCH'
  const spotTitle = booking?.title || spot?.title || 'Driveway Behind Sagar Petrol Pump'
  const baseAmount = booking?.amount ?? 80
  const hourlyRate = spot?.priceHour ?? 40
  const entryTime = '10:42 AM'
  const bookedEndTime = '12:42 PM'
  const actualExitTime = demoMode === 'overtime' ? '01:12 PM' : '12:42 PM'

  // Calculate overtime charge
  const overtimeHours = Math.ceil(overtimeMinutes / 60)
  const overtimeCharge = demoMode === 'overtime' ? overtimeHours * hourlyRate : 0
  const totalAmount = baseAmount + overtimeCharge

  // Simulated scanning timers
  useEffect(() => {
    let interval = null
    let resetTimeout = null

    if (demoState === 'ENTRY_SCANNING') {
      resetTimeout = setTimeout(() => {
        setScanProgress(0)
        interval = setInterval(() => {
          setScanProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              setDemoState('ENTRY_VERIFIED')
              return 100
            }
            return prev + 25
          })
        }, 350)
      }, 0)
    } else if (demoState === 'EXIT_SCANNING') {
      resetTimeout = setTimeout(() => {
        setScanProgress(0)
        interval = setInterval(() => {
          setScanProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              setDemoState('COMPLETED')
              return 100
            }
            return prev + 25
          })
        }, 350)
      }, 0)
    }

    return () => {
      if (resetTimeout) clearTimeout(resetTimeout)
      if (interval) clearInterval(interval)
    }
  }, [demoState])

  const normalSteps = [
    { id: 'BOOKED', label: '1. BOOKED' },
    { id: 'ENTRY_SCANNING', label: '2. ENTRY SCAN' },
    { id: 'ENTRY_VERIFIED', label: '3. PARKED' },
    { id: 'EXIT_SCANNING', label: '4. EXIT SCAN' },
    { id: 'COMPLETED', label: '5. COMPLETED' },
  ]

  const overtimeSteps = [
    { id: 'BOOKED', label: '1. BOOKED' },
    { id: 'ENTRY_SCANNING', label: '2. ENTRY SCAN' },
    { id: 'ENTRY_VERIFIED', label: '3. PARKED' },
    { id: 'TIME_EXPIRED', label: '4. EXPIRED' },
    { id: 'OVERTIME', label: '5. OVERTIME' },
    { id: 'EXIT_SCANNING', label: '6. EXIT SCAN' },
    { id: 'COMPLETED', label: '7. FINAL BILL' },
  ]

  const activeSteps = demoMode === 'overtime' ? overtimeSteps : normalSteps

  const getCurrentStepIndex = () => {
    const idx = activeSteps.findIndex((s) => s.id === demoState)
    return idx >= 0 ? idx : 0
  }

  const handleReset = () => {
    setDemoState('BOOKED')
    setScanProgress(0)
    setOvertimeMinutes(30)
  }

  const startOvertimeDemo = () => {
    setDemoMode('overtime')
    setDemoState('ENTRY_VERIFIED')
    setOvertimeMinutes(30)
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-[#0E151D]/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#FAF7F2] border-2 border-[#E2DDD3] shadow-2xl overflow-hidden my-auto">
        {/* ----------------- DEMO HEADER BAR ----------------- */}
        <div className="bg-[#17212B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <BrandLogo size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-black uppercase font-serif text-white tracking-wider">
                  STHAANAM PARKING DEMO
                </span>
                <span className="rounded bg-[#E9A83A] px-2 py-0.2 text-[9px] font-mono font-black text-[#17212B] uppercase">
                  {demoMode === 'overtime' ? '⚠ OVERTIME SIMULATION' : 'DEMO USER: DEVV'}
                </span>
              </div>
              <p className="text-[10.5px] text-white/70">
                Simulate gate entry scan, active session, overtime expiration & exit billing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher Buttons */}
            <button
              type="button"
              onClick={() => {
                setDemoMode('normal')
                setDemoState('BOOKED')
              }}
              className={cn(
                'rounded-lg px-3 py-1 text-[11px] font-bold transition-all cursor-pointer',
                demoMode === 'normal'
                  ? 'bg-[#006B4F] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20',
              )}
            >
              Standard Flow
            </button>
            <button
              type="button"
              onClick={startOvertimeDemo}
              className={cn(
                'rounded-lg px-3 py-1 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1',
                demoMode === 'overtime'
                  ? 'bg-[#E9A83A] text-[#17212B]'
                  : 'bg-white/10 text-[#FFD166] hover:bg-white/20',
              )}
            >
              <span>▶</span>
              <span>Simulate Overtime</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* ----------------- PROGRESS STEP BAR ----------------- */}
        <div className="bg-[#EFEADF] px-4 py-2.5 border-b border-[#E2DDD3] overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-[520px]">
            {activeSteps.map((s, idx) => {
              const currentIdx = getCurrentStepIndex()
              const isActive = idx === currentIdx
              const isPassed = idx < currentIdx

              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDemoState(s.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all cursor-pointer',
                      isActive
                        ? s.id.includes('OVERTIME') || s.id === 'TIME_EXPIRED'
                          ? 'bg-[#B47C10] text-white ring-2 ring-[#E6B84A]/40 shadow-xs'
                          : 'bg-[#006B4F] text-white ring-2 ring-[#006B4F]/30 shadow-xs'
                        : isPassed
                        ? 'bg-[#E9A83A] text-[#17212B]'
                        : 'bg-white/60 text-[#8A7E72]',
                    )}
                  >
                    <span>{s.label}</span>
                  </button>
                  {idx < activeSteps.length - 1 && (
                    <span className="text-[9px] text-[#A39788]">➔</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ----------------- MAIN DEMO CONTENT CANVAS ----------------- */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* STEP 1: BOOKED STATE */}
          {demoState === 'BOOKED' && (
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1 text-[11.5px] font-mono font-bold text-blue-700 border border-blue-500/20">
                <span>STATUS: BOOKED & CONFIRMED</span>
              </div>
              <h3 className="text-lg font-bold text-[#17212B]">
                Your Parking Pass is Ready for Arrival
              </h3>
              <p className="text-[12.5px] text-[#66706B] max-w-md mx-auto">
                Arriving at <strong className="text-[#17212B]">{spotTitle}</strong>. Reserved for 2 hours (₹{hourlyRate}/hr).
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setDemoState('ENTRY_SCANNING')}
                  className="bg-[#006B4F] hover:bg-[#00472B] text-white px-7 py-3 font-bold text-[13.5px] uppercase tracking-wider shadow-lg cursor-pointer rounded-xl"
                  icon={<Icon name="qr" size={17} />}
                >
                  [ SCAN AT ENTRANCE ]
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={startOvertimeDemo}
                  className="bg-[#FFF8E7] border-[#E6B84A] text-[#B47C10] hover:bg-[#FFF3D6] px-6 py-3 font-bold text-[13.5px] uppercase tracking-wider shadow-xs cursor-pointer rounded-xl"
                >
                  ▶ Jump to Overtime Demo
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: ENTRY SCANNING */}
          {demoState === 'ENTRY_SCANNING' && (
            <div className="text-center space-y-3 py-2">
              <div className="relative mx-auto size-44 rounded-2xl bg-[#17212B] p-4 text-white border-4 border-[#006B4F] shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-1 bg-[#E9A83A] shadow-[0_0_15px_#E9A83A] transition-all duration-300"
                  style={{ top: `${scanProgress}%` }}
                />
                <QRCode value={`DEMO_ENTRY_${passCode}`} size={100} className="p-1 bg-white rounded-lg" />
                <span className="mt-2 text-[9.5px] font-mono font-bold uppercase text-[#FFD166]">
                  SCANNING ENTRY QR... {scanProgress}%
                </span>
              </div>
              <p className="text-[12px] font-bold text-[#006B4F]">Verifying gate pass credentials...</p>
            </div>
          )}

          {/* STEP 3: ENTRY VERIFIED / PARKED STATE */}
          {demoState === 'ENTRY_VERIFIED' && (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center space-y-0.5 shadow-sm">
                <div className="inline-flex items-center gap-2 text-emerald-800 font-black text-[14px] uppercase font-serif">
                  <span className="size-5 rounded-full bg-emerald-600 text-white grid place-items-center text-[11px]">✓</span>
                  <span>ENTRY APPROVED • GATE PASS VERIFIED</span>
                </div>
                <p className="text-[11.5px] text-emerald-700 font-medium">
                  Entry Time recorded at <strong>{entryTime}</strong>. Reserved until <strong>{bookedEndTime}</strong>.
                </p>
              </div>

              {/* Active Session Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-[#E2DDD3]">
                <div className="text-center border-r border-gray-200 pr-2">
                  <span className="text-[9.5px] font-mono font-bold text-gray-500 uppercase block">ENTRY TIME</span>
                  <span className="text-[13px] font-black text-[#17212B] font-mono">{entryTime}</span>
                </div>
                <div className="text-center border-r border-gray-200 pr-2">
                  <span className="text-[9.5px] font-mono font-bold text-gray-500 uppercase block">RESERVED</span>
                  <span className="text-[13px] font-black text-[#17212B] font-mono">2 HOURS</span>
                </div>
                <div className="text-center border-r border-gray-200 pr-2">
                  <span className="text-[9.5px] font-mono font-bold text-emerald-600 uppercase block">ELAPSED</span>
                  <span className="text-[13px] font-black text-emerald-600 font-mono">01:14</span>
                </div>
                <div className="text-center">
                  <span className="text-[9.5px] font-mono font-bold text-amber-600 uppercase block">REMAINING</span>
                  <span className="text-[13px] font-black text-amber-600 font-mono">00:46</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setDemoState('EXIT_SCANNING')}
                  className="bg-[#8B2E21] hover:bg-[#6E2217] text-white px-7 py-3 font-bold text-[13.5px] uppercase tracking-wider shadow-lg cursor-pointer rounded-xl"
                  icon={<Icon name="qr" size={17} />}
                >
                  [ SCAN AT EXIT (ON TIME) ]
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setDemoMode('overtime')
                    setDemoState('TIME_EXPIRED')
                  }}
                  className="bg-[#FFF8E7] border-[#E6B84A] text-[#B47C10] hover:bg-[#FFF3D6] px-6 py-3 font-bold text-[13.5px] uppercase tracking-wider shadow-xs cursor-pointer rounded-xl"
                >
                  ⚠ Trigger Time Expired
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: TIME EXPIRED WARNING STATE */}
          {demoState === 'TIME_EXPIRED' && (
            <div className="space-y-3 text-center animate-[pop-in_0.2s_var(--ease-out-expo)]">
              <div className="rounded-2xl border border-[#E6B84A]/50 bg-[#FFF8E7] p-4 text-[#B47C10] shadow-sm space-y-2">
                <div className="inline-flex items-center gap-2 font-black text-[15px] uppercase font-serif text-[#B47C10]">
                  <span className="size-6 rounded-full bg-[#E6B84A] text-white grid place-items-center text-[12px] animate-pulse">
                    ⚠
                  </span>
                  <span>PARKING TIME EXCEEDED</span>
                </div>
                <p className="text-[13px] font-semibold text-[#8C5B00]">
                  Your reserved 2-hour parking period ended at <strong>{bookedEndTime}</strong>.
                </p>
                <p className="text-[12px] text-[#8C5B00]/80">
                  Your vehicle is still in the compound. Additional overtime billing will be tracked automatically.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    setDemoMode('overtime')
                    setDemoState('OVERTIME')
                  }}
                  className="bg-[#B47C10] hover:bg-[#8C5B00] text-white px-7 py-3 font-bold text-[13.5px] uppercase tracking-wider shadow-lg cursor-pointer rounded-xl"
                >
                  Start Overtime Counter (+30 Min) →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: ACTIVE OVERTIME COUNTER & CHARGE DISPLAY */}
          {demoState === 'OVERTIME' && (
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-[#E6B84A] bg-[#FFF8E7] p-4 text-[#B47C10] shadow-md space-y-3 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6B84A]/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6B84A] px-3 py-1 text-[11px] font-mono font-black text-white uppercase tracking-wider animate-pulse">
                      ⚠ OVERTIME PARKING
                    </span>
                    <span className="text-[12px] font-bold text-[#8C5B00]">
                      Rate: ₹{hourlyRate}/hr
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#8C5B00]">
                    <span>Simulated Extra:</span>
                    <button
                      type="button"
                      onClick={() => setOvertimeMinutes(15)}
                      className={cn('px-2 py-0.5 rounded border', overtimeMinutes === 15 ? 'bg-[#B47C10] text-white' : 'bg-white text-[#B47C10]')}
                    >
                      15m
                    </button>
                    <button
                      type="button"
                      onClick={() => setOvertimeMinutes(30)}
                      className={cn('px-2 py-0.5 rounded border', overtimeMinutes === 30 ? 'bg-[#B47C10] text-white' : 'bg-white text-[#B47C10]')}
                    >
                      30m
                    </button>
                    <button
                      type="button"
                      onClick={() => setOvertimeMinutes(60)}
                      className={cn('px-2 py-0.5 rounded border', overtimeMinutes === 60 ? 'bg-[#B47C10] text-white' : 'bg-white text-[#B47C10]')}
                    >
                      60m
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white p-3 border border-[#E6B84A]/30">
                    <span className="text-[10px] font-mono font-bold text-[#8C5B00] uppercase block">
                      OVERTIME DURATION
                    </span>
                    <span className="text-[18px] font-black text-[#B47C10] font-mono block">
                      + {overtimeMinutes} MIN OVER
                    </span>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[#E6B84A]/30">
                    <span className="text-[10px] font-mono font-bold text-[#8C5B00] uppercase block">
                      OVERTIME CHARGE
                    </span>
                    <span className="text-[18px] font-black text-[#B47C10] font-mono block">
                      {money(overtimeCharge)} EXTRA
                    </span>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[#E6B84A]/30">
                    <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
                      UPDATED TOTAL
                    </span>
                    <span className="text-[18px] font-black text-[#17212B] font-mono block">
                      {money(totalAmount)}
                    </span>
                  </div>
                </div>

                <p className="text-[11.5px] text-center font-medium text-[#8C5B00]">
                  Overtime charge will be added at gate exit scan.
                </p>
              </div>

              <div className="pt-1 text-center">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => setDemoState('EXIT_SCANNING')}
                  className="bg-[#B47C10] hover:bg-[#8C5B00] text-white px-8 py-3.5 font-bold text-[14px] uppercase tracking-wider shadow-lg cursor-pointer rounded-xl"
                  icon={<Icon name="qr" size={18} />}
                >
                  [ SCAN EXIT AT GATE WITH OVERTIME ]
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: EXIT SCANNING */}
          {demoState === 'EXIT_SCANNING' && (
            <div className="text-center space-y-3 py-2">
              <div className="relative mx-auto size-44 rounded-2xl bg-[#17212B] p-4 text-white border-4 border-[#E6B84A] shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                <div
                  className="absolute left-0 right-0 h-1 bg-[#E9A83A] shadow-[0_0_15px_#E9A83A] transition-all duration-300"
                  style={{ top: `${scanProgress}%` }}
                />
                <QRCode value={`DEMO_EXIT_${passCode}`} size={100} className="p-1 bg-white rounded-lg" />
                <span className="mt-2 text-[9.5px] font-mono font-bold uppercase text-[#FFD166]">
                  SCANNING EXIT QR... {scanProgress}%
                </span>
              </div>
              <p className="text-[12px] font-bold text-[#B47C10]">
                {demoMode === 'overtime'
                  ? 'Parking session exceeded booked duration. Calculating overtime charge...'
                  : 'Calculating stay duration and completing checkout...'}
              </p>
            </div>
          )}

          {/* STEP 7: COMPLETED STATE WITH OVERTIME BREAKDOWN */}
          {demoState === 'COMPLETED' && (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl bg-[#17212B] text-white p-5 space-y-3 border border-slate-700 shadow-xl text-left">
                <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                  <span className="text-[15px] font-black uppercase font-serif text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span> SESSION COMPLETED
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#FFD166] uppercase bg-white/10 px-2.5 py-0.5 rounded">
                    EXIT VERIFIED AT {actualExitTime}
                  </span>
                </div>

                {demoMode === 'overtime' && (
                  <div className="rounded-xl bg-[#FFF8E7] p-2.5 border border-[#E6B84A]/40 text-[#8C5B00] text-[12px] font-medium flex items-center gap-2">
                    <Icon name="alertCircle" size={16} className="shrink-0 text-[#B47C10]" />
                    <span>Parking session exceeded booked duration by {overtimeMinutes} minutes.</span>
                  </div>
                )}

                {/* Detailed Billing Summary Table */}
                <div className="space-y-1.5 text-[12.5px] font-mono pt-1">
                  <div className="flex justify-between text-white/70">
                    <span>BOOKED TIME</span>
                    <span className="font-bold text-white">2 hr (10:42 AM – 12:42 PM)</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>ACTUAL TIME</span>
                    <span className="font-bold text-white">
                      2 hr {overtimeMinutes > 0 ? `${overtimeMinutes} min` : ''} (10:42 AM – {actualExitTime})
                    </span>
                  </div>
                  {demoMode === 'overtime' && (
                    <div className="flex justify-between text-[#FFD166]">
                      <span>OVERTIME DURATION</span>
                      <span className="font-bold">+{overtimeMinutes} min</span>
                    </div>
                  )}

                  <div className="my-2 border-t border-white/15" />

                  <div className="flex justify-between text-white/80">
                    <span>BASE PARKING FEE (2 hr @ ₹{hourlyRate}/hr)</span>
                    <span className="font-bold">{money(baseAmount)}</span>
                  </div>
                  {demoMode === 'overtime' && (
                    <div className="flex justify-between text-[#FFD166]">
                      <span>OVERTIME CHARGE (+{overtimeMinutes}m)</span>
                      <span className="font-bold">+{money(overtimeCharge)}</span>
                    </div>
                  )}

                  <div className="my-2 border-t border-white/20 pt-1 flex justify-between text-[16px] font-black text-white">
                    <span>TOTAL AMOUNT SETTLED</span>
                    <span className="text-[#FFD166]">{money(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-[#17212B] bg-white text-[#17212B] font-bold text-[12px] uppercase tracking-wider rounded-xl py-2.5 px-4 cursor-pointer"
                >
                  Reset Demo
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose?.()
                    navigate('/search')
                  }}
                  className="bg-[#006B4F] text-white font-bold text-[12px] uppercase tracking-wider rounded-xl py-2.5 px-5 cursor-pointer"
                >
                  Book Another Spot
                </Button>
              </div>
            </div>
          )}

          {/* REUSED DIGITAL PARKING TICKET COMPONENT (DYNAMIC OVERTIME BADGE) */}
          <div className="relative">
            <DigitalParkingTicket
              booking={booking}
              spot={spot}
              showActions={false}
              overtimeMinutes={demoMode === 'overtime' && (demoState === 'OVERTIME' || demoState === 'EXIT_SCANNING' || demoState === 'COMPLETED') ? overtimeMinutes : 0}
              overtimeCharge={demoMode === 'overtime' && (demoState === 'OVERTIME' || demoState === 'EXIT_SCANNING' || demoState === 'COMPLETED') ? overtimeCharge : 0}
              ticketState={
                demoState === 'COMPLETED'
                  ? 'COMPLETED'
                  : demoState === 'EXIT_SCANNING'
                  ? 'EXIT_VERIFIED'
                  : demoState === 'OVERTIME' || demoState === 'TIME_EXPIRED'
                  ? 'OVERTIME'
                  : demoState === 'ENTRY_VERIFIED'
                  ? 'PARKING_ACTIVE'
                  : 'CONFIRMED'
              }
              isAnimatingCut={demoState === 'EXIT_SCANNING'}
            />
          </div>
        </div>

        {/* ----------------- FOOTER ACTIONS ----------------- */}
        <div className="bg-[#EFEADF] px-5 py-3 border-t border-[#E2DDD3] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-[11.5px] font-bold text-[#8B2E21] hover:underline cursor-pointer"
          >
            Reset Demo State
          </button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onClose}
            className="bg-white border-[#E2DDD3] text-[#17212B] font-bold text-[12px] cursor-pointer"
          >
            Close Demo
          </Button>
        </div>
      </div>
    </div>
  )
}
