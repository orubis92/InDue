import { useState } from 'react'
import { uploadPhoto } from '../lib/photos'

/** Aggiunta rapida: titolo + dettagli opzionali (note, foto,
 *  categoria, persona, scadenza, ricorrenza). Può essere
 *  pre-compilato dalla condivisione di altre app. */
export default function AddTaskForm({ categories, profiles, onAdd, initial }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [repeatDays, setRepeatDays] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [showDetails, setShowDetails] = useState(!!initial?.notes)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    setBusy(true)
    // La foto richiede la rete: offline viene semplicemente ignorata
    const photoPath = navigator.onLine ? await uploadPhoto(photoFile) : null
    await onAdd({
      title: clean,
      notes: notes.trim(),
      categoryId,
      assignedTo,
      dueDate,
      repeatDays: repeatDays ? Number(repeatDays) : null,
      photoPath
    })
    setTitle(''); setNotes(''); setDueDate(''); setRepeatDays(''); setPhotoFile(null)
    setBusy(false)
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
        <button className="btn-primary" disabled={busy} aria-label="Aggiungi attività">+</button>
      </div>

      <button
        type="button"
        className="btn-ghost details-toggle"
        onClick={() => setShowDetails(v => !v)}
      >
        {showDetails ? '− Meno dettagli' : '+ Note, foto, scadenza, ricorrenza…'}
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
          <label className="field-label photo-field">
            📷 Foto (scontrino, prodotto…)
            <input
              type="file"
              accept="image/*"
              onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </>
      )}
    </form>
  )
}
