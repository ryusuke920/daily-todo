import { useState } from 'react'
import type { Task, TaskPatch } from '../types'

type Props = {
  task: Task
  onSave: (patch: TaskPatch) => void
  onDelete: () => void
  onClose: () => void
}

export function EditDialog({ task, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [time, setTime] = useState(task.time ?? '')
  const [date, setDate] = useState(task.date)
  const [note, setNote] = useState(task.note)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), time: time || null, date, note })
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h2>タスクを編集</h2>
        <label>
          タイトル
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </label>
        <div className="row2">
          <label>
            日付
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            時刻
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <label>
          メモ
          <textarea value={note} rows={3} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="dialog-actions">
          <button type="button" className="danger" onClick={() => confirm('このタスクを削除しますか？') && onDelete()}>
            削除
          </button>
          <span className="spacer" />
          <button type="button" className="text-btn" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="primary">
            保存
          </button>
        </div>
      </form>
    </div>
  )
}
