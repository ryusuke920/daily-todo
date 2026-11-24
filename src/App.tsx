import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { DayView } from './components/DayView'
import { Login } from './components/Login'
import { NewPassword } from './components/NewPassword'
import { localStore } from './store/local'
import { authLinkError, createSupabaseStore, openedFromRecovery, supabase } from './store/supabase'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [recovering, setRecovering] = useState(openedFromRecovery)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const store = useMemo(() => (supabase && session ? createSupabaseStore(supabase) : localStore), [session])

  if (!supabase) return <DayView store={localStore} />
  if (session === undefined) return <div className="loading">読み込み中…</div>
  if (!session) return <Login sb={supabase} initialMessage={authLinkError ? `リンクが無効です: ${authLinkError}` : null} />
  if (recovering) return <NewPassword sb={supabase} email={session.user.email} onDone={() => setRecovering(false)} />
  return <DayView key={session.user.id} store={store} onSignOut={() => supabase!.auth.signOut()} />
}
