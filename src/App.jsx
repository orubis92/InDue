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
import ShoppingMode from './components/ShoppingMode'
import CalendarView from './components/CalendarView'
import MenuSheet from './components/MenuSheet'

/** Legge titolo/testo/link condivisi da altre app (Web Share Target). */
function readSharePrefill() {
  const params = new URLSearchParams(window.location.search)
  const title = params.get('title') || params.get('text') || ''
  const url = params.get('url') || ''
  if (!title && !url) return null
  window.history.replaceState({}, '', window.location.pathname)
  return {
    title: title || 'Link condiviso',
    notes: url && url !== title ? url : ''
  }
}

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [filter, setFilter] = useState({ category: null, person: null })
  const [editingTask, setEditingTask] = useState(null)
  const [view, setView] = useState(null) // null | 'shopping' | 'calendar'
  const [showTemplates, setShowTemplates] = useState(false)
  const [showPets, setShowPets] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sharePrefill] = useState(readSharePrefill)

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

  // Badge sull'icona dell'app: numero delle attività da fare
  const todoCount = useMemo(() => tasks.filter(t => !t.done).length, [tasks])
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return
    if (todoCount > 0) navigator.setAppBadge(todoCount).catch(() => {})
    else navigator.clearAppBadge?.().catch(() => {})
  }, [todoCount])

  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter.category && t.category_id !== filter.category) return false
      if (filter.person && t.assigned_to !== filter.person) return false
      return true
    })
  }, [tasks, filter])

  /** Backup completo dei dati in un file JSON. */
  async function exportData() {
    setExporting(true)
    const tables = ['categories', 'profiles', 'tasks', 'templates',
      'template_items', 'pets', 'pet_events']
    const backup = { esportato_il: new Date().toISOString() }
    for (const t of tables) {
      const { data } = await supabase.from(t).select('*')
      backup[t] = data ?? []
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `indue-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setExporting(false)
    setShowMenu(false)
  }

  if (checking) return null
  if (!session) return <Auth />

  // Viste a schermo intero (spesa e calendario)
  if (view === 'shopping') {
    return (
      <ShoppingMode
        tasks={tasks}
        categories={categories}
        onAdd={addTask}
        onToggle={toggleTask}
        onRefresh={refresh}
        onClose={() => setView(null)}
      />
    )
  }
  if (view === 'calendar') {
    return (
      <CalendarView
        tasks={tasks}
        onToggle={toggleTask}
        onClose={() => setView(null)}
      />
    )
  }

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
          <button className="btn-ghost" onClick={() => setView('shopping')} title="Modalità spesa">
            🛒
          </button>
          <button className="btn-ghost" onClick={() => setView('calendar')} title="Calendario scadenze">
            📅
          </button>
          <button className="btn-ghost" onClick={() => setShowMenu(true)} title="Menu" aria-label="Menu">
            ⋯
          </button>
        </div>
      </header>

      <AddTaskForm
        key={sharePrefill ? 'share' : 'std'}
        categories={categories}
        profiles={profiles}
        onAdd={addTask}
        initial={sharePrefill}
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

      {showMenu && (
        <MenuSheet
          push={push}
          exporting={exporting}
          onTemplates={() => setShowTemplates(true)}
          onPets={() => setShowPets(true)}
          onExport={exportData}
          onLogout={() => supabase.auth.signOut()}
          onClose={() => setShowMenu(false)}
        />
      )}
    </>
  )
}
