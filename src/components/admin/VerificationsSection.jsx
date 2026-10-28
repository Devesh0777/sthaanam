import { useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import StatusPill from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/Feedback'
import SpaceTypeIcon from '@/components/parking/SpaceTypeIcon'
import DossierDrawer from './DossierDrawer'
import { money } from '@/lib/format'
import { cn } from '@/lib/cn'

function relativeTime(iso) {
  if (!iso) return '—'
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function VerificationsSection({
  submissions = [],
  onApprove,
  onReject,
  onRequestInfo,
  busyId = null,
  initialStatusFilter = 'pending',
}) {
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [zoneFilter, setZoneFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [quickRejectSub, setQuickRejectSub] = useState(null)
  const [quickRejectReason, setQuickRejectReason] = useState(
    'Incomplete land ownership document / missing title deed',
  )

  // Unique zones from data
  const zones = useMemo(() => {
    const set = new Set()
    for (const s of submissions) {
      if (s.zoneName) set.add(s.zoneName)
    }
    return Array.from(set)
  }, [submissions])

  // Filtered list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Status filter
      if (statusFilter !== 'all') {
        const matchesPending = statusFilter === 'pending' && sub.status === 'pending'
        const matchesApproved =
          statusFilter === 'approved' && (sub.status === 'verified' || sub.status === 'approved')
        const matchesRejected = statusFilter === 'rejected' && sub.status === 'rejected'
        if (!matchesPending && !matchesApproved && !matchesRejected) return false
      }
      // Zone filter
      if (zoneFilter !== 'all' && sub.zoneName !== zoneFilter) return false
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = sub.title?.toLowerCase().includes(q)
        const matchHost = sub.hostName?.toLowerCase().includes(q)
        const matchPhone = sub.phone?.toLowerCase().includes(q)
        const matchZone = sub.zoneName?.toLowerCase().includes(q)
        const matchAddress = sub.address?.toLowerCase().includes(q)
        if (!matchTitle && !matchHost && !matchPhone && !matchZone && !matchAddress) return false
      }
      return true
    })
  }, [submissions, statusFilter, zoneFilter, searchQuery])

  // Bulk selection handling
  const allFilteredSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((s) => selectedIds.includes(s.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredSubmissions.map((s) => s.id))
    }
  }

  const toggleSelectRow = (id, e) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkApprove = async () => {
    for (const id of selectedIds) {
      const sub = submissions.find((s) => s.id === id)
      if (sub && sub.status === 'pending') {
        await onApprove(sub)
      }
    }
    setSelectedIds([])
  }

  const handleBulkReject = async () => {
    for (const id of selectedIds) {
      const sub = submissions.find((s) => s.id === id)
      if (sub && sub.status === 'pending') {
        await onReject(sub, 'Bulk administrative rejection')
      }
    }
    setSelectedIds([])
  }

  return (
    <div className="space-y-4">
      {/* Control Bar: Status Tabs + Zone Filter + Search */}
      <div className="rounded-3xl border border-white/60 glass-panel-strong p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E4DA] overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              {
                id: 'pending',
                label: 'Pending',
                count: submissions.filter((s) => s.status === 'pending').length,
              },
              {
                id: 'approved',
                label: 'Approved',
                count: submissions.filter((s) => s.status === 'verified').length,
              },
              {
                id: 'rejected',
                label: 'Rejected',
                count: submissions.filter((s) => s.status === 'rejected').length,
              },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap',
                    active
                      ? 'bg-[#075B3D] text-white shadow-2xs'
                      : 'text-[#6B7578] hover:text-[#17212B]',
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count != null && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[9.5px] font-mono font-black',
                        active ? 'bg-white/20 text-white' : 'bg-[#E8E4DA] text-[#17212B]',
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Zone Selector & Search Input */}
          <div className="flex items-center gap-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] px-3 py-1.5 text-[12px] font-bold text-[#17212B] focus:border-[#075B3D] focus:outline-none cursor-pointer"
            >
              <option value="all">All Sectors</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  Sector {z}
                </option>
              ))}
            </select>

            <div className="relative w-44 sm:w-56">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[#8C827A]">
                <Icon name="search" size={13} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter queue..."
                className="w-full rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] pl-8 pr-2.5 py-1.5 text-[12px] text-[#17212B] placeholder-[#8C827A] focus:border-[#075B3D] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Floating Row */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-[#075B3D] px-4 py-2 text-white animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-[12.5px] font-bold">
              <Icon name="checkCircle" size={16} />
              <span>
                {selectedIds.length} {selectedIds.length === 1 ? 'space' : 'spaces'} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11.5px] font-medium text-white/80 hover:text-white underline cursor-pointer mr-2"
              >
                Clear
              </button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 text-[11.5px] py-1"
                onClick={handleBulkReject}
              >
                Reject Selected
              </Button>
              <Button
                size="sm"
                className="bg-white text-[#075B3D] hover:bg-[#FAF7F2] font-black text-[11.5px] py-1 shadow-2xs"
                onClick={handleBulkApprove}
              >
                Approve & Publish Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          VERIFICATIONS QUEUE TABLE (DESKTOP) + CARDS (MOBILE)
      ========================================================================= */}
      {filteredSubmissions.length === 0 ? (
        <EmptyState
          icon="shield"
          title="No Matching Verifications"
          message="No host registration dossiers match the selected status, sector, or search term."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/70 glass-panel-strong shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-[#17212B]/10 bg-white/40 text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578]">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-[#E8E4DA] text-[#075B3D] focus:ring-[#075B3D] cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-3 px-3">Applicant</th>
                  <th className="py-3 px-3">Space & Type</th>
                  <th className="py-3 px-3">Sector</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3">Documents</th>
                  <th className="py-3 px-3">Risk / Notes</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DA]/70 font-sans">
                {filteredSubmissions.map((sub) => {
                  const isSelected = selectedIds.includes(sub.id)
                  const isPending = sub.status === 'pending'
                  const isApproved = sub.status === 'verified' || sub.status === 'approved'

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className={cn(
                        'hover:bg-[#FAF7F2]/80 transition-colors cursor-pointer group',
                        isSelected && 'bg-[#FAF7F2]',
                      )}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => toggleSelectRow(sub.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectRow(sub.id, e)}
                          className="rounded border-[#E8E4DA] text-[#075B3D] focus:ring-[#075B3D] cursor-pointer"
                        />
                      </td>

                      {/* Applicant (Person Icon, No First-Letter Avatar) */}
                      <td className="py-3.5 px-3 min-w-[140px]">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-xl bg-[#E7F1EA] text-[#075B3D] border border-[#075B3D]/20 grid place-items-center shrink-0">
                            <Icon name="user" size={15} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#17212B] truncate">{sub.hostName}</p>
                            <p className="text-[11px] font-mono text-[#6B7578] truncate">
                              {sub.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Space Name + SpaceTypeIcon */}
                      <td className="py-3.5 px-3 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <SpaceTypeIcon listing={sub} size="sm" />
                          <div className="min-w-0">
                            <p className="font-bold text-[#17212B] truncate group-hover:text-[#075B3D] transition-colors">
                              {sub.title}
                            </p>
                            <p className="text-[11px] text-[#6B7578] truncate">{sub.address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Zone / Landmark */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-[#17212B]">Sector {sub.zoneName}</span>
                      </td>

                      {/* Capacity & Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#17212B]">
                          {sub.capacity} bays
                        </span>
                        <span className="block text-[11px] font-mono text-[#075B3D]">
                          {money(sub.priceHour)}/hr
                        </span>
                      </td>

                      {/* Submitted Time (Relative) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className="font-mono text-[11.5px] text-[#6B7578]"
                          title={sub.submittedISO}
                        >
                          {relativeTime(sub.submittedISO)}
                        </span>
                      </td>

                      {/* Documents Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF7F2] border border-[#E8E4DA] px-2 py-0.5 text-[10.5px] font-mono font-bold text-[#075B3D]">
                          <Icon name="check" size={11} strokeWidth={2.5} />
                          {sub.documents?.length || 0} Docs
                        </span>
                      </td>

                      {/* Risk / Notes */}
                      <td className="py-3.5 px-3 min-w-[150px]">
                        {sub.note ? (
                          <span
                            className="inline-block max-w-[140px] truncate rounded bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-900 border border-amber-200/80"
                            title={sub.note}
                          >
                            “{sub.note}”
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8C827A] font-mono">No flags</span>
                        )}
                      </td>

                      {/* Status Chip */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusPill
                          tone={isApproved ? 'success' : isPending ? 'warning' : 'danger'}
                          label={isApproved ? 'Verified' : isPending ? 'Pending' : 'Rejected'}
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className="rounded-lg border border-[#E8E4DA] bg-white px-2.5 py-1 text-[11px] font-bold text-[#17212B] hover:bg-[#FAF7F2] hover:border-[#075B3D]/30 transition-all cursor-pointer shadow-2xs"
                          >
                            Inspect
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setQuickRejectSub(sub)}
                                className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                title="Reject application"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => onApprove(sub)}
                                disabled={busyId === sub.id}
                                className="rounded-lg bg-[#075B3D] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#064e34] transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                                title="Approve and publish"
                              >
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          RIGHT-SIDE DOSSIER DRAWER
      ========================================================================= */}
      <DossierDrawer
        submission={selectedSubmission}
        open={Boolean(selectedSubmission)}
        onClose={() => setSelectedSubmission(null)}
        onApprove={async (sub, note) => {
          await onApprove(sub, note)
          setSelectedSubmission(null)
        }}
        onReject={async (sub, reason) => {
          await onReject(sub, reason)
          setSelectedSubmission(null)
        }}
        onRequestInfo={(sub, note) => {
          onRequestInfo?.(sub, note)
        }}
        isProcessing={busyId === selectedSubmission?.id}
      />

      {/* =========================================================================
          QUICK ROW REJECT REASON MODAL
      ========================================================================= */}
      {quickRejectSub && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setQuickRejectSub(null)}
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
                  Rejecting <strong>{quickRejectSub.title}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
                Rejection Reason (Required)
              </label>
              <select
                value={quickRejectReason}
                onChange={(e) => setQuickRejectReason(e.target.value)}
                className="w-full rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] px-3 py-2 text-[12.5px] font-medium text-[#17212B] focus:outline-none focus:border-red-500"
              >
                <option value="Incomplete land ownership document / missing title deed">
                  Incomplete land ownership document / missing title deed
                </option>
                <option value="Missing society NOC or trust countersignature">
                  Missing society NOC or trust countersignature
                </option>
                <option value="Inadequate emergency egress or bay entry width (< 3.2m)">
                  Inadequate emergency egress or bay entry width (&lt; 3.2m)
                </option>
                <option value="Disputed property boundary or municipal reservation">
                  Disputed property boundary or municipal reservation
                </option>
                <option value="Unverifiable host identification / KYC mismatch">
                  Unverifiable host identification / KYC mismatch
                </option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DA]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickRejectSub(null)}
                className="font-bold text-[12px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[12px] px-4"
                onClick={() => {
                  const sub = quickRejectSub
                  setQuickRejectSub(null)
                  onReject(sub, quickRejectReason)
                }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
