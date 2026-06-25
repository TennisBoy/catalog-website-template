interface ConfirmDeleteDialogProps {
  onConfirm(): void
  onCancel(): void
}

/**
 * Inline delete-confirmation prompt extracted from ItemForm.
 * Rendered inline (not a modal) inside the caller's ternary when confirmDelete is true.
 */
export function ConfirmDeleteDialog({
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  return (
    <div className="form-confirm">
      <span className="form-confirm__msg">Delete this item?</span>
      <div className="form-confirm__btns">
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          Yes, delete
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
