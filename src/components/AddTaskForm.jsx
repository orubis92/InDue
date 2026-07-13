import { useState } from 'react'

/** Aggiunta rapida: titolo + categoria, persona e scadenza opzionali. */
export default function AddTaskForm({ categories, profiles, onAdd }) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    await onAdd({ title: clean, categoryId, assignedTo, dueDate })
    setTitle('')
    setDueDate('')
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
      </div>
    </form>
  )
}
