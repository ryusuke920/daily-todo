import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Store, Task } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

const COLS = 'id,date,title,time,note,done,done_at,list_order,time_order,created_at'

const fix = (t: Task): Task => ({ ...t, time: t.time ? t.time.slice(0, 5) : null })

const must = <T>(r: { data: T | null; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

export const createSupabaseStore = (sb: SupabaseClient): Store => ({
  kind: 'supabase',
  async listByDate(date) {
    return must(await sb.from('tasks').select(COLS).eq('date', date)).map(fix)
  },
  async listRange(from, to) {
    return must(await sb.from('tasks').select(COLS).gte('date', from).lte('date', to)).map(fix)
  },
  async history(since) {
    const rows = must(await sb.from('tasks').select('date,title,time').gte('date', since).limit(5000))
    return rows.map((r) => ({ ...r, time: r.time ? String(r.time).slice(0, 5) : null }))
  },
  async add(rows) {
    return must(await sb.from('tasks').insert(rows).select(COLS)).map(fix)
  },
  async update(id, patch) {
    must(await sb.from('tasks').update(patch).eq('id', id))
  },
  async remove(id) {
    must(await sb.from('tasks').delete().eq('id', id))
  },
})
