import type { CatalogFiltersState } from '../hooks/useCatalogFilters'
import { getCategoryColor } from '../lib/categoryColor'
import type { Category } from '../types'

interface ActiveFilterChipsProps {
  filters: CatalogFiltersState
}

interface ChipDef {
  key: string
  label: string
  onRemove: () => void
  /** Optional accent color (background tint) for the chip. */
  accentColor?: string
}

/** Renders one removable chip per active filter.  Renders nothing when no filter is active. */
export function ActiveFilterChips({ filters }: ActiveFilterChipsProps) {
  const chips: ChipDef[] = []

  if (filters.query) {
    chips.push({
      key: 'query',
      label: `"${filters.query}"`,
      onRemove: () => filters.setQuery(''),
    })
  }

  if (filters.category !== 'All') {
    chips.push({
      key: 'category',
      label: filters.category,
      onRemove: () => filters.setCategory('All'),
      accentColor: getCategoryColor(filters.category as Category),
    })
  }

  if (filters.materialType !== 'All') {
    chips.push({
      key: 'materialType',
      label: filters.materialType,
      onRemove: () => filters.setMaterialType('All'),
    })
  }

  if (filters.shelf !== 'All') {
    chips.push({
      key: 'shelf',
      label: `Shelf: ${filters.shelf}`,
      onRemove: () => filters.setShelf('All'),
    })
  }

  if (filters.uncatOnly) {
    chips.push({
      key: 'uncatOnly',
      label: 'Uncategorized only',
      onRemove: () => filters.setUncatOnly(false),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="active-chips" role="list" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="active-chip"
          role="listitem"
          style={
            chip.accentColor
              ? ({
                  '--chip-accent': chip.accentColor,
                } as React.CSSProperties)
              : undefined
          }
        >
          <span className="active-chip__label">{chip.label}</span>
          <button
            type="button"
            className="active-chip__remove"
            onClick={chip.onRemove}
            aria-label={`Remove filter: ${chip.label}`}
          >
            {/* U+00D7 multiplication sign -- renders as a clean small x */}
            {'×'}
          </button>
        </span>
      ))}
    </div>
  )
}
