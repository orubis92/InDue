import { useState } from 'react'

/** Modifica di un'attività esistente: tocca ✎ su un'attività per aprirla. */
export default function EditTaskModal({ task, categories, profiles, onSave, onClose }) {
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes || '')
  const [categoryId, setCategoryId] = useState(task.category_id || '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [repeatDays, setRepeatDays] = useState(task.repeat_days ? String(task.repeat_days) : '')

  function handleSave(e) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    onSave(task.id, {
      title: clean,
      notes: notes.trim() || null,
      category_id: categoryId || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      repeat_days: repeatDays ? Number(repeatDays) : null
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSave}>
        <h3>Modifica attività</h3>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          aria-label="Titolo"
          required
        />
        <textarea
          className="notes-input"
          placeholder="Note"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          aria-label="Note"
        />
        <div className="modal-grid">
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} aria-label="Categoria">
            <option value="">Nessuna categoria</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
          <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} aria-label="Assegna a">
            <option value="">Di entrambi</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} aria-label="Scadenza" />
          <select value={repeatDays} onChange={e => setRepeatDays(e.target.value)} aria-label="Ricorrenza">
            <option value="">Non si ripete</option>
            <option value="1">Ogni giorno</option>
            <option value="2">Ogni 2 giorni</option>
            <option value="3">Ogni 3 giorni</option>
            <option value="7">Ogni settimana</option>
            <option value="14">Ogni 2 settimane</option>
            <option value="30">Ogni mese</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Annulla</button>
          <button className="btn-primary">Salva modifiche</button>
        </div>
      </form>
    </div>
  )
}
