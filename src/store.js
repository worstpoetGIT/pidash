import { useSyncExternalStore } from 'react'

// Only per-device preferences live here. All Pi data is live from /api/*.
const KEY = 'pidash-dq:v1'
const MAP_IDS = ['city', 'lego', 'japan', 'wire']
const APPEARANCE = ['system', 'light', 'dark']

const initial = () => ({ appearance: 'system', map: 'city' })

function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || '{}')
    const s = initial()
    if (APPEARANCE.includes(r.appearance)) s.appearance = r.appearance
    if (MAP_IDS.includes(r.map)) s.map = r.map
    return s
  } catch { return initial() }
}

let state = load()
const subs = new Set()
export const getState = () => state
export function setState(fn) {
  state = fn(state)
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
  subs.forEach((f) => f())
}
const subscribe = (f) => { subs.add(f); return () => subs.delete(f) }
export const useStore = () => useSyncExternalStore(subscribe, getState)
