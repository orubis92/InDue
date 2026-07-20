import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPhoto, photoUrl } from '../lib/photos'

const PET_EMOJIS = ['🐶', '🐱', '🐰', '🐹', '🐦', '🐠', '🐢', '🐴']
const EVENT_TYPES = [
  { label: 'Visita veterinaria', emoji: '🩺' },
  { label: 'Vaccino', emoji: '💉' },
  { label: 'Antiparassitario', emoji: '🛡️' },
  { label: 'Toelettatura', emoji: '✂️' },
  { label: 'Peso', emoji: '⚖️' },
  { label: 'Altro', emoji: '📌' }
]

const eventEmoji = type => EVENT_TYPES.find(t => t.label === type)?.emoji ?? '📌'

function age(birthDate) {
  if (!birthDate) return null
  const months =
    (Date.now() - new Date(birthDate + 'T00:00')) / (1000 * 60 * 60 * 24 * 30.44)
  if (months < 12) return `${Math.max(1, Math.round(months))} mesi`
  const years = Math.floor(months / 12)
  return `${years} ann${years === 1 ? 'o' : 'i'}`
}

const fmt = d =>
  new Date(d + 'T00:00').toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

/**
 * Sezione Animali 🐾: anagrafica (cibo, allergie, microchip...) e
 * libretto sanitario con visite, vaccini e trattamenti. Ogni voce
 * può avere una "prossima scadenza" trasformabile in attività.
 */
