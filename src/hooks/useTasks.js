import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Carica attività, categorie e profili, e tiene la lista sincronizzata
 * in tempo reale: quando l'altra persona aggiunge/completa/elimina
 * un'attività, Supabase Realtime notifica questo dispositivo e la
 * lista viene ricaricata. Con due utenti, il "refetch completo" è
 * la strategia più semplice e più che sufficiente.
 */
export function useTasks(session) {
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(id, name, emoji, color)')
      .order('done', { ascending: true })
      .order('created_at', { ascending: false })
    if (!error && data) setTasks(data)
  }, [])

  // Caricamento iniziale
  useEffect(() => {
    if (!session) return
    let active = true
    async function load() {
      setLoading(true)
      const [{ data: cats }, { data: profs }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('profiles').select('*')
      ])
      if (!active) return
      if (cats) setCategories(cats)
      if (profs) setProfiles(profs)
      await fetchTasks()
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [session, fetchTasks])

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

  // --- Azioni -------------------------------------------------
  async function addTask({ title, categoryId, assignedTo, dueDate }) {
    const { error } = await supabase.from('tasks').insert({
      title,
      category_id: categoryId || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null
    })
    if (!error) fetchTasks() // aggiornamento immediato lato locale
    return error
  }

  async function toggleTask(task) {
    const done = !task.done
    // Aggiornamento ottimistico: la UI risponde subito
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, done } : t)))
    await supabase
      .from('tasks')
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq('id', task.id)
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  return { tasks, categories, profiles, loading, addTask, toggleTask, deleteTask }
}
