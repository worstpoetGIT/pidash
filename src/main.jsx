import { createRoot } from 'react-dom/client'
import '@fontsource/archivo-black'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './styles.css'
import { initHaptics } from './haptics.js'
import { Component } from 'react'
import App from './App.jsx'

// If anything ever fails to render, show a way out instead of a blank screen.
class Guard extends Component {
  state = { broken: false }
  static getDerivedStateFromError() { return { broken: true } }
  render() {
    if (!this.state.broken) return this.props.children
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 28, textAlign: 'center', background: 'var(--bg)', color: 'var(--ink)' }}>
        <div>
          <h2 style={{ fontFamily: 'Archivo Black', margin: '0 0 10px' }}>pidash hit a problem</h2>
          <p style={{ color: 'var(--ink-2)', margin: '0 0 22px' }}>Something on this screen failed to load. The Pi is unaffected.</p>
          <button className="btn" onClick={() => location.reload()}>Try again</button>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(<Guard><App /></Guard>)
initHaptics()
