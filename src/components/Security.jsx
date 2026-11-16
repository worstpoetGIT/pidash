import { useState } from 'react'
import Icon from './Icon.jsx'
import { useSecurity, NATIVE_API } from '../data.js'
import { haptic } from '../haptics.js'
import { Pentest, Pipelines } from './SecOps.jsx'

const COL = { ok: 'var(--green)', warn: '#f4a259', crit: 'var(--red)' }
const RANK = { ok: 0, warn: 1, crit: 2 }
const TOOLS = [
  ['trivy', 'Trivy', 'Container CVEs'], ['updates', 'Updates', 'Packages & kernel'], ['lynis', 'Lynis', 'System hardening'],
  ['nmap', 'Nmap', 'Open ports'], ['web', 'Nuclei', 'Web scan'], ['clamav', 'ClamAV', 'Malware'], ['fail2ban', 'fail2ban', 'SSH bans'],
]
const VERDICT = { ok: ['All clear', 'Nothing needs action.'], warn: ['Worth a look', 'Some findings to review.'], crit: ['Action needed', 'Critical findings are open.'] }

const when = (ts) => new Date(ts * 1000).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const ago = (t) => {
  if (!t) return 'never'
  const m = Math.round((Date.now() / 1000 - t) / 60)
  return m < 2 ? 'just now' : m < 120 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}
