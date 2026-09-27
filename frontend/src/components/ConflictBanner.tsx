import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, CalendarDays, Check, CircleCheck, CircleDollarSign, Clock3, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react'

type ConflictKind = 'double_booking' | 'rate_disparity' | 'calendar_sync_delay'
type Booking = {
  id: string
  channel: string
  guest: string
  reservation_ref: string
  check_in: string
  check_out: string
  guests: number
  status: string
  last_synced_at: string
}
type Conflict = {
  id: string
  listing_id: string
  listing: { name: string; unit: string }
  type: ConflictKind
  channels: string[]
  dates: string[]
  severity: string
  reviewed?: boolean
  bookings?: Booking[]
  nightly_rate_difference_eur?: number
  nightly_rates?: { channel: string; nightly_rate_eur: number }[]
  last_synced_at?: string
  hours_stale?: number
}
type ListingCount = { count: number }

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  return response.json() as Promise<T>
}
async function getConflicts(includeReviewed = false): Promise<Conflict[]> {
  const query = includeReviewed ? '?include_reviewed=true' : ''
  return readResponse<Conflict[]>(await fetch(`/api/conflicts${query}`))
}
async function getListingCount(): Promise<ListingCount> {
  return readResponse<ListingCount>(await fetch('/api/listings/count'))
}
async function markReviewed(id: string): Promise<{ id: string; reviewed: boolean }> {
  return readResponse(await fetch(`/api/conflicts/${encodeURIComponent(id)}/review`, { method: 'POST' }))
}

function formatDate(date: string, includeYear = false) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    month: 'short', day: '2-digit', ...(includeYear ? { year: 'numeric' as const } : {}),
  })
}
function typeLabel(type: ConflictKind) {
  if (type === 'double_booking') return 'Double-booking risk'
  if (type === 'rate_disparity') return 'Rate disparity'
  return 'Feed lagging'
}
function channelStatus(status: string) {
  return status.split('_').join(' ')
}

