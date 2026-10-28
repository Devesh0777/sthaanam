import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createBooking,
  confirmBookingPayment,
  cancelPendingBooking,
  expirePendingBooking,
  joinWaitlist,
} from '@/api'
import { dateTime, durationLabel, hoursLabel, money, relativeDay, time } from '@/lib/format'
import { quoteSummary } from '@/lib/id'
import { cn } from '@/lib/cn'
import { VEHICLE_TYPES } from '@/api/mock/spots'
import Sheet from '@/components/ui/Sheet'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import Photo from '@/components/ui/Photo'
import StatusPill from '@/components/ui/StatusPill'
import BrandLogo from '@/components/ui/BrandLogo'
import { useToast } from '@/components/ui/Toast'
import { paymentProvider } from '@/services/payment'

import DigitalParkingTicket from '@/components/booking/DigitalParkingTicket'
import PaymentSheetStep from '@/components/booking/PaymentSheetStep'

const DURATION_PRESETS = [
  { label: '1h', hours: 1, plan: 'hour' },
  { label: '2h', hours: 2, plan: 'hour' },
  { label: '3h', hours: 3, plan: 'hour' },
  { label: '4h', hours: 4, plan: 'hour' },
  { label: 'Half Day', hours: 12, plan: 'hour' },
  { label: 'Full Day', hours: 24, plan: 'day' },
]

const SAVED_VEHICLES = ['MH 15 AB 1234', 'MH 15 CZ 5678']

const VEHICLE_ICON = { '2w': 'bike', car: 'car', bus: 'bus' }

const STEP_LABELS = ['Slot', 'Vehicle', 'Review', 'Pay']

/**
 * Sthanam Parking Pass & Route Permit Flow (Redesigned in Glass Theme)
 * Four-step glass dialog: Slot -> Vehicle -> Review -> Pay (UPI) -> Confirmed Ticket
 */
export default function BookingSheet({ open, onClose, spot, initialBooking = null, initialStep = 0 }) {
  return (
    <BookingFlow
      key={open ? `open-${spot?.id}-${initialBooking?.id || 'new'}` : 'closed'}
      open={open}
      onClose={onClose}
      spot={spot}
      initialBooking={initialBooking}
      initialStep={initialStep}
    />
  )
}

