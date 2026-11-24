import type { HistoryRow } from './types'

export type Suggestion = { title: string; time: string | null; count: number; last: string }

/** 過去の登録履歴をタイトルごとに集計し、よく使う時刻を付けて頻度順に返す */
export const buildSuggestions = (rows: HistoryRow[]): Suggestion[] => {
  const map = new Map<string, { count: number; last: string; times: Map<string, number> }>()
  for (const r of rows) {
    const title = r.title.trim()
    if (!title) continue
    const e = map.get(title) ?? { count: 0, last: '', times: new Map() }
    e.count++
    if (r.date > e.last) e.last = r.date
    const tk = r.time ?? ''
    e.times.set(tk, (e.times.get(tk) ?? 0) + 1)
    map.set(title, e)
  }
  return [...map.entries()]
    .map(([title, e]) => {
      const [best] = [...e.times.entries()].sort((a, b) => b[1] - a[1])
      return { title, time: best[0] || null, count: e.count, last: e.last }
    })
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
}
