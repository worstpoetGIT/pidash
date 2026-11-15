"""pidash secops: a manual pentester and CI/CD pipeline control for Boss's own Pi.

Design rules (this service can run commands, so it is deliberately boring):
  * Binds to 127.0.0.1 only; the only way in is the Tailscale-only preview proxy.
  * Every action is a fixed id from a fixed table. Nothing typed in the UI is ever put into a command line.
  * Pentest targets come from a fixed list of Boss's own assets. No free-form host, no ranges.
  * POSTs need the X-Secops header, a Host on the allowlist and a same-origin Origin (blocks cross-site forms).
  * One job at a time, hard timeouts, output capped, every apply/run written to an audit log.
"""
import json
import os
import re
import secrets
import subprocess
import threading
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

BASE = Path(__file__).resolve().parent
DATA = BASE.parent / "secops-data"
DATA.mkdir(mode=0o700, exist_ok=True)
(DATA / "pentests").mkdir(mode=0o700, exist_ok=True)
AUDIT = DATA / "audit.log"
SCAN_DIR = Path("/var/lib/pidash-security")
SCAN_TIMER = "pidash-security-scan.timer"
SCAN_UNIT = "pidash-security-scan.service"
ALLOWED_HOSTS = set(os.environ.get("SECOPS_HOSTS", "localhost:5191,127.0.0.1:5191").split(","))

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.middleware("http")
async def guard(request: Request, call_next):
    if request.method != "GET":
        host = request.headers.get("host", "")
        origin = request.headers.get("origin")
        if (request.headers.get("x-secops") != "1" or host not in ALLOWED_HOSTS
                or (origin and origin.split("://", 1)[-1] != host)):
            return JSONResponse({"error": "forbidden"}, status_code=403)
    return await call_next(request)


def audit(event, **kw):
    with AUDIT.open("a") as f:
        f.write(json.dumps({"t": int(time.time()), "event": event, **kw}) + "\n")


def load(name):
    try:
        return json.loads((SCAN_DIR / f"{name}.json").read_text())
    except (OSError, ValueError):
        return None


def sh(argv, timeout=30):
    try:
        r = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout + r.stderr)
    except (OSError, subprocess.TimeoutExpired) as e:
        return 1, str(e)


# ───────────────────────── jobs (one at a time) ─────────────────────────
JOBS = {}
JOB_LOCK = threading.Lock()
ACTIVE = {"id": None}


def start_job(kind, title, argvs, timeout, on_done=None, env=None):
    with JOB_LOCK:
        if ACTIVE["id"] and JOBS[ACTIVE["id"]]["status"] == "running":
            raise HTTPException(409, "another job is running")
        jid = secrets.token_hex(6)
        job = {"id": jid, "kind": kind, "title": title, "started": int(time.time()), "status": "running",
               "rc": None, "lines": [], "commands": [" ".join(a) for a in argvs]}
        JOBS[jid] = job
        ACTIVE["id"] = jid
        # keep the last 30 jobs in memory
        for old in sorted(JOBS, key=lambda k: JOBS[k]["started"])[:-30]:
            JOBS.pop(old, None)
    audit("job-start", id=jid, kind=kind, title=title, commands=job["commands"])
    threading.Thread(target=_exec, args=(job, argvs, timeout, on_done, env), daemon=True).start()
    return job


def _exec(job, argvs, timeout, on_done, env):
    deadline = time.time() + timeout
    rc = 0
    full_env = {**os.environ, **(env or {})}
    try:
        for argv in argvs:
            job["lines"].append("$ " + " ".join(argv))
            p = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=full_env)
            killer = threading.Timer(max(1, deadline - time.time()), p.kill)
            killer.start()
            for line in p.stdout:
                job["lines"].append(line.rstrip()[:400])
                if len(job["lines"]) > 600:
                    del job["lines"][100:200]
            p.wait()
            killer.cancel()
            rc = p.returncode
            if rc != 0:
                job["lines"].append(f"[exit {rc}]")
                break
    except Exception as e:  # noqa: BLE001
        job["lines"].append(f"[error] {e}")
        rc = 1
    job["rc"] = rc
    job["status"] = "done" if rc == 0 else "failed"
    job["ended"] = int(time.time())
    if on_done:
        try:
            on_done(job)
        except Exception as e:  # noqa: BLE001
            job["lines"].append(f"[post-step error] {e}")
    audit("job-end", id=job["id"], status=job["status"], rc=rc)


def pub(job, tail=60):
    return {k: job[k] for k in ("id", "kind", "title", "started", "status", "rc", "commands") if k in job} | {
        "ended": job.get("ended"), "lines": job["lines"][-tail:], "result": job.get("result")}


@app.get("/secops/job/{jid}")
def get_job(jid: str):
    j = JOBS.get(jid)
    if not j:
        raise HTTPException(404, "no such job")
    return pub(j)


@app.get("/secops/status")
def status():
    _, timer = sh(["systemctl", "is-active", SCAN_TIMER], 5)
    _, scan = sh(["systemctl", "is-active", SCAN_UNIT], 5)
    cur = JOBS.get(ACTIVE["id"]) if ACTIVE["id"] else None
    return {"scan_timer": timer.strip(), "scanning": scan.strip() in ("active", "activating"),
            "job": pub(cur, 5) if cur and cur["status"] == "running" else None}


# ───────────────────────── manual pentester (own assets only) ─────────────────────────
def load_targets():
    """Targets and Host headers come from secops/targets.json (local, never committed);
    targets.example.json is the committed template with documentation-range addresses."""
    for name in ("targets.json", "targets.example.json"):
        f = BASE / name
        if f.exists():
            d = json.loads(f.read_text())
            hosts = {k: (v["label"], v["address"], v.get("url")) for k, v in d["hosts"].items()}
            return hosts, d.get("host_headers", {}), d.get("ssh_tls_ports", "22,80,443")
    return {}, {}, "22,80,443"