export default function ConflictBanner() {
  const queryClient = useQueryClient()
  const activeQuery = useQuery({ queryKey: ['conflicts'], queryFn: () => getConflicts() })
  const allQuery = useQuery({ queryKey: ['conflicts-all'], queryFn: () => getConflicts(true) })
  const listingsQuery = useQuery({ queryKey: ['listing-count'], queryFn: getListingCount })
  const reviewMutation = useMutation({
    mutationFn: markReviewed,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conflicts'] }),
        queryClient.invalidateQueries({ queryKey: ['conflicts-all'] }),
      ])
    },
  })

  const conflicts = activeQuery.data ?? []
  const reviewedCount = (allQuery.data ?? []).filter(conflict => conflict.reviewed).length
  const totalListings = listingsQuery.data?.count ?? 0
  const conflictedListingCount = new Set(conflicts.map(conflict => conflict.listing_id)).size
  const cleanListingCount = Math.max(0, totalListings - conflictedListingCount)
  const doubleBookingCount = conflicts.filter(conflict => conflict.type === 'double_booking').length
  const rateDisparityCount = conflicts.filter(conflict => conflict.type === 'rate_disparity').length
  const syncDelayCount = conflicts.filter(conflict => conflict.type === 'calendar_sync_delay').length

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow"><span className="h-2 w-2 rounded-full bg-alert"/> Channel Synchronization Engine / Lodgify Co-Host Core</div><h1 className="page-title">Channel Conflicts &amp; Parity</h1><p className="mt-2 max-w-2xl text-sm text-muted">Automated reconciliation across your connected channels. Review each item before making changes in your channel manager.</p></div><div className="flex items-center gap-4 rounded-lg border border-border bg-white p-3"><span className="font-mono text-[10px] text-muted">Last Audit<br/><b className="text-ink">Live on request</b></span><button onClick={() => void Promise.all([activeQuery.refetch(), allQuery.refetch(), listingsQuery.refetch()])} className="secondary-btn"><RefreshCw size={14}/>Force Reconciliation</button></div></div>

    <div className="grid gap-4 md:grid-cols-3">{[
      { title: 'Critical Priority', count: doubleBookingCount, caption: 'Double-booking risk', foot: 'IMMEDIATE ACTION', line: 'border-l-alert', text: 'text-alert' },
      { title: 'Yield & Parity Drift', count: rateDisparityCount, caption: 'Rate drift > 15%', foot: 'Review advised', line: 'border-l-warn', text: 'text-warn' },
      { title: 'Feed Reliability', count: syncDelayCount, caption: 'Stale calendar feeds', foot: syncDelayCount ? 'Sync attention' : 'Feeds current', line: 'border-l-success', text: 'text-success' },
    ].map(metric => <div className={`metric-card border-l-4 ${metric.line}`} key={metric.title}><span className="eyebrow">{metric.title}</span><div className="font-display text-4xl font-semibold">{activeQuery.isPending ? '—' : metric.count}</div><div className="mt-4 flex justify-between border-t border-border pt-3 text-xs"><span>{metric.caption}</span><b className={`${metric.text} font-mono text-[10px]`}>{metric.foot}</b></div></div>)}</div>

    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Active Inconsistencies <span className="ml-2 rounded bg-border/50 px-2 py-1 font-mono text-[10px] font-normal">{activeQuery.isPending ? '…' : conflicts.length} items requiring review · {allQuery.isPending ? '…' : reviewedCount} reviewed</span></h2><span className="font-mono text-[10px] text-muted">Grouped by Property Priority</span></div>
    {activeQuery.isPending && <div className="status-card">Loading channel reconciliation…</div>}
    {activeQuery.isError && <div className="status-card text-alert">{activeQuery.error.message}</div>}
    {allQuery.isError && <div className="status-card text-alert">Could not load reviewed conflict count: {allQuery.error.message}</div>}
    {!activeQuery.isPending && !activeQuery.isError && conflicts.length === 0 && <div className="status-card flex items-center gap-3"><CircleCheck size={20} className="text-success"/>No active channel conflicts found.</div>}

    {conflicts.map(conflict => {
      const isDoubleBooking = conflict.type === 'double_booking'
      const isRateDisparity = conflict.type === 'rate_disparity'
      const kindIcon = isDoubleBooking ? CalendarDays : isRateDisparity ? CircleDollarSign : Clock3
      const Icon = kindIcon
      const isThisReviewPending = reviewMutation.isPending && reviewMutation.variables === conflict.id
      return <article className={`overflow-hidden rounded-lg border border-border border-l-4 bg-white ${conflict.severity === 'high' ? 'border-l-alert' : 'border-l-warn'}`} key={conflict.id}>
        <header className="flex flex-wrap items-center justify-between gap-3 bg-base/70 px-6 py-5"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-lg bg-border/50"><Icon size={24}/></div><div><b>{conflict.listing.name} <span className="font-normal text-muted">· {conflict.listing.unit}</span></b><div className="mt-1 font-mono text-[10px] text-muted">▦ {formatDate(conflict.dates[0])} – {formatDate(conflict.dates[1], true)}</div></div></div><div className="flex gap-2"><span className={`rounded px-2 py-1 font-mono text-[10px] uppercase ${conflict.severity === 'high' ? 'bg-alert/15 text-alert' : 'bg-warn/15 text-warn'}`}>● {typeLabel(conflict.type)}</span><span className="rounded bg-base px-2 py-1 font-mono text-[10px]">ID: {conflict.id}</span></div></header>
        <div className="space-y-4 p-6"><div className="eyebrow">{isDoubleBooking ? 'Conflicting' : isRateDisparity ? 'Analyzed' : 'Delayed'} channels: <span className="normal-case text-ink">{conflict.channels.join(' × ')}</span></div>

          {isDoubleBooking && <div className="grid gap-3 md:grid-cols-2">{(conflict.bookings ?? []).map(booking => <div className="rounded bg-base p-4" key={booking.id}><div className="flex justify-between gap-3 font-semibold">{booking.channel}<span className="font-mono text-[10px] text-muted">{booking.reservation_ref}</span></div><div className="mt-3 space-y-2 text-xs text-muted"><div className="flex justify-between"><span>Lead guest</span><span className="font-medium text-ink">{booking.guest} · {booking.guests} guests</span></div><div className="flex justify-between"><span>Booking state</span><b className="text-success">{channelStatus(booking.status)}</b></div><div className="flex justify-between"><span>Stay dates</span><span className="font-mono text-ink">{booking.check_in} – {booking.check_out}</span></div><div className="flex justify-between"><span>Last synced</span><span className="font-mono text-ink">{new Date(booking.last_synced_at).toLocaleString()}</span></div></div></div>)}</div>}

          {isRateDisparity && <div className="grid gap-3 md:grid-cols-2">{(conflict.nightly_rates ?? []).map(rate => <div className="rounded bg-base p-4" key={rate.channel}><div className="flex justify-between font-semibold">{rate.channel}<span className="font-mono text-[10px] text-muted">{formatDate(conflict.dates[0])}</span></div><div className="mt-3 flex justify-between text-xs text-muted"><span>Nightly base rate</span><b className="font-mono text-ink">€{rate.nightly_rate_eur.toFixed(2)} / night</b></div></div>)}</div>}

          {conflict.type === 'calendar_sync_delay' && <div className="flex flex-wrap items-center justify-between gap-4 rounded bg-base p-4"><div className="flex gap-3"><Clock3 size={18} className="text-warn"/><div><b className="text-sm">Calendar feed is stale</b><p className="mt-1 max-w-3xl text-xs leading-5 text-muted">The {conflict.channels[0]} calendar was last synced {conflict.hours_stale} hours ago. Check the channel connection and confirm recent reservations are reflected.</p></div></div><div className="rounded bg-white px-3 py-2 font-mono text-[10px]">Last sync: {conflict.last_synced_at ? new Date(conflict.last_synced_at).toLocaleString() : 'Unknown'}</div></div>}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded bg-base p-4"><div className="flex gap-3"><AlertTriangle size={18} className={conflict.severity === 'high' ? 'text-alert' : 'text-warn'}/><div><b className="text-sm">{isDoubleBooking ? 'Collision Diagnostic' : isRateDisparity ? 'Rate Disparity' : 'Sync Delay'}</b><p className="mt-1 max-w-3xl text-xs leading-5 text-muted">{isDoubleBooking ? 'These reservations overlap. Review the conflicting dates and resolve inventory directly in your channel manager.' : isRateDisparity ? `Rates differ by €${conflict.nightly_rate_difference_eur?.toFixed(2) ?? '—'} per night across the same listing and date.` : `This feed has exceeded the sync warning threshold. Severity: ${conflict.severity}.`}</p></div></div><div className="rounded bg-white px-3 py-2 font-mono text-[10px]">{conflict.dates[0]} → {conflict.dates[1]}</div></div>

          <div className="flex flex-wrap items-center gap-2"><button onClick={() => reviewMutation.mutate(conflict.id)} disabled={reviewMutation.isPending} className="primary-btn"><Check size={14}/>{isThisReviewPending ? 'Marking reviewed…' : 'Got it (Mark Reviewed)'}</button>{conflict.channels.map(channel => <button key={channel} className="secondary-btn">Open in {channel}<ExternalLink size={13}/></button>)}<span className="ml-auto font-mono text-[9px] text-muted">Host Copilot never changes reservations automatically.</span></div>
          {reviewMutation.isError && reviewMutation.variables === conflict.id && <p className="text-xs text-alert">{reviewMutation.error.message}</p>}
        </div>
      </article>
    })}

    {listingsQuery.isError && <div className="status-card text-alert">Could not load listing count: {listingsQuery.error.message}</div>}
    {cleanListingCount > 0 && <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-5"><span className="rounded bg-success/15 p-3 text-success"><ShieldCheck size={22}/></span><div className="flex-1"><b className="text-sm">Clean Alignment Across Sister Portfolio</b><p className="mt-1 text-xs text-muted">No conflicts across {cleanListingCount} of {totalListings} listings right now. Calendar feeds are synchronizing every 90 seconds.</p></div><span className="font-mono text-[10px] text-success"><CircleCheck size={13} className="mr-1 inline"/>Feeds checked live</span><button className="secondary-btn">Audit Log <ArrowRight size={13}/></button></div>}
  </div>
}
