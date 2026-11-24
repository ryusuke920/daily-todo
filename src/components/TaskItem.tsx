import type { Task } from '../types'
import type { HandleProps } from './SortableList'

type Props = {
  task: Task
  overdue: boolean
  handle?: HandleProps
  onToggle: () => void
  onEdit: () => void
}

export function TaskItem({ task, overdue, handle, onToggle, onEdit }: Props) {
  return (
    <div className={`task${task.done ? ' done' : ''}${overdue ? ' overdue' : ''}`}>
      <button className="check" aria-label={task.done ? '未完了に戻す' : '完了にする'} onClick={onToggle}>
        {task.done && (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <button className="body" onClick={onEdit}>
        <span className="title">{task.title}</span>
        {task.note && <span className="note">{task.note}</span>}
        <span className="meta">
          {task.time && (
            <span className="chip">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {task.time}
            </span>
          )}
          {overdue && <span className="badge">時間切れ</span>}
        </span>
      </button>
      {handle && (
      <button className="handle" aria-label="ドラッグして並べ替え" {...handle}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" />))}
        </svg>
      </button>
      )}
    </div>
  )
}
