import { useState } from 'react'

/** Aggiunta rapida: titolo + dettagli opzionali (note, categoria,
 *  persona, scadenza, ricorrenza). */
export default function AddTaskForm({ categories, profiles, onAdd }) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [repeatDays, setRepeatDays] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    await onAdd({
      title: clean,
      notes: notes.trim(),
      categoryId,
      assignedTo,
      dueDate,
      repeatDays: repeatDays ? Number(repeatDays) : null
    })
    setTitle('')
    setNotes('')
    setDueDate('')
    setRepeatDays('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="add-form">
        <input
          placeholder="Cosa c'è da fare?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          aria-label="Nuova attività"
        />
        <button className="btn-primary" aria-label="Aggiungi attività">+</button>
      </div>

      <button
        type="button"
        className="btn-ghost details-toggle"
        onClick={() => setShowDetails(v => !v)}
      >
        {showDetails ? '− Meno dettagli' : '+ Note, scadenza, ricorrenza…'}
      </button>

      {showDetails && (
        <>
          <textarea
            className="notes-input"
            placeholder="Note (es. marca preferita, indirizzo, misure…)"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            aria-label="Note"
          />
          <div className="add-details">
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} aria-label="Categoria">
              <option value="">Categoria</option>
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
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              aria-label="Scadenza"
            />
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
        </>
      )}
    </form>
  )
}
