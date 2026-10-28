/**
 * PaymentProvider Interface definition.
 *
 * Any payment provider (Demo, Razorpay, Cashfree, PhonePe PG) must implement:
 *
 * 1. createPayment(bookingDetails)
 *    @param {Object} bookingDetails - spot, quote, booking reference, duration, vehicle
 *    @returns {Promise<{
 *      paymentId: string,
 *      upiIntentUrl: string,
 *      amountPaise: number,
 *      amountRupees: number,
 *      expiresAt: number (epoch ms),
 *      vpa: string,
 *      bookingRef: string,
 *      txnRef: string,
 *      provider: string
 *    }>}
 *
 * 2. getStatus(paymentId)
 *    @param {string} paymentId
 *    @returns {Promise<{
 *      paymentId: string,
 *      status: 'created' | 'awaiting_payment' | 'processing' | 'paid' | 'failed' | 'expired' | 'cancelled',
 *      paidAt?: string,
 *      failureReason?: string,
 *      amountPaise: number,
 *      expiresAt: number
 *    }>}
 *
 * 3. cancel(paymentId)
 *    @param {string} paymentId
 *    @returns {Promise<boolean>}
 *
 * 4. subscribe(paymentId, listener)
 *    @param {string} paymentId
 *    @param {(statusRecord: Object) => void} listener
 *    @returns {() => void} unsubscribe
 */

export class PaymentProvider {
  /**
   * @param {Object} _bookingDetails
   */
  async createPayment(_bookingDetails) {
    throw new Error('createPayment() must be implemented by payment provider')
  }

  /**
   * @param {string} _paymentId
   */
  async getStatus(_paymentId) {
    throw new Error('getStatus() must be implemented by payment provider')
  }

  /**
   * @param {string} _paymentId
   */
  async cancel(_paymentId) {
    throw new Error('cancel() must be implemented by payment provider')
  }

  /**
   * @param {string} _paymentId
   * @param {Function} _listener
   */
  subscribe(_paymentId, _listener) {
    return () => {}
  }
}
