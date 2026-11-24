const pad = (n: number) => String(n).padStart(2, '0')

export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => toDateStr(new Date())
export const nowHM = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export const parseDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (s: string, n: number) => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

const WD = ['日', '月', '火', '水', '木', '金', '土']
export const weekday = (s: string) => WD[parseDate(s).getDay()]
export const formatJP = (s: string) => {
  const d = parseDate(s)
  return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`
}
export const WEEKDAYS = WD

/** 予定時刻を過ぎているか（未完了のみ）。時刻なしは日付が過去なら過ぎている扱い */
export const isOverdue = (t: { date: string; time: string | null; done: boolean }, now = new Date()) => {
  if (t.done) return false
  const today = toDateStr(now)
  if (t.date < today) return true
  if (t.date > today) return false
  return !!t.time && t.time <= nowHM(now)
}
