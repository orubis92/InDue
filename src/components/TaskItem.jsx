/** Singola attività: check, titolo, note, categoria, persona,
 *  scadenza, ricorrenza, "fatta da", modifica ed eliminazione. */
export default function TaskItem({ task, profiles, onToggle, onDelete, onEdit }) {
  const person = profiles.find(p => p.id === task.assigned_to)
  const doneBy = profiles.find(p => p.id === task.done_by)
  const overdue =
    !task.done && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)

  const fmtDate = d =>
    new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

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
        {task.notes && <div className="task-notes">{task.notes}</div>}
        <div className="task-meta">
          {task.category && (
            <span className="pill">{task.category.emoji} {task.category.name}</span>
          )}
          {person && (
            <span className="pill person" style={{ '--person-color': person.color }}>
              {person.display_name}
            </span>
          )}
          {task.due_date && !task.done && (
            <span className={`pill ${overdue ? 'overdue' : ''}`}>
              {overdue ? '⚠ ' : '📅 '}{fmtDate(task.due_date + 'T00:00')}
            </span>
          )}
          {task.repeat_days && (
            <span className="pill">
              🔁 {task.repeat_days === 1 ? 'ogni giorno'
                : task.repeat_days === 7 ? 'ogni settimana'
                : task.repeat_days === 30 ? 'ogni mese'
                : `ogni ${task.repeat_days} gg`}
            </span>
          )}
          {task.done && doneBy && task.done_at && (
            <span className="pill">✓ {doneBy.display_name} · {fmtDate(task.done_at)}</span>
          )}
        </div>
      </div>

      {!task.done && (
        <button className="task-edit" onClick={() => onEdit(task)} aria-label="Modifica attività">
          ✎
        </button>
      )}
      <button className="task-delete" onClick={() => onDelete(task.id)} aria-label="Elimina attività">
        ×
      </button>
    </div>
  )
}
