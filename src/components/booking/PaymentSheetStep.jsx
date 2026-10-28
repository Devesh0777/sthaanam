import { useEffect, useState } from 'react'
import QRCode from '@/components/ui/QRCode'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { money, relativeDay, time } from '@/lib/format'
import { cn } from '@/lib/cn'
import { PAYMENT_STATUS } from '@/services/payment/types'
import { isDemoProvider, paymentProvider } from '@/services/payment'

/**
 * Sthanam UPI QR Payment Step
 *
 * Implements:
 * - Domain state machine: created -> awaiting_payment -> processing -> paid | failed | expired | cancelled
 * - Scannable UPI QR code with standard NPCI upi:// link
 * - 5:00 hold timer with animated circular progress ring
 * - Mobile deep-link "Pay with UPI app" button
 * - VPA copy action with visual feedback
 * - Aria-live status announcements
 * - Demo simulation buttons strictly guarded by config (invisible in production)
 * - Placeholder tabs for Cards and Net Banking (Coming soon)
 */
export default function PaymentSheetStep({
  booking,
  spot,
  quote,
  payment,
  onPaid,
  onCancel,
  onBack,
  onExpired,
  onRetry,
}) {
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(payment?.status || PAYMENT_STATUS.AWAITING_PAYMENT)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Hold Countdown Timer: 5:00 (300 seconds total)
  const [expiresAt] = useState(() => payment?.expiresAt || Date.now() + 300_000)
  const [timeLeftMs, setTimeLeftMs] = useState(() => Math.max(0, expiresAt - Date.now()))

  // Subscribe to provider status updates
  useEffect(() => {
    if (!payment?.paymentId) return

    const unsubscribe = paymentProvider.subscribe(payment.paymentId, (record) => {
      setPaymentStatus(record.status)
      if (record.failureReason) {
        setErrorMessage(record.failureReason)
      }
      if (record.status === PAYMENT_STATUS.PAID) {
        // Automatically trigger ticket transition after brief confirmation
        setTimeout(() => {
          onPaid?.(record)
        }, 750)
      } else if (record.status === PAYMENT_STATUS.EXPIRED) {
        onExpired?.(record)
      }
    })

    return () => unsubscribe()
  }, [payment?.paymentId, onPaid, onExpired])

  // Timer interval
  useEffect(() => {
    if (paymentStatus === PAYMENT_STATUS.PAID || paymentStatus === PAYMENT_STATUS.CANCELLED) {
      return
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now())
      setTimeLeftMs(remaining)

      if (remaining <= 0) {
        clearInterval(timer)
        paymentProvider.getStatus(payment.paymentId).then((rec) => {
          setPaymentStatus(rec.status)
          onExpired?.(rec)
        })
      }
    }, 500)

    return () => clearInterval(timer)
  }, [expiresAt, payment?.paymentId, paymentStatus, onExpired])

  // Timer calculation
  const totalDurationMs = 5 * 60 * 1000
  const progressRatio = Math.max(0, Math.min(1, timeLeftMs / totalDurationMs))
  const minutes = Math.floor(timeLeftMs / 60000)
  const seconds = Math.floor((timeLeftMs % 60000) / 1000)
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // SVG Ring properties
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - progressRatio * circumference

  const copyVpa = async () => {
    if (!payment?.vpa) return
    try {
      await navigator.clipboard.writeText(payment.vpa)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  // Simulation handlers for Demo mode
  const handleSimulateSuccess = async () => {
    if (isSimulating || paymentStatus === PAYMENT_STATUS.PAID) return
    setIsSimulating(true)
    try {
      await paymentProvider.simulateSuccess(payment.paymentId)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleSimulateFailure = async () => {
    if (isSimulating) return
    setIsSimulating(true)
    try {
      await paymentProvider.simulateFailure(payment.paymentId)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsSimulating(false)
    }
  }

  const isExpired = paymentStatus === PAYMENT_STATUS.EXPIRED || timeLeftMs <= 0
  const isPaid = paymentStatus === PAYMENT_STATUS.PAID
  const isProcessing = paymentStatus === PAYMENT_STATUS.PROCESSING
  const isFailed = paymentStatus === PAYMENT_STATUS.FAILED

  // Only render simulation if running demo provider and not production
  const showDemoControls = isDemoProvider && import.meta.env.MODE !== 'production'

  const amountRupees = quote?.total ?? payment?.amountRupees ?? booking?.amount ?? 0

  return (
    <div className="space-y-4 text-[#17212B]">
      {/* 1. Header & Booking Summary (Glass Card) */}
      <div className="rounded-2xl border border-white/70 glass-panel-strong p-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#006341]">
              Direct UPI Checkout
            </span>
            <h3 className="text-[20px] font-black text-[#17212B] tracking-tight">
              Pay {money(amountRupees)} to Sthaanam
            </h3>
            <p className="mt-0.5 text-[12px] font-medium text-[#6B6B6B]">
              Sector {spot?.zone?.short ?? 'Nashik'} • {spot?.title}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase text-[#6B6B6B]">
              Total Due
            </span>
            <span className="text-[22px] font-black font-mono text-[#006341]">
              {money(amountRupees)}
            </span>
          </div>
        </div>

        {/* Compact booking details pill */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#17212B]/10 pt-2.5 text-[11px] text-[#4A4A4A]">
          <span className="inline-flex items-center gap-1 rounded-md glass-panel px-2 py-0.5 font-semibold text-[#17212B] border border-white/70">
            <Icon name="calendar" size={12} className="text-[#006341]" />
            {relativeDay(booking?.startISO)}, {time(booking?.startISO)} → {time(booking?.endISO)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md glass-panel px-2 py-0.5 font-semibold text-[#17212B] border border-white/70">
            <Icon name="car" size={12} className="text-[#006341]" />
            {booking?.plate || 'MH 15 AB 1234'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md glass-panel px-2 py-0.5 font-mono text-[10px] text-[#6B6B6B] border border-white/70">
            REF: {payment?.bookingRef}
          </span>
        </div>
      </div>

      {/* 2. Payment Method Tabs (Glass Pills) */}
      <div className="flex gap-2 border-b border-[#17212B]/10 pb-1">
        <button
          type="button"
          className="relative px-3.5 py-2 text-[13px] font-bold text-[#006341] border-b-2 border-[#006341] flex items-center gap-1.5"
        >
          <span>UPI QR & Apps</span>
          <span className="rounded bg-[#006341]/10 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-[#006341]">
            Instant
          </span>
        </button>
        <button
          type="button"
          disabled
          className="px-3.5 py-2 text-[13px] font-medium text-gray-400 cursor-not-allowed flex items-center gap-1.5 opacity-60"
          title="Cards payment coming soon"
        >
          <span>Cards</span>
          <span className="rounded bg-gray-200/60 px-1.5 py-0.2 text-[9px] font-bold uppercase text-gray-500">
            Coming soon
          </span>
        </button>
        <button
          type="button"
          disabled
          className="px-3.5 py-2 text-[13px] font-medium text-gray-400 cursor-not-allowed flex items-center gap-1.5 opacity-60"
          title="Net banking coming soon"
        >
          <span>Net Banking</span>
          <span className="rounded bg-gray-200/60 px-1.5 py-0.2 text-[9px] font-bold uppercase text-gray-500">
            Coming soon
          </span>
        </button>
      </div>

      {/* 3. Hold Countdown Banner with Circular Ring (Glass) */}
      <div
        className={cn(
          'flex items-center justify-between rounded-2xl p-3 border transition-colors shadow-2xs',
          isExpired
            ? 'glass-panel border-red-300 text-red-700 bg-red-50/50'
            : isPaid
              ? 'glass-panel border-emerald-300 text-[#006341] bg-emerald-50/50'
              : 'glass-panel border-[#E9A83A]/50 text-amber-900 bg-amber-50/40',
        )}
      >
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative size-12 shrink-0">
            <svg className="size-12 -rotate-90" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r={radius}
                className="stroke-black/10"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="26"
                cy="26"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={isExpired ? circumference : strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-[stroke-dashoffset] duration-500 ease-linear motion-reduce:transition-none text-[#E9A83A]"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10.5px] font-black tracking-tight">
              {isExpired ? '00:00' : formattedTime}
            </span>
          </div>

          <div>
            <span className="block text-[12px] font-bold leading-tight">
              {isPaid
                ? 'Payment Confirmed'
                : isExpired
                  ? 'Reservation Hold Expired'
                  : `Hold expires in ${formattedTime}`}
            </span>
            <span className="block text-[11px] opacity-80">
              {isPaid
                ? 'Your parking bay is confirmed and ready.'
                : isExpired
                  ? 'The bay has been released to other pilgrims.'
                  : 'Parking bay held exclusively during checkout.'}
            </span>
          </div>
        </div>

        {isExpired && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-red-400 text-red-700 hover:bg-red-100/50"
          >
            Rebook
          </Button>
        )}
      </div>

      {/* 4. Active UPI Payment Card (Glass Container with Solid White QR Tile) */}
      {!isExpired ? (
        <div className="rounded-2xl border border-white/80 glass-panel-strong p-4 shadow-sm space-y-4">
          {/* Mobile Deep-Link Button (<= 640px) */}
          <div className="sm:hidden">
            <a
              href={payment?.upiIntentUrl}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#006341] hover:bg-[#004e33] px-4 py-3 text-center text-[14px] font-black text-white shadow-md active:scale-98 cursor-pointer tracking-wide uppercase transition-all"
            >
              <Icon name="bolt" size={17} className="text-[#FFD900]" />
              Pay with UPI App ({money(amountRupees)})
            </a>
            <p className="mt-1.5 text-center text-[11px] text-[#6B6B6B]">
              Opens GPay, PhonePe, Paytm, or BHIM directly.
            </p>
            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-[#17212B]/10 w-full" />
              <span className="absolute glass-panel px-2 py-0.5 rounded text-[9.5px] uppercase font-bold text-[#6B6B6B]">
                Or Scan QR Below
              </span>
            </div>
          </div>

          {/* QR Code and Instructions */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* SOLID White Tile with Quiet Zone (Phase 2 Requirement 5) */}
            <div className="relative shrink-0 rounded-2xl bg-white p-3.5 shadow-md border-2 border-white ring-1 ring-black/5">
              <QRCode
                value={payment?.upiIntentUrl || 'upi://pay?pa=sthanam@upi'}
                size={168}
                label={`UPI QR for ${money(amountRupees)}`}
              />
            </div>

            <div className="space-y-3 text-center sm:text-left min-w-0 flex-1">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Scan with any UPI app
                </span>
                {/* Text-only tags for UPI apps */}
                <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((appName) => (
                    <span
                      key={appName}
                      className="rounded-lg border border-white/70 glass-panel px-2.5 py-0.5 text-[11px] font-black text-[#17212B] shadow-2xs"
                    >
                      {appName}
                    </span>
                  ))}
                </div>
              </div>

              {/* UPI ID / VPA Details with Copy Button */}
              <div className="rounded-xl border border-white/70 glass-panel p-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                  Sthaanam UPI ID
                </span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="font-mono text-[13px] font-black text-[#17212B] truncate">
                    {payment?.vpa || 'sthanam@upi'}
                  </span>
                  <button
                    type="button"
                    onClick={copyVpa}
                    className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg bg-white/80 hover:bg-white px-2.5 py-1 text-[11px] font-bold text-[#006341] border border-[#006341]/20 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Icon name={copied ? 'check' : 'copy'} size={13} />
                    <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#6B6B6B]">
                  <span className="rounded bg-amber-100 px-1 py-0.2 font-bold text-amber-800">
                    Demo VPA
                  </span>
                  <span>Verified Sthaanam Merchant Account</span>
                </div>
              </div>

              <div className="text-[11px] text-[#6B6B6B] flex items-center justify-center sm:justify-start gap-2">
                <span>TXN: <span className="font-mono text-[10.5px] font-bold text-[#17212B]">{payment?.txnRef}</span></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Expired State Details */
        <div className="rounded-2xl border border-red-300 glass-panel p-5 text-center space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-red-600">
            <Icon name="clock" size={24} />
          </div>
          <div>
            <h4 className="text-[16px] font-black text-[#17212B]">Reservation Hold Expired</h4>
            <p className="mt-1 text-[13px] text-[#6B6B6B] max-w-sm mx-auto">
              Your 5-minute booking hold expired without a confirmed payment. The bay was released back to the parking map.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="md" onClick={onBack}>
              Change Details
            </Button>
            <Button variant="primary" size="md" onClick={onRetry} className="bg-[#006341]">
              Rebook This Spot
            </Button>
          </div>
        </div>
      )}

      {/* 5. Aria-Live Status Announcement Area */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[12px] font-semibold transition-all',
          isPaid
            ? 'bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/30'
            : isProcessing
              ? 'bg-[#FFF8E7] text-[#8B5A2B] border border-[#E9A83A]/40'
              : isFailed
                ? 'bg-[#FBEAEA] text-[#D96B5F] border border-[#D96B5F]/40'
                : 'bg-[#FAF7F2] text-[#6B6B6B] border border-[#E8E4DA]',
        )}
      >
        <div className="flex items-center gap-2">
          {isPaid ? (
            <span className="grid size-5 place-items-center rounded-full bg-[#075B3D] text-white text-[11px] font-black">
              ✓
            </span>
          ) : isProcessing ? (
            <span className="size-4 animate-spin rounded-full border-2 border-[#E9A83A] border-t-transparent" />
          ) : isFailed ? (
            <Icon name="alert" size={16} className="text-[#D96B5F]" />
          ) : (
            <span className="size-2.5 rounded-full bg-[#075B3D] animate-ping" />
          )}

          <span>
            {isPaid
              ? '✔ Payment confirmed! Generating your digital parking pass…'
              : isProcessing
                ? 'Processing payment verification…'
                : isFailed
                  ? `Payment failed: ${errorMessage || 'Declined by bank'}`
                  : 'Waiting for payment confirmation from UPI app…'}
          </span>
        </div>

        {isFailed && (
          <button
            type="button"
            onClick={() => {
              setPaymentStatus(PAYMENT_STATUS.AWAITING_PAYMENT)
              setErrorMessage(null)
            }}
            className="text-[11px] font-black underline text-[#D96B5F] cursor-pointer"
          >
            Try Again
          </button>
        )}
      </div>

      {/* 6. Demo Simulation Controls (Guarded by config — invisible in production) */}
      {showDemoControls && !isPaid && !isExpired && (
        <div className="rounded-2xl border-2 border-dashed border-[#E9A83A] bg-[#FFF8E7]/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-black uppercase tracking-wider text-[#8B5A2B]">
            <span>⚙ Simulation Controls (Demo Mode Only)</span>
            <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[9px] text-amber-900 font-bold">
              DEV ONLY
            </span>
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            In production, a server webhook confirms payment. For this demo, trigger realistic state machine transitions:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleSimulateSuccess}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#075B3D] hover:bg-[#064e34] py-2.5 px-3 text-[12px] font-black text-white shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{isSimulating ? 'Verifying…' : '✔ Simulate Success'}</span>
            </button>
            <button
              type="button"
              disabled={isSimulating}
              onClick={handleSimulateFailure}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#D96B5F] bg-white hover:bg-[#FBEAEA] py-2.5 px-3 text-[12px] font-bold text-[#D96B5F] transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>✕ Simulate Failure</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Action Controls */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isPaid}
          className="text-[13px] font-bold text-[#6B6B6B] hover:text-[#17212B] transition-colors cursor-pointer disabled:opacity-40"
        >
          ← Back to review
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPaid}
          className="text-[13px] font-bold text-[#D96B5F] hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
        >
          Cancel & release bay
        </button>
      </div>
    </div>
  )
}
