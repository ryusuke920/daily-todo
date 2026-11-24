import { useState } from 'react'
import type { Suggestion } from '../history'

type Props = {
  suggestions: Suggestion[]
  onAdd: (title: string, time: string | null) => void
}

export function AddTask({ suggestions, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')

  const onTitle = (v: string) => {
    setTitle(v)
    const hit = suggestions.find((s) => s.title === v)
    if (hit?.time && !time) setTime(hit.time)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    onAdd(t, time || null)
    setTitle('')
    setTime('')
  }

  return (
    <form className="add" onSubmit={submit}>
      <input
        className="add-title"
        placeholder="タスクを追加"
        value={title}
        list="task-suggestions"
        onChange={(e) => onTitle(e.target.value)}
        enterKeyHint="done"
      />
      <datalist id="task-suggestions">
        {suggestions.slice(0, 50).map((s) => (
          <option key={s.title} value={s.title} />
        ))}
      </datalist>
      <input className="add-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="時刻" />
      <button className="primary" type="submit" disabled={!title.trim()}>
        追加
      </button>
    </form>
  )
}
