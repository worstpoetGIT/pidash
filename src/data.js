import { useEffect, useMemo, useRef, useState } from 'react'
import { CapacitorHttp } from '@capacitor/core'

// Live Pi data: /api/stats every 5 s (6 s timeout, offline after 2 failures — same rule as the web and RN dashboards),
// Claude usage every 30 s.
const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x))

// In the phone app the UI is bundled, so the API lives at an absolute address set at build time (VITE_API_BASE).
// On the website it stays empty and every path is relative to the page.
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
export const NATIVE_API = BASE !== ''

async function get(path, ms = 6000) {
  if (NATIVE_API) {
    // Native request: no CORS, real timeouts. WebKit's fetch cannot do plain-http calls to another origin.
    const r = await CapacitorHttp.get({ url: BASE + path, readTimeout: ms, connectTimeout: ms, headers: { 'Cache-Control': 'no-store' } })
    if (r.status < 200 || r.status >= 300) throw new Error(String(r.status))
    return typeof r.data === 'string' ? JSON.parse(r.data) : r.data
  }
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  try {
    const r = await fetch(path, { signal: ac.signal, cache: 'no-store' })
    if (!r.ok) throw new Error(String(r.status))
    return await r.json()
  } finally { clearTimeout(t) }
}

export function usePi() {
  const [stats, setStats] = useState(null)
  const [claude, setClaude] = useState(null)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState('')
  const fails = useRef(0)

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const s = await get('/api/stats')
        if (!alive) return
        fails.current = 0
        setStats(s); setOffline(false)
      } catch (e) {
        if (!alive) return
        setError(String(e?.message || e).slice(0, 160))
        if (++fails.current >= 2) setOffline(true)
      }
    }
    const tickC = async () => {
      try { const u = await get('/api/claude-usage'); if (alive) setClaude(u) } catch { /* optional */ }
    }
    tick(); tickC()
    const a = setInterval(tick, 5000)
    const b = setInterval(tickC, 30000)
    return () => { alive = false; clearInterval(a); clearInterval(b) }
  }, [])

  const counties = useMemo(() => buildCounties(stats, claude), [stats, claude])
  return { stats, claude, offline, error, counties }
}

export async function post(path) {
  if (NATIVE_API) {
    const r = await CapacitorHttp.post({ url: BASE + path, headers: { 'X-Secops': '1' }, readTimeout: 90000, connectTimeout: 10000 })
    const j = typeof r.data === 'string' ? (() => { try { return JSON.parse(r.data) } catch { return {} } })() : (r.data || {})
    if (r.status < 200 || r.status >= 300) throw new Error(j.detail || j.error || 'Request failed (' + r.status + ')')
    return j
  }
  const r = await fetch(path, { method: 'POST', headers: { 'X-Secops': '1' } })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.detail || j.error || 'Request failed (' + r.status + ')')
  return j
}
export const getJson = (p, ms) => get(p, ms)

export function useSecurity() {
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState(null)
  const [err, setErr] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [r, h] = await Promise.all([get('/api/security/report', 15000), get('/api/security/history', 15000)])
        if (alive) { setReport(r); setHistory(h?.runs || []); setErr(false) }
      } catch (e) { if (alive) { setErr(true); setErrMsg(String(e?.message || e).slice(0, 160)) } }
    }
    load()
    const t = setInterval(load, 60000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return { report, history, err, errMsg }
}

