/** Singola attività: check, titolo, categoria, persona, scadenza. */
export default function TaskItem({ task, profiles, onToggle, onDelete }) {
  const person = profiles.find(p => p.id === task.assigned_to)
  const overdue =
    !task.done && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)

  const dueLabel = task.due_date
    ? new Date(task.due_date + 'T00:00').toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
      })
    : null

  return (
    <div
      className={`task-item ${task.done ? 'done' : ''}`}
      style={{ '--cat-color': task.category?.color }}
    >
      <button
        className={`task-check ${task.done ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
        aria-label={task.done ? 'Segna da fare' : 'Segna come fatta'}
      >
        ✓
      </button>
      <div className="task-main">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {task.category && (
            <span className="pill">{task.category.emoji} {task.category.name}</span>
          )}
          {person && (
            <span className="pill person" style={{ '--person-color': person.color }}>
              {person.display_name}
            </span>
          )}
          {dueLabel && (
            <span className={`pill ${overdue ? 'overdue' : ''}`}>
              {overdue ? '⚠ ' : '📅 '}{dueLabel}
            </span>
          )}
        </div>
      </div>
      <button
        className="task-delete"
        onClick={() => onDelete(task.id)}
        aria-label="Elimina attività"
      >
        ×
      </button>
    </div>
  )
}
