import { useEffect } from 'react'
import { ItemFormBody } from './ItemFormBody'
import './AddItemPanel.css'

export function AddItemPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // Escape closes the panel.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Lock background scroll so the page behind can't scroll (and so the catalog's
    // infinite scroll can't keep loading) while the full-screen panel is open.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div className="addpanel" role="dialog" aria-label="Add item" aria-modal="true">
      <div className="addpanel__head">
        <h2 className="addpanel__title">Add item</h2>
        <button type="button" className="btn btn--ghost addpanel__close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="addpanel__body">
        <div className="addpanel__inner">
          <ItemFormBody mode="add" onClose={onClose} />
        </div>
      </div>
    </div>
  )
}
