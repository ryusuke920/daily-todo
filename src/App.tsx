import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { DayView } from './components/DayView'
import { Login } from './components/Login'
import { localStore } from './store/local'
import { createSupabaseStore, supabase } from './store/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const store = useMemo(() => (supabase && session ? createSupabaseStore(supabase) : localStore), [session])

  if (!supabase) return <DayView store={localStore} />
  if (session === undefined) return <div className="loading">読み込み中…</div>
  if (!session) return <Login sb={supabase} />
  return <DayView key={session.user.id} store={store} onSignOut={() => supabase!.auth.signOut()} />
}
