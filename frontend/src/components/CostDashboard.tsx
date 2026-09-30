import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Activity } from 'lucide-react'
import { apiFetch } from '../lib/api'

type Tier = 'cheap' | 'mid' | 'premium'
type RecentCall = { timestamp: string; tier: string; tokens_in: number; tokens_out: number; cost_eur: number }
type Summary = {
  tier: Tier
  cost_per_host_month_eur: number
  all_tiers: Record<Tier, number>
  recent_calls: RecentCall[]
}

const TIERS: Tier[] = ['cheap', 'mid', 'premium']
const TIER_LABELS: Record<Tier, string> = { cheap: 'Cheap', mid: 'Mid', premium: 'Premium' }

async function getCost(tier: Tier): Promise<Summary> {
  const response = await apiFetch(`/api/cost/summary?tier=${tier}`)
  if (!response.ok) throw new Error('Unable to load cost summary')
  return response.json()
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function CostDashboard() {
  const [tier, setTier] = useState<Tier>('mid')
  const { data, isPending, isError, error } = useQuery({ queryKey: ['cost', tier], queryFn: () => getCost(tier) })
  const maxCost = data ? Math.max(...Object.values(data.all_tiers), 0.01) : 1

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="eyebrow"><span className="h-2 w-2 rounded-full bg-accent"/> Usage-based cost projection</div>
        <h1 className="page-title">Host Copilot Costs</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">Monthly cost estimates use token averages from logged calls and the assumed monthly usage profile.</p>
      </div>
    </div>

    {isPending && <div className="status-card">Loading cost summary…</div>}
    {isError && <div className="status-card text-alert">{error instanceof Error ? error.message : 'Unable to load cost summary'}</div>}

    {data && <>
      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-lg border border-border bg-white p-7">
          <div className="eyebrow">Monthly cost tier</div>
          <div className="mt-2 grid grid-cols-3 rounded bg-base p-1">
            {TIERS.map((option) => <button key={option} onClick={() => setTier(option)} className={`rounded py-2 text-xs ${tier === option ? 'bg-white shadow-card' : ''}`}>{TIER_LABELS[option]}</button>)}
          </div>
          <div className="mt-6">
            <b className="font-display text-4xl">€{data.cost_per_host_month_eur.toFixed(2)}</b>
            <span className="ml-2 font-mono text-xs">/ host / mo</span>
            <p className="mt-1 text-sm">Estimated on the {TIER_LABELS[tier]} tier</p>
            <p className="mt-1 text-xs leading-5 text-muted">Logged calls provide average token usage; assumed monthly volumes are applied to each call type.</p>
          </div>
          <div className="mt-8 rounded bg-base p-4 text-xs leading-5 text-muted">Projection applies the assumed monthly call volume for reply drafts and weekly briefs to the average tokens recorded for each type.</div>
        </section>

        <section className="rounded-lg border border-border bg-white p-7">
          <div className="flex justify-between">
            <div><h2 className="font-display text-lg font-semibold">Cost by tier</h2><p className="mt-1 text-xs text-muted">Same usage averages, priced at each tier</p></div>
            <span className="h-fit rounded bg-base px-2 py-1 font-mono text-[10px]">Monthly / Host</span>
          </div>
          <div className="mt-6 space-y-5">{TIERS.map((option) => {
            const value = data.all_tiers[option]
            const width = Math.max((value / maxCost) * 100, value > 0 ? 2 : 0)
            return <div key={option}>
              <div className="flex justify-between text-xs"><span>{TIER_LABELS[option]} {option === tier && <b className="rounded bg-accent px-1 font-mono text-[9px]">ACTIVE</b>}</span><span className="font-mono">€{value.toFixed(2)} / host / mo</span></div>
              <div className="mt-1 h-8 overflow-hidden rounded bg-base"><div style={{ width: `${width}%` }} className={`flex h-full items-center px-3 font-mono text-[10px] ${option === tier ? 'bg-accent text-ink' : 'bg-border text-ink'}`}>{TIER_LABELS[option]}</div></div>
            </div>
          })}</div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-white">
        <header className="flex items-center p-5">
          <div className="flex items-center gap-3"><Activity size={20}/><div><h2 className="font-display font-semibold">Recent usage log</h2><p className="text-xs text-muted">Most recent calls recorded by Host Copilot</p></div></div>
        </header>
        {data.recent_calls.length === 0 ? <p className="px-5 pb-5 text-xs text-muted">No calls logged yet, showing projected cost from assumed usage.</p> : <>
          <div className="overflow-auto"><table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-base font-display text-[10px] uppercase text-muted"><tr>{['Timestamp', 'Tier', 'Tokens in', 'Tokens out', 'Estimated cost'].map((heading) => <th className="px-4 py-3 font-medium" key={heading}>{heading}</th>)}</tr></thead>
            <tbody>{data.recent_calls.map((call, index) => <tr className="border-t border-border/70 text-xs" key={`${call.timestamp}-${index}`}>
              <td className="px-4 py-4 font-mono text-[10px]">{formatTimestamp(call.timestamp)}</td>
              <td className="px-4 py-4 font-mono text-[10px]">{TIER_LABELS[call.tier as Tier] ?? 'Mid'}</td>
              <td className="px-4 py-4 font-mono text-[10px]">{call.tokens_in.toLocaleString()}</td>
              <td className="px-4 py-4 font-mono text-[10px]">{call.tokens_out.toLocaleString()}</td>
              <td className="px-4 py-4 font-mono text-[10px]">€{call.cost_eur.toFixed(4)}</td>
            </tr>)}</tbody>
          </table></div>
          <footer className="bg-base px-5 py-3 font-mono text-[9px] text-muted">Showing {data.recent_calls.length} most recent logged calls</footer>
        </>}
      </section>
    </>}
  </div>
}
