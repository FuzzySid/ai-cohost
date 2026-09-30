import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3, MessageSquare, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import type { Screen } from '../App'
import { apiFetch } from '../lib/api'

type OccupancyPoint = { date: string; percent: number }
type Brief = {
  digest_id: string
  period: string
  headline_stat: { label: string; value: string; detail: string; potential_revenue_eur: number; occupancy_percent: number }
  occupancy_trend: OccupancyPoint[]
  flagged_issues: { type: string; title: string; detail: string; channel?: string | null; status?: string | null }[]
  suggested_action: { title: string; priority: string; detail: string; action: string }
}

async function getBrief(): Promise<Brief> {
  const response = await apiFetch('/api/brief/weekly')
  if (!response.ok) throw new Error('Unable to load weekly brief')
  return response.json()
}

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return `${date.toLocaleDateString('en', { weekday: 'short' })} ${date.getDate()}`
}

export default function WeeklyBrief({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({ queryKey: ['weekly-brief'], queryFn: getBrief, retry: false })
  const points = data?.occupancy_trend ?? []
  const chartWidth = 800
  const chartHeight = 110
  const chartPoints = points.map((point, index) => ({
    x: points.length <= 1 ? chartWidth / 2 : 5 + (index / (points.length - 1)) * (chartWidth - 10),
    y: chartHeight - 10 - (Math.max(0, Math.min(100, point.percent)) / 100) * (chartHeight - 20),
  }))
  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')
  const areaPath = chartPoints.length ? `${linePath} L${chartPoints[chartPoints.length - 1].x} ${chartHeight} L${chartPoints[0].x} ${chartHeight} Z` : ''
  const peak = points.length ? Math.max(...points.map((point) => point.percent)) : 0
  const peakIndex = points.findIndex((point) => point.percent === peak)

  return <div className="mx-auto max-w-[1080px]">
    {isPending && <div className="status-card">Loading weekly brief…</div>}
    {isError && <div className="status-card text-alert">{error instanceof Error ? error.message : 'Unable to load weekly brief'}</div>}
    {data && <>
      <div className="mb-5 flex items-center justify-between"><h1 className="font-display text-lg font-semibold">Your week at a glance <span className="ml-2 text-sm font-normal text-muted">{data.period}</span></h1><button onClick={() => refetch()} disabled={isFetching} className="secondary-btn disabled:cursor-wait disabled:opacity-60"><RefreshCw size={15} className={isFetching ? 'animate-spin' : ''}/>{isFetching ? 'Updating…' : 'Refresh brief'}</button></div>
      <section className="overflow-hidden rounded-lg border border-border border-t-[6px] border-t-accent bg-white p-8"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-base text-success">⌂</div><div><h2 className="font-display text-lg font-semibold">Casa Marbella Portfolio</h2><p className="text-sm text-muted">Marbella Old Town, Spain</p></div></div><span className="rounded bg-base px-3 py-1 text-xs text-muted">Local portfolio data</span></div>
        <div className="mt-7 rounded-lg bg-base p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow text-ink">⚡ {data.headline_stat.label}</div><h3 className="mt-2 font-display text-4xl font-semibold">{data.headline_stat.value}</h3><p className="mt-2 text-sm text-muted">{data.headline_stat.detail} Potential revenue: <b className="text-ink">€{data.headline_stat.potential_revenue_eur}</b>.</p></div><div className="text-right"><b className="font-display text-3xl">{data.headline_stat.occupancy_percent}%</b><p className="font-mono text-[10px] text-muted">next 30 days occupancy</p></div></div>
          <div className="mt-6 rounded-lg bg-white p-4"><div className="flex justify-between font-mono text-[10px]"><span>🟡 7-Day Occupancy Trend ({points.length ? `${dateLabel(points[0].date)} – ${dateLabel(points[points.length - 1].date)}` : 'no data'})</span><span>{points.length ? `Peak: ${dateLabel(points[peakIndex].date)} (${peak}%)` : 'No trend data'}</span></div><div className="mt-5 flex h-24 items-end justify-between border-b border-border px-2"><svg className="h-full w-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" aria-label="Seven-day occupancy trend"><path d={areaPath} fill="currentColor" className="text-accent" opacity=".25"/><path d={linePath} fill="none" stroke="currentColor" className="text-ink" strokeWidth="3"/>{chartPoints[peakIndex] && <circle cx={chartPoints[peakIndex].x} cy={chartPoints[peakIndex].y} r="7" fill="currentColor" className="text-accent" stroke="currentColor" strokeWidth="3"/>}</svg></div><div className="mt-2 flex justify-between font-mono text-[9px] text-muted">{points.map((point) => <span key={point.date} className="text-center">{dateLabel(point.date)} ({point.percent}%)</span>)}</div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{[['NEXT 30-DAY OCCUPANCY', `${data.headline_stat.occupancy_percent}%`, 'Across the active portfolio'], ['PROJECTED GAP REVENUE', `€${data.headline_stat.potential_revenue_eur}`, 'At the current average nightly rate'], ['FLAGGED FOR REVIEW', String(data.flagged_issues.length), 'Open operational issues']].map((item) => <div className="rounded bg-white p-4" key={item[0]}><div className="eyebrow">{item[0]}</div><b className="mt-1 block font-display text-xl">{item[1]}</b><span className="text-xs text-muted">{item[2]}</span></div>)}</div>
        </div>
        <div className="mt-8"><div className="mb-3 flex justify-between text-xs font-semibold text-muted"><span>Items to review ({data.flagged_issues.length})</span><span>Based on current portfolio data</span></div><div className="space-y-1">{data.flagged_issues.map((issue, index) => <div className="flex items-center gap-4 rounded bg-base p-4" key={`${issue.type}-${issue.title}`}><span className={`rounded-lg p-2 ${issue.type === 'conflict' ? 'bg-alert/10 text-alert' : issue.type === 'review_risk' ? 'bg-warn/10 text-warn' : index === 0 ? 'bg-accent' : 'bg-border/60'}`}>{issue.type === 'conflict' ? <ShieldCheck size={18}/> : issue.type === 'review_risk' ? <Clock3 size={18}/> : <MessageSquare size={18}/>}</span><div className="flex-1"><div className="flex items-center gap-2 text-sm font-semibold">{issue.title}{(issue.channel || issue.status) && <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs text-success">{issue.channel ?? issue.status}</span>}</div><p className="mt-1 text-sm text-muted">{issue.detail}</p></div>{issue.type !== 'review_risk' && <button onClick={() => onNavigate(issue.type === 'conflict' ? 'Conflicts' : 'Inbox')} className="whitespace-nowrap text-sm font-semibold">{issue.type === 'conflict' ? 'View conflict' : 'Open inbox'} <ArrowRight size={14} className="inline"/></button>}</div>)}</div></div>
        <div className="mt-7 rounded-lg bg-border/30 p-6"><div className="flex items-center justify-between"><h3 className="font-display font-semibold"><Sparkles size={18} className="mr-2 inline text-warn"/>Suggested next step: {data.suggested_action.title}</h3><span className="rounded bg-accent px-2 py-1 text-xs">{data.suggested_action.priority} priority</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{data.suggested_action.detail}</p></div>
        <footer className="mt-8 flex justify-between font-mono text-[10px] text-muted"><span><ShieldCheck size={13} className="mr-1 inline"/>Prepared by Host Copilot for Elena Vance</span><span>Weekly portfolio brief</span></footer>
      </section><div className="flex justify-end px-2 py-4 text-xs text-muted"><span>Brief ID: #{data.digest_id}</span></div>
    </>}
  </div>
}
