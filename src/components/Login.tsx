import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Mode = 'in' | 'up' | 'reset'

const TITLES: Record<Mode, string> = { in: 'ログイン', up: '新規登録', reset: 'パスワードの再設定' }
const SUBMIT: Record<Mode, string> = { in: 'ログイン', up: '登録する', reset: '再設定メールを送る' }

export function Login({ sb, initialMessage = null }: { sb: SupabaseClient; initialMessage?: string | null }) {
  const [mode, setMode] = useState<Mode>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(initialMessage ? { text: initialMessage } : null)
  const [busy, setBusy] = useState(false)

  const redirectTo = location.origin + import.meta.env.BASE_URL

  const switchMode = (m: Mode) => {
    setMode(m)
    setMsg(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    if (mode === 'reset') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo })
      setBusy(false)
      setMsg(
        error
          ? { text: error.message }
          : { text: '再設定用のメールを送りました（登録済みのアドレスの場合のみ届きます）。メールのリンクを開くと、新しいパスワードを設定できます。', ok: true },
      )
      return
    }
    const { data, error } =
      mode === 'in'
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
    setBusy(false)
    if (error) setMsg({ text: error.message })
    else if (mode === 'up' && !data.session) setMsg({ text: '確認メールを送りました。メールのリンクを開いてからログインしてください。', ok: true })
  }

  return (
    <main className="login">
      <h1>Daily ToDo</h1>
      <form className="dialog" onSubmit={submit}>
        <h2>{TITLES[mode]}</h2>
        {mode === 'reset' && <p className="hint">登録したメールアドレスを入力してください。再設定用のリンクを送ります。</p>}
        <label>
          メールアドレス
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {mode !== 'reset' && (
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
        )}
        {msg && <p className={msg.ok ? 'msg ok' : 'msg'}>{msg.text}</p>}
        <button className="primary" disabled={busy}>
          {busy ? '送信中…' : SUBMIT[mode]}
        </button>
        <div className="login-links">
          {mode === 'in' ? (
            <>
              <button type="button" className="text-btn" onClick={() => switchMode('reset')}>
                パスワードを忘れた
              </button>
              <button type="button" className="text-btn" onClick={() => switchMode('up')}>
                アカウントを作成する
              </button>
            </>
          ) : (
            <button type="button" className="text-btn" onClick={() => switchMode('in')}>
              ログインに戻る
            </button>
          )}
        </div>
      </form>
    </main>
  )
}
