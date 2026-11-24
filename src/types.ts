export type Task = {
  id: string
  date: string // YYYY-MM-DD (local)
  title: string
  time: string | null // HH:MM
  note: string
  done: boolean
  done_at: string | null
  list_order: number
  time_order: number
  created_at: string
}

export type NewTask = Pick<Task, 'date' | 'title' | 'time'> & Partial<Pick<Task, 'note'>>

export type TaskPatch = Partial<Omit<Task, 'id' | 'created_at'>>

export type HistoryRow = Pick<Task, 'date' | 'title' | 'time'>

export interface Store {
  readonly kind: 'local' | 'supabase'
  listByDate(date: string): Promise<Task[]>
  listRange(from: string, to: string): Promise<Task[]>
  history(since: string): Promise<HistoryRow[]>
  add(rows: Omit<Task, 'id' | 'created_at' | 'done' | 'done_at'>[]): Promise<Task[]>
  update(id: string, patch: TaskPatch): Promise<void>
  remove(id: string): Promise<void>
}