export function useAltServer() {
  const [d, setD] = useState(null)
  useEffect(() => {
    let alive = true
    const load = async () => { try { const j = await get('/secops/altserver', 12000); if (alive) setD(j) } catch { if (alive) setD(null) } }
    load()
    const t = setInterval(load, 20000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  return d
}

export const fmtBytes = (n) => {
  if (n == null) return '—'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return (n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)) + ' ' + u[i]
}
export const fmtRate = (bps) => (bps == null ? '—' : fmtBytes(bps) + '/s')
export const pct = (n) => (n == null ? '—' : Math.round(n) + '%')
export function fmtUptime(sec) {
  if (sec == null) return '—'
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60)
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`
}
const tok = (n) => (n == null ? '—' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(Math.round(n)))

// A county's level (building height) follows live load: 1 (idle) … 14 (maxed). spent > 0 means "something is standing here";
// 0 = the whole county is down, which leaves an empty plot with a sign.
const level = (p) => 1 + Math.round((clamp(p) / 100) * 13)

export function buildCounties(st, claude) {
  if (!st) return []
  const svc = (n) => st.services.find((s) => s.name === n)
  const up = (n) => !!svc(n)?.up
  const svcRows = (names) => names.map((n) => {
    const s = svc(n)
    return { label: n, value: s?.up ? 'Running' : 'Down', sub: s?.up && s.cpu_percent != null ? `CPU ${s.cpu_percent.toFixed(1)}% · RAM ${s.mem_percent.toFixed(1)}%` : null, link: s?.link, bad: !s?.up }
  })
  const cu = st.cpu, mem = st.mem, t = st.temps || {}, net = st.network || {}, pw = st.power || {}, fan = st.fan || {}
  const hot = Math.max(t.soc || 0, t.rp1 || 0, t.pmic || 0)
  const bps = (net.rx_bps || 0) + (net.tx_bps || 0)
  const worstDisk = Math.max(0, ...st.disks.map((d) => d.percent || 0))
  const libUp = ['Immich', 'Nextcloud', 'Jellyfin'].filter(up).length
  const libCpu = ['Immich', 'Nextcloud', 'Jellyfin'].reduce((a, n) => a + (svc(n)?.cpu_percent || 0), 0)
  const cs = claude?.session

  return [
    {
      id: 'compute', name: 'Compute', group: 'Hardware', style: 'tech', icon: 'chip', color: '#3a86ff',
      spent: 1, level: level(Math.max(cu.percent, mem.percent)),
      headline: `${pct(cu.percent)} CPU · ${pct(mem.percent)} RAM`,
      rows: [
        { label: 'CPU', value: pct(cu.percent), bar: cu.percent },
        { label: 'Load 1 / 5 / 15 min', value: [cu.load?.['1m'], cu.load?.['5m'], cu.load?.['15m']].map((x) => x?.toFixed(2)).join(' · ') },
        { label: 'Memory', value: `${fmtBytes(mem.used)} of ${fmtBytes(mem.total)}`, bar: mem.percent },
        { label: 'Swap', value: pct(mem.swap?.percent), bar: mem.swap?.percent },
      ],
    },
    {
      id: 'climate', name: 'Climate', group: 'Hardware', style: 'tower', icon: 'bolt', color: '#ff7f50',
      spent: 1, level: level(((hot - 30) / 55) * 100),
      headline: `${hot.toFixed(0)}°C · fan ${pct(fan.percent)}`,
      rows: [
        { label: 'SoC', value: t.soc != null ? t.soc.toFixed(1) + '°C' : '—' },
        { label: 'RP1', value: t.rp1 != null ? t.rp1.toFixed(1) + '°C' : '—' },
        { label: 'PMIC', value: t.pmic != null ? t.pmic.toFixed(1) + '°C' : '—' },
        { label: 'Fan', value: `${fan.rpm ?? '—'} rpm`, bar: fan.percent },
        { label: 'Core voltage', value: pw.core_volts != null ? pw.core_volts.toFixed(3) + ' V' : '—' },
        { label: 'Power', value: pw.undervoltage_active ? 'Undervoltage now' : pw.undervoltage_history ? 'Undervoltage since boot' : 'Healthy', bad: !!pw.undervoltage_active },
      ],
    },
    {
      id: 'network', name: 'Network', group: 'Hardware', style: 'depot', icon: 'repeat', color: '#2d936c',
      spent: 1, level: level((Math.log10(Math.max(1, bps)) / 7) * 100),
      headline: `↓ ${fmtRate(net.rx_bps)} · ↑ ${fmtRate(net.tx_bps)}`,
      rows: [
        { label: 'Download', value: fmtRate(net.rx_bps) },
        { label: 'Upload', value: fmtRate(net.tx_bps) },
        ...svcRows(['Pi-hole']),
      ],
    },
    {
      id: 'vault', name: 'Vault', group: 'Hardware', style: 'market', icon: 'bank', color: '#8338ec',
      spent: 1, level: level(worstDisk),
      headline: `Fullest disk ${pct(worstDisk)}`,
      rows: st.disks.map((d) => (d.error
        ? { label: d.name, value: 'Offline', bad: true }
        : { label: d.name, value: `${fmtBytes(d.used)} of ${fmtBytes(d.total)}`, bar: d.percent })),
    },
    {
      id: 'library', name: 'Library', group: 'Services', style: 'cinema', icon: 'film', color: '#d62f8b',
      spent: libUp ? 1 : 0, level: level((libUp / 3) * 70 + Math.min(30, libCpu * 3)),
      headline: `${libUp} of 3 running`,
      rows: svcRows(['Immich', 'Nextcloud', 'Jellyfin']),
    },
    {
      id: 'lab', name: 'Lab', group: 'Services', style: 'shop', icon: 'chart', color: '#f4a259',
      spent: up('Claude') ? 1 : 0, level: level(cs?.percent_used ?? (up('Claude') ? 8 : 0)),
      headline: up('Claude') ? (cs ? `Session ${pct(cs.percent_used)}` : 'Claude idle') : 'Claude down',
      rows: [
        ...svcRows(['Claude']),
        { label: 'Session tokens', value: cs ? tok(cs.total_tokens) : '—' },
        { label: 'Burn rate', value: cs ? tok(cs.tokens_per_minute) + '/min' : '—' },
        { label: 'Session used', value: pct(cs?.percent_used), bar: cs?.percent_used },
        { label: 'Week tokens', value: tok(claude?.week_total_tokens) },
      ],
    },
    {
      id: 'fortress', name: 'Fortress', group: 'Services', style: 'dome', icon: 'home', color: '#e5383b',
      spent: up('Hack VM') ? 1 : 0, level: level(up('Hack VM') ? 45 : 0),
      headline: up('Hack VM') ? 'Hack VM running' : 'Hack VM down',
      rows: svcRows(['Hack VM']),
    },
  ]
}
