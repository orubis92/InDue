import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { useTasks } from './hooks/useTasks'
import Auth from './components/Auth'
import AddTaskForm from './components/AddTaskForm'
import FilterBar from './components/FilterBar'
import TaskList from './components/TaskList'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [filter, setFilter] = useState({ category: null, person: null })

  // Recupera la sessione salvata e resta in ascolto di login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const { tasks, categories, profiles, loading, addTask, toggleTask, deleteTask } =
    useTasks(session)

  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter.category && t.category_id !== filter.category) return false
      if (filter.person && t.assigned_to !== filter.person) return false
      return true
    })
  }, [tasks, filter])

  if (checking) return null
  if (!session) return <Auth />

  return (
    <>
      <header className="app-header">
        <h1>InDue<span className="dot">.</span></h1>
        <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>
          Esci
        </button>
      </header>

      <AddTaskForm
        categories={categories}
        profiles={profiles}
        onAdd={addTask}
      />

      <FilterBar
        categories={categories}
        profiles={profiles}
        filter={filter}
        onChange={setFilter}
      />

      {loading ? (
        <p className="empty-state">Carico le vostre attività…</p>
      ) : (
        <TaskList
          tasks={visibleTasks}
          profiles={profiles}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      )}
    </>
  )
}
