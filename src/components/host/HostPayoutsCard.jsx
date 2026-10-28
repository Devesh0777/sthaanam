import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import { money } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'

export default function HostPayoutsCard({
  pendingAmount = 1463,
  paidOutMonth = 22654,
  upiId = 'sunita@okhdfc',
}) {
  const toast = useToast()

  const handleInstantPayout = () => {
    toast.push({
      tone: 'info',
      title: 'Demo Mode: UPI Payout',
      message: `Simulated payout of ${money(pendingAmount)} to ${upiId}. Real automated payment provider webhooks plug in during Step 7.`,
    })
  }

  return (
    <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E4DA] pb-3">
        <div>
          <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
            SETTLEMENTS & DISBURSEMENTS
          </span>
          <h3 className="text-[16px] font-black text-[#17212B] font-heading">
            UPI Payouts & Balance
          </h3>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F1EA] px-2.5 py-0.5 text-[10.5px] font-mono font-bold text-[#075B3D]">
          <span className="size-1.5 rounded-full bg-[#075B3D]" />
          Direct Bank UPI
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Left: Pending Balance Container */}
        <div className="rounded-2xl border-2 border-[#075B3D] bg-[#075B3D] p-5 text-white shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#E9A83A] block">
              AVAILABLE TO WITHDRAW (TODAY)
            </span>
            <p className="mt-1 text-[30px] font-black font-mono text-white leading-none">
              {money(pendingAmount)}
            </p>
            <p className="mt-2 text-[11.5px] text-white/85 leading-relaxed">
              Real-time pilgrim tariffs collected from today's active check-ins. Settle instantly to registered UPI.
            </p>
          </div>

          <Button
            size="md"
            onClick={handleInstantPayout}
            className="w-full bg-[#E9A83A] hover:bg-[#DC9B2E] text-[#17212B] font-black text-[13px] uppercase tracking-wider py-3 shadow-sm active:scale-98 cursor-pointer rounded-xl"
            icon={<Icon name="wallet" size={16} />}
          >
            Instant UPI Withdrawal
          </Button>
        </div>

        {/* Right: Paid Out & UPI Bank Details */}
        <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
              SETTLED THIS MONTH
            </span>
            <p className="text-[26px] font-black font-mono text-[#075B3D] leading-none">
              {money(paidOutMonth)}
            </p>
            <p className="text-[11.5px] text-[#6B7578]">
              Disbursed via automated weekly cycles with zero commission deductions during the Kumbh Mela.
            </p>
          </div>

          <div className="rounded-xl border border-[#E8E4DA] bg-white p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#6B7578]">Destination VPA / UPI ID:</span>
              <span className="font-mono font-bold text-[#17212B]">{upiId}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#6B7578]">Next Auto-Cycle:</span>
              <span className="font-semibold text-[#075B3D]">Monday at 09:00 AM IST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