const Dot = ({ s, size = 10 }) => <span style={{ width: size, height: size, borderRadius: '50%', background: COL[s] || 'var(--ink-2)', display: 'inline-block', flex: 'none' }} />
const Line = ({ children, right, bad }) => (
  <div className="row" style={{ padding: '6px 0', alignItems: 'flex-start', fontSize: 16 }}>
    <span className="sp" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
    {right != null && <span style={{ color: bad ? 'var(--red)' : 'var(--ink-2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{right}</span>}
  </div>
)

function Detail({ id, r }) {
  const d = r[id]
  if (!d) return null
  if (id === 'trivy') return d.images.map((im) => (
    <div key={im.image} style={{ padding: '6px 0' }}>
      <Line right={`${im.critical} crit · ${im.high} high`} bad={im.critical > 0}><b>{im.image}</b></Line>
      {im.top?.slice(0, 3).map((c) => <div key={c.id} className="muted" style={{ fontSize: 14.4, padding: '1px 0 1px 10px' }}>{c.id} · {c.pkg}{c.fixed ? ` → ${c.fixed}` : ''}</div>)}
    </div>
  ))
  if (id === 'updates') return (<>
    <Line right={`${d.upgradable} pending`}>Upgradable packages</Line>
    <Line right={`${d.security_upgradable} · ${d.fixable_cves} CVEs`} bad={d.security_upgradable > 0}>Security updates</Line>
    <Line right={d.reboot_needed ? 'Needed' : 'No'} bad={d.reboot_needed}>Reboot</Line>
    <Line right={d.running_kernel}>Kernel</Line>
    {d.security_names?.length > 0 && <div className="muted" style={{ fontSize: 14.4 }}>{d.security_names.join(', ')}</div>}
  </>)
  if (id === 'lynis') return (<>
    <Line right={`${d.hardening_index}/100`}>Hardening index</Line>
    {d.warnings.map((w) => <Line key={w.id} bad right={w.id}>{w.text}</Line>)}
    {d.suggestions.slice(0, 5).map((w) => <Line key={w.id + w.text} right={w.id}>{w.text}</Line>)}
    {d.suggestion_count > 5 && <div className="muted" style={{ fontSize: 14.4 }}>+ {d.suggestion_count - 5} more suggestions</div>}
  </>)
  if (id === 'nmap') return (<>
    {d.ports.map((p) => <Line key={p.port} bad={!p.expected} right={p.expected ? 'expected' : 'UNEXPECTED'}>{p.port}/{p.proto} · {p.service}</Line>)}
  </>)
  if (id === 'web') return d.targets.map((t) => (
    <div key={t.name} style={{ padding: '4px 0' }}>
      <Line right={t.reachable ? Object.entries(t.counts || {}).map(([k, v]) => `${v} ${k}`).join(' · ') || 'clean' : 'unreachable'} bad={!t.reachable}><b>{t.name}</b></Line>
      {t.findings?.slice(0, 2).map((f) => <div key={f.template + f.name} className="muted" style={{ fontSize: 14.4, padding: '1px 0 1px 10px' }}>{f.severity} · {f.name.slice(0, 90)}</div>)}
    </div>
  ))
  if (id === 'clamav') return (<>
    <Line right={d.files_scanned?.toLocaleString()}>Files scanned</Line>
    <Line right={d.infected?.length || 0} bad={d.infected?.length > 0}>Infected</Line>
    <Line right={Math.round(d.duration) + ' s'}>Scan time</Line>
  </>)
  if (id === 'fail2ban') return (<>
    <Line right={d.currently_banned}>Banned now</Line>
    <Line right={d.total_banned}>Total bans</Line>
    <Line right={d.total_failed}>Failed logins</Line>
    {d.banned_ips?.map((ip) => <Line key={ip}>{ip}</Line>)}
  </>)
  return null
}

export default function Security() {
  const { report, history, err } = useSecurity()
  const [open, setOpen] = useState(null)
  const tools = report?.summary?.tools || {}
  const worst = Object.values(tools).reduce((a, t) => (RANK[t.status] > RANK[a] ? t.status : a), 'ok')
  const alerts = report?.alerts?.items || []

  return (
    <div className="page">
      <h1 className="title">Security</h1>
      {err && !report && <div className="notice">Couldn't load the security report.</div>}
      {!report && !err && <div className="muted" style={{ padding: 20 }}>Loading…</div>}
      {report && (<>
        <div className="card fade-up" style={{ marginBottom: 14 }}>
          <div className="row">
            <div className="ico-circle" style={{ background: 'color-mix(in srgb, ' + COL[worst] + ' 18%, transparent)', color: COL[worst] }}><Icon name="shield" size={26} /></div>
            <div className="sp"><b style={{ fontSize: 22 }}>{VERDICT[worst][0]}</b><div className="muted" style={{ fontSize: 15.6 }}>{VERDICT[worst][1]}</div></div>
          </div>
          <div className="muted" style={{ fontSize: 14.4, marginTop: 10 }}>Last scan {ago(report.summary.generated_at)}{report.summary.scanning ? ' · scanning now' : ''}</div>
        </div>

        <div className="label">Since last scan</div>
        <div className="card fade-up" style={{ marginBottom: 14 }}>
          {alerts.length === 0 && <div className="muted">No changes since the previous scan.</div>}
          {alerts.map((a, i) => (
            <div key={i} className="row" style={{ padding: '6px 0', alignItems: 'flex-start' }}>
              <span style={{ paddingTop: 6 }}><Dot s={a.level} /></span><span className="sp" style={{ fontSize: 16 }}>{a.text}</span>
            </div>
          ))}
        </div>

        <div className="label">Scanners</div>
        {TOOLS.map(([id, name, sub], i) => {
          const t = tools[id]
          if (!t) return null
          const on = open === id
          return (
            <div key={id} className="card fade-up" style={{ marginBottom: 12, animationDelay: i * 35 + 'ms' }} onClick={() => { haptic('light'); setOpen(on ? null : id) }}>
              <div className="row">
                <Dot s={t.status} size={12} />
                <div className="sp"><b style={{ fontSize: 19 }}>{name}</b></div>
                <b style={{ color: COL[t.status] }}>{t.headline}</b>
                <Icon name={on ? 'down' : 'right'} size={16} />
              </div>
              <div className="muted" style={{ fontSize: 14.4, marginTop: 4 }}>{sub} · {t.detail}</div>
              {on && <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}><Detail id={id} r={report} /></div>}
            </div>
          )
        })}

        <div className="label">Scan log</div>
        <div className="card fade-up" style={{ marginBottom: 14 }}>
          {(history || []).slice(0, 8).map((run) => (
            <div key={run.ts} className="row" style={{ padding: '8px 0' }}>
              <span className="sp" style={{ fontSize: 15.6, fontWeight: 600 }}>{when(run.ts)}</span>
              <span className="row" style={{ gap: 5 }}>{TOOLS.map(([id]) => <Dot key={id} s={run.tools?.[id]?.status} size={9} />)}</span>
            </div>
          ))}
          {history && history.length > 8 && <div className="muted" style={{ fontSize: 13.5, paddingTop: 6 }}>+ {history.length - 8} earlier runs</div>}
          {history && history.length === 0 && <div className="muted">No scans recorded yet.</div>}
        </div>

        {!NATIVE_API && <><Pentest /><Pipelines /></>}
      </>)}
    </div>
  )
}
