import { useEffect, useState } from 'react'
import { WEEKDAYS, addDays, parseDate, toDateStr, todayStr } from '../date'
import type { Store, Task } from '../types'

type Props = { store: Store; selected: string; onPick: (date: string) => void }

export function CalendarView({ store, selected, onPick }: Props) {
  const [month, setMonth] = useState(() => selected.slice(0, 7))
  const [tasks, setTasks] = useState<Task[]>([])

  const first = parseDate(`${month}-01`)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const from = toDateStr(first)
  const to = toDateStr(last)

  useEffect(() => {
    let alive = true
    store.listRange(from, to).then((r) => alive && setTasks(r)).catch(console.error)
    return () => {
      alive = false
    }
  }, [store, from, to])

  const shift = (n: number) => setMonth(toDateStr(new Date(first.getFullYear(), first.getMonth() + n, 1)).slice(0, 7))

  const stats = new Map<string, { total: number; done: number }>()
  for (const t of tasks) {
    const s = stats.get(t.date) ?? { total: 0, done: 0 }
    s.total++
    if (t.done) s.done++
    stats.set(t.date, s)
  }

  const start = addDays(from, -first.getDay())
  const cells = Array.from({ length: Math.ceil((first.getDay() + last.getDate()) / 7) * 7 }, (_, i) => addDays(start, i))
  const today = todayStr()

  return (
    <section className="calendar">
      <div className="cal-head">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="前の月">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h2>
          {first.getFullYear()}年{first.getMonth() + 1}月
        </h2>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="次の月">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`cal-wd${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const s = stats.get(d)
          const out = d.slice(0, 7) !== month
          const cls = ['cal-day', out && 'out', d === today && 'today', d === selected && 'sel'].filter(Boolean).join(' ')
          const state = !s ? '' : s.done === s.total ? 'all' : d < today ? 'left' : 'some'
          return (
            <button key={d} className={cls} onClick={() => onPick(d)}>
              <span className="cal-num">{Number(d.slice(8))}</span>
              {s && (
                <span className={`cal-stat ${state}`}>
                  <span className="cal-bar"><span style={{ width: `${(s.done / s.total) * 100}%` }} /></span>
                  {s.done}/{s.total}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="hint">日付をタップするとその日のタスクを表示します。</p>
    </section>
  )
}
