import TaskItem from './TaskItem'

const DONE_VISIBLE_DAYS = 7

/** Liste "Da fare" e "Fatte". Le fatte più vecchie di 7 giorni
 *  vengono nascoste automaticamente; "Svuota" le elimina tutte. */
export default function TaskList({ tasks, profiles, onToggle, onDelete, onEdit, onClearDone }) {
  const cutoff = Date.now() - DONE_VISIBLE_DAYS * 24 * 60 * 60 * 1000
  const todo = tasks.filter(t => !t.done)
  const done = tasks.filter(
    t => t.done && (!t.done_at || new Date(t.done_at).getTime() > cutoff)
  )
  const hiddenDone = tasks.filter(t => t.done).length - done.length

  if (todo.length === 0 && done.length === 0) {
    return (
      <p className="empty-state">
        Tutto fatto! Aggiungi la prossima cosa da fare qui sopra.
      </p>
    )
  }

  return (
    <div className="task-list">
      {todo.length > 0 && <p className="section-label">Da fare · {todo.length}</p>}
      {todo.map(t => (
        <TaskItem key={t.id} task={t} profiles={profiles}
          onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
      ))}

      {done.length > 0 && (
        <div className="done-header">
          <p className="section-label">Fatte · {done.length}</p>
          <button className="btn-ghost" onClick={onClearDone}>Svuota</button>
        </div>
      )}
      {done.map(t => (
        <TaskItem key={t.id} task={t} profiles={profiles}
          onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
      ))}
      {hiddenDone > 0 && (
        <p className="hint">
          {hiddenDone} attività completate da più di {DONE_VISIBLE_DAYS} giorni sono nascoste.
        </p>
      )}
    </div>
  )
}
