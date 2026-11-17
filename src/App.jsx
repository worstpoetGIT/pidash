import { useEffect, useState } from 'react'
import Icon from './components/Icon.jsx'
import Home from './components/Home.jsx'
import Stats from './components/Stats.jsx'
import Security from './components/Security.jsx'
import { useStore } from './store.js'
import { usePi } from './data.js'
import { haptic } from './haptics.js'

const TABS = [['home', 'city', 'Pi'], ['stats', 'chart', 'Stats'], ['security', 'shield', 'Security']]

export default function App() {
  const s = useStore()
  const pi = usePi()
  const [tab, setTab] = useState('home')

  useEffect(() => {
    const el = document.documentElement
    if (s.appearance === 'light' || s.appearance === 'dark') el.dataset.theme = s.appearance
    else delete el.dataset.theme
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const paint = () => {
      const dark = s.appearance === 'dark' || (s.appearance !== 'light' && mq.matches)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#ffffff')
    }
    paint()
    mq.addEventListener('change', paint)
    return () => mq.removeEventListener('change', paint)
  }, [s.appearance])

  return (
    <div className="app">
      <Home s={s} pi={pi} active={tab === 'home'} />
      {tab !== 'home' && <div className="top-cover" />}
      {tab === 'stats' && <Stats pi={pi} />}
      {tab === 'security' && <Security />}

      <nav className="tabbar three">
        {TABS.map((t) => (
          <button key={t[0]} className={'tab' + (tab === t[0] ? ' on' : '')} onClick={() => { haptic('light'); setTab(t[0]) }}>
            <Icon name={t[1]} size={24} />{t[2]}
          </button>
        ))}
      </nav>
    </div>
  )
}
