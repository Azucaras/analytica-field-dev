import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { readLocale } from './strings/locale-store'

// One address. A link to the former second route, /analise/<code>, becomes the
// same page with the analysis sheet open (#analise/<code>).
const legacy = window.location.pathname.match(/^\/analise(?:\/(\d+))?\/?$/)
if (legacy) window.history.replaceState(null, '', `/#analise${legacy[1] ? `/${legacy[1]}` : ''}`)

document.documentElement.lang = readLocale()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
