import { useState } from 'react'
import AppShell from './components/AppShell'
import ReplyDrafter from './components/ReplyDrafter'
import ConflictBanner from './components/ConflictBanner'
import WeeklyBrief from './components/WeeklyBrief'
import CostDashboard from './components/CostDashboard'

export type Screen = 'Inbox' | 'Conflicts' | 'Weekly Brief' | 'Cost'
export default function App() {
  const [screen, setScreen] = useState<Screen>('Inbox')
  return <AppShell active={screen} onNavigate={setScreen}>
    {screen === 'Inbox' && <ReplyDrafter />}
    {screen === 'Conflicts' && <ConflictBanner />}
    {screen === 'Weekly Brief' && <WeeklyBrief onNavigate={setScreen} />}
    {screen === 'Cost' && <CostDashboard />}
  </AppShell>
}
