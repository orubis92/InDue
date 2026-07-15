import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { useTasks } from './hooks/useTasks'
import { usePush } from './hooks/usePush'
import Auth from './components/Auth'
import AddTaskForm from './components/AddTaskForm'
import FilterBar from './components/FilterBar'
import TaskList from './components/TaskList'
import EditTaskModal from './components/EditTaskModal'
import Templates from './components/Templates'
import Pets from './components/Pets'

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [filter, setFilter] = useState({ category: null, person: null })
  const [editingTask, setEditingTask] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPets, setShowPets] = useState(false)

  // Recupera la sessione salvata e resta in ascolto di login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const {
    tasks, categories, profiles, loading, online,
    addTask, updateTask, toggleTask, deleteTask, clearDone, refresh
  } = useTasks(session)

  const push = usePush(session)

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
      {!online && (
        <div className="offline-banner">
          📵 Sei offline — le modifiche verranno sincronizzate al ritorno della rete
        </div>
      )}

      <header className="app-header">
        <h1>InDue<span className="dot">.</span></h1>
        <div className="header-actions">
          {push.supported && (
            <button
              className="btn-ghost"
              onClick={push.toggle}
              disabled={push.busy}
              title={push.enabled
                ? 'Notifiche attive su questo dispositivo'
                : 'Attiva le notifiche su questo dispositivo'}
            >
              {push.enabled ? '🔔' : '🔕'}
            </button>
          )}
          <button className="btn-ghost" onClick={() => setShowTemplates(true)} title="Liste riutilizzabili">
            🧳
          </button>
          <button className="btn-ghost" onClick={() => setShowPets(true)} title="I nostri animali">
            🐾
          </button>
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>
            Esci
          </button>
        </div>
      </header>

      <AddTaskForm categories={categories} profiles={profiles} onAdd={addTask} />

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
          onEdit={setEditingTask}
          onClearDone={clearDone}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          categories={categories}
          profiles={profiles}
          onSave={updateTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {showTemplates && (
        <Templates
          categories={categories}
          onClose={() => setShowTemplates(false)}
          onApplied={refresh}
        />
      )}

      {showPets && (
        <Pets
          categories={categories}
          onClose={() => setShowPets(false)}
          onTaskCreated={refresh}
        />
      )}
    </>
  )
}
