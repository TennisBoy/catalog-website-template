import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCatalog } from '../store/useCatalog'
import { ItemFormBody } from '../components/ItemFormBody'
import './ItemForm.css'

export function ItemForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getItem } = useCatalog()
  const existing = id ? getItem(id) : undefined

  // Edit mode but the id doesn't resolve to a real item.
  if (!existing) {
    return (
      <div className="page">
        <div className="page__head">
          <h1>Item not found</h1>
        </div>
        <p className="muted form-notfound">
          That item no longer exists. <Link to="/catalog">Back to the catalog</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head form-head">
        <Link to="/catalog" className="btn btn--ghost form-close" aria-label="Close">
          ✕
        </Link>
        <h1>Edit item</h1>
      </div>
      <ItemFormBody mode="edit" existing={existing} onClose={() => navigate('/catalog')} />
    </div>
  )
}
