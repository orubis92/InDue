import TaskItem from './TaskItem'

/** Divide la lista in "Da fare" e "Fatte". */
export default function TaskList({ tasks, profiles, onToggle, onDelete }) {
  const todo = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  if (tasks.length === 0) {
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
        <TaskItem key={t.id} task={t} profiles={profiles} onToggle={onToggle} onDelete={onDelete} />
      ))}
      {done.length > 0 && <p className="section-label">Fatte · {done.length}</p>}
      {done.map(t => (
        <TaskItem key={t.id} task={t} profiles={profiles} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  )
}
