import { DemoPaymentProvider } from './demoProvider'
import { PAYMENT_STATUS, isTerminalPaymentStatus, paiseToRupees, rupeesToPaise } from './types'

// Configure provider based on environment setting
const providerName = import.meta.env.VITE_PAYMENT_PROVIDER || 'demo'

let instance = null

function getProviderInstance() {
  if (!instance) {
    if (providerName === 'demo') {
      instance = new DemoPaymentProvider()
    } else {
      // Future backend provider plug-in (Step 7: Razorpay / Cashfree)
      console.warn(`Payment provider "${providerName}" not registered, falling back to Demo provider`)
      instance = new DemoPaymentProvider()
    }
  }
  return instance
}

export const paymentProvider = getProviderInstance()

export const isDemoProvider = providerName === 'demo'

export { PAYMENT_STATUS, isTerminalPaymentStatus, paiseToRupees, rupeesToPaise }
