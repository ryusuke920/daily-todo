import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export function Login({ sb }: { sb: SupabaseClient }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const { data, error } =
      mode === 'in'
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + import.meta.env.BASE_URL } })
    setBusy(false)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('確認メールを送りました。メールのリンクを開いてからログインしてください。')
  }

  return (
    <main className="login">
      <h1>Daily ToDo</h1>
      <form className="dialog" onSubmit={submit}>
        <h2>{mode === 'in' ? 'ログイン' : '新規登録'}</h2>
        <label>
          メールアドレス
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          パスワード
          <input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {msg && <p className="msg">{msg}</p>}
        <button className="primary" disabled={busy}>
          {mode === 'in' ? 'ログイン' : '登録する'}
        </button>
        <button type="button" className="text-btn" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'アカウントを作成する' : 'ログインに戻る'}
        </button>
      </form>
    </main>
  )
}
