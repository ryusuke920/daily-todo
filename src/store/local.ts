import type { HistoryRow, Store, Task, TaskPatch } from '../types'

const KEY = 'daily-todo:tasks:v1'

const load = (): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Task[]
  } catch {
    return []
  }
}
const save = (tasks: Task[]) => localStorage.setItem(KEY, JSON.stringify(tasks))

export const localStore: Store = {
  kind: 'local',
  async listByDate(date) {
    return load().filter((t) => t.date === date)
  },
  async listRange(from, to) {
    return load().filter((t) => t.date >= from && t.date <= to)
  },
  async history(since) {
    return load()
      .filter((t) => t.date >= since)
      .map(({ date, title, time }): HistoryRow => ({ date, title, time }))
  },
  async add(rows) {
    const now = new Date().toISOString()
    const created = rows.map((r) => ({ ...r, id: crypto.randomUUID(), created_at: now, done: false, done_at: null }))
    save([...load(), ...created])
    return created
  },
  async update(id, patch: TaskPatch) {
    save(load().map((t) => (t.id === id ? { ...t, ...patch } : t)))
  },
  async remove(id) {
    save(load().filter((t) => t.id !== id))
  },
}