export default function Pets({ categories, onClose, onTaskCreated }) {
  const [pets, setPets] = useState([])
  const [selected, setSelected] = useState(null)   // pet aperto
  const [editingPet, setEditingPet] = useState(null) // null | 'new' | pet
  const [addingEvent, setAddingEvent] = useState(false)
  const [busy, setBusy] = useState(false)

  const animaliCategory = useMemo(
    () => categories.find(c => c.name === 'Animali') ?? null,
    [categories]
  )

  async function load() {
    const { data } = await supabase
      .from('pets')
      .select('*, pet_events(*)')
      .order('created_at')
    if (data) {
      setPets(data)
      if (selected) setSelected(data.find(p => p.id === selected.id) ?? null)
    }
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Anagrafica ---------------------------------------------
  async function savePet(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = {
      name: form.get('name').trim(),
      emoji: form.get('emoji'),
      breed: form.get('breed').trim() || null,
      birth_date: form.get('birth_date') || null,
      notes: form.get('notes').trim() || null
    }
    if (!payload.name) return
    setBusy(true)
    if (editingPet === 'new') {
      await supabase.from('pets').insert(payload)
    } else {
      await supabase.from('pets').update(payload).eq('id', editingPet.id)
    }
    setBusy(false)
    setEditingPet(null)
    load()
  }

  async function removePet(pet) {
    if (!confirm(`Eliminare ${pet.name} e tutto il suo libretto sanitario?`)) return
    await supabase.from('pets').delete().eq('id', pet.id)
    setSelected(null)
    load()
  }

  // --- Libretto sanitario --------------------------------------
  async function saveEvent(e) {
    e.preventDefault()
    const form = new FormData(e.target)
    const payload = {
      pet_id: selected.id,
      event_type: form.get('event_type'),
      event_date: form.get('event_date'),
      notes: form.get('notes').trim() || null,
      next_due: form.get('next_due') || null
    }
    setBusy(true)
    const photo = form.get('photo')
    if (photo && photo.size > 0 && navigator.onLine) {
      payload.photo_path = await uploadPhoto(photo)
    }
    await supabase.from('pet_events').insert(payload)
    setBusy(false)
    setAddingEvent(false)
    load()
  }

  async function removeEvent(ev) {
    await supabase.from('pet_events').delete().eq('id', ev.id)
    load()
  }

  /** Trasforma una scadenza del libretto in un'attività da fare. */
  async function createTask(pet, ev) {
    setBusy(true)
    await supabase.from('tasks').insert({
      title: `${eventEmoji(ev.event_type)} ${ev.event_type} — ${pet.name}`,
      notes: ev.notes,
      due_date: ev.next_due,
      category_id: animaliCategory?.id ?? null
    })
    setBusy(false)
    onTaskCreated()
  }

  // ============================================================
  // Vista: modulo nuovo animale / modifica
  // ============================================================
  if (editingPet) {
    const p = editingPet === 'new' ? {} : editingPet
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <form className="modal" onClick={e => e.stopPropagation()} onSubmit={savePet}>
          <h3>{editingPet === 'new' ? 'Nuovo animale' : `Modifica ${p.name}`}</h3>
          <input name="name" placeholder="Nome" defaultValue={p.name || ''} required />
          <div className="modal-grid">
            <select name="emoji" defaultValue={p.emoji || '🐶'} aria-label="Tipo">
              {PET_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input name="breed" placeholder="Razza / specie" defaultValue={p.breed || ''} />
          </div>
          <label className="field-label">
            Data di nascita
            <input type="date" name="birth_date" defaultValue={p.birth_date || ''} />
          </label>
          <textarea
            className="notes-input" name="notes" rows={4}
            placeholder={'Note utili:\nCibo abituale e dosi\nAllergie\nNumero microchip\nVeterinario di fiducia e telefono'}
            defaultValue={p.notes || ''}
          />
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setEditingPet(null)}>Annulla</button>
            <button className="btn-primary" disabled={busy}>Salva</button>
          </div>
        </form>
      </div>
    )
  }

  // ============================================================
  // Vista: scheda di un animale (dettagli + libretto)
  // ============================================================
  if (selected) {
    const events = [...selected.pet_events].sort((a, b) =>
      b.event_date.localeCompare(a.event_date)
    )
    const today = new Date().toISOString().slice(0, 10)
    const deadlines = events
      .filter(ev => ev.next_due && ev.next_due >= today)
      .sort((a, b) => a.next_due.localeCompare(b.next_due))

    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="pet-header">
            <h3>{selected.emoji} {selected.name}</h3>
            <button className="btn-ghost" onClick={() => setEditingPet(selected)}>✎ Modifica</button>
          </div>
          <p className="hint">
            {[selected.breed, age(selected.birth_date)].filter(Boolean).join(' · ') || 'Nessun dettaglio'}
          </p>
          {selected.notes && <p className="pet-notes">{selected.notes}</p>}

          {deadlines.length > 0 && (
            <>
              <p className="section-label">Prossime scadenze</p>
              {deadlines.map(ev => (
                <div key={ev.id} className="template-row">
                  <div className="template-info">
                    <strong>{eventEmoji(ev.event_type)} {ev.event_type}</strong>
                    <span className="hint">entro il {fmt(ev.next_due)}</span>
                  </div>
                  <button className="btn-primary btn-small" disabled={busy}
                    onClick={() => createTask(selected, ev)}>
                    → Attività
                  </button>
                </div>
              ))}
            </>
          )}

          <p className="section-label">Libretto sanitario</p>
          {events.length === 0 && (
            <p className="hint">Ancora vuoto: registra la prima visita o il primo vaccino.</p>
          )}
          {events.map(ev => (
            <div key={ev.id} className="template-row">
              <div className="template-info">
                <strong>{eventEmoji(ev.event_type)} {ev.event_type} · {fmt(ev.event_date)}</strong>
                {ev.notes && <span className="hint">{ev.notes}</span>}
                {ev.next_due && <span className="hint">↻ prossima: {fmt(ev.next_due)}</span>}
                {ev.photo_path && (
                  <a href={photoUrl(ev.photo_path)} target="_blank" rel="noreferrer" className="hint">
                    📷 Vedi foto allegata
                  </a>
                )}
              </div>
              <button className="task-delete" onClick={() => removeEvent(ev)} aria-label="Elimina voce">×</button>
            </div>
          ))}

          {addingEvent ? (
            <form className="template-form" onSubmit={saveEvent}>
              <div className="modal-grid">
                <select name="event_type" aria-label="Tipo di evento">
                  {EVENT_TYPES.map(t => (
                    <option key={t.label} value={t.label}>{t.emoji} {t.label}</option>
                  ))}
                </select>
                <label className="field-label">
                  Data
                  <input type="date" name="event_date"
                    defaultValue={new Date().toISOString().slice(0, 10)} required />
                </label>
              </div>
              <input name="notes" placeholder="Note (es. vaccino trivalente, 4.2 kg…)" />
              <label className="field-label">
                Prossima scadenza (opzionale, es. richiamo)
                <input type="date" name="next_due" />
              </label>
              <label className="field-label photo-field">
                📷 Foto (pagina del libretto, referto…)
                <input type="file" name="photo" accept="image/*" />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setAddingEvent(false)}>Annulla</button>
                <button className="btn-primary" disabled={busy}>Salva</button>
              </div>
            </form>
          ) : (
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => removePet(selected)}>Elimina animale</button>
              <button className="btn-ghost" onClick={() => setSelected(null)}>← Indietro</button>
              <button className="btn-primary" onClick={() => setAddingEvent(true)}>+ Registra evento</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // Vista: elenco animali
  // ============================================================
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>🐾 I nostri animali</h3>
        {pets.length === 0 && (
          <p className="hint">
            Nessun animale registrato. Aggiungine uno per tenere insieme
            cibo, allergie, microchip, visite e vaccini.
          </p>
        )}
        {pets.map(p => {
          const today = new Date().toISOString().slice(0, 10)
          const upcoming = p.pet_events.filter(ev => ev.next_due && ev.next_due >= today).length
          return (
            <div key={p.id} className="template-row pet-row" onClick={() => setSelected(p)}>
              <div className="template-info">
                <strong>{p.emoji} {p.name}</strong>
                <span className="hint">
                  {[p.breed, age(p.birth_date)].filter(Boolean).join(' · ') || '—'}
                  {upcoming > 0 && ` · ${upcoming} scadenz${upcoming === 1 ? 'a' : 'e'}`}
                </span>
              </div>
              <span className="hint">›</span>
            </div>
          )
        })}
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Chiudi</button>
          <button className="btn-primary" onClick={() => setEditingPet('new')}>+ Aggiungi animale</button>
        </div>
      </div>
    </div>
  )
}
