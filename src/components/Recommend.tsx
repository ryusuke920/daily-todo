import { useMemo, useState } from 'react'
import type { Suggestion } from '../history'
import type { Task } from '../types'

type Props = {
  suggestions: Suggestion[]
  existing: Task[]
  carryOver: Task[]
  onAdd: (rows: { title: string; time: string | null; note?: string }[]) => void
  onClose?: () => void
}

export function Recommend({ suggestions, existing, carryOver, onAdd, onClose }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const have = useMemo(() => new Set(existing.map((t) => t.title)), [existing])
  const list = suggestions.filter((s) => !have.has(s.title)).slice(0, 24)
  const carry = carryOver.filter((t) => !have.has(t.title))

  const toggle = (title: string) =>
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(title)) n.delete(title)
      else n.add(title)
      return n
    })

  const addPicked = () => {
    onAdd(list.filter((s) => picked.has(s.title)).map((s) => ({ title: s.title, time: s.time })))
    setPicked(new Set())
  }

  return (
    <section className="recommend">
      <div className="recommend-head">
        <h2>今日のタスクを登録しましょう</h2>
        {onClose && (
          <button className="ghost small" onClick={onClose}>
            閉じる
          </button>
        )}
      </div>

      {carry.length > 0 && (
        <button className="carry" onClick={() => onAdd(carry.map((t) => ({ title: t.title, time: t.time, note: t.note })))}>
          前日の未完了 {carry.length} 件を引き継ぐ
        </button>
      )}

      {list.length > 0 ? (
        <>
          <p className="hint">よく登録しているタスク（タップで選択）</p>
          <div className="chips">
            {list.map((s) => (
              <button key={s.title} className={picked.has(s.title) ? 'sug on' : 'sug'} onClick={() => toggle(s.title)}>
                <span>{s.title}</span>
                {s.time && <span className="sug-time">{s.time}</span>}
                <span className="sug-count">{s.count}回</span>
              </button>
            ))}
          </div>
          <div className="recommend-actions">
            <button className="ghost small" onClick={() => setPicked(new Set(list.map((s) => s.title)))}>
              全部選ぶ
            </button>
            <button className="primary" disabled={picked.size === 0} onClick={addPicked}>
              選んだ {picked.size} 件を追加
            </button>
          </div>
        </>
      ) : (
        carry.length === 0 && (
          <p className="hint">
            {suggestions.length ? 'おすすめのタスクはすべて追加済みです。' : '登録を続けると、よく使うタスクがここにおすすめ表示されます。'}
          </p>
        )
      )}
    </section>
  )
}
