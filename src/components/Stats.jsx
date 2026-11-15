import Icon from './Icon.jsx'
import { fmtUptime } from '../data.js'

export function Meter({ value, color }) {
  const v = Math.max(0, Math.min(100, value || 0))
  return <div className="meter"><i style={{ width: v + '%', background: color || 'var(--ink)' }} /></div>
}

// All hardware + service numbers, one card per county.
export default function Stats({ pi }) {
  const { counties, stats, offline } = pi
  return (
    <div className="page">
      <h1 className="title">Stats</h1>
      {offline && <div className="notice">Pi unreachable. Showing the last values.</div>}
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
    </div>
  )
}