function BookingFlow({ open, onClose, spot, initialBooking, initialStep }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(() => (initialBooking ? (initialBooking.paymentStatus === 'paid' ? 4 : 3) : initialStep))
  const [plan, setPlan] = useState(() => initialBooking?.plan ?? 'hour')
  const [hours, setHours] = useState(() => initialBooking?.hours ?? 2)
  const [selectedDay, setSelectedDay] = useState('today')
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)
  const [vehicleType, setVehicleType] = useState(() => initialBooking?.vehicleType ?? spot?.vehicles?.[0] ?? 'car')
  const [plate, setPlate] = useState(() => initialBooking?.plate ?? 'MH 15 AB 1234')
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState(initialBooking)
  const [payment, setPayment] = useState(null)
  const [waitlisted, setWaitlisted] = useState(false)
  const [error, setError] = useState(null)

  // Day options: Today, Tomorrow, Day After
  const dayOptions = useMemo(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(now)
    dayAfter.setDate(dayAfter.getDate() + 2)

    const formatShort = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

    return [
      { id: 'today', label: 'Today', sub: formatShort(now), daysAhead: 0 },
      { id: 'tomorrow', label: 'Tomorrow', sub: formatShort(tomorrow), daysAhead: 1 },
      { id: 'dayafter', label: dayAfter.toLocaleDateString('en-IN', { weekday: 'short' }), sub: formatShort(dayAfter), daysAhead: 2 },
    ]
  }, [])

  // 30-minute incremental time slots starting from current rounded half-hour
  const timeSlots = useMemo(() => {
    const slots = []
    const now = new Date()
    const startMinutes = now.getMinutes() < 30 ? 30 : 60
    const base = new Date(now)
    base.setMinutes(startMinutes, 0, 0)

    for (let i = 0; i < 10; i++) {
      const slotTime = new Date(base.getTime() + i * 30 * 60 * 1000)
      const label = slotTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      slots.push({
        id: `slot-${i}`,
        index: i,
        label,
        slotTime,
        hoursAhead: i * 0.5,
      })
    }
    return slots
  }, [])

  // Arrival and Departure time window
  const windows = useMemo(() => {
    const start = new Date()
    const dayObj = dayOptions.find((d) => d.id === selectedDay)
    if (dayObj?.daysAhead) {
      start.setDate(start.getDate() + dayObj.daysAhead)
    }
    const slot = timeSlots[selectedSlotIndex] || timeSlots[0]
    if (slot) {
      start.setHours(start.getHours() + slot.hoursAhead)
    }
    const end = new Date(start.getTime() + hours * 3600_000)
    return { startISO: start.toISOString(), endISO: end.toISOString() }
  }, [selectedDay, selectedSlotIndex, hours, dayOptions, timeSlots])

  // Calculation of live price quote
  const quote = useMemo(() => (spot ? quoteSummary(spot, { plan, hours }) : null), [spot, plan, hours])

  // Restore or initialize payment for initialBooking
  useEffect(() => {
    if (!initialBooking) return
    if (initialBooking.paymentStatus === 'pending') {
      if (initialBooking.paymentId) {
        paymentProvider.getStatus(initialBooking.paymentId).then((rec) => {
          if (rec && rec.status !== 'failed') {
            setPayment(rec)
          } else {
            paymentProvider.createPayment(initialBooking).then(setPayment)
          }
        })
      } else {
        paymentProvider.createPayment(initialBooking).then(setPayment)
      }
    }
  }, [initialBooking])

  if (!spot && !initialBooking) return null

  const isFull = spot?.spotsLeft <= 0 || spot?.availability === 'full'

  const proceedToPayment = async () => {
    if (plate.trim().length < 6) {
      setError('Enter a valid vehicle registration number (e.g. MH 15 AB 1234)')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const createdPayment = await paymentProvider.createPayment({
        spot,
        quote,
        hours,
        plan,
        startISO: windows.startISO,
        endISO: windows.endISO,
        vehicleType,
        plate: plate.trim().toUpperCase(),
      })

      const createdBooking = await createBooking({
        spotId: spot.id,
        plan,
        hours,
        startISO: windows.startISO,
        endISO: windows.endISO,
        vehicleType,
        plate: plate.trim().toUpperCase(),
        quote,
        paymentPending: true,
        paymentId: createdPayment.paymentId,
        holdExpiresAt: createdPayment.expiresAt,
      })

      setPayment(createdPayment)
      setBooking(createdBooking)
      setStep(3)
    } catch (err) {
      setError(err.friendlyMessage ?? err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const onWaitlist = async () => {
    setSubmitting(true)
    try {
      await joinWaitlist(spot.id, 'Rohit Kulkarni')
      setWaitlisted(true)
      toast.push({ tone: 'success', title: 'You are on the waitlist', message: 'We will text you when a bay frees up.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      height="tall"
      width={step === 4 ? 'wide' : 'default'}
      eyebrow={`STHAANAM PERMIT • SECTOR ${spot?.zone?.short ?? booking?.zoneName ?? 'NASHIK'}`}
      title={step < 4 ? `Reserve Bay: Step ${step + 1} of 4` : 'Digital Parking Ticket'}
      subtitle={step < 4 ? (spot?.title ?? booking?.title) : `Pass ID #${booking?.code || 'NPC-CONFIRMED'}`}
      footer={
        step < 3 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-panel-strong border border-white/70 shadow-sm">
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
                  Total Tariff Due
                </span>
                <span className="text-[22px] font-black text-[#17212B] font-mono leading-none">
                  {money(quote?.total)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-white/60 glass-panel text-[12.5px] font-bold text-[#17212B] hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
                <Button
                  size="lg"
                  loading={submitting}
                  disabled={isFull && step < 3}
                  onClick={async () => {
                    if (step === 2) await proceedToPayment()
                    else setStep((s) => s + 1)
                  }}
                  className="min-h-[44px] bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] font-black text-[13.5px] uppercase tracking-wide shadow-md transition-all active:scale-[0.98] px-5 sm:px-6 cursor-pointer"
                >
                  {step === 0
                    ? 'Continue to Vehicle →'
                    : step === 1
                      ? 'Proceed to Review →'
                      : `Pay ${money(quote?.total)} via UPI →`}
                </Button>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      {/* 1. Glass Stepper Pill Header (Slot - Vehicle - Review - Pay) */}
      {step < 4 && (
        <div className="mb-5 flex items-center justify-between gap-1 p-1 rounded-full glass-panel-strong border border-white/70 shadow-xs">
          {STEP_LABELS.map((label, idx) => {
            const isActive = step === idx
            const isDone = step > idx
            return (
              <button
                key={label}
                type="button"
                disabled={idx > step}
                onClick={() => idx < step && setStep(idx)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-[11px] sm:text-[12px] font-bold transition-all',
                  isActive
                    ? 'bg-[#006341] text-white shadow-xs'
                    : isDone
                      ? 'text-[#006341] hover:bg-white/40 cursor-pointer'
                      : 'text-gray-400 cursor-default opacity-60',
                )}
              >
                <span
                  className={cn(
                    'grid size-4 place-items-center rounded-full text-[9px] font-bold',
                    isActive
                      ? 'bg-white text-[#006341]'
                      : isDone
                        ? 'bg-[#006341]/15 text-[#006341]'
                        : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {isDone ? '✓' : idx + 1}
                </span>
                <span className="hidden xs:inline truncate">{label}</span>
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-[#FBEAEA] border border-[#D96B5F]/30 p-3.5 text-[13px] text-[#D96B5F] font-semibold">
          <Icon name="alert" size={17} className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isFull && step < 3 && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-[#FFF8E7] border border-[#E6B84A]/40 p-3.5 text-[13px] text-amber-900 font-medium">
          <Icon name="info" size={17} className="mt-px shrink-0 text-[#B47C10]" />
          <span>
            This spot is currently full.{' '}
            <button type="button" onClick={onWaitlist} className="font-bold underline text-amber-950 cursor-pointer">
              {waitlisted ? 'On the waitlist' : 'Join the waitlist'}
            </button>{' '}
            and we will alert you instantly when a parking bay frees up.
          </span>
        </div>
      )}

      {/* =========================================================================
          STEP 0: CHOOSE YOUR SLOT (SPACE HEADER + DAY + 30-MIN STRIP + DURATION + PRICE)
      ========================================================================= */}
      {step === 0 && (
        <div className="space-y-5">
          {/* 1. Space Summary Header Tile */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl glass-panel-strong border border-white/70 shadow-sm">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#006341] text-[#FFD900] shadow-xs">
              <Icon name={VEHICLE_ICON[spot.vehicles?.[0] || 'car'] || 'pin'} size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading text-[15px] font-black text-[#17212B] truncate">{spot.title}</h3>
                <span className="font-mono text-[14px] font-black text-[#006341] shrink-0">
                  ₹{spot.priceHour}/hr
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#66706B]">
                <span>Sector {spot.zone?.short ?? 'Nashik'}</span>
                <span>•</span>
                <span className={cn('font-bold', spot.spotsLeft > 0 ? 'text-[#006341]' : 'text-red-500')}>
                  {spot.spotsLeft > 0 ? `${spot.spotsLeft} bays free` : 'Lot Full'}
                </span>
                <span>•</span>
                <span>{spot.capacity} total bays</span>
              </div>
            </div>
          </div>

          {/* 2. Day Selection Chips */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">
              Select Arrival Day
            </span>
            <div className="flex gap-2">
              {dayOptions.map((opt) => {
                const isSelected = selectedDay === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDay(opt.id)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-xl text-center transition-all cursor-pointer border active:scale-98',
                      isSelected
                        ? 'bg-[#006341] text-white border-[#006341] shadow-xs font-bold'
                        : 'glass-panel text-[#17212B] border-white/70 hover:bg-white/80 font-semibold',
                    )}
                  >
                    <span className="block text-[12px] leading-tight">{opt.label}</span>
                    <span className={cn('block text-[10px] mt-0.5', isSelected ? 'text-white/80' : 'text-[#6B6B6B]')}>
                      {opt.sub}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Horizontal Glass Time Strip (30-min increments) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Arrival Time Strip (30-min slots)
              </span>
              <span className="text-[11px] font-mono font-bold text-[#006341]">
                {timeSlots[selectedSlotIndex]?.label}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
              {timeSlots.map((slot) => {
                const isSelected = selectedSlotIndex === slot.index
                const isSlotFull = isFull
                const isLimited = spot.spotsLeft > 0 && spot.spotsLeft <= 3

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isSlotFull}
                    onClick={() => setSelectedSlotIndex(slot.index)}
                    className={cn(
                      'shrink-0 flex flex-col items-center justify-center min-w-[76px] py-2 px-2.5 rounded-xl border text-center transition-all duration-150 cursor-pointer active:scale-95',
                      isSlotFull
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-400'
                        : isSelected
                          ? 'bg-[#006341] text-white border-[#006341] shadow-md ring-2 ring-[#006341]/25'
                          : 'glass-panel-strong border-white/70 text-[#17212B] hover:bg-white/80',
                    )}
                  >
                    <span className="font-mono text-[12.5px] font-black leading-tight">
                      {slot.label}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider mt-0.5',
                        isSelected
                          ? 'text-[#FFD900]'
                          : isSlotFull
                            ? 'text-gray-400'
                            : isLimited
                              ? 'text-amber-600'
                              : 'text-[#006341]',
                      )}
                    >
                      {isSlotFull ? 'Full' : isLimited ? 'Limited' : 'Available'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Duration: Segmented Chips + Custom Stepper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                Parking Duration
              </span>
              <span className="text-[12px] font-extrabold text-[#006341]">
                {durationLabel(hours)} ({time(windows.startISO)} → {time(windows.endISO)})
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {DURATION_PRESETS.map((preset) => {
                const isSelected = hours === preset.hours && plan === preset.plan
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setHours(preset.hours)
                      setPlan(preset.plan)
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all cursor-pointer border active:scale-95 font-mono',
                      isSelected
                        ? 'bg-[#006341] text-white border-[#006341] shadow-xs ring-2 ring-[#006341]/25'
                        : 'glass-panel text-[#17212B] border-white/70 hover:bg-white/80',
                    )}
                  >
                    <span className="text-[15px] font-black">{preset.label}</span>
                    <span className={cn('text-[9.5px] font-bold uppercase', isSelected ? 'text-white/80' : 'text-[#6B6B6B]')}>
                      {preset.plan === 'day' ? 'Day' : 'Hrs'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Custom Hours Stepper & Availability Meter */}
            <div className="mt-3 flex items-center justify-between gap-3 p-2.5 rounded-xl glass-panel border border-white/60">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#6B6B6B]">Custom duration:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHours((h) => Math.max(1, h - 1))}
                    className="grid size-7 place-items-center rounded-lg bg-white border border-[#17212B]/10 text-[#17212B] font-bold text-[14px] hover:bg-gray-100 active:scale-95 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="min-w-[40px] text-center font-mono font-black text-[13px] text-[#17212B]">
                    {hours}h
                  </span>
                  <button
                    type="button"
                    onClick={() => setHours((h) => Math.min(72, h + 1))}
                    className="grid size-7 place-items-center rounded-lg bg-white border border-[#17212B]/10 text-[#17212B] font-bold text-[14px] hover:bg-gray-100 active:scale-95 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Real Capacity Meter */}
              <div className="text-right">
                <span className="text-[11px] font-semibold text-[#4A4A4A]">
                  <strong className="text-[#17212B] font-mono">{spot.spotsLeft}</strong> of {spot.capacity} bays free
                </span>
                <div className="mt-1 h-1.5 w-24 rounded-full bg-gray-200 overflow-hidden ml-auto">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      spot.spotsLeft <= 0
                        ? 'bg-gray-400'
                        : spot.spotsLeft / spot.capacity > 0.4
                          ? 'bg-[#006341]'
                          : 'bg-[#E9A83A]',
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(100, Math.round((spot.spotsLeft / (spot.capacity || 1)) * 100)))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Live Price Card (Glass) */}
          <div className="rounded-2xl border border-white/80 glass-panel-strong p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between border-b border-[#17212B]/10 pb-2 text-[10px] font-mono font-bold tracking-widest text-[#006341] uppercase">
              <span className="flex items-center gap-1.5">
                <BrandLogo size={15} variant="small" />
                <span>STHAANAM TARIFF QUOTE</span>
              </span>
              <span>100% SECURE BAY</span>
            </div>

            <div className="divide-y divide-[#17212B]/5 text-[12px]">
              <div className="flex justify-between py-1.5 text-[#6B6B6B]">
                <span>Base Parking Tariff ({hoursLabel(hours)})</span>
                <span className="font-mono font-bold text-[#17212B]">{money(quote.base)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[#6B6B6B]">
                <span>Platform & Security Guarantee (6%)</span>
                <span className="font-mono font-bold text-[#17212B]">{money(quote.serviceFee)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[#6B6B6B]">
                <span>GST (18%)</span>
                <span className="font-mono font-bold text-[#17212B]">{money(quote.gst)}</span>
              </div>
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-[13px] font-black uppercase text-[#17212B]">Total Tariff</span>
                <span className="font-mono text-[22px] font-black text-[#006341]">{money(quote.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 1: VEHICLE DETAILS & COMPOUND CLEARANCE
      ========================================================================= */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">
              Select Vehicle Category
            </span>
            <div className="space-y-2.5">
              {VEHICLE_TYPES.filter((type) => spot.vehicles.includes(type.id)).map((type) => {
                const isSelected = vehicleType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setVehicleType(type.id)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all cursor-pointer active:scale-99',
                      isSelected
                        ? 'border-[#006341] bg-[#006341]/10 ring-2 ring-[#006341]/20 shadow-xs'
                        : 'border-white/70 glass-panel hover:bg-white/70',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('grid size-10 place-items-center rounded-xl', isSelected ? 'bg-[#006341] text-white' : 'bg-white text-[#17212B] border border-gray-200')}>
                        <Icon name={VEHICLE_ICON[type.id]} size={20} />
                      </span>
                      <div>
                        <span className="text-[14px] font-black text-[#17212B] block">
                          {type.label}
                        </span>
                        <span className="text-[11px] text-[#6B6B6B]">
                          {type.id === '2w'
                            ? 'Motorcycle, Scooter, or Electric 2-Wheeler'
                            : type.id === 'car'
                              ? 'Hatchback, Sedan, or SUV'
                              : 'Tourist Bus, Tempo Traveller, or Minibus'}
                        </span>
                      </div>
                    </div>
                    <span className={cn('size-4 rounded-full border-2', isSelected ? 'border-[#006341] bg-[#006341]' : 'border-gray-300')} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Registration Plate Input with IND badge */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Vehicle Registration Number (For Gate Entry)
            </label>
            <div className="relative rounded-2xl border-2 border-[#17212B] bg-[#FFF8E7] p-2 focus-within:ring-2 focus-within:ring-[#006341]">
              <div className="flex items-center gap-2 px-2">
                <span className="rounded-md bg-[#17212B] px-2 py-1 text-[10px] font-black text-white uppercase font-mono">
                  IND
                </span>
                <input
                  value={plate}
                  onChange={(event) => setPlate(event.target.value.toUpperCase())}
                  placeholder="MH 15 AB 1234"
                  maxLength={14}
                  className="w-full bg-transparent text-[18px] font-black tracking-widest text-[#17212B] uppercase font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Saved vehicle chips */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Saved:</span>
              {SAVED_VEHICLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPlate(v)}
                  className="rounded-lg border border-white/70 glass-panel px-2 py-0.5 text-[10.5px] font-mono font-bold text-[#17212B] hover:bg-white/80 cursor-pointer"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Compound Rules */}
          {spot.rules?.length > 0 && (
            <div className="rounded-2xl border border-white/70 glass-panel p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#17212B]">
                Compound Gate Rules
              </p>
              <ul className="space-y-1">
                {spot.rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-[11.5px] text-[#4A4A4A]">
                    <Icon name="check" size={13} className="mt-0.5 shrink-0 text-[#006341]" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STEP 2: PERMIT REVIEW (GLASS SUMMARY CARDS WITH EDIT LINKS)
      ========================================================================= */}
      {step === 2 && (
        <div className="space-y-3.5">
          {/* Card 1: Space Summary Card */}
          <div className="rounded-2xl border border-white/70 glass-panel-strong p-3.5 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-white border border-gray-200 shadow-2xs">
                <Photo seed={spot.id} label={spot.title} ratio="aspect-square" rounded="rounded-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] font-mono font-bold text-[#006341] uppercase tracking-wider block">
                  SECTOR {spot.zone?.short ?? 'NASHIK'}
                </span>
                <h4 className="text-[14px] font-black text-[#17212B] truncate">{spot.title}</h4>
                <p className="text-[11px] text-[#6B6B6B] truncate">{spot.address}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-[11px] font-bold text-[#006341] hover:underline cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>

          {/* Card 2: Arrival Window Card */}
          <div className="rounded-2xl border border-white/70 glass-panel p-3.5 shadow-xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] block">
                Arrival Window & Duration
              </span>
              <p className="text-[13px] font-black text-[#17212B]">
                {relativeDay(windows.startISO)}, {time(windows.startISO)} → {time(windows.endISO)}
              </p>
              <p className="text-[11px] text-[#66706B]">{durationLabel(hours)} Slot Reserved</p>
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="text-[11px] font-bold text-[#006341] hover:underline cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>

          {/* Card 3: Vehicle Card */}
          <div className="rounded-2xl border border-white/70 glass-panel p-3.5 shadow-xs flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] block">
                Registered Vehicle
              </span>
              <p className="text-[14px] font-black font-mono text-[#17212B] tracking-wide">
                {plate} ({VEHICLE_TYPES.find((v) => v.id === vehicleType)?.label})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-bold text-[#006341] hover:underline cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>

          {/* Card 4: Price Breakdown Card */}
          <div className="rounded-2xl border border-white/80 glass-panel-strong p-3.5 shadow-xs space-y-1.5 text-[12px]">
            <div className="flex justify-between text-[#6B6B6B]">
              <span>Base Parking Tariff</span>
              <span className="font-mono font-bold text-[#17212B]">{money(quote.base)}</span>
            </div>
            <div className="flex justify-between text-[#6B6B6B]">
              <span>Platform & Security Guarantee</span>
              <span className="font-mono font-bold text-[#17212B]">{money(quote.serviceFee)}</span>
            </div>
            <div className="flex justify-between text-[#6B6B6B]">
              <span>GST (18%)</span>
              <span className="font-mono font-bold text-[#17212B]">{money(quote.gst)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[#17212B]/10 pt-2">
              <span className="font-black uppercase text-[#17212B]">Total Tariff Payable</span>
              <span className="font-mono text-[20px] font-black text-[#006341]">{money(quote.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: UPI QR PAYMENT STEP
      ========================================================================= */}
      {step === 3 && (
        <PaymentSheetStep
          booking={booking}
          spot={spot}
          quote={quote}
          payment={payment}
          onPaid={async (paymentRecord) => {
            try {
              const confirmed = await confirmBookingPayment({
                bookingId: booking?.id,
                paymentId: payment?.paymentId,
                paymentRef: paymentRecord.paymentRef,
                paidAt: paymentRecord.paidAt,
              })
              setBooking(confirmed)
              setStep(4)
              toast.push({
                tone: 'success',
                title: 'Payment Confirmed',
                message: `${money(quote?.total ?? booking?.amount)} received via UPI. Digital pass generated!`,
              })
            } catch (err) {
              setError(err.friendlyMessage ?? err.message)
            }
          }}
          onBack={() => setStep(2)}
          onCancel={async () => {
            if (payment?.paymentId) {
              await paymentProvider.cancel(payment.paymentId)
            }
            if (booking?.id) {
              await cancelPendingBooking(booking.id)
            }
            toast.push({
              tone: 'info',
              title: 'Hold Released',
              message: 'The reservation hold was cancelled and the spot returned to the map.',
            })
            onClose()
          }}
          onExpired={async () => {
            if (booking?.id) {
              await expirePendingBooking(booking.id)
            }
          }}
          onRetry={() => {
            setStep(0)
            setPayment(null)
            setBooking(null)
          }}
        />
      )}

      {/* =========================================================================
          STEP 4: CONFIRMED DIGITAL PARKING TICKET
      ========================================================================= */}
      {step === 4 && booking && (
        <div className="animate-[ticket-enter_0.35s_var(--ease-out-expo)] pb-4">
          <DigitalParkingTicket
            booking={booking}
            spot={spot}
            onClose={onClose}
            showActions={true}
          />
        </div>
      )}
    </Sheet>
  )
}
