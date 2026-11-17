import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { getJson, post } from '../data.js'
import { haptic } from '../haptics.js'

const ago = (t) => {
  const m = Math.round((Date.now() / 1000 - t) / 60)
  return m < 2 ? 'just now' : m < 120 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`
}
const iso = (s) => ago(new Date(s).getTime() / 1000)
const Pill = ({ on, children, onClick }) => <button className={'chip' + (on ? ' on' : '')} onClick={onClick}>{children}</button>

// Live output of a running job; calls onDone(job) once when it finishes.
function JobLog({ id, onDone }) {
  const [job, setJob] = useState(null)
  const done = useRef(false)
  const box = useRef(null)
  useEffect(() => {
    let alive = true
    done.current = false
    const tick = async () => {
      try {
        const j = await getJson('/secops/job/' + id, 8000)
        if (!alive) return
        setJob(j)
        if (j.status !== 'running' && !done.current) { done.current = true; onDone?.(j) }
      } catch { /* retry */ }
    }
    tick()
    const t = setInterval(() => { if (!done.current) tick() }, 1500)
    return () => { alive = false; clearInterval(t) }
  }, [id])
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [job])
  if (!job) return <div className="muted">Starting…</div>
  const color = job.status === 'running' ? 'var(--ink-2)' : job.status === 'done' ? 'var(--green)' : 'var(--red)'
  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}><b style={{ color }}>{job.status === 'running' ? 'Running…' : job.status === 'done' ? 'Finished' : 'Failed'}</b></div>
      <pre className="term" ref={box}>{job.lines.join('\n')}</pre>
    </div>
  )
}

// ───────────── one-tap fixes ─────────────
export function Fixes({ onChanged }) {
  const [fixes, setFixes] = useState(null)
  const [plan, setPlan] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => { try { setFixes((await getJson('/secops/fixes')).fixes) } catch { setFixes([]) } }, [])
  useEffect(() => { load() }, [load])

  const ask = async (f) => {
    haptic('light'); setErr(null); setBusy(true)
    try { setPlan(await post('/secops/fix/plan/' + f.id)) } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  const apply = async () => {
    haptic('medium'); setBusy(true); setErr(null)
    try { const j = await post('/secops/fix/apply/' + plan.plan_id); setJobId(j.id) } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  const close = () => { setPlan(null); setJobId(null); setErr(null); load(); onChanged?.() }

  if (!fixes || fixes.length === 0) return null
  return (<>
    <div className="label">One-tap fixes</div>
    <div className="card fade-up" style={{ marginBottom: 14 }}>
      {fixes.map((f) => (
        <div key={f.id} className="row" style={{ padding: '8px 0', alignItems: 'flex-start' }}>
          <div className="sp">
            <b style={{ fontSize: 18 }}>{f.title}</b>
            <div className="muted" style={{ fontSize: 14.4, marginTop: 2 }}>{f.why}</div>
            {f.held?.length > 0 && <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>Held back for manual update: {f.held.join(', ')}</div>}
          </div>
          <button className="mini" style={{ background: 'var(--green)', flex: 'none' }} disabled={busy} onClick={() => ask(f)}>Fix</button>
        </div>
      ))}
      <div className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Container CVEs (Trivy) and Lynis hardening items are not one-tap: updating images can break services, so they stay manual.</div>
      {err && !plan && <div style={{ color: 'var(--red)', fontWeight: 600, marginTop: 8 }}>{err}</div>}
    </div>

    {plan && (
      <>
        <div className="map-scrim" onClick={() => !jobId && close()} />
        <div className="sheet fade-up">
          <div className="row" style={{ marginBottom: 10 }}>
            <b className="sp display" style={{ fontSize: 22 }}>{plan.fix.title}</b>
            <button className="x-btn" onClick={close} aria-label="Close"><Icon name="x" size={16} /></button>
          </div>
          {!jobId ? (<>
            <div className="muted" style={{ fontSize: 14.4, marginBottom: 6 }}>This will run exactly:</div>
            <pre className="term">{plan.commands.join('\n')}</pre>
            {plan.dry_run?.length > 0 && (<>
              <div className="muted" style={{ fontSize: 14.4, margin: '10px 0 6px' }}>Dry run says:</div>
              <pre className="term">{plan.dry_run.join('\n')}</pre>
            </>)}
            {err && <div style={{ color: 'var(--red)', fontWeight: 600, margin: '8px 0' }}>{err}</div>}
            <div className="row" style={{ marginTop: 14, gap: 10 }}>
              <button className="btn ghost" onClick={close}>Cancel</button>
              <button className="btn green" disabled={busy} onClick={apply}>Apply</button>
            </div>
          </>) : <JobLog id={jobId} onDone={() => { haptic('light'); load(); onChanged?.() }} />}
        </div>
      </>
    )}
  </>)
}

// ───────────── manual pentester ─────────────
export function Pentest() {
  const [opts, setOpts] = useState(null)
  const [target, setTarget] = useState('pi-lan')
  const [profile, setProfile] = useState('ports')
  const [jobId, setJobId] = useState(null)
  const [hist, setHist] = useState([])
  const [err, setErr] = useState(null)
  const [running, setRunning] = useState(false)

  const loadHist = useCallback(async () => { try { setHist((await getJson('/secops/pentest/history')).runs) } catch { /* ignore */ } }, [])
  useEffect(() => { getJson('/secops/pentest/options').then(setOpts).catch(() => {}); loadHist() }, [loadHist])
  useEffect(() => {
    getJson('/secops/status').then((s) => { if (s.job?.kind === 'pentest') { setJobId(s.job.id); setRunning(true) } }).catch(() => {})
  }, [])

  if (!opts) return null
  const t = opts.targets.find((x) => x.id === target)
  const p = opts.profiles.find((x) => x.id === profile)
  const blocked = p.web_only && !t.web

  const run = async () => {
    haptic('medium'); setErr(null)
    try { const j = await post(`/secops/pentest/${target}/${profile}`); setJobId(j.id); setRunning(true) } catch (e) { setErr(e.message) }
  }

  return (<>
    <div className="label">Manual pentest</div>
    <div className="card fade-up" style={{ marginBottom: 14 }}>
      <div className="muted" style={{ fontSize: 14.4, marginBottom: 8 }}>Your own assets only. Pick a target and a test.</div>
      <div className="chips" style={{ padding: '2px 0', margin: 0 }}>{opts.targets.map((x) => <Pill key={x.id} on={x.id === target} onClick={() => { haptic('light'); setTarget(x.id) }}>{x.label}</Pill>)}</div>
      <div className="chips" style={{ padding: '8px 0 2px', margin: 0 }}>{opts.profiles.map((x) => <Pill key={x.id} on={x.id === profile} onClick={() => { haptic('light'); setProfile(x.id) }}>{x.label}</Pill>)}</div>
      <div className="muted" style={{ fontSize: 14.4, margin: '8px 0 12px' }}>{p.desc}</div>
      <button className="btn green" disabled={blocked || running} onClick={run} style={{ height: 50, fontSize: 18 }}>
        {blocked ? 'Choose a web target for this test' : running ? 'A test is running…' : 'Run pentest'}
      </button>
      {err && <div style={{ color: 'var(--red)', fontWeight: 600, marginTop: 8 }}>{err}</div>}
      {jobId && <div style={{ marginTop: 12 }}><JobLog id={jobId} onDone={() => { setRunning(false); loadHist() }} /></div>}
      {hist.length > 0 && (<>
        <div className="label" style={{ margin: '16px 0 4px' }}>Past tests</div>
        {hist.slice(0, 6).map((h) => (
          <div key={h.id} className="row" style={{ padding: '5px 0', fontSize: 15.6 }}>
            <span className="sp" style={{ minWidth: 0 }}>{h.title}</span>
            <span className="muted" style={{ whiteSpace: 'nowrap', fontSize: 13.5 }}>
              {h.result?.open_ports?.length ? `${h.result.open_ports.length} open · ` : ''}{h.result?.findings?.length ? `${h.result.findings.length} findings · ` : ''}{ago(h.started)}
            </span>
          </div>
        ))}
      </>)}
    </div>
  </>)
}

// ───────────── CI/CD pipelines ─────────────
const RUN_COL = (r) => (r.status !== 'completed' ? '#f4a259' : r.conclusion === 'success' ? 'var(--green)' : 'var(--red)')

export function Pipelines() {
  const [data, setData] = useState(null)
  const [arm, setArm] = useState(null)
  const [msg, setMsg] = useState(null)
  const load = useCallback(async () => { try { setData(await getJson('/secops/pipelines', 30000)) } catch { setData({ repos: [] }) } }, [])
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [load])
  if (!data || data.repos.length === 0) return null

  const run = async (repo, wf) => {
    const key = repo + wf
    if (arm !== key) { haptic('light'); setArm(key); setTimeout(() => setArm((a) => (a === key ? null : a)), 4000); return }
    haptic('medium'); setArm(null); setMsg(null)
    try { await post(`/secops/pipelines/run/${repo}/${wf}`); setMsg('Pipeline started'); setTimeout(load, 4000) } catch (e) { setMsg(e.message) }
  }

  return (<>
    <div className="label">CI/CD pipelines</div>
    {data.repos.map((r) => (
      <div key={r.repo} className="card fade-up" style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 6 }}>
          <div className="ico-circle" style={{ width: 38, height: 38, background: 'var(--press)' }}><Icon name="branch" size={20} /></div>
          <div className="sp"><b style={{ fontSize: 18 }}>{r.repo.split('/')[1]}</b><div className="muted" style={{ fontSize: 13.5 }}>GitHub Actions</div></div>
          {r.workflows.map((w) => (
            <button key={w} className="mini" style={{ background: arm === r.repo + w ? 'var(--red)' : 'var(--indigo)' }} onClick={() => run(r.repo, w)}>
              {arm === r.repo + w ? 'Tap again to run' : 'Run'}
            </button>
          ))}
        </div>
        {r.error && <div style={{ color: 'var(--red)', fontWeight: 600 }}>{r.error}</div>}
        {r.runs.map((x) => (
          <a key={x.databaseId} href={x.url} target="_blank" rel="noreferrer" className="row" style={{ padding: '6px 0', textDecoration: 'none', color: 'inherit' }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: RUN_COL(x), flex: 'none' }} />
            <span className="sp" style={{ minWidth: 0, fontSize: 15.6, overflowWrap: 'anywhere' }}>{x.displayTitle}</span>
            <span className="muted" style={{ fontSize: 13.5, whiteSpace: 'nowrap' }}>{x.status !== 'completed' ? x.status.replace('_', ' ') : iso(x.createdAt)}</span>
          </a>
        ))}
        {msg && <div className="muted" style={{ marginTop: 6 }}>{msg}</div>}
      </div>
    ))}
  </>)
}
