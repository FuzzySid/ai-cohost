import type { ReactNode } from 'react'
import { CalendarDays, CircleAlert, House, MessageSquare, ReceiptText, UserRound } from 'lucide-react'
import type { Screen } from '../App'

const nav: { name: Screen; icon: typeof MessageSquare }[] = [
  { name: 'Inbox', icon: MessageSquare }, { name: 'Conflicts', icon: CircleAlert },
  { name: 'Weekly Brief', icon: CalendarDays }, { name: 'Cost', icon: ReceiptText },
]
export default function AppShell({ active, onNavigate, children }: { active: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  return <div className="min-h-screen bg-base text-ink">
    <aside className="sidebar fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col justify-between border-r border-border bg-white">
      <div>
        <div className="px-5 pb-3 pt-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-accent"><House size={20} /></div><div><div className="font-display text-lg font-semibold leading-tight">Host Copilot</div><div className="text-xs text-muted">Property operations</div></div></div></div>
        <div className="mx-4 mt-2 flex items-center gap-3 rounded-lg bg-base p-3"><span className="flex h-8 w-8 items-center justify-center rounded bg-border/60"><House size={17}/></span><span><b className="block text-sm">Casa Marbella</b><small className="text-xs text-muted">Marbella, Spain</small></span></div>
        <nav className="mt-5 space-y-1 px-2">{nav.map(({name, icon: Icon}) => <button key={name} onClick={() => onNavigate(name)} className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition ${active === name ? 'bg-accent font-semibold text-ink' : 'text-muted hover:bg-base hover:text-ink'}`}><Icon size={19}/>{name}</button>)}</nav>
      </div>
      <div className="m-4 flex items-center gap-2 rounded-md bg-base p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-accent"><UserRound size={17}/></span><span><b className="block text-sm">Elena Vance</b><small className="text-xs text-muted">Host</small></span></div>
    </aside>
    <div className="ml-[240px]"><header className="topbar sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-base/95 px-8 backdrop-blur"><div className="text-sm text-muted">Casa Marbella <span className="px-1">›</span> <span className="text-ink">{active}</span></div></header><main className="mx-auto max-w-[1500px] px-8 py-7">{children}</main></div>
  </div>
}
