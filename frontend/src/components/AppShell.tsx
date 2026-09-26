import type { ReactNode } from 'react'
import { Bell, CalendarDays, ChevronDown, CircleAlert, House, MessageSquare, ReceiptText, Search, Settings, UserRound } from 'lucide-react'
import type { Screen } from '../App'

const nav: { name: Screen; icon: typeof MessageSquare; count?: string; tag?: string }[] = [
  { name: 'Inbox', icon: MessageSquare, count: '2' }, { name: 'Conflicts', icon: CircleAlert, count: '1' },
  { name: 'Weekly Brief', icon: CalendarDays }, { name: 'Cost', icon: ReceiptText, tag: 'INTERNAL' },
]
export default function AppShell({ active, onNavigate, children }: { active: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  return <div className="min-h-screen bg-base text-ink">
    <aside className="sidebar fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col justify-between border-r border-border bg-white">
      <div>
        <div className="px-5 pt-5 pb-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-accent"><House size={20} /></div><div><div className="font-display text-lg font-semibold leading-tight">Host Copilot</div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted">Prototype</div></div></div><div className="mt-3 inline-block rounded bg-base px-2 py-1 font-mono text-[10px] text-muted">Lodgify Co-Host Core</div></div>
        <button className="mx-4 mt-2 flex w-[calc(100%-2rem)] items-center justify-between rounded-md bg-base p-3 text-left"><span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded bg-border/60"><House size={17}/></span><span><b className="block text-sm">Casa Marbella</b><small className="font-mono text-[10px] text-muted">3 units active</small></span></span><ChevronDown size={16}/></button>
        <nav className="mt-5 space-y-1 px-2">{nav.map(({name, icon: Icon, count, tag}) => <button key={name} onClick={() => onNavigate(name)} className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm transition ${active === name ? 'bg-accent font-semibold text-ink' : 'text-muted hover:bg-base hover:text-ink'}`}><span className="flex items-center gap-3"><Icon size={19}/>{name}</span>{count && <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${name === 'Conflicts' ? 'bg-alert/15 text-alert' : 'bg-border/50'}`}>{count}</span>}{tag && <span className="rounded bg-base px-1.5 py-0.5 font-mono text-[9px]">{tag}</span>}</button>)}</nav>
      </div>
      <div className="m-4 flex items-center justify-between rounded-md bg-base p-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-accent"><UserRound size={17}/></span><span><b className="block text-xs">Elena Vance</b><small className="font-mono text-[9px] text-muted">Superhost · Listing</small></span></div><Settings size={17} className="text-muted"/></div>
    </aside>
    <div className="ml-[240px]"><header className="topbar sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-base/95 px-8 backdrop-blur"><div className="font-mono text-xs text-muted">Casa Marbella <span className="px-1">›</span> <span className="text-ink">Operations</span></div><div className="flex items-center gap-5"><div className="flex h-10 w-[330px] items-center gap-2 rounded bg-white px-3 text-sm text-muted"><Search size={17}/><span>Search messages, guests, reservations...</span></div><div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 font-mono text-[10px] text-muted xl:flex"><span className="h-2 w-2 rounded-full bg-success"/>Synced 2 min ago <span className="text-[9px]">(Airbnb, Vrbo, Booking.com)</span></div><button aria-label="Notifications" className="relative rounded-full p-2 text-muted hover:bg-white"><Bell size={18}/><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-alert"/></button><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-accent"><UserRound size={16}/></span></div></header><main className="mx-auto max-w-[1500px] px-8 py-7">{children}</main></div>
  </div>
}
