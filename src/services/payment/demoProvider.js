import { PaymentProvider } from './provider'
import { BRAND_PAYEE_NAME, PAYMENT_STATUS, rupeesToPaise } from './types'

const STORAGE_KEY = 'sthanam_demo_payments'
const HOLD_DURATION_MS = 5 * 60 * 1000 // 5 minutes

function loadPayments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePayments(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // localStorage full or unavailable
  }
}

export class DemoPaymentProvider extends PaymentProvider {
  constructor() {
    super()
    this.name = 'demo'
    this.records = loadPayments()
    this.listeners = new Map() // paymentId -> Set<callback>
  }

  _notify(paymentId, record) {
    const set = this.listeners.get(paymentId)
    if (set) {
      set.forEach((cb) => {
        try {
          cb(record)
        } catch (err) {
          console.error('Payment listener error:', err)
        }
      })
    }
  }

  subscribe(paymentId, listener) {
    if (!this.listeners.has(paymentId)) {
      this.listeners.set(paymentId, new Set())
    }
    const set = this.listeners.get(paymentId)
    set.add(listener)

    // Fire immediately with current state if exists
    const current = this.records[paymentId]
    if (current) {
      listener(current)
    }

    return () => {
      set.delete(listener)
      if (set.size === 0) {
        this.listeners.delete(paymentId)
      }
    }
  }

  async createPayment(bookingDetails) {
    const now = Date.now()
    const amountRupees = Number(bookingDetails.quote?.total ?? bookingDetails.amount ?? 0)
    const amountPaise = rupeesToPaise(amountRupees)
    const bookingRef = bookingDetails.code || `NPC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    const paymentId = `pay_${now.toString(36)}_${Math.random().toString(36).substring(2, 6)}`
    const txnRef = `TXN_${bookingRef}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const vpa = import.meta.env.VITE_UPI_VPA || 'sthanam@upi'
    const expiresAt = now + HOLD_DURATION_MS

    // Standard NPCI UPI URI Format:
    // upi://pay?pa=<VPA>&pn=Sthanam&am=<amount>&cu=INR&tn=<bookingRef>&tr=<txnRef>
    const amountParam = (amountPaise / 100).toFixed(2)
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(BRAND_PAYEE_NAME)}&am=${amountParam}&cu=INR&tn=${encodeURIComponent(bookingRef)}&tr=${encodeURIComponent(txnRef)}`

    const record = {
      paymentId,
      bookingId: bookingDetails.id || null,
      bookingRef,
      txnRef,
      vpa,
      amountRupees,
      amountPaise,
      upiIntentUrl,
      status: PAYMENT_STATUS.AWAITING_PAYMENT,
      createdAt: now,
      expiresAt,
      paidAt: null,
      failureReason: null,
      provider: 'demo',
      spotId: bookingDetails.spotId || bookingDetails.spot?.id,
      spotTitle: bookingDetails.title || bookingDetails.spot?.title,
    }

    this.records[paymentId] = record
    savePayments(this.records)
    this._notify(paymentId, record)

    return {
      paymentId,
      upiIntentUrl,
      amountPaise,
      amountRupees,
      expiresAt,
      vpa,
      bookingRef,
      txnRef,
      provider: 'demo',
    }
  }

  async getStatus(paymentId) {
    const record = this.records[paymentId]
    if (!record) {
      return {
        paymentId,
        status: PAYMENT_STATUS.FAILED,
        failureReason: 'Payment record not found',
      }
    }

    // Auto-expire check
    if (
      record.status === PAYMENT_STATUS.AWAITING_PAYMENT ||
      record.status === PAYMENT_STATUS.PROCESSING
    ) {
      if (Date.now() > record.expiresAt) {
        record.status = PAYMENT_STATUS.EXPIRED
        record.failureReason = 'Payment hold expired (5 minutes)'
        savePayments(this.records)
        this._notify(paymentId, record)
      }
    }

    return { ...record }
  }

  async cancel(paymentId) {
    const record = this.records[paymentId]
    if (!record) return false

    if (record.status !== PAYMENT_STATUS.PAID) {
      record.status = PAYMENT_STATUS.CANCELLED
      record.failureReason = 'Cancelled by user'
      savePayments(this.records)
      this._notify(paymentId, record)
      return true
    }
    return false
  }

  /**
   * Demo-only simulation triggers
   */
  async simulateSuccess(paymentId) {
    const record = this.records[paymentId]
    if (!record) throw new Error('Payment not found')

    if (record.status === PAYMENT_STATUS.EXPIRED) {
      throw new Error('Cannot simulate success on expired hold')
    }

    // Move to processing first
    record.status = PAYMENT_STATUS.PROCESSING
    savePayments(this.records)
    this._notify(paymentId, record)

    // Brief simulated network delay for realism (~500ms)
    await new Promise((resolve) => setTimeout(resolve, 500))

    record.status = PAYMENT_STATUS.PAID
    record.paidAt = new Date().toISOString()
    record.paymentRef = `PAY_DEMO_${Date.now().toString(36).toUpperCase()}`
    savePayments(this.records)
    this._notify(paymentId, record)

    return { ...record }
  }

  async simulateFailure(paymentId, reason = 'Bank server timeout or transaction declined by user') {
    const record = this.records[paymentId]
    if (!record) throw new Error('Payment not found')

    record.status = PAYMENT_STATUS.PROCESSING
    savePayments(this.records)
    this._notify(paymentId, record)

    await new Promise((resolve) => setTimeout(resolve, 400))

    record.status = PAYMENT_STATUS.FAILED
    record.failureReason = reason
    savePayments(this.records)
    this._notify(paymentId, record)

    return { ...record }
  }

  getPendingPaymentForBooking(bookingId) {
    if (!bookingId) return null
    for (const record of Object.values(this.records)) {
      if (record.bookingId === bookingId) {
        if (
          record.status === PAYMENT_STATUS.AWAITING_PAYMENT &&
          Date.now() <= record.expiresAt
        ) {
          return record
        }
      }
    }
    return null
  }
}
