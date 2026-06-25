import { useMemo, useState } from 'react'
import type { Item } from '../types'
import { useCatalog } from '../store/useCatalog'
import { normalizeTitle } from '../lib/dedupe'
import { planLostRemoval } from '../lib/lostCopies'
import { CategoryBadge } from '../components/badges'
import { QuantityStepper } from '../components/QuantityStepper'
import { EmptyState } from '../components/EmptyState'
import './LostItem.css'

interface TitleGroup {
  title: string
  items: Item[]
}

/** Edition details that distinguish one copy of a title from another. */
function editionLine(it: Item): string {
  return [it.author, it.notes, it.isbn ? `ISBN ${it.isbn}` : '']
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' · ')
}

export function LostItem() {
  const { items, updateItem } = useCatalog()
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  // How many copies to mark lost per edition (defaults to 1 when untouched).
  const [counts, setCounts] = useState<Record<string, number>>({})

  const q = query.trim().toLowerCase()

  // Search by title or author, then group editions of the same title together so
  // the user can pick the right one when a title has more than one edition.
  const groups = useMemo<TitleGroup[]>(() => {
    if (!q) return []
    const matched = items.filter((it) => `${it.title} ${it.author ?? ''}`.toLowerCase().includes(q))
    const map = new Map<string, TitleGroup>()
    for (const it of matched) {
      const key = normalizeTitle(it.title)
      const g = map.get(key)
      if (g) g.items.push(it)
      else map.set(key, { title: it.title, items: [it] })
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title))
  }, [items, q])

  // Number of copies queued for removal on a row (default 1), never above stock.
  const countFor = (it: Item) => Math.min(counts[it.id] ?? 1, it.quantity)

  function markLost(it: Item) {
    const { remove, next } = planLostRemoval(it.quantity, countFor(it))
    if (remove <= 0) return
    updateItem(it.id, { quantity: next })
    setCounts((prev) => ({ ...prev, [it.id]: 1 }))
    setMessage(
      `Removed ${remove} ${remove === 1 ? 'copy' : 'copies'} of "${it.title}". ` +
        `${next} ${next === 1 ? 'copy' : 'copies'} left.`,
    )
  }

  return (
    <div className="page">
      <header className="page__head">
        <p className="eyebrow">English Department</p>
        <h1>Report a lost copy</h1>
      </header>

      <div className="lost-search">
        <span className="lost-search__icon" aria-hidden>
          🔎
        </span>
        <input
          className="input lost-search__input"
          type="search"
          placeholder="Search title or author…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setMessage(null)
          }}
          autoFocus
          aria-label="Search for a lost title"
        />
      </div>

      {message && (
        <div className="lost-msg" role="status">
          {message}
        </div>
      )}

      {!q ? (
        <p className="muted lost-hint">Start typing a title to find it.</p>
      ) : groups.length === 0 ? (
        <EmptyState icon="🔍" title="No match" hint="No title matches that search. Check the spelling." />
      ) : (
        <ul className="lost-groups">
          {groups.map((g) => (
            <li key={g.title + g.items[0].id} className="lost-group">
              <div className="lost-group__head">
                <span className="lost-group__title">{g.title}</span>
                {g.items.length > 1 && (
                  <span className="lost-group__count">{g.items.length} editions, choose one</span>
                )}
              </div>
              <ul className="lost-editions">
                {g.items.map((it) => {
                  const line = editionLine(it)
                  const out = it.quantity <= 0
                  return (
                    <li key={it.id} className="card lost-row">
                      <div className="lost-row__body">
                        <div className="lost-row__tags">
                          <CategoryBadge category={it.category} />
                          <span className="lost-row__qty">
                            {it.quantity} {it.quantity === 1 ? 'copy' : 'copies'}
                          </span>
                        </div>
                        {line && <span className="lost-row__edition muted">{line}</span>}
                        <span className="lost-row__loc muted">
                          📍 {it.location.shelf.trim() || it.location.section.trim() || 'No location'}
                        </span>
                      </div>
                      <div className="lost-row__actions">
                        {!out && (
                          <QuantityStepper
                            value={countFor(it)}
                            onChange={(n) =>
                              setCounts((prev) => ({
                                ...prev,
                                [it.id]: Math.min(Math.max(1, n), it.quantity),
                              }))
                            }
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn--danger lost-row__btn"
                          onClick={() => markLost(it)}
                          disabled={out}
                        >
                          {out
                            ? 'Out of copies'
                            : `Mark ${countFor(it)} lost`}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
