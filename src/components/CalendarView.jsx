import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const iso = d => d.toISOString().slice(0, 10)

/**
 * Calendario mensile delle scadenze: attività con data di scadenza
 * e richiami del libretto sanitario degli animali, mese per mese.
 * Tocca un giorno per vedere il dettaglio.
 */
export default function CalendarView({ tasks, onToggle, onClose }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(iso(today))
  const [petDeadlines, setPetDeadlines] = useState([])

  // Richiami degli animali (scadenze del libretto sanitario)
  useEffect(() => {
    supabase
      .from('pet_events')
      .select('id, event_type, next_due, pet:pets(name, emoji)')
      .not('next_due', 'is', null)
      .then(({ data }) => { if (data) setPetDeadlines(data) })
  }, [])

  // Mappa data -> voci (attività + richiami animali)
  const byDate = useMemo(() => {
    const map = new Map()
    const push = (date, item) => map.set(date, [...(map.get(date) ?? []), item])
    for (const t of tasks) {
      if (t.due_date && !t.done) {
        push(t.due_date, { kind: 'task', key: t.id, task: t })
      }
    }
    for (const ev of petDeadlines) {
      push(ev.next_due, { kind: 'pet', key: `pet-${ev.id}`, ev })
    }
    return map
  }, [tasks, petDeadlines])

  // Griglia del mese (settimane che iniziano di lunedì)
  const weeks = useMemo(() => {
    const first = new Date(year, month, 1)
    const start = new Date(first)
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
    const out = []
    const cursor = new Date(start)
    do {
      const week = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      out.push(week)
    } while (cursor.getMonth() === month)
    return out
  }, [year, month])

  function move(delta) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const todayIso = iso(today)
  const dayItems = byDate.get(selected) ?? []

  return (
    <div className="shopping-mode">
      <div className="shopping-header">
        <h2>📅 Scadenze</h2>
        <button className="btn-ghost" onClick={onClose}>✕ Chiudi</button>
      </div>

      <div className="cal-nav">
        <button className="btn-ghost" onClick={() => move(-1)} aria-label="Mese precedente">‹</button>
        <strong>{MESI[month]} {year}</strong>
        <button className="btn-ghost" onClick={() => move(1)} aria-label="Mese successivo">›</button>
      </div>

      <div className="cal-grid">
        {GIORNI.map(g => <div key={g} className="cal-dow">{g}</div>)}
        {weeks.flat().map(d => {
          const dIso = iso(d)
          const items = byDate.get(dIso) ?? []
          const isOther = d.getMonth() !== month
          const overdue = items.some(i => i.kind === 'task') && dIso < todayIso
          return (
            <button
              key={dIso}
              className={[
                'cal-day',
                isOther ? 'other' : '',
                dIso === todayIso ? 'today' : '',
                dIso === selected ? 'selected' : ''
              ].join(' ')}
              onClick={() => setSelected(dIso)}
            >
              <span>{d.getDate()}</span>
              <span className="cal-dots">
                {items.slice(0, 3).map(i => (
                  <i key={i.key} className={`cal-dot ${overdue ? 'overdue' : i.kind}`} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <p className="section-label">
        {new Date(selected + 'T00:00').toLocaleDateString('it-IT', {
          weekday: 'long', day: 'numeric', month: 'long'
        })}
      </p>
      {dayItems.length === 0 && <p className="hint">Nessuna scadenza in questo giorno.</p>}
      {dayItems.map(item =>
        item.kind === 'task' ? (
          <div key={item.key} className="template-row">
            <button
              className={`task-check ${item.task.done ? 'checked' : ''}`}
              onClick={() => onToggle(item.task)}
              aria-label="Segna come fatta"
            >✓</button>
            <div className="template-info">
              <strong>{item.task.title}</strong>
              {item.task.category && (
                <span className="hint">{item.task.category.emoji} {item.task.category.name}</span>
              )}
            </div>
          </div>
        ) : (
          <div key={item.key} className="template-row">
            <div className="template-info">
              <strong>{item.ev.pet?.emoji} {item.ev.event_type} — {item.ev.pet?.name}</strong>
              <span className="hint">richiamo dal libretto sanitario</span>
            </div>
          </div>
        )
      )}
    </div>
  )
}
