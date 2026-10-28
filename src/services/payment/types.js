/**
 * The UPI merchant name sent to the payment provider.
 * Defined via single config constant; value preserved as 'Sthanam'.
 */
export const BRAND_PAYEE_NAME = 'Sthanam'


export const PAYMENT_STATUS = {
  CREATED: 'created',
  AWAITING_PAYMENT: 'awaiting_payment',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
}

export const TERMINAL_PAYMENT_STATUSES = new Set([
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.EXPIRED,
  PAYMENT_STATUS.CANCELLED,
])

export function isTerminalPaymentStatus(status) {
  return TERMINAL_PAYMENT_STATUSES.has(status)
}

/**
 * Converts Indian Rupee integer or float into integer paise.
 * 281 -> 28100
 */
export function rupeesToPaise(rupees) {
  if (rupees == null || Number.isNaN(Number(rupees))) return 0
  return Math.round(Number(rupees) * 100)
}

/**
 * Converts integer paise into Indian Rupees.
 * 28100 -> 281
 */
export function paiseToRupees(paise) {
  if (paise == null || Number.isNaN(Number(paise))) return 0
  return Number(paise) / 100
}
