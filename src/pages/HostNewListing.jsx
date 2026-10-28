import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createHostListing, getZones } from '@/api'
import { cn } from '@/lib/cn'
import { money } from '@/lib/format'
import { FEATURES, SURFACES, VEHICLE_TYPES } from '@/api/mock/spots'
import { NASHIK_LANDMARKS, findNearestLandmark } from '@/data/landmarks'
import { useAsync } from '@/hooks/useAsync'
import { PageShell, PageHeader } from '@/components/layout/PageShell'
import Button from '@/components/ui/Button'
import Icon from '@/components/ui/Icon'
import Photo from '@/components/ui/Photo'
import { photoUri } from '@/lib/photo'
import { Field, Input, OptionTile, Select, Textarea } from '@/components/ui/Field'
import HostLocationSection from '@/components/parking/HostLocationSection'
import LiveListingPreview from '@/components/host/LiveListingPreview'
import { SegmentedTabs } from '@/components/ui/Chip'
import { useToast } from '@/components/ui/Toast'
import { useApp } from '@/context/AppContext'

const STEPS = [
  { id: 'location', label: 'Location', number: 1 },
  { id: 'details', label: 'Details', number: 2 },
  { id: 'photos', label: 'Photos', number: 3 },
  { id: 'pricing', label: 'Pricing', number: 4 },
  { id: 'availability', label: 'Hours', number: 5 },
  { id: 'review', label: 'Review', number: 6 },
]

const VEHICLE_ICON = { '2w': 'bike', car: 'car', bus: 'bus' }
const FEATURE_ICON = {
  covered: 'home',
  gate: 'lock',
  cctv: 'video',
  floodlight: 'bulb',
  caretaker: 'user',
  water: 'droplet',
  ev: 'bolt',
  wide: 'wide',
}

const TIME_WINDOWS = [
  { id: 'morning', label: 'Morning snan', from: '05:00', to: '11:00' },
  { id: 'day', label: 'Day darshan', from: '11:00', to: '17:00' },
  { id: 'aarti', label: 'Evening aarti', from: '17:00', to: '22:00' },
  { id: 'night', label: 'Overnight', from: '22:00', to: '05:00' },
]

const DEFAULT_ZONES = [
  { id: 'ramkund', name: 'Ramkund Ghat Area', short: 'Ramkund' },
  { id: 'panchavati', name: 'Panchavati', short: 'Panchavati' },
  { id: 'tapovan', name: 'Tapovan / Sadhugram', short: 'Tapovan' },
  { id: 'kalaram', name: 'Kalaram Temple Zone', short: 'Kalaram' },
  { id: 'trimbakeshwar', name: 'Trimbakeshwar', short: 'Trimbak' },
  { id: 'cbd', name: 'CBS / Nashik Central', short: 'CBS' },
]

const DRAFT_KEY = 'sthanam_host_draft'

