import { useCatalog } from '../store/useCatalog'
import { reviewBuckets, attentionCount } from '../store/selectors'
import { getCategoryColor } from '../lib/categoryColor'
import { UNCATEGORIZED } from '../types'
import { EmptyState } from '../components/EmptyState'
import { ReviewGroup } from './review/shared'
import { UncategorizedGroup } from './review/UncategorizedGroup'
import { DuplicateRow } from './review/DuplicatesGroup'
import { MissingQtyGroup } from './review/MissingQtyGroup'
import { NoLocationGroup } from './review/ShelfGapsGroup'
import { NeedsReviewGroup } from './review/NeedsReviewGroup'
import './Review.css'

export function Review() {
  const { items } = useCatalog()
  const buckets = reviewBuckets(items)
  const total = attentionCount(buckets)

  return (
    <div className="page">
      <header className="page__head">
        <p className="eyebrow">English Department</p>
        <h1>Review &amp; Cleanup</h1>
        {total > 0 ? (
          <p className="rev-count">
            <strong>{total}</strong> {total === 1 ? 'item needs' : 'items need'} attention
          </p>
        ) : (
          <p className="muted">Every gap in the catalog, gathered into one tidy to-do list.</p>
        )}
      </header>

      {total === 0 ? (
        <EmptyState
          icon="🎉"
          title="Everything's tidy"
          hint="No uncategorized items, missing quantities, empty shelves, duplicates, or flags. Nicely done."
        />
      ) : (
        <div className="rev-groups">
          <ReviewGroup
            title="Uncategorized"
            hint="Give each item a category. Tick several and assign them all at once."
            count={buckets.uncategorized.length}
            tone={getCategoryColor(UNCATEGORIZED)}
          >
            <UncategorizedGroup items={buckets.uncategorized} />
          </ReviewGroup>

          <ReviewGroup
            title="Possible duplicates"
            hint="The same edition on more than one row. Merge adds the copies together, “Keep only this” deletes the other rows, or “Keep both” dismisses the warning."
            count={buckets.duplicateGroups.length}
            tone="#7c3aed"
          >
            <ul className="rev-list">
              {buckets.duplicateGroups.map((g) => (
                <DuplicateRow key={g.key} items={g.items} />
              ))}
            </ul>
          </ReviewGroup>

          <ReviewGroup
            title="Missing quantity"
            hint="Set how many copies are on hand. Tick several to set them together."
            count={buckets.missingQuantity.length}
            tone="var(--warn)"
          >
            <MissingQtyGroup items={buckets.missingQuantity} />
          </ReviewGroup>

          <ReviewGroup
            title="No shelf / location"
            hint="Items without a shelf. Add a shelf to any you want shelved; it's optional, so it's fine to leave some unshelved. Tick several to set them together."
            count={buckets.noLocation.length}
            tone="var(--warn)"
          >
            <NoLocationGroup items={buckets.noLocation} />
          </ReviewGroup>

          <ReviewGroup
            title="Marked “Needs review”"
            hint="Flagged by a person. Resolve the note, then mark cataloged, singly or in bulk."
            count={buckets.needsReview.length}
            tone="var(--danger)"
          >
            <NeedsReviewGroup items={buckets.needsReview} />
          </ReviewGroup>
        </div>
      )}
    </div>
  )
}
