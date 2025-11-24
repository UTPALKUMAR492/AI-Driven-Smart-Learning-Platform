import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/variables.css'
import './styles/global.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'
import installSafeConsole from './utils/safeConsole'

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <ToastContainer position="top-right" autoClose={2500} />
  </>
)

// Global safe error handlers to catch unhandled rejections and window errors
window.addEventListener('unhandledrejection', (e) => {
  try {
    const reason = e?.reason
    const msg = reason && reason.message ? reason.message : String(reason)
    console.warn('Unhandled promise rejection:', msg)
  } catch (err) { console.warn('Unhandled promise rejection (unserializable)') }
})

window.addEventListener('error', (e) => {
  try { console.warn('Window error:', e?.error?.message || e?.message || String(e)) } catch (err) { console.warn('Window error (unserializable)') }
})

// Install safe console wrappers before any other logging happens
installSafeConsole()
