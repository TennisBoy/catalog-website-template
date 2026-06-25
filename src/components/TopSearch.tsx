import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalog } from '../store/useCatalog'
import './TopSearch.css'

const MIN_CHARS = 3
const MAX_SUGGESTIONS = 8

/** Top-bar catalog search with a typeahead: once 3+ characters are typed it
 *  suggests matching books; picking one opens that item, Enter searches the
 *  whole catalog. */
export function TopSearch() {
  const { items } = useCatalog()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const query = q.trim().toLowerCase()

  const suggestions = useMemo(() => {
    if (query.length < MIN_CHARS) return []
    return items
      .filter((it) => `${it.title} ${it.author ?? ''}`.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS)
  }, [items, query])

  const showList = open && query.length >= MIN_CHARS

  function submit(e: React.FormEvent) {
    e.preventDefault()
    navigate('/catalog' + (q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''))
    setOpen(false)
  }

  function pick(id: string) {
    setOpen(false)
    setQ('')
    navigate(`/item/${id}`)
  }

  return (
    <div className="topsearch">
      <form className="topbar__search" onSubmit={submit} role="search">
        <span aria-hidden>🔍</span>
        <input
          type="search"
          placeholder="Search the catalog…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          aria-label="Search the catalog"
          aria-expanded={showList}
          autoComplete="off"
        />
      </form>

      {showList && (
        <ul className="topsearch__list">
          {suggestions.length === 0 ? (
            <li className="topsearch__empty muted">No titles match “{q.trim()}”.</li>
          ) : (
            suggestions.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  className="topsearch__item"
                  // Keep the input focused so onBlur doesn't close the list before the click lands.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(it.id)}
                >
                  <span className="topsearch__title">{it.title}</span>
                  <span className="topsearch__meta muted">
                    {[it.author, it.category, it.location.shelf.trim() ? `Shelf ${it.location.shelf}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