HOSTS, HOST_HEADERS, SSH_TLS_PORTS = load_targets()
NUCLEI_TAGS = "exposure,misconfig,default-login,cors,xss,sqli,lfi,traversal,ssrf,redirect,xxe,ssti,injection,auth-bypass,unauth,disclosure"
NUCLEI_BASE = ["docker", "run", "--rm", "--cpus", "1", "--cpu-shares", "128", "--network", "host",
               "-v", "pidash-nuclei-cache:/root/nuclei-templates", "-v", "pidash-nuclei-cache-cfg:/root/.config/nuclei",
               "projectdiscovery/nuclei:latest", "-disable-update-check", "-ud", "/root/nuclei-templates"]
PROFILES = {
    "ports": ("Ports & services", "Top 1000 TCP ports with service detection (nmap).", False),
    "ssh-tls": ("SSH & TLS audit", "SSH algorithms, auth methods and TLS ciphers on common ports (nmap scripts).", False),
    "web": ("Web vulnerabilities", "Nuclei templates: exposures, misconfigurations, default logins, injections (web targets only).", True),
}


@app.get("/secops/pentest/options")
def pentest_options():
    return {"targets": [{"id": k, "label": v[0], "web": v[2] is not None} for k, v in HOSTS.items()],
            "profiles": [{"id": k, "label": v[0], "desc": v[1], "web_only": v[2]} for k, v in PROFILES.items()]}


def _finish_pentest(job):
    lines = job["lines"]
    summary = {"open_ports": [ln.split()[0] for ln in lines if re.match(r"^\d+/tcp\s+open", ln)],
               "findings": [ln for ln in lines if re.match(r"^\[[^\]]+\] \[[^\]]+\] \[(info|low|medium|high|critical)\]", ln)]}
    job["result"] = summary
    (DATA / "pentests" / f"{job['started']}.json").write_text(json.dumps({**pub(job, 600), "target": job["target"], "profile": job["profile"], "result": summary}))


@app.post("/secops/pentest/{target}/{profile}")
async def pentest(target: str, profile: str):
    if target not in HOSTS or profile not in PROFILES:
        raise HTTPException(404, "unknown target or profile")
    label, addr, url = HOSTS[target]
    if PROFILES[profile][2] and not url:
        raise HTTPException(400, "that profile needs a web target")
    if profile == "ports":
        argvs, tmo = [["nmap", "-sV", "--top-ports", "1000", "-T3", "--open", "-Pn", addr]], 900
    elif profile == "ssh-tls":
        argvs, tmo = [["nmap", "-Pn", "-p", SSH_TLS_PORTS, "--script", "ssh2-enum-algos,ssh-auth-methods,ssl-enum-ciphers", addr]], 600
    else:
        hdr = ["-H", HOST_HEADERS[target]] if target in HOST_HEADERS else []
        argvs, tmo = [[*NUCLEI_BASE, "-u", url, "-tags", NUCLEI_TAGS, "-severity", "info,low,medium,high,critical", "-nc", *hdr]], 1500
    job = start_job("pentest", f"{PROFILES[profile][0]} · {label}", argvs, tmo, on_done=_finish_pentest)
    job["target"], job["profile"] = target, profile
    return pub(job)


@app.get("/secops/pentest/history")
def pentest_history():
    out = []
    for f in sorted((DATA / "pentests").glob("*.json"), reverse=True)[:15]:
        try:
            d = json.loads(f.read_text())
            out.append({"id": d["id"], "title": d["title"], "started": d["started"], "status": d["status"], "result": d.get("result")})
        except (OSError, ValueError, KeyError):
            continue
    return {"runs": out}


# ───────────────────────── CI/CD pipelines (GitHub Actions via gh) ─────────────────────────
PIPELINES = {"worstpoetGIT/pidash": ["security.yml", "build-ios.yml"]}
_pcache = {"t": 0, "v": None}


@app.get("/secops/pipelines")
def pipelines():
    if time.time() - _pcache["t"] < 45 and _pcache["v"] is not None:
        return _pcache["v"]
    repos = []
    for repo, wfs in PIPELINES.items():
        rc, out = sh(["gh", "run", "list", "-R", repo, "-L", "6", "--json",
                      "databaseId,workflowName,status,conclusion,headBranch,displayTitle,createdAt,url,event"], 25)
        try:
            runs = json.loads(out) if rc == 0 else []
        except ValueError:
            runs = []
        repos.append({"repo": repo, "workflows": wfs, "runs": runs, "error": None if rc == 0 else out.strip()[-160:]})
    _pcache.update(t=time.time(), v={"repos": repos})
    return _pcache["v"]


@app.post("/secops/pipelines/run/{owner}/{repo}/{workflow}")
async def pipeline_run(owner: str, repo: str, workflow: str):
    full = f"{owner}/{repo}"
    if workflow not in PIPELINES.get(full, []):
        raise HTTPException(404, "unknown pipeline")
    rc, out = sh(["gh", "workflow", "run", workflow, "-R", full], 30)
    audit("pipeline-run", repo=full, workflow=workflow, rc=rc)
    _pcache["t"] = 0
    if rc != 0:
        raise HTTPException(502, out.strip()[-200:])
    return {"status": "started"}


@app.get("/secops/audit")
def audit_tail():
    try:
        return {"lines": AUDIT.read_text().splitlines()[-40:]}
    except OSError:
        return {"lines": []}
