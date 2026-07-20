import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Riconoscimento del reparto dal nome del prodotto (parole chiave).
const REPARTI = [
  ['🥬 Frutta e verdura', ['mela', 'banan', 'insalat', 'pomodor', 'zucchin', 'carot', 'patat', 'cipoll', 'frutta', 'verdur', 'limon', 'aranc', 'pesch', 'uva', 'melanzan', 'peperon', 'funghi', 'spinaci', 'basilico', 'prezzemolo', 'sedano', 'aglio']],
  ['🍞 Pane e colazione', ['pane', 'cracker', 'fette', 'biscott', 'cereali', 'brioche', 'marmellat', 'miele', 'caffè', 'caffe', 'tè', 'the ', 'zucchero', 'farina', 'lievito', 'merendine']],
  ['🧀 Latticini e uova', ['latte', 'yogurt', 'burro', 'formagg', 'mozzarell', 'parmigiano', 'grana', 'ricotta', 'uova', 'uovo', 'panna', 'stracchino']],
  ['🥩 Carne e pesce', ['carne', 'pollo', 'manzo', 'maiale', 'salsicc', 'prosciutt', 'salame', 'tonno', 'salmone', 'pesce', 'gamber', 'tacchino', 'bresaola', 'wurstel']],
  ['🧊 Surgelati', ['surgelat', 'gelato', 'pisell', 'bastoncini', 'minestrone']],
  ['🍝 Dispensa', ['pasta', 'riso', 'pelati', 'passata', 'olio', 'aceto', 'sale', 'pepe', 'legumi', 'fagioli', 'ceci', 'lentic', 'sugo', 'scatolett', 'mais', 'spezie', 'brodo']],
  ['🥤 Bevande', ['acqua', 'vino', 'birra', 'succo', 'coca', 'aranciata', 'bibite', 'spuma']],
  ['🧼 Casa e igiene', ['carta igienica', 'detersiv', 'sapone', 'shampoo', 'dentifric', 'spugn', 'sacchetti', 'ammorbident', 'deodorante', 'candeggina', 'scottex', 'tovaglioli', 'piatti carta']],
  ['🐾 Animali', ['crocchett', 'croccantini', 'lettiera', 'cibo gatto', 'cibo cane', 'bocconcini']]
]

function reparto(title) {
  const t = title.toLowerCase()
  for (const [nome, parole] of REPARTI) {
    if (parole.some(p => t.includes(p))) return nome
  }
  return '🛒 Altro'
}

/**
 * Modalità spesa: aggiunta rapidissima (invio dopo invio, il campo
 * resta attivo), voci raggruppate per reparto, tocco per spuntare.
 */
export default function ShoppingMode({ tasks, categories, onAdd, onToggle, onClose, onRefresh }) {
  const inputRef = useRef(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const spesaCategory = useMemo(
    () => categories.find(c => c.name === 'Spesa') ?? null,
    [categories]
  )

  const items = useMemo(
    () => tasks.filter(t => t.category_id === spesaCategory?.id),
    [tasks, spesaCategory]
  )
  const toBuy = items.filter(t => !t.done)
  const bought = items.filter(t => t.done)

  // Raggruppa per reparto, nell'ordine dei reparti del supermercato
  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of toBuy) {
      const r = reparto(t.title)
      map.set(r, [...(map.get(r) ?? []), t])
    }
    const order = [...REPARTI.map(r => r[0]), '🛒 Altro']
    return order.filter(r => map.has(r)).map(r => [r, map.get(r)])
  }, [toBuy])

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const clean = value.trim()
    if (!clean) return
    setValue('')
    await onAdd({ title: clean, notes: '', categoryId: spesaCategory?.id ?? '', assignedTo: '', dueDate: '', repeatDays: null })
    inputRef.current?.focus() // pronto per la prossima voce
  }

  /** Elimina le voci già comprate (solo quelle della spesa). */
  async function clearBought() {
    if (bought.length === 0) return
    setBusy(true)
    await supabase.from('tasks').delete()
      .eq('done', true)
      .eq('category_id', spesaCategory?.id)
    setBusy(false)
    onRefresh()
  }

  return (
    <div className="shopping-mode">
      <div className="shopping-header">
        <h2>🛒 Spesa</h2>
        <button className="btn-ghost" onClick={onClose}>✕ Chiudi</button>
      </div>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          ref={inputRef}
          placeholder="Aggiungi e premi invio…"
          value={value}
          onChange={e => setValue(e.target.value)}
          aria-label="Nuova voce spesa"
          enterKeyHint="done"
        />
        <button className="btn-primary" aria-label="Aggiungi">+</button>
      </form>

      {!spesaCategory && (
        <p className="hint">Categoria "Spesa" non trovata: ricrea la categoria dal Table Editor.</p>
      )}
      {toBuy.length === 0 && bought.length === 0 && (
        <p className="empty-state">Lista vuota: scrivi la prima voce qui sopra.</p>
      )}

      {grouped.map(([nome, list]) => (
        <div key={nome}>
          <p className="section-label">{nome}</p>
          {list.map(t => (
            <button key={t.id} className="shopping-item" onClick={() => onToggle(t)}>
              <span className="task-check" aria-hidden>​</span>
              {t.title}
            </button>
          ))}
        </div>
      ))}

      {bought.length > 0 && (
        <>
          <div className="done-header">
            <p className="section-label">Nel carrello · {bought.length}</p>
            <button className="btn-ghost" disabled={busy} onClick={clearBought}>Svuota</button>
          </div>
          {bought.map(t => (
            <button key={t.id} className="shopping-item done" onClick={() => onToggle(t)}>
              <span className="task-check checked" aria-hidden>✓</span>
              {t.title}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
