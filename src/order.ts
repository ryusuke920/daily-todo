import type { Task } from './types'

export type OrderField = 'list_order' | 'time_order'
export type OrderUpdate = { id: string; order: number }

export const byOrder = (field: OrderField) => (a: Task, b: Task) =>
  a[field] - b[field] || a.created_at.localeCompare(b.created_at)

/** 時刻順（時刻なしは末尾）。同時刻は time_order */
export const byTime = (a: Task, b: Task) => {
  if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1
  if (!!a.time !== !!b.time) return a.time ? -1 : 1
  return byOrder('time_order')(a, b)
}

const between = (prev?: number, next?: number) => {
  if (prev === undefined && next === undefined) return 0
  if (prev === undefined) return next! - 1
  if (next === undefined) return prev + 1
  return (prev + next) / 2
}

/** 並べ替え後の配列から、変更すべき order を求める（基本は1件、詰まっていたら振り直し） */
export const reorderUpdates = (moved: Task[], index: number, field: OrderField): OrderUpdate[] => {
  const prev = moved[index - 1]?.[field]
  const next = moved[index + 1]?.[field]
  const v = between(prev, next)
  const ok = (prev === undefined || v > prev) && (next === undefined || v < next)
  if (ok) return [{ id: moved[index].id, order: v }]
  return moved.map((t, i) => ({ id: t.id, order: i })).filter((u, i) => moved[i][field] !== u.order)
}

/** 新規追加時の order（list は末尾、time は時刻に応じた位置） */
export const newOrders = (tasks: Task[], time: string | null) => {
  const list = [...tasks].sort(byOrder('list_order'))
  const list_order = list.length ? list[list.length - 1].list_order + 1 : 0
  const tl = [...tasks].sort(byOrder('time_order'))
  let idx = tl.length
  if (time) {
    const i = tl.findIndex((t) => t.time && t.time > time)
    if (i >= 0) idx = i
  }
  const time_order = between(tl[idx - 1]?.time_order, tl[idx]?.time_order)
  return { list_order, time_order }
}
