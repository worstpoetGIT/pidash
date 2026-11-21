import Icon from './Icon.jsx'
import { fmtUptime, useAltServer } from '../data.js'

export function Meter({ value, color }) {
  const v = Math.max(0, Math.min(100, value || 0))
  return <div className="meter"><i style={{ width: v + '%', background: color || 'var(--ink)' }} /></div>
}

// All hardware + service numbers, one card per county.
export default function Stats({ pi }) {
  const { counties, stats, offline, error } = pi
  const alt = useAltServer()
  return (
    <div className="page">
      <h1 className="title">Stats</h1>
      {offline && <div className="notice">Pi unreachable. Showing the last values.{error ? <div style={{ fontWeight: 400, fontSize: 13.5, marginTop: 4, overflowWrap: 'anywhere' }}>{error}</div> : null}</div>}
      {!stats && !offline && <div className="muted" style={{ padding: 20 }}>Loading…</div>}
      {stats && (
        <div className="card fade-up" style={{ marginBottom: 14 }}>
          <div className="row">
            <div className="ico-circle" style={{ background: 'var(--press)' }}><Icon name="gear" size={24} /></div>
            <div className="sp"><b style={{ fontSize: 20.4 }}>Uptime</b><div className="muted" style={{ fontSize: 15.6 }}>since last boot</div></div>
            <b className="display" style={{ fontSize: 28 }}>{fmtUptime(stats.uptime_seconds)}</b>
          </div>
        </div>
      )}
      {counties.map((c, i) => (
        <div key={c.id} className="card fade-up" style={{ marginBottom: 14, animationDelay: i * 40 + 'ms' }}>
          <div className="row" style={{ marginBottom: 6 }}>
            <div className="ico-circle" style={{ background: c.color + '26', color: c.color }}><Icon name={c.icon} size={24} /></div>
            <div className="sp"><b style={{ fontSize: 20.4 }}>{c.name}</b><div className="muted" style={{ fontSize: 15.6 }}>{c.headline}</div></div>
          </div>
          {c.rows.map((r) => (
            <div key={r.label} style={{ padding: '7px 0' }}>
              <div className="row"><span className="sp">{r.label}</span><b style={{ color: r.bad ? 'var(--red)' : undefined }}>{r.value}</b></div>
              {r.sub && <div className="muted" style={{ fontSize: 14.4, marginTop: 2 }}>{r.sub}</div>}
              {r.bar != null && <Meter value={r.bar} color={c.color} />}
            </div>
          ))}
        </div>
      ))}
      {alt && <AltCard d={alt} />}
    </div>
  )
}

const ago = (t, now) => {
  if (!t) return 'never'
  const m = Math.round(((now || Date.now() / 1000) - t) / 60)
  return m < 2 ? 'just now' : m < 120 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}
const PHONE = { home: 'On home Wi-Fi', away: 'Away from home', idle: 'Idle' }

// AltServer (the Pi re-signs the sideloaded apps in the background): health, load and recent activity.
function AltCard({ d }) {
  const bad = d.status !== 'ok'
  const color = '#0ea5a4'
  const a = d.altserver
  const row = (label, value, red) => (
    <div style={{ padding: '7px 0' }} key={label}>
      <div className="row"><span className="sp">{label}</span><b style={{ color: red ? 'var(--red)' : undefined }}>{value}</b></div>
    </div>
  )
  return (
    <div className="card fade-up" style={{ marginBottom: 14 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <div className="ico-circle" style={{ background: color + '26', color }}><Icon name="repeat" size={24} /></div>
        <div className="sp"><b style={{ fontSize: 20.4 }}>AltServer</b><div className="muted" style={{ fontSize: 15.6 }}>{d.status === 'ok' ? 'Re-signing in the background' : d.status === 'stuck' ? 'Stuck, the watchdog will restart it' : 'Not running'}</div></div>
      </div>
      {row('Status', d.status === 'ok' ? 'Running' : d.status === 'stuck' ? 'Stuck' : 'Down', bad)}
      {row('Uptime', a.uptime_s != null ? fmtUptime(a.uptime_s) : '—')}
      <div style={{ padding: '7px 0' }}>
        <div className="row"><span className="sp">CPU</span><b style={{ color: (a.cpu_pct || 0) > 80 ? 'var(--red)' : undefined }}>{a.cpu_pct != null ? Math.round(a.cpu_pct) + '%' : '—'}</b></div>
        <Meter value={a.cpu_pct} color={color} />
      </div>
      {row('iPhone bridge', d.netmuxd.active && d.muxfix.active ? 'Running' : 'Down', !(d.netmuxd.active && d.muxfix.active))}
      {row('Apple login helper', d.anisette_ok == null ? '—' : d.anisette_ok ? 'Running' : 'Down', d.anisette_ok === false)}
      {row('Last request', ago(d.last_request, d.now))}
      {row('Requests, 24 h', d.handled_24h ?? '—')}
      {row('Watchdog restarts, 7 d', d.watchdog_restarts_7d ?? '—', (d.watchdog_restarts_7d || 0) > 0)}
      {row('iPhone', PHONE[d.iphone] || '—')}
    </div>
  )
}
