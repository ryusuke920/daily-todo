import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Props = { sb: SupabaseClient; email?: string; onDone: () => void }

export function NewPassword({ sb, email, onDone }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setMsg('パスワードが一致しません')
    setBusy(true)
    setMsg(null)
    const { error } = await sb.auth.updateUser({ password })
    setBusy(false)
    if (error) setMsg(error.message)
    else onDone()
  }

  return (
    <main className="login">
      <h1>Daily ToDo</h1>
      <form className="dialog" onSubmit={submit}>
        <h2>新しいパスワードを設定</h2>
        {email && <p className="hint">{email}</p>}
        {/* パスワードマネージャーが正しいアカウントに保存できるように */}
        <input type="email" autoComplete="username" value={email ?? ''} readOnly hidden />
        <label>
          新しいパスワード
          <input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </label>
        <label>
          もう一度入力
          <input type="password" autoComplete="new-password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </label>
        {msg && <p className="msg">{msg}</p>}
        <button className="primary" disabled={busy}>
          {busy ? '保存中…' : 'パスワードを変更'}
        </button>
        <button type="button" className="text-btn" onClick={onDone}>
          あとで変更する
        </button>
      </form>
    </main>
  )
}
