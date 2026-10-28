import { useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'
import Button from '@/components/ui/Button'
import StatusPill from '@/components/ui/StatusPill'
import { Textarea } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/Feedback'
import { dateTime } from '@/lib/format'
import { ISSUE_STATUS } from '@/lib/status'
import { cn } from '@/lib/cn'

const SEVERITY_CONFIG = {
  high: {
    label: 'High Priority',
    tone: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  medium: {
    label: 'Medium Priority',
    tone: 'bg-[#FFF8E7] text-[#B47C10] border-[#E9A83A]/30',
    dot: 'bg-[#E9A83A]',
  },
  low: {
    label: 'Low Priority',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
}

export default function IncidentDeskSection({
  issues = [],
  onUpdateIssue,
  busyId = null,
  initialStatusFilter = 'all',
}) {
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter) // all, open, in_review, resolved
  const [severityFilter, setSeverityFilter] = useState('all') // all, high, medium, low
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIssue, setActiveIssue] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('resolved')
  const [resolutionNote, setResolutionNote] = useState('')

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter === 'open' && issue.status !== 'open') return false
      if (statusFilter === 'in_review' && issue.status !== 'in_review') return false
      if (statusFilter === 'resolved' && issue.status !== 'resolved') return false

      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = issue.title?.toLowerCase().includes(q)
        const matchDetail = issue.detail?.toLowerCase().includes(q)
        const matchRaised = issue.raisedBy?.toLowerCase().includes(q)
        const matchZone = issue.zoneName?.toLowerCase().includes(q)
        const matchId = issue.id?.toLowerCase().includes(q)
        if (!matchTitle && !matchDetail && !matchRaised && !matchZone && !matchId) return false
      }

      return true
    })
  }, [issues, statusFilter, severityFilter, searchQuery])

  const openDrawer = (issue) => {
    setActiveIssue(issue)
    setSelectedStatus(issue.status === 'open' ? 'in_review' : 'resolved')
    setResolutionNote(issue.resolution || '')
  }

  const handleSaveStatus = async () => {
    if (!activeIssue) return
    await onUpdateIssue(activeIssue.id, {
      status: selectedStatus,
      resolution: resolutionNote || 'Incident reviewed and processed by Operations Center.',
    })
    setActiveIssue(null)
    setResolutionNote('')
  }

  const handleQuickAcknowledge = async (issue, e) => {
    e.stopPropagation()
    await onUpdateIssue(issue.id, {
      status: 'in_review',
      resolution: 'Acknowledged by inspector; field team dispatched.',
    })
  }

  return (
    <div className="space-y-4">
      {/* =========================================================================
          CONTROL BAR: STATUS FILTER + SEVERITY FILTER + SEARCH
      ========================================================================= */}
      <div className="rounded-2xl border border-[#E8E4DA] bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Chips */}
          <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E8E4DA] overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Incidents' },
              {
                id: 'open',
                label: 'Open',
                count: issues.filter((i) => i.status === 'open').length,
              },
              {
                id: 'in_review',
                label: 'Investigating',
                count: issues.filter((i) => i.status === 'in_review').length,
              },
              {
                id: 'resolved',
                label: 'Resolved',
                count: issues.filter((i) => i.status === 'resolved').length,
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

          {/* Severity & Search Filter */}
          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] px-3 py-1.5 text-[12px] font-bold text-[#17212B] focus:border-[#075B3D] focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="high">High Priority Only</option>
              <option value="medium">Medium Priority Only</option>
              <option value="low">Low Priority Only</option>
            </select>

            <div className="relative w-44 sm:w-56">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[#8C827A]">
                <Icon name="search" size={13} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents..."
                className="w-full rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] pl-8 pr-2.5 py-1.5 text-[12px] text-[#17212B] placeholder-[#8C827A] focus:border-[#075B3D] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INCIDENT CARDS LIST
      ========================================================================= */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          icon="checkCircle"
          title="Zero Incidents Matching"
          message="No alerts or compound complaints match the selected filter criteria."
        />
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const statusMeta = ISSUE_STATUS[issue.status] || { label: issue.status, tone: 'neutral' }
            const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.low
            const isOpen = issue.status === 'open'
            const isResolved = issue.status === 'resolved'

            return (
              <article
                key={issue.id}
                onClick={() => openDrawer(issue)}
                className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-2xs space-y-3.5 hover:shadow-xs hover:border-[#075B3D]/40 transition-all cursor-pointer group"
              >
                {/* Header: Title + Severity Chip + Status */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10.5px] font-bold text-[#6B7578] uppercase">
                        INCIDENT #{issue.id.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span className="text-[11.5px] font-bold text-[#075B3D]">
                        Sector {issue.zoneName}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] text-[#6B7578]">
                        Linked Space: #{issue.spotId}
                      </span>
                    </div>

                    <h4 className="mt-1 text-[16px] font-black text-[#17212B] font-heading group-hover:text-[#075B3D] transition-colors">
                      {issue.title}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#6B7578]">
                      <span>Type: <strong className="text-[#17212B]">{issue.type}</strong></span>
                      <span>•</span>
                      <span>Raised by: <strong className="text-[#17212B]">{issue.raisedBy}</strong></span>
                      <span>•</span>
                      <span>
                        Assignee:{' '}
                        <strong className="text-[#075B3D]">Mela Marshal Squad #2</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-mono font-bold uppercase border',
                        sev.tone,
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', sev.dot)} />
                      {sev.label}
                    </span>
                    <StatusPill tone={statusMeta.tone} label={statusMeta.label} size="sm" />
                  </div>
                </div>

                {/* Detail Box */}
                <div className="rounded-xl bg-[#FAF7F2] p-3 text-[12.5px] leading-relaxed text-[#4A4A4A] border border-[#E8E4DA]/70">
                  {issue.detail}
                </div>

                {/* Resolution Footnote if resolved */}
                {issue.resolution && (
                  <div className="rounded-xl bg-[#E7F1EA]/60 p-2.5 text-[11.5px] text-[#075B3D] flex items-center gap-2 border border-[#075B3D]/15">
                    <Icon name="check" size={13} strokeWidth={2.4} />
                    <span>Resolution: {issue.resolution}</span>
                  </div>
                )}

                {/* Footer Bar */}
                <div className="flex items-center justify-between border-t border-[#E8E4DA] pt-3 text-[12px]">
                  <span className="text-[#6B7578] font-mono text-[11px]">
                    Logged: {dateTime(issue.raisedISO)}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isOpen && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E8E4DA] bg-white hover:bg-[#FAF7F2] text-[11.5px] font-bold"
                        onClick={(e) => handleQuickAcknowledge(issue, e)}
                        loading={busyId === issue.id}
                      >
                        Acknowledge
                      </Button>
                    )}

                    <Button
                      size="sm"
                      className="bg-[#075B3D] hover:bg-[#064e34] text-white font-bold text-[11.5px] shadow-2xs"
                      onClick={() => openDrawer(issue)}
                    >
                      {isResolved ? 'Inspect Resolution' : 'Update / Resolve'}
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* =========================================================================
          INCIDENT RESOLUTION SLIDE-OVER DRAWER
      ========================================================================= */}
      {activeIssue && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveIssue(null)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Incident Resolution"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col border-l border-[#E8E4DA] animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <header className="px-6 py-4 border-b border-[#E8E4DA] bg-[#FAF7F2] flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono text-[10.5px] font-bold text-[#6B7578] uppercase">
                  INCIDENT #{activeIssue.id.toUpperCase()}
                </span>
                <h3 className="text-[17px] font-black text-[#17212B] font-heading mt-0.5 truncate max-w-sm">
                  {activeIssue.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveIssue(null)}
                className="grid size-8 place-items-center rounded-xl text-[#6B7578] hover:bg-[#E8E4DA]/60"
              >
                <Icon name="x" size={18} />
              </button>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="rounded-xl border border-[#E8E4DA] bg-[#FAF7F2] p-4 space-y-2 text-[12px]">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#6B7578]">Sector & Compound:</span>
                  <strong className="text-[#17212B]">
                    {activeIssue.zoneName} • #{activeIssue.spotId}
                  </strong>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#6B7578]">Raised by:</span>
                  <strong className="text-[#17212B]">{activeIssue.raisedBy}</strong>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#6B7578]">Priority Level:</span>
                  <span className="capitalize font-bold text-[#17212B]">
                    {activeIssue.severity} Priority
                  </span>
                </div>
              </div>

              {/* Full Incident Detail */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
                  Incident Log Description
                </label>
                <div className="rounded-xl border border-[#E8E4DA] bg-white p-3.5 text-[12.5px] leading-relaxed text-[#17212B]">
                  {activeIssue.detail}
                </div>
              </div>

              {/* Status Switcher */}
              <div className="space-y-2">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
                  Transition Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'open', label: 'Open' },
                    { id: 'in_review', label: 'Investigating' },
                    { id: 'resolved', label: 'Resolved' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStatus(s.id)}
                      className={cn(
                        'rounded-xl border py-2 text-[11.5px] font-bold text-center transition-all cursor-pointer',
                        selectedStatus === s.id
                          ? 'border-[#075B3D] bg-[#E7F1EA] text-[#075B3D] ring-1 ring-[#075B3D]'
                          : 'border-[#E8E4DA] bg-[#FAF7F2] text-[#6B7578] hover:text-[#17212B]',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Note */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#6B7578] block">
                  Official Operational Resolution Note
                </label>
                <Textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Ground marshal cleared overstay vehicle; compound gate verified open."
                  rows={3}
                  className="bg-white border-[#E8E4DA] text-[12.5px]"
                />
              </div>
            </div>

            {/* Footer */}
            <footer className="px-6 py-4 border-t border-[#E8E4DA] bg-[#FAF7F2] flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveIssue(null)}
                className="font-bold text-[12px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#075B3D] hover:bg-[#064e34] text-white font-bold text-[12px] px-5"
                onClick={handleSaveStatus}
                loading={busyId === activeIssue.id}
              >
                Update Incident
              </Button>
            </footer>
          </aside>
        </>
      )}
    </div>
  )
}
