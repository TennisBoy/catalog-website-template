import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './styles/global.css'
import './components/components.css'
import { CatalogProvider } from './store/useCatalog'
import { App } from './App'

// HashRouter so the static SPA works on GitHub Pages / file hosting without
// server-side route rewrites.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <CatalogProvider>
        <App />
      </CatalogProvider>
    </HashRouter>
  </StrictMode>,
)
