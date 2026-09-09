import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { initI18n } from './lib/i18n'
import { initAccessibility } from './lib/accessibility'

// All applied before the first render so there's never a flash of the wrong theme, of English
// before the user's own language loads, or — most disorienting of the three — of default-size
// text that jumps once someone's 150% reading preference is read back.
initTheme()
initI18n()
initAccessibility()

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