export default function HostNewListing() {
  const navigate = useNavigate()
  const toast = useToast()
  const { host } = useApp()
  const { data: rawZones } = useAsync(() => getZones(), [])
  const zones = useMemo(() => (rawZones?.length ? rawZones : DEFAULT_ZONES), [rawZones])

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [showErrorSummary, setShowErrorSummary] = useState(false)

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // Fallback
    }
    return {
      zoneId: 'ramkund',
      address: '',
      nearestLandmark: NASHIK_LANDMARKS[0], // Default: Ramkund
      landmark: NASHIK_LANDMARKS[0].name,
      latlng: [19.9992, 73.7915],
      locationSource: 'manual',
      locationAccuracy: null,
      title: '',
      description: '',
      vehicles: ['2w', 'car'],
      capacity: 8,
      surface: 'Cement',
      clearanceM: 2.5,
      features: ['gate', 'floodlight'],
      photos: 3,
      priceHour: 30,
      priceDay: 200,
      windows: ['morning', 'day', 'aarti'],
      note: '',
    }
  })

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  const goTo = (next) => {
    setShowErrorSummary(false)
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const errors = useMemo(() => validate(step, form), [step, form])
  const zone = zones?.find((z) => z.id === form.zoneId)

  // Save draft locally
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      toast.push({
        tone: 'success',
        title: 'Draft Saved',
        message: 'Your listing progress has been saved locally.',
      })
    } catch {
      toast.push({ tone: 'error', title: 'Could not save draft' })
    }
  }

  const handleContinue = () => {
    const currentErrors = validate(step, form)
    if (Object.keys(currentErrors).length > 0) {
      setShowErrorSummary(true)
      return
    }
    if (step === STEPS.length - 1) {
      submit()
    } else {
      goTo(step + 1)
    }
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const nearest = form.nearestLandmark || findNearestLandmark(form.latlng)
      const result = await createHostListing({
        ...form,
        location: {
          latitude: form.latlng[0],
          longitude: form.latlng[1],
          accuracy: form.locationAccuracy || 0,
          source: form.locationSource || 'manual',
          landmark: nearest?.name || form.landmark || '',
          landmarkId: nearest?.id || '',
          landmarkDistanceMeters: nearest?.distanceMeters || 0,
          zone: zone?.name || '',
          address: form.address,
        },
        landmark: nearest?.name || form.landmark,
        title:
          form.title ||
          `${form.capacity}-spot parking near ${nearest?.name ?? zone?.short ?? 'the ghat'}`,
        hostName: host.name,
        phone: host.phone,
      })
      localStorage.removeItem(DRAFT_KEY)
      setSubmitted(result)
    } catch (err) {
      toast.push({ tone: 'error', title: 'Could not submit', message: err.friendlyMessage ?? err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <PageShell>
        <PageHeader title="Listing Submitted" backTo="/host" />
        <div className="mx-auto max-w-lg px-4 pt-10 pb-20 text-center space-y-6">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/30 shadow-md">
            <Icon name="check" size={38} strokeWidth={2.8} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8E7] px-3 py-1 text-[11px] font-mono font-black text-[#B47C10] border border-[#E9A83A]/40 uppercase tracking-wider">
              <span>Status: Pending Field Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17212B] font-heading">
              Listing Sent for Verification
            </h1>
            <p className="text-[13.5px] text-[#525B60] leading-relaxed max-w-md mx-auto">
              Our Nashik municipal cordon team verifies physical gate clearance and access security. Verified spaces typically go live within 2–4 hours during the Kumbh Mela.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 text-left shadow-2xs space-y-2.5">
            <SummaryRow label="Submission Ref" value={`#${submitted.id}`} />
            <SummaryRow label="Zone Sector" value={submitted.zoneName} />
            <SummaryRow label="Assigned Landmark" value={form.nearestLandmark?.name ?? 'Ramkund'} />
            <SummaryRow label="Coordinates" value={`${form.latlng[0].toFixed(4)}, ${form.latlng[1].toFixed(4)}`} />
            <SummaryRow label="Bays Capacity" value={`${submitted.capacity} vehicles`} />
            <SummaryRow label="Tariff Rate" value={`${money(submitted.priceHour)}/hr · ${money(submitted.priceDay)}/day`} />
          </div>

          <Button
            full
            size="lg"
            className="bg-[#075B3D] hover:bg-[#064e34] text-white font-black text-[14px] uppercase tracking-wider py-4 shadow-md rounded-2xl cursor-pointer"
            onClick={() => navigate('/host')}
          >
            Back to Host Dashboard
          </Button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      {/* ----------------- 1. HEADER & MODERN NUMBERED STEPPER ----------------- */}
      <PageHeader
        title="List Your Parking Space"
        subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].label}`}
        backTo="/host"
      />

      <div className="sticky top-[52px] z-[500] border-b border-[#E8E4DA] bg-white/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          {/* Stepper Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar w-full">
            {STEPS.map((s, index) => {
              const isCurrent = step === index
              const isCompleted = step > index
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(index)}
                  className="flex items-center gap-2 group cursor-pointer shrink-0"
                >
                  <div
                    className={cn(
                      'grid size-7 place-items-center rounded-full text-[11px] font-mono font-bold transition-all',
                      isCurrent
                        ? 'bg-[#075B3D] text-white ring-4 ring-[#075B3D]/20 shadow-xs'
                        : isCompleted
                          ? 'bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/30'
                          : 'bg-[#FAF7F2] text-[#6B7578] border border-[#E8E4DA]',
                    )}
                  >
                    {isCompleted ? '✓' : s.number}
                  </div>
                  <span
                    className={cn(
                      'hidden md:inline text-[12px] font-bold transition-colors',
                      isCurrent ? 'text-[#075B3D] font-black' : isCompleted ? 'text-[#17212B]' : 'text-[#6B7578]',
                    )}
                  >
                    {s.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span className="hidden sm:inline text-[#E8E4DA] font-bold">―</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Mobile Preview Toggle Pill */}
          <button
            type="button"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#FAF7F2] border border-[#E8E4DA] px-2.5 py-1 text-[11px] font-bold text-[#075B3D] cursor-pointer"
          >
            <Icon name="eye" size={13} />
            <span>{showMobilePreview ? 'Hide' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {/* ----------------- 2. TWO-COLUMN WORKSPACE (FORM LEFT, PREVIEW RIGHT) ----------------- */}
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-32 sm:px-6">
        {/* Mobile Collapsible Preview */}
        {showMobilePreview && (
          <div className="lg:hidden mb-6">
            <LiveListingPreview form={form} zone={zone} />
          </div>
        )}

        {/* Validation Error Banner */}
        {showErrorSummary && Object.keys(errors).length > 0 && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-[13px] text-red-800 flex items-start gap-3">
            <Icon name="alertCircle" size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black text-red-900 font-mono uppercase tracking-wide">
                Please complete required fields
              </strong>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-[12px]">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =====================================================================
              LEFT COLUMN: 6 WIZARD STEPS
          ===================================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* ----------------- STEP 1: LOCATION ----------------- */}
            {step === 0 && (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-[18px] font-black text-[#17212B] font-heading">
                    Space Location & Zone
                  </h2>
                  <p className="mt-1 text-[13px] text-[#525B60]">
                    Place the exact compound pin and match with the nearest sacred ghat landmark.
                  </p>
                </div>

                <HostLocationSection
                  form={form}
                  setForm={setForm}
                  zones={zones}
                  errors={errors}
                />
              </div>
            )}

            {/* ----------------- STEP 2: DETAILS ----------------- */}
            {step === 1 && (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-[18px] font-black text-[#17212B] font-heading">
                    Compound Details & Capacity
                  </h2>
                  <p className="mt-1 text-[13px] text-[#525B60]">
                    Define vehicle accessibility, physical clearance, and plot surface.
                  </p>
                </div>

                <Field label="Listing title" required error={errors.title} hint="Say what it is and what landmark it is near.">
                  <Input
                    value={form.title}
                    onChange={(event) => set({ title: event.target.value })}
                    placeholder="e.g. Driveway behind Sagar Petrol Pump"
                  />
                </Field>

                <Field label="What can pilgrims expect?" hint="Describe gate approach, shaded areas, and security.">
                  <Textarea
                    value={form.description}
                    onChange={(event) => set({ description: event.target.value })}
                    placeholder="Level covered driveway right off Agra Road, 6 minutes walk to Ramkund main road…"
                  />
                </Field>

                <Field label="Vehicle types allowed" required error={errors.vehicles}>
                  <div className="space-y-2">
                    {VEHICLE_TYPES.map((type) => {
                      const active = form.vehicles.includes(type.id)
                      return (
                        <OptionTile
                          key={type.id}
                          active={active}
                          onClick={() =>
                            set({
                              vehicles: active
                                ? form.vehicles.filter((v) => v !== type.id)
                                : [...form.vehicles, type.id],
                            })
                          }
                          icon={<Icon name={VEHICLE_ICON[type.id]} size={17} />}
                          title={type.label}
                        />
                      )
                    })}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vehicle capacity" required>
                    <Input
                      type="number"
                      min={1}
                      max={80}
                      value={form.capacity}
                      onChange={(event) => set({ capacity: Number(event.target.value) || 1 })}
                    />
                  </Field>
                  <Field label="Height clearance">
                    <Select value={form.clearanceM} onChange={(event) => set({ clearanceM: Number(event.target.value) })}>
                      {[2, 2.4, 3, 4, 5, 6].map((value) => (
                        <option key={value} value={value}>
                          {value} m
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field label="Surface">
                  <Select value={form.surface} onChange={(event) => set({ surface: event.target.value })}>
                    {SURFACES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div>
                  <p className="mb-2 text-[13px] font-bold text-[#17212B]">Compound Amenities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURES.map((feature) => {
                      const active = form.features.includes(feature.id)
                      return (
                        <button
                          key={feature.id}
                          type="button"
                          onClick={() =>
                            set({
                              features: active
                                ? form.features.filter((f) => f !== feature.id)
                                : [...form.features, feature.id],
                            })
                          }
                          className={cn(
                            'flex items-center gap-2 rounded-xl border p-2.5 text-left text-[12px] font-bold transition-all active:scale-[0.98] cursor-pointer',
                            active
                              ? 'border-[#075B3D] bg-[#E7F1EA] text-[#075B3D]'
                              : 'border-[#E8E4DA] bg-[#FAF7F2] text-[#17212B]',
                          )}
                        >
                          <Icon name={FEATURE_ICON[feature.id]} size={15} />
                          {feature.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- STEP 3: PHOTOS (OPTIONAL REMINDER) ----------------- */}
            {step === 2 && (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-[18px] font-black text-[#17212B] font-heading">
                    Compound Photos
                  </h2>
                  {/* Explicit Guidance per Requirement 3.3 */}
                  <div className="mt-2 rounded-2xl bg-[#E7F1EA] border border-[#075B3D]/25 p-3 text-[12.5px] font-semibold text-[#075B3D] flex items-center gap-2">
                    <Icon name="shield" size={16} className="shrink-0" />
                    <span>
                      Photos are optional; your listing shows an authentic space-type icon in search results.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="relative">
                      <Photo
                        src={index < form.photos ? photoUri(`${form.zoneId}-photo-${index}`, 'YOUR SPOT') : undefined}
                        seed={`${form.zoneId}-photo-${index}`}
                        label="YOUR SPOT"
                        ratio="aspect-square"
                        rounded="rounded-2xl"
                        className={index < form.photos ? '' : 'opacity-40'}
                      />
                      {index < form.photos ? (
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => set({ photos: Math.max(0, form.photos - 1) })}
                          className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      ) : null}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => set({ photos: Math.min(6, form.photos + 1) })}
                    className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-[#CBD5E1] text-[#6B7578] transition-colors hover:border-[#075B3D] hover:text-[#075B3D] cursor-pointer"
                  >
                    <span className="flex flex-col items-center gap-1">
                      <Icon name="camera" size={20} />
                      <span className="text-[11px] font-mono font-bold">{form.photos}/6 Photos</span>
                    </span>
                  </button>
                </div>

                <div className="rounded-2xl bg-[#FAF7F2] p-4 border border-[#E8E4DA] space-y-1.5 text-[12px] text-[#525B60]">
                  <p className="font-bold text-[#17212B] flex items-center gap-1.5">
                    <Icon name="info" size={14} className="text-[#075B3D]" />
                    Helpful Photo Tips
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px]">
                    <li>Capture the compound gate from the road so pilgrims easily spot it.</li>
                    <li>Show clear pavement or parking ground surface.</li>
                    <li>Avoid shots showing pilgrim vehicles with number plates visible.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ----------------- STEP 4: PRICING & ESTIMATOR ----------------- */}
            {step === 3 && (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-[18px] font-black text-[#17212B] font-heading">
                    Tariff Pricing & Host Earnings
                  </h2>
                  <p className="mt-1 text-[13px] text-[#525B60]">
                    Set regulated hourly and daily parking tariffs for visiting pilgrims.
                  </p>
                </div>

                <Field label="Billing Plan Allowed" required>
                  <SegmentedTabs
                    tabs={[
                      { id: 'both', label: 'Hourly + Daily' },
                      { id: 'hour', label: 'Hourly Only' },
                      { id: 'day', label: 'Daily Only' },
                    ]}
                    value="both"
                    onChange={() => {}}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price per hour (₹)" required>
                    <Input
                      type="number"
                      min={10}
                      step={5}
                      value={form.priceHour}
                      onChange={(event) => set({ priceHour: Number(event.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Price per day (₹)" required>
                    <Input
                      type="number"
                      min={50}
                      step={10}
                      value={form.priceDay}
                      onChange={(event) => set({ priceDay: Number(event.target.value) || 0 })}
                    />
                  </Field>
                </div>

                {/* Earnings Estimate Helper per Requirement 3.3 */}
                <div className="rounded-2xl border border-[#075B3D]/30 bg-[#FAF7F2] p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                      ESTIMATED FESTIVAL EARNINGS HELPER
                    </span>
                    <span className="text-[11px] font-bold text-[#075B3D]">
                      94% Net Host Payout
                    </span>
                  </div>

                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[#6B7578]">8 hours daily booking (1 bay):</span>
                      <span className="font-mono font-bold text-[#17212B]">
                        {money(form.priceHour * 8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7578]">5-day Shahi Snan festival window (8 bays):</span>
                      <span className="font-mono font-bold text-[#17212B]">
                        {money(form.priceHour * 8 * 5 * Math.min(8, form.capacity))}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#E8E4DA] pt-2 text-[15px] font-black text-[#075B3D]">
                      <span>Projected Host Settlement:</span>
                      <span className="font-mono">
                        {money(Math.round(form.priceHour * 8 * 5 * Math.min(8, form.capacity) * 0.94))}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6B7578] italic pt-1">
                    *Assumes average 8-hour daily mela reservation across 5 peak Snan festival dates with 94% direct bank settlement.
                  </p>
                </div>
              </div>
            )}

            {/* ----------------- STEP 5: HOURS / AVAILABILITY ----------------- */}
            {step === 4 && (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-[18px] font-black text-[#17212B] font-heading">
                    Operating Hours & Gate Windows
                  </h2>
                  <p className="mt-1 text-[13px] text-[#525B60]">
                    Select the pilgrimage periods when your gatekeeper or caretaker is on site.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {TIME_WINDOWS.map((window) => {
                    const active = form.windows.includes(window.id)
                    return (
                      <button
                        key={window.id}
                        type="button"
                        onClick={() =>
                          set({
                            windows: active
                              ? form.windows.filter((w) => w !== window.id)
                              : [...form.windows, window.id],
                          })
                        }
                        className={cn(
                          'flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer',
                          active
                            ? 'border-[#075B3D] bg-[#E7F1EA]'
                            : 'border-[#E8E4DA] bg-white hover:bg-[#FAF7F2]',
                        )}
                      >
                        <span
                          className={cn(
                            'grid size-10 shrink-0 place-items-center rounded-xl font-bold',
                            active ? 'bg-[#075B3D] text-white' : 'bg-[#FAF7F2] text-[#6B7578]',
                          )}
                        >
                          <Icon name={window.id === 'night' ? 'moon' : 'sun'} size={17} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <span className="block text-[14px] font-bold text-[#17212B]">
                            {window.label}
                          </span>
                          <span className="block text-[12px] font-mono text-[#6B7578]">
                            {window.from} – {window.to}
                          </span>
                        </div>

                        {active && <Icon name="checkCircle" size={20} className="shrink-0 text-[#075B3D]" />}
                      </button>
                    )
                  })}
                </div>

                <Field label="Special gatekeeper or access instructions" hint="Caretaker contact, barrier pass details, landmark cues.">
                  <Textarea
                    value={form.note}
                    onChange={(event) => set({ note: event.target.value })}
                    placeholder="Gate is unlocked from 04:30 AM, caretaker stays on site at compound entry."
                  />
                </Field>
              </div>
            )}

            {/* ----------------- STEP 6: REVIEW SUMMARY ----------------- */}
            {step === 5 && (
              <div className="rounded-3xl border border-[#E8E4DA] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <h2 className="text-[18px] font-black text-[#17212B] font-heading">
                    Review Your Listing
                  </h2>
                  <p className="mt-1 text-[13px] text-[#525B60]">
                    Review compound attributes before sending to the field verification queue.
                  </p>
                </div>

                {/* Section 1: Location Summary */}
                <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2">
                    <span className="font-bold text-[13px] text-[#17212B]">Location & Landmark</span>
                    <button
                      type="button"
                      onClick={() => goTo(0)}
                      className="text-[12px] font-bold text-[#075B3D] hover:underline"
                    >
                      Edit ↗
                    </button>
                  </div>
                  <SummaryRow label="Zone Sector" value={zone?.name} />
                  <SummaryRow label="Gate Address" value={form.address || 'Address provided'} />
                  <SummaryRow label="Nearest Landmark" value={form.nearestLandmark?.name || 'Ramkund'} />
                </div>

                {/* Section 2: Details Summary */}
                <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2">
                    <span className="font-bold text-[13px] text-[#17212B]">Space Details</span>
                    <button
                      type="button"
                      onClick={() => goTo(1)}
                      className="text-[12px] font-bold text-[#075B3D] hover:underline"
                    >
                      Edit ↗
                    </button>
                  </div>
                  <SummaryRow label="Title" value={form.title || 'Untitled'} />
                  <SummaryRow label="Capacity" value={`${form.capacity} Bays`} />
                  <SummaryRow label="Vehicles" value={form.vehicles.join(', ').toUpperCase()} />
                  <SummaryRow label="Surface" value={form.surface} />
                </div>

                {/* Section 3: Pricing & Hours */}
                <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-2">
                    <span className="font-bold text-[13px] text-[#17212B]">Tariffs & Operating Hours</span>
                    <button
                      type="button"
                      onClick={() => goTo(3)}
                      className="text-[12px] font-bold text-[#075B3D] hover:underline"
                    >
                      Edit ↗
                    </button>
                  </div>
                  <SummaryRow label="Hourly Tariff" value={`${money(form.priceHour)}/hr`} />
                  <SummaryRow label="Daily Tariff" value={`${money(form.priceDay)}/day`} />
                  <SummaryRow label="Active Windows" value={`${form.windows.length} periods active`} />
                </div>

                <div className="rounded-2xl bg-[#E7F1EA] p-4 text-[12px] text-[#075B3D] border border-[#075B3D]/25 space-y-1.5">
                  <p className="font-bold">Next Steps After Submission:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11.5px]">
                    <li>Our field mobility inspector checks gate clearance.</li>
                    <li>Spot is certified and issued an official Sthaanam QR Gate Pass.</li>
                    <li>Listing goes live and accepts instant UPI reservations.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* =====================================================================
              RIGHT COLUMN: LIVE STEP-2 DRIVER PREVIEW (DESKTOP)
          ===================================================================== */}
          <div className="hidden lg:block lg:col-span-5">
            <LiveListingPreview form={form} zone={zone} />
          </div>
        </div>
      </div>

      {/* ----------------- 3. STICKY FOOTER ACTION STRIP ----------------- */}
      <div className="fixed inset-x-0 bottom-0 z-[750] border-t border-[#E8E4DA] bg-white/95 px-4 pt-3 pb-[calc(0.75rem+max(0.75rem,env(safe-area-inset-bottom)))] backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {/* Left: Back Button */}
          <div>
            {step > 0 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => goTo(step - 1)}
                className="border-[#CBD5E1] bg-white hover:bg-[#FAF7F2] font-bold text-[13px] px-5 py-2.5 rounded-xl cursor-pointer"
              >
                ← Back
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/host')}
                className="border-[#CBD5E1] bg-white hover:bg-[#FAF7F2] font-bold text-[13px] px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Right: Save Draft & Continue */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              className="border-[#E8E4DA] bg-[#FAF7F2] hover:bg-[#E8E4DA] font-bold text-[13px] px-4 py-2.5 rounded-xl cursor-pointer"
              icon={<Icon name="download" size={14} />}
            >
              Save Draft
            </Button>

            <Button
              size="md"
              loading={submitting}
              onClick={handleContinue}
              className="bg-[#075B3D] hover:bg-[#064e34] text-white font-black text-[14px] uppercase tracking-wider px-7 py-3 rounded-xl shadow-md cursor-pointer"
            >
              {step === STEPS.length - 1 ? 'Submit for Verification' : 'Continue →'}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[12.5px] border-b border-[#E8E4DA] py-1.5 last:border-b-0">
      <span className="text-[#6B7578]">{label}:</span>
      <span className="font-bold text-[#17212B] font-mono truncate">{value}</span>
    </div>
  )
}

function validate(step, form) {
  if (step === 0) {
    const errors = {}
    if (!form.address.trim()) errors.address = 'Add the full address so pilgrims can locate the gate'
    if (!form.nearestLandmark) errors.nearestLandmark = 'Select a nearby landmark for pilgrim walking guidance'
    return errors
  }
  if (step === 1) {
    const errors = {}
    if (!form.title.trim()) errors.title = 'Give the listing a clear title (e.g. Driveway behind Sagar Petrol Pump)'
    if (!form.vehicles.length) errors.vehicles = 'Select at least one vehicle type allowed'
    return errors
  }
  return {}
}
