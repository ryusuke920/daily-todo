import type { Task } from '../types'
import type { HandleProps } from './SortableList'

type Props = {
  task: Task
  overdue: boolean
  handle?: HandleProps
  variant?: 'card' | 'timeline'
  onToggle: () => void
  onEdit: () => void
}

const Clock = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export function TaskItem({ task, overdue, handle, variant = 'card', onToggle, onEdit }: Props) {
  const cls = ['task', variant, task.done && 'done', overdue && 'overdue'].filter(Boolean).join(' ')
  const card = (
    <div className="task-card">
      <button className="check" aria-label={task.done ? '未完了に戻す' : '完了にする'} onClick={onToggle}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button className="body" onClick={onEdit}>
        <span className="title">{task.title}</span>
        {task.note && <span className="note">{task.note}</span>}
        {(variant === 'card' ? task.time || overdue : overdue) && (
          <span className="meta">
            {variant === 'card' && task.time && (
              <span className="chip">
                <Clock />
                {task.time}
              </span>
            )}
            {overdue && <span className="badge">時間切れ</span>}
          </span>
        )}
      </button>
      {handle && (
        <button className="handle" aria-label="ドラッグして並べ替え" {...handle}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" />))}
          </svg>
        </button>
      )}
    </div>
  )
  if (variant === 'card') return <div className={cls}>{card}</div>
  return (
    <div className={cls}>
      <span className="tl-time">{task.time ?? ''}</span>
      <span className="tl-rail">
        <span className="tl-dot" />
      </span>
      {card}
    </div>
  )
}
