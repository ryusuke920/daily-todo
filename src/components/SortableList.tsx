import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
import type { Task } from '../types'

export type HandleProps = ReturnType<typeof useSortable>['listeners'] & ReturnType<typeof useSortable>['attributes']

function Row({ task, children }: { task: Task; children: (h: HandleProps) => ReactNode }) {
  const { setNodeRef, transform, transition, isDragging, listeners, attributes } = useSortable({ id: task.id })
  return (
    <li
      ref={setNodeRef}
      className={isDragging ? 'row dragging' : 'row'}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children({ ...attributes, ...listeners } as HandleProps)}
    </li>
  )
}

type Props = {
  items: Task[]
  onMove: (moved: Task[], index: number) => void
  renderItem: (task: Task, handle: HandleProps) => ReactNode
  /** 指定した index の直前に差し込む要素（現在時刻ラインなど） */
  insertBefore?: { index: number; node: ReactNode }
  className?: string
}

export function SortableList({ items, onMove, renderItem, insertBefore, className = 'cards' }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((t) => t.id === active.id)
    const to = items.findIndex((t) => t.id === over.id)
    onMove(arrayMove(items, from, to), to)
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className={`tasks ${className}`}>
          {items.map((t, i) => (
            <FragmentWithInsert key={t.id} show={insertBefore?.index === i} node={insertBefore?.node}>
              <Row task={t}>{(h) => renderItem(t, h)}</Row>
            </FragmentWithInsert>
          ))}
          {insertBefore && insertBefore.index >= items.length && insertBefore.node}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function FragmentWithInsert({ show, node, children }: { show: boolean; node: ReactNode; children: ReactNode }) {
  return (
    <>
      {show && node}
      {children}
    </>
  )
}
