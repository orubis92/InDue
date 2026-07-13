import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Liste riutilizzabili: crei una volta la lista "Valigia mare"
 * (costume, caricabatterie, documenti…) e a ogni partenza la
 * aggiungi alle attività con un tocco, invece di riscriverla.
 */
export default function Templates({ categories, onClose, onApplied }) {
  const [templates, setTemplates] = useState([])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemsText, setItemsText] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('templates')
      .select('*, template_items(*)')
      .order('created_at')
    if (data) setTemplates(data)
  }
  useEffect(() => { load() }, [])

  /** Trasforma tutte le voci della lista in attività da fare. */
  async function apply(template) {
    setBusy(true)
    const rows = template.template_items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => ({ title: item.title, category_id: template.category_id }))
    if (rows.length) await supabase.from('tasks').insert(rows)
    setBusy(false)
    onApplied()
    onClose()
  }

  async function create(e) {
    e.preventDefault()
    const items = itemsText.split('\n').map(s => s.trim()).filter(Boolean)
    if (!name.trim() || items.length === 0) return
    setBusy(true)
    const { data: tpl } = await supabase
      .from('templates')
      .insert({ name: name.trim(), category_id: categoryId || null })
      .select()
      .single()
    if (tpl) {
      await supabase.from('template_items').insert(
        items.map((title, i) => ({ template_id: tpl.id, title, sort_order: i }))
      )
    }
    setName(''); setItemsText(''); setCreating(false); setBusy(false)
    load()
  }

  async function remove(template) {
    if (!confirm(`Eliminare la lista "${template.name}"?`)) return
    await supabase.from('templates').delete().eq('id', template.id)
    load()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>🧳 Liste riutilizzabili</h3>

        {templates.length === 0 && !creating && (
          <p className="hint">
            Nessuna lista salvata. Creane una — ad esempio "Valigia mare" —
            e potrai aggiungerla alle attività a ogni partenza.
          </p>
        )}

        {templates.map(t => (
          <div key={t.id} className="template-row">
            <div className="template-info">
              <strong>{t.emoji} {t.name}</strong>
              <span className="hint">{t.template_items.length} voci</span>
            </div>
            <button className="btn-primary btn-small" disabled={busy} onClick={() => apply(t)}>
              Aggiungi
            </button>
            <button className="task-delete" onClick={() => remove(t)} aria-label={`Elimina lista ${t.name}`}>
              ×
            </button>
          </div>
        ))}

        {creating ? (
          <form onSubmit={create} className="template-form">
            <input
              placeholder="Nome della lista (es. Valigia mare)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} aria-label="Categoria delle attività">
              <option value="">Nessuna categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
            <textarea
              className="notes-input"
              placeholder={'Una voce per riga:\nCostumi\nCaricabatterie\nDocumenti'}
              rows={6}
              value={itemsText}
              onChange={e => setItemsText(e.target.value)}
              required
            />
            <div className="modal-actions">
              <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>Annulla</button>
              <button className="btn-primary" disabled={busy}>Salva lista</button>
            </div>
          </form>
        ) : (
          <div className="modal-actions">
            <button className="btn-ghost" onClick={onClose}>Chiudi</button>
            <button className="btn-primary" onClick={() => setCreating(true)}>+ Nuova lista</button>
          </div>
        )}
      </div>
    </div>
  )
}
