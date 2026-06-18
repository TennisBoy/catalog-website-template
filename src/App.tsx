import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './screens/Dashboard'
import { Catalog } from './screens/Catalog'
import { ItemForm } from './screens/ItemForm'
import { ItemDetail } from './screens/ItemDetail'
import { ShelfView } from './screens/ShelfView'
import { Labels } from './screens/Labels'
import { Review } from './screens/Review'
import { ExportPage } from './screens/ExportPage'
import { useCatalog } from './store/useCatalog'

export function App() {
  const { readOnly } = useCatalog()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="shelves" element={<ShelfView />} />
        <Route path="labels" element={<Labels />} />
        <Route path="export" element={<ExportPage />} />

        {readOnly ? (
          // Public site: items open a read-only detail; no write routes exist.
          <Route path="item/:id" element={<ItemDetail />} />
        ) : (
          <>
            <Route path="add" element={<ItemForm />} />
            <Route path="item/:id" element={<ItemForm />} />
            <Route path="review" element={<Review />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
