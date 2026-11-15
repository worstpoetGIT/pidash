import { useEffect, useRef, useState } from 'react'
import { CityScene } from '../CityScene.js'
import Icon from './Icon.jsx'
import { Meter } from './Stats.jsx'
import { fmtUptime } from '../data.js'
import { useDark } from '../hooks.js'
import { haptic } from '../haptics.js'
import { MAP_LIST } from '../maps.js'
import { setState } from '../store.js'

const MODES = ['system', 'light', 'dark']
const MODE_ICON = { system: 'auto', light: 'sun', dark: 'moon' }
const MODE_LABEL = { system: 'System', light: 'Light', dark: 'Dark' }

const FILTERS = [
  { id: null, label: 'All Pi', icon: 'city', color: '#5b54e8' },
  { id: 'Hardware', label: 'Hardware', icon: 'chip', color: '#3a86ff' },
  { id: 'Services', label: 'Services', icon: 'repeat', color: '#d62f8b' },
]

export default function Home({ s, pi, active }) {
  const box = useRef(null)
  const scene = useRef(null)
  const dark = useDark()
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState(null)
  const [moved, setMoved] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const mapMeta = MAP_LIST.find((m) => m.id === s.map) || MAP_LIST[0]
  const { counties: list, stats, offline } = pi

  useEffect(() => {
    const sc = new CityScene(box.current, {
      onSelect: (id) => { if (id) haptic('light'); setSel(id) },
      onViewChanged: (m) => setMoved(m),
    })
    scene.current = sc
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_HOOK) window.__scene = sc
    return () => { sc.dispose(); scene.current = null }
  }, [])

  useEffect(() => { if (list.length) scene.current?.setCounties(list) }, [list])
  useEffect(() => { scene.current?.setMap(s.map) }, [s.map])
  useEffect(() => { scene.current?.setDark(dark) }, [dark])
  useEffect(() => { scene.current?.select(sel) }, [sel])
  useEffect(() => { scene.current?.setFilter(filter) }, [filter])
  useEffect(() => { if (active) scene.current?.start(); else scene.current?.stop() }, [active])

  const selC = list.find((c) => c.id === sel)
  const shown = list.filter((c) => !filter || c.group === filter)

  return (
    <div className={'home' + (mapMeta.hud === 'light' && !dark ? ' hud-light' : '')} style={{ display: active ? 'block' : 'none' }}>
      <div className="scene" ref={box} />

      <div className="home-top">
        <div className="spent-label">pidash <span className="muted" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14.4 }}>{offline ? 'offline' : 'uptime'}</span></div>
        <div className="spent-amt">{stats ? fmtUptime(stats.uptime_seconds) : '—'}</div>
        <div className="filters">
          {FILTERS.map((f) => (
            <button key={f.label} className={'filt' + (filter === f.id ? ' on' : '')} onClick={() => { haptic('light'); setSel(null); setFilter(f.id) }}>
              <span className="ring"><Icon name={f.icon} size={22} color={f.color} /></span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <button className="map-btn" onClick={() => setMapOpen(true)} aria-label="Change map"><Icon name="map" size={22} /></button>
      <button className="map-btn mode-btn" onClick={() => { haptic('light'); setState((st) => ({ ...st, appearance: MODES[(MODES.indexOf(st.appearance) + 1) % 3] })) }} aria-label={'Appearance: ' + MODE_LABEL[s.appearance]}>
        <Icon name={MODE_ICON[s.appearance]} size={22} />
      </button>
      {mapOpen && (
        <>
          <div className="map-scrim" onClick={() => setMapOpen(false)} />
          <div className="map-sheet fade-up">
            <div className="row" style={{ marginBottom: 10 }}>
              <b className="sp display" style={{ fontSize: 24 }}>Maps</b>
              <button className="x-btn" onClick={() => setMapOpen(false)} aria-label="Close"><Icon name="x" size={16} /></button>
            </div>
            <div className="map-row">
              {MAP_LIST.map((m) => (
                <button key={m.id} className={'map-card' + (m.id === mapMeta.id ? ' on' : '')} onClick={() => { haptic('light'); setSel(null); setState((st) => ({ ...st, map: m.id })); setMapOpen(false) }}>
                  <span className="map-thumb" style={{ background: `linear-gradient(180deg, ${m.sky[0]}, ${m.sky[1]})` }}>
                    <i className="g" style={{ background: m.ground }} />
                    <i className="r" style={{ background: m.road }} />
                    {m.accent.map((c, k) => <i key={k} className={'b b' + k} style={{ background: c }} />)}
                  </span>
                  <span className="map-name">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="dock">
        {moved && <button className="recenter" style={{ bottom: 'calc(100% + 10px)' }} onClick={() => scene.current?.recenter()}>
          <Icon name="up" size={14} /> Recenter
        </button>}
        {selC ? (
          <div className="card fade-up">
            <div className="row">
              <div className="ico-circle" style={{ background: selC.color + '26', color: selC.color }}><Icon name={selC.icon} size={24} /></div>
              <div className="sp">
                <b style={{ fontSize: 20.4 }}>{selC.name}</b>
                <div className="muted" style={{ fontSize: 15.6, marginTop: 2 }}>{selC.headline}</div>
              </div>
              <button className="x-btn" onClick={() => setSel(null)} aria-label="Close"><Icon name="x" size={16} /></button>
            </div>
            <div style={{ marginTop: 8, maxHeight: '28vh', overflowY: 'auto' }}>
              {selC.rows.map((r) => (
                <div key={r.label} style={{ padding: '5px 0' }}>
                  <div className="bd-row" style={{ padding: 0 }}>
                    <span className="sp">{r.label}</span>
                    <span style={{ color: r.bad ? 'var(--red)' : undefined }}>{r.value}</span>
                  </div>
                  {r.bar != null && <Meter value={r.bar} color={selC.color} />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card" onClick={() => setOpen((v) => !v)}>
            <div className="row" style={{ marginBottom: open ? 4 : 0 }}>
              <div className="ico-circle" style={{ background: 'var(--press)' }}><Icon name="city" size={24} /></div>
              <div className="sp">
                <b style={{ fontSize: 20.4 }}>{filter || 'All'} Pi</b>
                <div className="muted" style={{ fontSize: 15.6, marginTop: 2 }}>{stats ? 'Tap a building for live details' : 'Connecting…'}</div>
              </div>
              <Icon name={open ? 'down' : 'right'} size={16} />
            </div>
            {open && <div style={{ maxHeight: '30vh', overflowY: 'auto' }}>
              {shown.map((c) => (
                <div key={c.id} className="bd-row" onClick={(e) => { e.stopPropagation(); haptic('light'); setSel(c.id) }}>
                  <span className="ico-circle" style={{ width: 32, height: 32, background: c.color + '26', color: c.color }}><Icon name={c.icon} size={17} /></span>
                  <span className="sp">{c.name}</span>
                  <span className="muted" style={{ fontSize: 14.4 }}>{c.headline}</span>
                </div>
              ))}
            </div>}
          </div>
        )}
      </div>
    </div>
  )
}
