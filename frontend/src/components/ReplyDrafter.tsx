import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Check, Languages, Search, ShieldAlert, Sparkles } from 'lucide-react'

type Status = 'needs_action' | 'unanswered' | 'unread' | 'resolved' | 'sent' | string
type ThreadSummary = {
  thread_id: string
  guest: string
  listing_id: string
  listing_name: string
  unit: string
  channel: string
  last_message: string
  language: string
  updated_at: string
  status: Status
}
type ThreadMessage = { sender: 'guest' | 'host' | string; language: string; text: string; ts: string }
type ThreadDetail = Omit<ThreadSummary, 'last_message' | 'updated_at'> & { messages: ThreadMessage[] }
type Draft = { draft_reply: string | null; detected_language: string; confidence: 'high' | 'medium' | 'needs_human' | string; reason_if_needs_human: string | null }
type InboxFilter = 'all' | 'needs_action' | 'unread'

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? 'The request could not be completed')
  }
  return response.json() as Promise<T>
}
async function fetchThreads(): Promise<ThreadSummary[]> {
  return readJson<ThreadSummary[]>(await fetch('/api/replies/threads'))
}
async function fetchThread(threadId: string): Promise<ThreadDetail> {
  return readJson<ThreadDetail>(await fetch(`/api/replies/threads/${encodeURIComponent(threadId)}`))
}
async function fetchDraft(threadId: string): Promise<Draft> {
  return readJson<Draft>(await fetch('/api/replies/draft', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ thread_id: threadId }),
  }))
}
async function sendReply(input: { thread_id: string; message: string }): Promise<{ thread_id: string; status: string }> {
  return readJson(await fetch('/api/replies/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }))
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0] ?? '').join('').toUpperCase()
}
function formatTime(value: string) {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function statusLabel(status: Status) {
  if (status === 'sent') return '✓ Saved locally'
  if (status === 'resolved') return '✓ Resolved'
  if (status === 'needs_action' || status === 'unanswered') return 'Host Attention Needed'
  if (status === 'unread') return 'Unread'
  return status.split('_').join(' ')
}

export default function ReplyDrafter() {
  const queryClient = useQueryClient()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState<InboxFilter>('all')
  const [search, setSearch] = useState('')

  const threadsQuery = useQuery({ queryKey: ['reply-threads'], queryFn: fetchThreads })
  const threads = threadsQuery.data ?? []
  useEffect(() => {
    if (activeThreadId === null && threads.length > 0) setActiveThreadId(threads[0].thread_id)
  }, [activeThreadId, threads])
  useEffect(() => setReply(''), [activeThreadId])

  const activeSummary = threads.find(thread => thread.thread_id === activeThreadId)
  const threadQuery = useQuery({
    queryKey: ['reply-thread', activeThreadId],
    queryFn: () => fetchThread(activeThreadId!),
    enabled: Boolean(activeThreadId),
  })
  const activeThread = threadQuery.data
  const draftQuery = useQuery({
    queryKey: ['reply-draft', activeThreadId],
    queryFn: () => fetchDraft(activeThreadId!),
    enabled: Boolean(activeThreadId && activeSummary?.status !== 'sent'),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (draftQuery.data?.draft_reply) setReply(draftQuery.data.draft_reply)
  }, [draftQuery.data, activeThreadId])

  const sendMutation = useMutation({
    mutationFn: sendReply,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reply-threads'] }),
        queryClient.invalidateQueries({ queryKey: ['reply-thread', activeThreadId] }),
      ])
    },
  })

  const visibleThreads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return threads.filter(thread => {
      const matchesFilter = filter === 'all'
        || (filter === 'needs_action' && ['needs_action', 'unanswered'].includes(thread.status))
        || (filter === 'unread' && thread.status === 'unread')
      const matchesSearch = !query || `${thread.guest} ${thread.listing_name} ${thread.unit} ${thread.last_message}`.toLocaleLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [filter, search, threads])
  const needsActionCount = threads.filter(thread => ['needs_action', 'unanswered'].includes(thread.status)).length
  const unreadCount = threads.filter(thread => thread.status === 'unread').length
  const needsHuman = draftQuery.data?.confidence === 'needs_human'
  const draftCanBeEdited = draftQuery.data?.confidence === 'high' || draftQuery.data?.confidence === 'medium'
  const sent = activeSummary?.status === 'sent'

  return <div className="inbox-layout grid h-[calc(100vh-7.5rem)] min-h-0 grid-cols-[minmax(300px,390px)_1fr] gap-4">
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-white">
      <div className="shrink-0 p-5 pb-3">
        <h1 className="font-display text-2xl font-semibold">Unified Inbox</h1>
        <p className="mt-1 text-sm text-muted">Guest conversations and reply drafts</p>
        <label className="mt-5 flex items-center gap-2 rounded bg-base px-3 py-3 text-sm text-muted"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Filter messages, guests, units..."/></label>
        <div className="mt-3 flex gap-1.5 font-mono text-[10px]">
          <button onClick={() => setFilter('all')} className={`rounded-full px-3 py-1 ${filter === 'all' ? 'bg-ink text-white' : 'bg-base'}`}>All ({threads.length})</button>
          <button onClick={() => setFilter('needs_action')} className={`rounded-full px-3 py-1 ${filter === 'needs_action' ? 'bg-ink text-white' : 'bg-base'}`}>Needs Action <b className="text-alert">{needsActionCount}</b></button>
          <button onClick={() => setFilter('unread')} className={`rounded-full px-3 py-1 ${filter === 'unread' ? 'bg-ink text-white' : 'bg-base'}`}>Unread {unreadCount}</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
      {threadsQuery.isPending && <div className="space-y-3 p-5" aria-label="Loading messages">{[0, 1, 2, 3].map(item => <div key={item} className="h-[88px] animate-pulse rounded bg-base"/>)}</div>}
      {threadsQuery.isError && <p className="p-5 text-sm text-alert">{threadsQuery.error.message}</p>}
      {!threadsQuery.isPending && !threadsQuery.isError && threads.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted">No new messages right now.</div>}
      {!threadsQuery.isPending && !threadsQuery.isError && threads.length > 0 && visibleThreads.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted">No messages match this filter.</div>}
      <div>{visibleThreads.map(thread => {
        const active = thread.thread_id === activeThreadId
        return <button key={thread.thread_id} onClick={() => setActiveThreadId(thread.thread_id)} className={`w-full border-t border-border/50 px-5 py-4 text-left hover:bg-base ${active ? 'border-l-4 border-l-ink bg-base' : ''}`}>
          <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-border/60 font-mono text-xs">{initials(thread.guest)}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="truncate text-sm">{thread.guest}{active && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-ink"/>}</b><span className="shrink-0 font-mono text-[10px]">{formatTime(thread.updated_at)}</span></div><div className="flex justify-between gap-2 font-mono text-[10px] text-muted"><span className="truncate">{thread.listing_name} · {thread.unit}</span><span className="shrink-0 rounded bg-base px-1">{thread.channel.toUpperCase()}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted">{thread.last_message}</p>{thread.status !== 'resolved' && <span className={`mt-1 inline-block rounded px-1.5 py-1 font-mono text-[10px] ${thread.status === 'sent' ? 'bg-success/10 text-success' : thread.status === 'needs_action' || thread.status === 'unanswered' ? 'bg-alert/10 text-alert' : thread.status === 'unread' ? 'bg-accent' : 'bg-base'}`}>{statusLabel(thread.status)}</span>}</div></div>
        </button>
      })}</div>
      </div>
    </section>

    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-white">
      {!activeThreadId && !threadsQuery.isPending && <div className="flex flex-1 items-center justify-center p-8 text-muted">No new messages right now.</div>}
      {activeThreadId && <>
        <div className="grid grid-cols-[auto_1fr] items-center gap-4 border-b border-border p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-border/60 font-mono text-sm">{initials(activeThread?.guest ?? activeSummary?.guest ?? 'GC')}</span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{activeThread?.guest ?? activeSummary?.guest ?? 'Loading thread…'}</b>{activeSummary && <span className="text-sm text-muted">{activeSummary.language.toUpperCase()}</span>}</div><div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted"><span>{activeThread?.channel ?? activeSummary?.channel} · {activeThread?.unit ?? activeSummary?.unit}</span><span>{activeThread?.listing_name ?? activeSummary?.listing_name}</span></div></div>
        </div>

        <div className="conversation min-h-0 flex-1 space-y-5 overflow-auto bg-base/60 px-7 py-6">
          {threadQuery.isPending && <div className="space-y-4"><div className="ml-auto h-24 w-3/4 animate-pulse rounded-lg bg-white"/><div className="h-28 w-4/5 animate-pulse rounded-lg bg-white"/></div>}
          {threadQuery.isError && <p className="rounded bg-white p-4 text-sm text-alert">{threadQuery.error.message}</p>}
          {activeThread?.messages.map((message, index) => <article key={`${message.ts}-${index}`} className={`max-w-[88%] rounded-lg border border-border/60 bg-white p-5 ${message.sender === 'host' ? 'ml-auto' : 'mr-auto'}`}>
            <div className="flex justify-between gap-4 font-mono text-xs"><b>{message.sender === 'host' ? 'Elena Vance' : activeThread.guest}</b><span className="shrink-0 text-muted">{formatTime(message.ts)}</span></div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
            {message.sender === 'guest' && message.language && <div className="mt-3 rounded bg-base p-3 font-mono text-xs text-muted"><Languages size={14} className="mr-2 inline"/>Guest message · {message.language.toUpperCase()}</div>}
          </article>)}
          {activeThread?.messages.length === 0 && <p className="text-center text-sm text-muted">This conversation has no messages yet.</p>}
        </div>

        <div className="shrink-0 border-t border-border bg-white p-5">
          {sent && <div className="mb-3 rounded bg-success/10 p-3 text-sm text-success"><Check size={16} className="mr-2 inline"/>Reply saved to the local inbox. No channel delivery was performed.</div>}
          {!sent && draftQuery.isPending && <div className="animate-pulse rounded border border-border border-l-[3px] border-l-accent p-4" aria-label="Loading reply draft"><div className="h-4 w-1/3 rounded bg-base"/><div className="mt-4 h-20 rounded bg-base"/><div className="mt-4 h-9 w-36 rounded bg-base"/></div>}
          {!sent && draftQuery.isError && <div className="rounded border border-alert/30 bg-alert/5 p-4 text-sm text-alert">{draftQuery.error.message}<button onClick={() => void draftQuery.refetch()} className="ml-3 underline">Try again</button></div>}
          {!sent && needsHuman && <div className="rounded border border-warn/30 bg-warn/15 p-5 text-ink"><div className="flex items-start gap-3"><ShieldAlert size={20} className="mt-0.5 shrink-0 text-warn"/><div><div className="font-semibold">Host reply required</div><p className="mt-1 text-sm leading-5 text-muted">{draftQuery.data?.reason_if_needs_human}</p></div><span className="ml-auto rounded bg-warn/20 px-2 py-1 font-mono text-[9px] uppercase">Needs human</span></div></div>}
          {!sent && draftCanBeEdited && <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]"><span className="rounded bg-accent px-3 py-2 font-semibold"><Sparkles size={14} className="mr-1 inline"/>AI DRAFT · {draftQuery.data?.confidence.toUpperCase()} CONFIDENCE</span><span className="text-muted">Grounded in listing details</span><span className="text-muted">Tone: Warm &amp; Hospitality</span><span>Language: {draftQuery.data?.detected_language.toUpperCase()}</span></div>
            <div className="rounded border border-border border-l-[3px] border-l-accent p-4"><div className="text-sm text-muted">Suggested response · review and edit before saving to this demo inbox</div><textarea value={reply} onChange={event => setReply(event.target.value)} className="mt-2 min-h-24 w-full resize-y text-sm leading-6 outline-none" aria-label="Editable reply draft"/><div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={() => sendMutation.mutate({ thread_id: activeThreadId, message: reply })} disabled={sendMutation.isPending || !reply.trim()} className="primary-btn"><Check size={15}/>{sendMutation.isPending ? 'Saving…' : 'Save Reply'}</button><button onClick={() => void draftQuery.refetch()} disabled={draftQuery.isFetching} className="secondary-btn">{draftQuery.isFetching ? 'Regenerating…' : 'Regenerate'}</button><button onClick={() => setReply('')} className="ghost-btn">Discard Draft</button></div>{sendMutation.isError && <p className="mt-2 text-xs text-alert">{sendMutation.error.message}</p>}</div>
          </>}
          {!sent && !draftQuery.isPending && !draftQuery.isError && !needsHuman && !draftCanBeEdited && <div className="rounded bg-base p-4 text-sm text-muted">No reply draft is available for this thread.</div>}
        </div>
      </>}
    </section>
  </div>
}
