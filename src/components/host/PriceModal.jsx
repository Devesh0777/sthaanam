import { useState } from 'react'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import { Field, Input } from '@/components/ui/Field'
import { money } from '@/lib/format'

export default function PriceModal({
  spot,
  isOpen,
  onClose,
  onSave,
}) {
  const [priceHour, setPriceHour] = useState(spot?.priceHour ?? 30)
  const [priceDay, setPriceDay] = useState(spot?.priceDay ?? 200)
  const [saving, setSaving] = useState(false)

  if (!isOpen || !spot) return null

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        spotId: spot.id,
        priceHour: Number(priceHour),
        priceDay: Number(priceDay),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-[#E8E4DA] bg-white p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
              DYNAMIC TARIFF MANAGEMENT
            </span>
            <h3 className="text-[17px] font-black text-[#17212B] font-heading">
              Update Parking Rates
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7578] hover:text-[#17212B] p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <p className="text-[12px] text-[#525B60] leading-relaxed">
          Updating tariff applies immediately to new incoming reservations for <strong>{spot.title}</strong>. Existing bookings honor the rate locked at booking time.
        </p>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hourly Rate (₹)" required>
              <Input
                type="number"
                min={10}
                step={5}
                value={priceHour}
                onChange={(e) => setPriceHour(e.target.value)}
              />
            </Field>

            <Field label="Daily Rate (₹)" required>
              <Input
                type="number"
                min={50}
                step={10}
                value={priceDay}
                onChange={(e) => setPriceDay(e.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-xl bg-[#FAF7F2] p-3 text-[11px] text-[#525B60] space-y-1">
            <div className="flex justify-between">
              <span>8-hour full booking earnings:</span>
              <span className="font-mono font-bold text-[#17212B]">{money(priceHour * 8)}</span>
            </div>
            <div className="flex justify-between">
              <span>Host settlement per day (94%):</span>
              <span className="font-mono font-bold text-[#075B3D]">{money(Math.round(priceDay * 0.94))}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-[13px] font-bold px-4 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              className="bg-[#075B3D] hover:bg-[#064e34] text-white font-black text-[13px] px-5 py-2 rounded-xl"
              icon={<Icon name="check" size={14} />}
            >
              Save New Rates
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
