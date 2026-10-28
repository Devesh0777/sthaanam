import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import StatusPill from '@/components/ui/StatusPill'
import { Textarea } from '@/components/ui/Field'
import SpaceTypeIcon from '@/components/parking/SpaceTypeIcon'
import { dateTime, money, relativeDay } from '@/lib/format'
import { cn } from '@/lib/cn'

const VEHICLE_ICONS = {
  '2w': 'bike',
  car: 'car',
  bus: 'bus',
}

const REJECTION_REASONS = [
  'Incomplete land ownership document / missing title deed',
  'Missing society NOC or trust countersignature',
  'Inadequate emergency egress or bay entry width (< 3.2m)',
  'Disputed property boundary or municipal reservation',
  'Unverifiable host identification / KYC mismatch',
  'Other operational non-compliance',
]

export default function DossierDrawer({
  submission,
  open,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
  isProcessing = false,
}) {
  const [activeDocPreview, setActiveDocPreview] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [requestInfoOpen, setRequestInfoOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0])
  const [rejectionNote, setRejectionNote] = useState('')
  const [infoNote, setInfoNote] = useState('')
  const [adminNote, setAdminNote] = useState('')

  if (!open || !submission) return null

  const handleApprove = () => {
    setApproveConfirmOpen(false)
    onApprove(submission, adminNote)
  }

  const handleConfirmReject = () => {
    if (!rejectionReason) return
    setRejectModalOpen(false)
    const combinedReason = rejectionNote
      ? `${rejectionReason}: ${rejectionNote}`
      : rejectionReason
    onReject(submission, combinedReason)
  }

  const handleSendInfoRequest = () => {
    setRequestInfoOpen(false)
    onRequestInfo(submission, infoNote || 'Additional documentation requested by inspector.')
    setInfoNote('')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Application Dossier"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl glass-panel-strong shadow-2xl flex flex-col border-l border-white/60 animate-in slide-in-from-right duration-250"
      >
        {/* Header Bar */}
        <header className="px-6 py-4 border-b border-[#17212B]/10 bg-white/40 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[#075B3D] uppercase tracking-wider">
                DOSSIER #{submission.id.toUpperCase()}
              </span>
              <span>•</span>
              <span className="text-[11.5px] font-semibold text-[#6B7578]">
                Sector {submission.zoneName}
              </span>
            </div>
            <h2 className="text-[17px] font-black text-[#17212B] font-heading mt-0.5 truncate max-w-md">
              {submission.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill
              tone={
                submission.status === 'verified'
                  ? 'success'
                  : submission.status === 'rejected'
                    ? 'danger'
                    : 'warning'
              }
              label={
                submission.status === 'verified'
                  ? 'Verified'
                  : submission.status === 'rejected'
                    ? 'Rejected'
                    : 'Pending Review'
              }
              size="sm"
            />
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-xl text-[#6B7578] hover:bg-[#E8E4DA]/60 hover:text-[#17212B] transition-colors cursor-pointer"
              aria-label="Close dossier"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Section 1: Space & Type Banner */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 flex items-start gap-4">
            <SpaceTypeIcon listing={submission} size="default" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#075B3D]">
                  Compound Specifications
                </span>
                <span className="text-[11px] font-mono font-bold text-[#6B7578]">
                  Submitted {relativeDay(submission.submittedISO)}
                </span>
              </div>
              <h3 className="text-[16px] font-black text-[#17212B] mt-0.5">{submission.title}</h3>
              <p className="text-[12px] text-[#6B7578] mt-0.5">{submission.address}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#E8E4DA] px-2.5 py-1 text-[11px] font-mono font-bold text-[#17212B]">
                  <Icon name="car" size={13} className="text-[#075B3D]" />
                  {submission.capacity} Bay Capacity
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#E8E4DA] px-2.5 py-1 text-[11px] font-mono font-bold text-[#075B3D]">
                  {money(submission.priceHour)}/hr Base Tariff
                </span>
                {submission.priceDay && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-[#E8E4DA] px-2.5 py-1 text-[11px] font-mono font-bold text-[#17212B]">
                    {money(submission.priceDay)}/day Full Mela
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Applicant Profile Card (Strictly Person Icon, No First-Letter Avatar) */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 space-y-3">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
              Applicant Identity & Ownership Profile
            </span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/25 grid place-items-center shadow-2xs">
                  <Icon name="user" size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-[#17212B] leading-tight">
                    {submission.hostName}
                  </h4>
                  <p className="text-[12px] font-mono text-[#6B7578]">{submission.phone}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F1EA] px-2.5 py-1 text-[10.5px] font-mono font-bold text-[#075B3D]">
                <Icon name="shield" size={12} />
                Aadhaar KYC Match
              </span>
            </div>
          </div>

          {/* Section 3: Geolocation & Vehicles Allowed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Geolocation Card */}
            <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 space-y-2">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
                GPS Coordinate Fix
              </span>
              <div className="flex items-center gap-2 text-[13px] font-mono font-bold text-[#17212B]">
                <Icon name="pin" size={15} className="text-[#075B3D]" />
                <span>
                  {submission.latlng?.[0]?.toFixed(4)}° N, {submission.latlng?.[1]?.toFixed(4)}° E
                </span>
              </div>
              <p className="text-[11px] text-[#6B7578]">
                Precision validated within {submission.zoneName} Mela Perimeter.
              </p>
            </div>

            {/* Allowed Vehicle Classes */}
            <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 space-y-2">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
                Permitted Vehicle Categories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(submission.vehicles || []).map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#FAF7F2] border border-[#E8E4DA] px-2.5 py-1 text-[11px] font-bold text-[#17212B]"
                  >
                    <Icon name={VEHICLE_ICONS[v] || 'car'} size={13} className="text-[#075B3D]" />
                    <span className="uppercase font-mono">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Submitted Verification Documents with View Button */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578]">
                Submitted Legal & Permission Documents
              </span>
              <span className="text-[11px] font-mono font-bold text-[#075B3D]">
                {submission.documents?.length || 0} Documents Uploaded
              </span>
            </div>

            <div className="space-y-2">
              {(submission.documents || []).map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-[#FAF7F2] border border-[#E8E4DA] px-3.5 py-2.5 transition-all hover:bg-white hover:border-[#075B3D]/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid size-7 place-items-center rounded-lg bg-[#E7F1EA] text-[#075B3D] shrink-0">
                      <Icon name="check" size={14} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-[#17212B] truncate">{doc}</p>
                      <p className="text-[10.5px] font-mono text-[#6B7578]">
                        Digital Sign Valid • Scanned Oct 2026
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveDocPreview({
                        title: doc,
                        host: submission.hostName,
                        zone: submission.zoneName,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E8E4DA] bg-white px-2.5 py-1 text-[11px] font-bold text-[#075B3D] hover:bg-[#E7F1EA] transition-colors cursor-pointer shrink-0"
                  >
                    <Icon name="externalLink" size={12} />
                    View Document
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Host Operational Note */}
          {submission.note && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-1 text-amber-950">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#B47C10]">
                <Icon name="info" size={13} />
                Host Operational Note
              </div>
              <p className="text-[12.5px] leading-relaxed italic">
                “{submission.note}”
              </p>
            </div>
          )}

          {/* Section 6: Verification Audit Timeline */}
          <div className="rounded-2xl border border-[#E8E4DA] bg-white p-4 space-y-3">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
              Inspection Audit Trail
            </span>

            <div className="space-y-3 text-[12px] pl-2 border-l-2 border-[#E7F1EA]">
              <div className="relative pl-3">
                <span className="absolute -left-[13px] top-1 size-2 rounded-full bg-[#075B3D]" />
                <p className="font-bold text-[#17212B]">Host Registration & KYC Verification</p>
                <p className="text-[10.5px] text-[#6B7578] font-mono">
                  {dateTime(submission.submittedISO)} • System Match
                </p>
              </div>

              <div className="relative pl-3">
                <span className="absolute -left-[13px] top-1 size-2 rounded-full bg-[#075B3D]" />
                <p className="font-bold text-[#17212B]">Land Record & Document Anti-Tamper Check</p>
                <p className="text-[10.5px] text-[#6B7578] font-mono">
                  Valid OCR hash • No duplicate title recorded
                </p>
              </div>

              <div className="relative pl-3">
                <span
                  className={cn(
                    'absolute -left-[13px] top-1 size-2 rounded-full',
                    submission.status === 'verified'
                      ? 'bg-[#075B3D]'
                      : submission.status === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-amber-400 animate-pulse',
                  )}
                />
                <p className="font-bold text-[#17212B]">
                  {submission.status === 'verified'
                    ? 'Superuser Approval Granted'
                    : submission.status === 'rejected'
                      ? 'Submission Rejected'
                      : 'Pending Operations Center Clearance'}
                </p>
                <p className="text-[10.5px] text-[#6B7578] font-mono">
                  Current Inspector Desk Step
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: Operational Admin Note input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578]">
              Official Decision Dispatch Note (Optional)
            </label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add inspector comment for records or dispatch message to host..."
              rows={2}
              className="bg-white border-[#E8E4DA] text-[12.5px]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="px-6 py-4 border-t border-[#E8E4DA] bg-[#FAF7F2] flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#6B7578] hover:text-[#17212B] font-bold text-[12px]"
            onClick={() => setRequestInfoOpen(true)}
            disabled={isProcessing}
          >
            Request Info
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 font-bold text-[12px]"
              onClick={() => setRejectModalOpen(true)}
              disabled={isProcessing}
              icon={<Icon name="x" size={13} />}
            >
              Reject
            </Button>

            <Button
              size="sm"
              className="bg-[#075B3D] hover:bg-[#064e34] text-white font-bold text-[12px] shadow-2xs px-4"
              onClick={() => setApproveConfirmOpen(true)}
              loading={isProcessing}
              icon={<Icon name="check" size={14} strokeWidth={2.6} />}
            >
              Approve & Publish
            </Button>
          </div>
        </footer>
      </aside>

      {/* =========================================================================
          DOCUMENT PREVIEW MODAL
      ========================================================================= */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setActiveDocPreview(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white border border-[#E8E4DA] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E8E4DA] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-[#E7F1EA] text-[#075B3D]">
                  <Icon name="shield" size={16} />
                </span>
                <div>
                  <h3 className="font-black text-[#17212B] text-[15px]">
                    {activeDocPreview.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[#6B7578]">Official Document Inspection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="grid size-8 place-items-center rounded-xl text-[#6B7578] hover:bg-[#FAF7F2]"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Simulated Authenticated Document Canvas */}
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E8E4DA] p-5 space-y-3 font-mono text-[12px]">
              <div className="flex items-center justify-between border-b border-dashed border-[#E8E4DA] pb-2 text-[10.5px] text-[#6B7578]">
                <span>GOVERNMENT OF MAHARASHTRA / MELA AUTH</span>
                <span className="text-[#075B3D] font-bold">VERIFIED SEAL</span>
              </div>

              <div className="space-y-1.5 py-2">
                <p>
                  <strong>Title:</strong> {activeDocPreview.title}
                </p>
                <p>
                  <strong>Registered Host:</strong> {activeDocPreview.host}
                </p>
                <p>
                  <strong>Compound Zone:</strong> Sector {activeDocPreview.zone}
                </p>
                <p>
                  <strong>Hash ID:</strong>{' '}
                  <span className="text-[#075B3D]">SHA256: 7f8a9b2c...d4e1</span>
                </p>
                <p>
                  <strong>Verification Status:</strong> Validated by Operations Automated Scanner
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 border border-[#E8E4DA] text-center text-[11px] text-[#6B7578]">
                [Digital Certificate & QR Seal Verified for Kumbh 2027 Operations]
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDocPreview(null)}
                className="font-bold text-[12px]"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          APPROVE CONFIRMATION DIALOG
      ========================================================================= */}
      {approveConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setApproveConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-[#E8E4DA] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#E7F1EA] text-[#075B3D] shrink-0">
                <Icon name="checkCircle" size={22} strokeWidth={2.4} />
              </span>
              <div>
                <h3 className="text-[17px] font-black text-[#17212B] font-heading">
                  Approve & Publish Space?
                </h3>
                <p className="mt-1 text-[12.5px] text-[#6B7578] leading-relaxed">
                  This will publish <strong>{submission.title}</strong> to the live Kumbh map.
                  Pilgrims will immediately be able to search and reserve parking in Sector{' '}
                  {submission.zoneName}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApproveConfirmOpen(false)}
                className="font-bold text-[12px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#075B3D] hover:bg-[#064e34] text-white font-bold text-[12px] px-4"
                onClick={handleApprove}
                loading={isProcessing}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REJECT DIALOG (REASON REQUIRED)
      ========================================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-[#E8E4DA] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-red-50 text-red-600 shrink-0">
                <Icon name="alert" size={20} strokeWidth={2.4} />
              </span>
              <div>
                <h3 className="text-[17px] font-black text-[#17212B] font-heading">
                  Reject Application
                </h3>
                <p className="mt-0.5 text-[12px] text-[#6B7578]">
                  Specify the official rejection rationale for host notification.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block mb-1">
                  Rejection Reason (Required)
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] px-3 py-2 text-[12.5px] font-medium text-[#17212B] focus:outline-none focus:border-red-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block mb-1">
                  Additional Explanation to Host (Optional)
                </label>
                <Textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Please re-upload your property tax receipt with clear seal..."
                  rows={2}
                  className="bg-white border-[#E8E4DA] text-[12px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                className="font-bold text-[12px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[12px] px-4"
                onClick={handleConfirmReject}
                loading={isProcessing}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REQUEST INFO DIALOG
      ========================================================================= */}
      {requestInfoOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setRequestInfoOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-[#E8E4DA] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-[17px] font-black text-[#17212B] font-heading">
                Request Clarification from Host
              </h3>
              <p className="mt-0.5 text-[12px] text-[#6B7578]">
                Send an official inquiry regarding documents or space layout.
              </p>
            </div>

            <Textarea
              value={infoNote}
              onChange={(e) => setInfoNote(e.target.value)}
              placeholder="Specify the additional documents or photo angles required..."
              rows={3}
              className="bg-white border-[#E8E4DA] text-[12.5px]"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRequestInfoOpen(false)}
                className="font-bold text-[12px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#075B3D] hover:bg-[#064e34] text-white font-bold text-[12px] px-4"
                onClick={handleSendInfoRequest}
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
