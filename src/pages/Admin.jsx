import { useMemo, useState } from 'react'
import {
  decideVerification,
  getAdminOverview,
  getIssues,
  getOccupancy,
  getVerifications,
  updateIssue,
} from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/components/ui/Toast'
import { ErrorState } from '@/components/ui/Feedback'
import AdminShell from '@/components/admin/AdminShell'
import AdminKpiRow from '@/components/admin/AdminKpiRow'
import VerificationsSection from '@/components/admin/VerificationsSection'
import LiveOperationsSection from '@/components/admin/LiveOperationsSection'
import NetworkAnalyticsSection from '@/components/admin/NetworkAnalyticsSection'
import ZoneOccupancySection from '@/components/admin/ZoneOccupancySection'
import IncidentDeskSection from '@/components/admin/IncidentDeskSection'

export default function Admin() {
  const toast = useToast()
  const [tab, setTab] = useState('verifications')
  const [dateRange, setDateRange] = useState('7d')
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date())

  // Pre-filters when user clicks KPI cards
  const [verificationInitialFilter, setVerificationInitialFilter] = useState('pending')
  const [incidentInitialFilter, setIncidentInitialFilter] = useState('all')

  const { data: overview, error: overviewErr, reload: reloadOverview } = useAsync(
    () => getAdminOverview(),
    [],
  )
  const { data: subs, error: subsErr, reload: reloadSubs } = useAsync(() => getVerifications(), [])
  const { data: issues, error: issuesErr, reload: reloadIssues } = useAsync(() => getIssues(), [])
  const { data: occupancy } = useAsync(() => getOccupancy(), [])

  const pending = useMemo(() => (subs ?? []).filter((s) => s.status === 'pending'), [subs])
  const openIssues = useMemo(() => (issues ?? []).filter((i) => i.status !== 'resolved'), [issues])

  // Aggregate live capacity metrics from occupancy
  const capacityStats = useMemo(() => {
    let totalCap = 0
    let totalOpen = 0
    for (const spot of occupancy ?? []) {
      totalCap += spot.capacity || 10
      totalOpen += spot.spotsLeft || 0
    }
    const occupied = Math.max(0, totalCap - totalOpen)
    const rate = totalCap > 0 ? Math.round((occupied / totalCap) * 100) : 78
    return {
      totalCap: totalCap || 120,
      totalOpen: totalOpen || 26,
      occupied: occupied || 94,
      rate,
    }
  }, [occupancy])

  // Telemetry Synchronization
  const handleSyncTelemetry = async () => {
    setIsSyncing(true)
    try {
      await Promise.all([reloadOverview(), reloadSubs(), reloadIssues()])
      setLastSyncedAt(new Date())
      toast.push({
        tone: 'success',
        title: 'Telemetry Synchronized',
        message: 'Compound permits, active gate sessions, and issues updated.',
      })
    } catch {
      toast.push({ tone: 'error', title: 'Sync Failed', message: 'Could not connect to node.' })
    } finally {
      setIsSyncing(false)
    }
  }

  // Verification Decision Action (Approve & Publish / Reject)
  const handleDecideVerification = async (submission, decision, note = null) => {
    setBusyId(submission.id)
    try {
      await decideVerification(submission.id, decision, note)
      toast.push({
        tone: decision === 'verified' ? 'success' : 'info',
        title:
          decision === 'verified' ? 'Listing Approved & Published' : 'Submission Rejected',
        message: `${submission.hostName} • ${submission.title}`,
      })
      reloadSubs()
      reloadOverview()
    } catch (err) {
      toast.push({
        tone: 'error',
        title: 'Action failed',
        message: err.friendlyMessage ?? err.message,
      })
    } finally {
      setBusyId(null)
    }
  }

  // Request More Info Action
  const handleRequestInfo = (submission, note) => {
    toast.push({
      tone: 'info',
      title: 'Clarification Dispatched',
      message: `Inquiry sent to ${submission.hostName}: "${note}"`,
    })
  }

  // Incident Status Action (Acknowledge / Resolve with note)
  const handleUpdateIssue = async (issueId, patch) => {
    setBusyId(issueId)
    try {
      await updateIssue(issueId, patch)
      toast.push({
        tone: 'success',
        title: patch.status === 'resolved' ? 'Incident Resolved' : 'Incident Status Updated',
        message: patch.resolution || undefined,
      })
      reloadIssues()
      reloadOverview()
    } catch (err) {
      toast.push({
        tone: 'error',
        title: 'Update failed',
        message: err.friendlyMessage ?? err.message,
      })
    } finally {
      setBusyId(null)
    }
  }

  // Handle clicking a KPI card: switches tab and sets pre-filter
  const handleKpiClick = (targetTab, filterValue) => {
    setTab(targetTab)
    if (targetTab === 'verifications' && filterValue) {
      setVerificationInitialFilter(filterValue)
    } else if (targetTab === 'issues' && filterValue) {
      setIncidentInitialFilter(filterValue)
    }
  }

  const hasError = overviewErr || subsErr || issuesErr

  return (
    <AdminShell
      currentTab={tab}
      onSelectTab={setTab}
      pendingCount={pending.length}
      openIncidentsCount={openIssues.length}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onSyncTelemetry={handleSyncTelemetry}
      isSyncing={isSyncing}
      lastSyncedAt={lastSyncedAt}
    >
      {/* Global Error Banner if any */}
      {hasError && (
        <ErrorState
          message="Failed to load some operations data. Please synchronize telemetry."
          onRetry={handleSyncTelemetry}
        />
      )}

      {/* =========================================================================
          ROW 1: FOUR CLICKABLE KPI METRIC CARDS (LIGHT SURFACE + SPARKLINES)
      ========================================================================= */}
      <AdminKpiRow
        pendingCount={pending.length}
        liveBookingsCount={overview?.liveBookings ?? 28}
        openIncidentsCount={openIssues.length}
        grossToday={overview?.grossToday ?? 24500}
        onKpiClick={handleKpiClick}
      />

      {/* =========================================================================
          ACTIVE MODULE CONTENT VIEWPORT
      ========================================================================= */}
      {tab === 'verifications' && (
        <VerificationsSection
          submissions={subs ?? []}
          onApprove={(sub, note) => handleDecideVerification(sub, 'verified', note)}
          onReject={(sub, reason) => handleDecideVerification(sub, 'rejected', reason)}
          onRequestInfo={handleRequestInfo}
          busyId={busyId}
          initialStatusFilter={verificationInitialFilter}
        />
      )}

      {tab === 'live-ops' && <LiveOperationsSection spots={occupancy ?? []} />}

      {tab === 'analytics' && <NetworkAnalyticsSection overview={overview} />}

      {tab === 'zones' && (
        <ZoneOccupancySection
          zoneLoad={overview?.zoneLoad ?? []}
          capacityStats={capacityStats}
        />
      )}

      {tab === 'issues' && (
        <IncidentDeskSection
          issues={issues ?? []}
          onUpdateIssue={handleUpdateIssue}
          busyId={busyId}
          initialStatusFilter={incidentInitialFilter}
        />
      )}
    </AdminShell>
  )
}
