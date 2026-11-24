import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addDays, isOverdue, nowHM, toDateStr, todayStr, weekday } from '../date'
import { buildSuggestions, type Suggestion } from '../history'
import { byOrder, byTime, newOrders, reorderUpdates, type OrderField, type OrderUpdate } from '../order'
import type { Store, Task, TaskPatch } from '../types'
import { AddTask } from './AddTask'
import { CalendarView } from './CalendarView'
import { EditDialog } from './EditDialog'
import { Recommend } from './Recommend'
import { SortableList } from './SortableList'
import { TaskItem } from './TaskItem'

type View = 'time' | 'list' | 'calendar'
const VIEW_KEY = 'daily-todo:view'

const loadView = (): View => {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    if (v === 'time' || v === 'list' || v === 'calendar') return v
  } catch {
    /* ignore */
  }
  return 'time'
}

export function DayView({ store, onSignOut }: { store: Store; onSignOut?: () => void }) {
  const [date, setDate] = useState(todayStr)
  const [view, setViewState] = useState<View>(loadView)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loaded, setLoaded] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [carryOver, setCarryOver] = useState<Task[]>([])
  const [recOpen, setRecOpen] = useState<boolean | null>(null)
  const [editing, setEditing] = useState<Task | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* ignore */
    }
  }

  // 現在時刻を30秒ごとに更新（時間切れマーク用）。日付が変わったら今日へ追従
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    const onVis = () => document.visibilityState === 'visible' && setNow(new Date())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const fail = useCallback((e: unknown) => {
    console.error(e)
    setError(e instanceof Error ? e.message : String(e))
  }, [])

  const reload = useCallback(async () => {
    try {
      const [day, hist, prev] = await Promise.all([
        store.listByDate(date),
        store.history(addDays(date, -60)),
        store.listByDate(addDays(date, -1)),
      ])
      setTasks(day)
      setSuggestions(buildSuggestions(hist.filter((h) => h.date !== date)))
      setCarryOver(prev.filter((t) => !t.done).sort(byOrder('list_order')))
      setLoaded(true)
    } catch (e) {
      fail(e)
    }
  }, [store, date, fail])

  useEffect(() => {
    setLoaded(false)
    setRecOpen(null)
    void reload()
  }, [reload])

  const today = toDateStr(now)
  const prevToday = useRef(today)
  useEffect(() => {
    // 日付をまたいだら、今日を表示していた場合は新しい今日へ移動
    if (prevToday.current !== today) {
      setDate((d) => (d === prevToday.current ? today : d))
      prevToday.current = today
    }
  }, [today])
  const showRecommend = recOpen ?? (loaded && tasks.length === 0 && date >= today)

  // ---- mutations ----
  const addMany = async (rows: { title: string; time: string | null; note?: string }[]) => {
    if (!rows.length) return
    let cur = tasks
    const payload = rows.map((r) => {
      const o = newOrders(cur, r.time)
      const row = { date, title: r.title, time: r.time, note: r.note ?? '', ...o }
      cur = [...cur, { ...row, id: '', created_at: '', done: false, done_at: null }]
      return row
    })
    try {
      const created = await store.add(payload)
      setTasks((p) => [...p, ...created])
      setRecOpen(false)
    } catch (e) {
      fail(e)
    }
  }

  const patch = async (id: string, p: TaskPatch) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)))
    try {
      await store.update(id, p)
    } catch (e) {
      fail(e)
      void reload()
    }
  }

  const toggle = (t: Task) => patch(t.id, { done: !t.done, done_at: t.done ? null : new Date().toISOString() })

  const applyOrder = async (field: OrderField, updates: OrderUpdate[]) => {
    const m = new Map(updates.map((u) => [u.id, u.order]))
    setTasks((ts) => ts.map((t) => (m.has(t.id) ? { ...t, [field]: m.get(t.id)! } : t)))
    try {
      await Promise.all(updates.map((u) => store.update(u.id, { [field]: u.order })))
    } catch (e) {
      fail(e)
      void reload()
    }
  }

  const sortByTime = () => {
    const sorted = [...tasks].sort(byTime)
    void applyOrder(
      'time_order',
      sorted.map((t, i) => ({ id: t.id, order: i })).filter((u, i) => sorted[i].time_order !== u.order),
    )
  }

  const saveEdit = async (t: Task, p: TaskPatch) => {
    setEditing(null)
    try {
      if (p.date && p.date !== t.date) {
        const target = await store.listByDate(p.date)
        await store.update(t.id, { ...p, ...newOrders(target, p.time ?? null) })
        setTasks((ts) => ts.filter((x) => x.id !== t.id))
        return
      }
      const extra = p.time !== t.time ? { time_order: newOrders(tasks.filter((x) => x.id !== t.id), p.time ?? null).time_order } : {}
      await patch(t.id, { ...p, ...extra })
    } catch (e) {
      fail(e)
    }
  }

  const remove = async (t: Task) => {
    setEditing(null)
    setTasks((ts) => ts.filter((x) => x.id !== t.id))
    try {
      await store.remove(t.id)
    } catch (e) {
      fail(e)
      void reload()
    }
  }

  // ---- derived ----
  const timeItems = useMemo(() => [...tasks].sort(byOrder('time_order')), [tasks])
  const remaining = useMemo(() => tasks.filter((t) => !t.done).sort(byOrder('list_order')), [tasks])
  const doneItems = useMemo(() => tasks.filter((t) => t.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? '')), [tasks])
  const overdueCount = tasks.filter((t) => isOverdue(t, now)).length
  const outOfOrder = timeItems.some((t, i) => i > 0 && byTime(timeItems[i - 1], t) > 0)

  const nowLine = useMemo(() => {
    if (date !== today) return undefined
    const hm = nowHM(now)
    if (!timeItems.some((t) => t.time)) return undefined
    let idx = timeItems.findIndex((t) => t.time && t.time > hm)
    if (idx < 0) {
      const lastTimed = timeItems.map((t) => !!t.time).lastIndexOf(true)
      idx = lastTimed + 1
    }
    return {
      index: idx,
      node: (
        <li key="now-line" className="now-line" aria-label={`現在 ${hm}`}>
          <span className="now-time">{hm}</span>
          <span className="now-dot" />
          <span className="now-rule" />
        </li>
      ),
    }
  }, [date, today, now, timeItems])

  const item = (withTimeOverdue: boolean) => (t: Task, h?: Parameters<typeof TaskItem>[0]['handle']) => (
    <TaskItem
      variant={withTimeOverdue ? 'timeline' : 'card'}
      task={t}
      handle={h}
      overdue={withTimeOverdue && isOverdue(t, now)}
      onToggle={() => toggle(t)}
      onEdit={() => setEditing(t)}
    />
  )

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <div className="date-block">
            <span className="eyebrow">
              {date === today ? 'TODAY' : date < today ? 'PAST' : 'UPCOMING'} · {date.slice(0, 4)}
            </span>
            <div className="date-line">
              <button className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="前の日">
                <Chevron dir="left" />
              </button>
              <button className="date-label" onClick={() => setView('calendar')}>
                {Number(date.slice(5, 7))}月{Number(date.slice(8))}日<small>（{weekday(date)}）</small>
              </button>
              <button className="icon-btn" onClick={() => setDate(addDays(date, 1))} aria-label="次の日">
                <Chevron dir="right" />
              </button>
            </div>
          </div>
          <div className="top-actions">
            {date !== today && (
              <button className="pill-btn" onClick={() => setDate(today)}>
                今日へ
              </button>
            )}
            {onSignOut && (
              <button className="text-btn" onClick={onSignOut}>
                ログアウト
              </button>
            )}
          </div>
        </div>
        {tasks.length > 0 && (
          <div className="progress" aria-label={`${tasks.length - remaining.length} / ${tasks.length} 完了`}>
            <div className="progress-bar">
              <span style={{ width: `${((tasks.length - remaining.length) / tasks.length) * 100}%` }} />
            </div>
            <span className="progress-text">
              {tasks.length - remaining.length}/{tasks.length}
            </span>
          </div>
        )}
        <nav className="seg" role="tablist">
          {(
            [
              ['time', '時間順'],
              ['list', '残りタスク'],
              ['calendar', 'カレンダー'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'seg-btn on' : 'seg-btn'} onClick={() => setView(v)}>
              {label}
              {v === 'list' && remaining.length > 0 && <span className="count">{remaining.length}</span>}
              {v === 'time' && overdueCount > 0 && <span className="count warn">{overdueCount}</span>}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="error" onClick={() => setError(null)}>
          エラー: {error}（タップで閉じる）
        </div>
      )}

      <main className="content">
        {view === 'calendar' ? (
          <CalendarView
            store={store}
            selected={date}
            onPick={(d) => {
              setDate(d)
              setView('time')
            }}
          />
        ) : (
          <>
            {showRecommend ? (
              <Recommend
                suggestions={suggestions}
                existing={tasks}
                carryOver={date >= today ? carryOver : []}
                onAdd={addMany}
                onClose={() => setRecOpen(false)}
              />
            ) : (
              <button className="text-btn open-rec" onClick={() => setRecOpen(true)}>
                おすすめから追加
              </button>
            )}

            <AddTask suggestions={suggestions} onAdd={(title, time) => addMany([{ title, time }])} />

            {view === 'time' ? (
              <>
                {outOfOrder && (
                  <div className="toolbar">
                    <span className="hint">手動で並べ替え中</span>
                    <button className="pill-btn" onClick={sortByTime}>
                      時間順に並べ直す
                    </button>
                  </div>
                )}
                {loaded && timeItems.length === 0 && <p className="empty">タスクはまだありません</p>}
                <SortableList
                  items={timeItems}
                  onMove={(moved, i) => applyOrder('time_order', reorderUpdates(moved, i, 'time_order'))}
                  renderItem={item(true)}
                  insertBefore={nowLine}
                  className="timeline"
                />
              </>
            ) : (
              <>
                {loaded && remaining.length === 0 && (
                  <p className="empty">{tasks.length ? 'すべて完了しました' : 'タスクはまだありません'}</p>
                )}
                <SortableList
                  items={remaining}
                  onMove={(moved, i) => applyOrder('list_order', reorderUpdates(moved, i, 'list_order'))}
                  renderItem={item(false)}
                />
                {doneItems.length > 0 && (
                  <section className="done-section">
                    <button className="text-btn" onClick={() => setShowDone(!showDone)}>
                      完了済み {doneItems.length} 件 {showDone ? '▲' : '▼'}
                    </button>
                    {showDone && (
                      <ul className="tasks cards">
                        {doneItems.map((t) => (
                          <li key={t.id} className="row">
                            {item(false)(t)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      {editing && (
        <EditDialog task={editing} onSave={(p) => saveEdit(editing, p)} onDelete={() => remove(editing)} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
