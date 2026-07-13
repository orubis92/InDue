import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Dati + sincronizzazione dell'app.
 *
 * Novità v2:
 * - updateTask: modifica di titolo, note, categoria, persona, scadenza, ricorrenza
 * - ricorrenze: completando un'attività con repeat_days, la prossima
 *   occorrenza viene creata automaticamente
 * - done_by: registra chi ha completato l'attività
 * - clearDone: elimina tutte le attività fatte
 * - offline: i dati vengono conservati in cache locale e le modifiche
 *   fatte senza rete finiscono in una coda, sincronizzata al ritorno
 *   della connessione
 */

const CACHE_KEY = 'indue-cache-v2'
const QUEUE_KEY = 'indue-queue-v2'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const getQueue = () => readJSON(QUEUE_KEY, [])
const setQueue = q => localStorage.setItem(QUEUE_KEY, JSON.stringify(q))

export function useTasks(session) {
  const cached = useRef(readJSON(CACHE_KEY, null))
  const [tasks, setTasks] = useState(cached.current?.tasks ?? [])
  const [categories, setCategories] = useState(cached.current?.categories ?? [])
  const [profiles, setProfiles] = useState(cached.current?.profiles ?? [])
  const [loading, setLoading] = useState(!cached.current)
  const [online, setOnline] = useState(navigator.onLine)

  // Cache locale: permette di aprire l'app e vedere le liste anche offline
  useEffect(() => {
    if (tasks.length || categories.length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ tasks, categories, profiles }))
    }
  }, [tasks, categories, profiles])

  const fetchTasks = useCallback(async () => {
    if (!navigator.onLine) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(id, name, emoji, color)')
      .order('done', { ascending: true })
      .order('created_at', { ascending: false })
    if (!error && data) setTasks(data)
  }, [])

  // Svuota la coda delle modifiche fatte offline, poi ricarica
  const flushQueue = useCallback(async () => {
    const queue = getQueue()
    for (const op of queue) {
      try {
        if (op.type === 'add') await supabase.from('tasks').insert(op.payload)
        if (op.type === 'update') await supabase.from('tasks').update(op.payload).eq('id', op.id)
        if (op.type === 'delete') await supabase.from('tasks').delete().eq('id', op.id)
      } catch {
        /* se una singola operazione fallisce, non blocca le altre */
      }
    }
    setQueue([])
    await fetchTasks()
  }, [fetchTasks])

  // Caricamento iniziale
  useEffect(() => {
    if (!session) return
    let active = true
    async function load() {
      if (!navigator.onLine) { setLoading(false); return }
      const [{ data: cats }, { data: profs }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('profiles').select('*')
      ])
      if (!active) return
      if (cats) setCategories(cats)
      if (profs) setProfiles(profs)
      await flushQueue() // sincronizza eventuali modifiche offline pendenti
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [session, flushQueue])

  // Ritorno/perdita della connessione
  useEffect(() => {
    const onOnline = () => { setOnline(true); flushQueue() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [flushQueue])

  // Sottoscrizione realtime
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session, fetchTasks])

  // --- Helper -------------------------------------------------
  const findCategory = id => categories.find(c => c.id === id) || null

  function queueOp(op) {
    const queue = getQueue()
    // Operazioni su attività create offline (id "local-...") vengono
    // fuse con l'inserimento pendente, che non è ancora sul server.
    if (op.id?.startsWith?.('local-')) {
      const pending = queue.find(q => q.type === 'add' && q.localId === op.id)
      if (pending) {
        if (op.type === 'delete') setQueue(queue.filter(q => q !== pending))
        if (op.type === 'update') {
          Object.assign(pending.payload, op.payload)
          setQueue(queue)
        }
        return
      }
    }
    setQueue([...queue, op])
  }

  // --- Azioni -------------------------------------------------
  async function addTask({ title, notes, categoryId, assignedTo, dueDate, repeatDays }) {
    const payload = {
      title,
      notes: notes || null,
      category_id: categoryId || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      repeat_days: repeatDays || null
    }
    if (!navigator.onLine) {
      const localId = `local-${Date.now()}`
      setTasks(prev => [{
        ...payload,
        id: localId,
        done: false,
        done_at: null,
        done_by: null,
        created_at: new Date().toISOString(),
        category: findCategory(payload.category_id)
      }, ...prev])
      queueOp({ type: 'add', localId, payload })
      return null
    }
    const { error } = await supabase.from('tasks').insert(payload)
    if (!error) fetchTasks()
    return error
  }

  async function updateTask(id, patch) {
    // Aggiornamento ottimistico, ricostruendo la categoria per la UI
    setTasks(prev => prev.map(t => (
      t.id === id
        ? { ...t, ...patch, category: 'category_id' in patch ? findCategory(patch.category_id) : t.category }
        : t
    )))
    if (!navigator.onLine) {
      queueOp({ type: 'update', id, payload: patch })
      return
    }
    await supabase.from('tasks').update(patch).eq('id', id)
    fetchTasks()
  }

  async function toggleTask(task) {
    const done = !task.done
    const patch = {
      done,
      done_at: done ? new Date().toISOString() : null,
      done_by: done ? session.user.id : null
    }
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, ...patch } : t)))

    // Ricorrenza: completando, nasce la prossima occorrenza
    let nextTask = null
    if (done && task.repeat_days) {
      const base = task.due_date ? new Date(task.due_date + 'T00:00') : new Date()
      base.setDate(base.getDate() + task.repeat_days)
      nextTask = {
        title: task.title,
        notes: task.notes,
        category_id: task.category_id,
        assigned_to: task.assigned_to,
        repeat_days: task.repeat_days,
        due_date: base.toISOString().slice(0, 10)
      }
    }

    if (!navigator.onLine) {
      queueOp({ type: 'update', id: task.id, payload: patch })
      if (nextTask) {
        const localId = `local-${Date.now()}`
        setTasks(prev => [{
          ...nextTask,
          id: localId,
          done: false,
          done_at: null,
          done_by: null,
          created_at: new Date().toISOString(),
          category: findCategory(nextTask.category_id)
        }, ...prev])
        queueOp({ type: 'add', localId, payload: nextTask })
      }
      return
    }

    await supabase.from('tasks').update(patch).eq('id', task.id)
    if (nextTask) await supabase.from('tasks').insert(nextTask)
    fetchTasks()
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (!navigator.onLine) {
      queueOp({ type: 'delete', id })
      return
    }
    await supabase.from('tasks').delete().eq('id', id)
  }

  /** Elimina tutte le attività completate. */
  async function clearDone() {
    setTasks(prev => prev.filter(t => !t.done))
    if (!navigator.onLine) {
      // offline: accoda l'eliminazione una per una
      tasks.filter(t => t.done).forEach(t => queueOp({ type: 'delete', id: t.id }))
      return
    }
    await supabase.from('tasks').delete().eq('done', true)
    fetchTasks()
  }

  return {
    tasks, categories, profiles, loading, online,
    addTask, updateTask, toggleTask, deleteTask, clearDone, refresh: fetchTasks
  }
}
