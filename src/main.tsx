import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'

// Applied before the first render so there's never a flash of the wrong light/dark theme.
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Service worker: production-only. Registering it in dev fights Vite's HMR (a stale cached
// asset can shadow a hot-updated one), so it's gated on import.meta.env.PROD.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[sw] registration failed', err)
    })
  })
}
