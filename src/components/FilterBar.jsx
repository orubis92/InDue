/** Chip scorrevoli per filtrare per categoria o per persona. */
export default function FilterBar({ categories, profiles, filter, onChange }) {
  const setCategory = id =>
    onChange({ ...filter, category: filter.category === id ? null : id })
  const setPerson = id =>
    onChange({ ...filter, person: filter.person === id ? null : id })

  return (
    <div className="filter-bar" role="toolbar" aria-label="Filtri">
      <button
        className={`chip ${!filter.category && !filter.person ? 'active' : ''}`}
        onClick={() => onChange({ category: null, person: null })}
      >
        Tutte
      </button>
      {categories.map(c => (
        <button
          key={c.id}
          className={`chip ${filter.category === c.id ? 'active' : ''}`}
          onClick={() => setCategory(c.id)}
        >
          {c.emoji} {c.name}
        </button>
      ))}
      {profiles.map(p => (
        <button
          key={p.id}
          className={`chip ${filter.person === p.id ? 'active' : ''}`}
          onClick={() => setPerson(p.id)}
        >
          {p.display_name}
        </button>
      ))}
    </div>
  )
}
