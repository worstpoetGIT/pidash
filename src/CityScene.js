import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js'
import { makeMaps, MAP_LIST } from './maps.js'

/* ---------- helpers ---------- */
const shade = (c, a) => new THREE.Color(c).offsetHSL(0, 0, a).getHex()
// anime look: flat cel-shaded bands instead of smooth shading
let TOON = false
let WIRE = false
const toonRamp = (() => {
  let t
  return () => {
    if (t) return t
    t = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat)
    t.minFilter = t.magFilter = THREE.NearestFilter
    t.needsUpdate = true
    return t
  }
})()
const L = (c, map) => {
  if (WIRE) return new THREE.MeshBasicMaterial({ color: c, wireframe: true })
  const o = map ? { map } : { color: c }
  return TOON ? new THREE.MeshToonMaterial({ ...o, gradientMap: toonRamp() }) : new THREE.MeshLambertMaterial(o)
}

function mk(parent, geo, color, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? L(color) : color)
  m.position.set(x, y, z)
  m.castShadow = shadow
  m.receiveShadow = true
  parent.add(m)
  return m
}
const bx = (p, w, h, d, c, x = 0, y = 0, z = 0) => mk(p, new THREE.BoxGeometry(w, h, d), c, x, y + h / 2, z)
const cyl = (p, r, h, c, x = 0, y = 0, z = 0, seg = 12) => mk(p, new THREE.CylinderGeometry(r, r, h, seg), c, x, y + h / 2, z)

const texCache = new Map()
function windowTex(wall, floors, cols, glass = 0x2b3a55) {
  const key = [wall, floors, cols, glass].join('|')
  if (texCache.has(key)) return texCache.get(key)
  const cw = 64
  const ch = Math.max(10, Math.min(56, Math.floor(2000 / floors)))
  const c = document.createElement('canvas')
  c.width = cw * cols
  c.height = ch * floors
  const g = c.getContext('2d')
  g.fillStyle = '#' + new THREE.Color(wall).getHexString()
  g.fillRect(0, 0, c.width, c.height)
  for (let r = 0; r < floors; r++) {
    for (let k = 0; k < cols; k++) {
      const x = k * cw + 14, y = r * ch + 12
      g.fillStyle = '#' + new THREE.Color(glass).getHexString()
      g.fillRect(x, y, cw - 28, ch - 24)
      g.fillStyle = 'rgba(255,255,255,.32)'
      g.fillRect(x + 3, y + 3, 6, ch - 30)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  texCache.set(key, t)
  return t
}
function wall(p, w, h, d, color, floors, cols, x = 0, y = 0, z = 0, glass) {
  const side = WIRE ? L(color) : L(0, windowTex(color, floors, cols, glass))
  const top = L(shade(color, -0.12))
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side])
  m.position.set(x, y + h / 2, z)
  m.castShadow = true
  m.receiveShadow = true
  p.add(m)
  return m
}
function textPlane(p, text, w, h, bg, fg, x, y, z, ry = 0) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = Math.round(256 * (h / w))
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = fg
  g.font = `900 ${Math.round(c.height * 0.62)}px Arial Black, Arial, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, c.width / 2, c.height / 2 + 2)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t }))
  m.position.set(x, y, z)
  m.rotation.y = ry
  p.add(m)
  return m
}

/* ---------- building styles (footprint ≈ 3.6 x 3.6, base at y=0) ---------- */
const STYLE_FN = {
  house(g, f, col) {
    const h = 0.8 + 0.75 * f
    wall(g, 3.0, h, 2.6, shade(col, 0.28), f, 2)
    const roof = mk(g, new THREE.ConeGeometry(2.35, 1.25, 4), shade(col, -0.05), 0, h + 0.62, 0)
    roof.rotation.y = Math.PI / 4
    bx(g, 0.55, 0.85, 0.12, 0x7a4b2a, 0, 0, 1.32)
    bx(g, 0.32, 0.9, 0.32, 0x8a5a44, 0.8, h + 0.35, 0)
  },
  tower(g, f, col) {
    const h = 1.6 + 1.35 * f
    wall(g, 2.6, h, 2.6, shade(col, 0.12), f * 2, 3, 0, 0, 0, 0x203a5a)
    bx(g, 2.8, 0.22, 2.8, 0x3a4250, 0, h, 0)
    cyl(g, 0.06, 1.0, 0x8a919c, 0.6, h + 0.2, 0.6, 6)
    bx(g, 0.9, 0.5, 0.9, 0x59616e, -0.6, h + 0.2, -0.5)
  },
  shop(g, f, col) {
    const h = 1.1 + 0.8 * f
    wall(g, 3.4, h, 2.6, shade(col, 0.3), f, 3)
    const aw = bx(g, 3.4, 0.14, 1.05, col, 0, 1.15, 1.55)
    aw.rotation.x = 0.32
    bx(g, 2.2, 0.42, 0.14, 0x1f2937, 0, 1.62, 1.33)
    bx(g, 0.8, 1.0, 0.1, 0x2b3a55, -0.9, 0, 1.31)
    bx(g, 1.2, 0.7, 0.08, 0xcfe8f5, 0.9, 0.3, 1.31)
  },
  dome(g, f, col) {
    const h = 1.0 + 0.55 * f
    wall(g, 3.4, h, 2.8, 0xefe4cc, f, 4, 0, 0, 0, 0x6b5b45)
    for (let i = 0; i < 4; i++) cyl(g, 0.14, h, 0xfaf5e8, -1.35 + i * 0.9, 0, 1.55, 10)
    bx(g, 3.7, 0.28, 3.1, 0xd8c9a8, 0, h, 0.05)
    const dome = mk(g, new THREE.SphereGeometry(1.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), col, 0, h + 0.28, 0)
    dome.scale.y = 0.85
    cyl(g, 0.05, 0.6, 0xd4af37, 0, h + 1.2, 0, 6)
  },
  market(g, f, col) {
    const n = Math.min(1 + f, 6)
    for (let i = 0; i < n; i++) {
      const x = ((i % 3) - 1) * 1.2
      const z = (Math.floor(i / 3) - 0.5) * 1.5
      bx(g, 0.95, 0.42, 0.62, 0x8b5a3c, x, 0, z)
      const c = bx(g, 1.1, 0.1, 0.8, i % 2 ? 0xffffff : col, x, 1.0, z)
      c.rotation.x = 0.12
      for (const dx of [-0.48, 0.48]) cyl(g, 0.03, 1.0, 0xcbd5e1, x + dx, 0, z + 0.34, 5)
      bx(g, 0.3, 0.2, 0.3, [0xe63946, 0x2a9d8f, 0xf4a261][i % 3], x - 0.25, 0.42, z)
      bx(g, 0.28, 0.16, 0.28, [0x2a9d8f, 0xf4a261, 0xe63946][i % 3], x + 0.22, 0.42, z)
    }
  },
  cafe(g, f, col) {
    const h = 0.9 + 0.45 * f
    wall(g, 2.2, h, 2.0, shade(col, 0.32), f, 2, -0.6, 0, -0.3)
    const aw = bx(g, 2.2, 0.12, 0.8, col, -0.6, 0.95, 0.9)
    aw.rotation.x = 0.3
    bx(g, 2.4, 0.2, 2.2, 0x3a3a3a, -0.6, h, -0.3)
    const n = Math.min(f, 3)
    for (let i = 0; i < n; i++) {
      const x = 1.05, z = -1.1 + i * 1.05
      cyl(g, 0.04, 1.0, 0xcbd5e1, x, 0, z, 5)
      mk(g, new THREE.ConeGeometry(0.55, 0.28, 8), i % 2 ? 0xffffff : col, x, 1.1, z)
      cyl(g, 0.25, 0.05, 0x6b4f3a, x, 0.45, z + 0.0, 10)
    }
  },
  cinema(g, f, col) {
    const h = 1.3 + 0.75 * f
    wall(g, 3.4, h, 2.6, 0x3b3358, f, 3, 0, 0, 0, 0x8d7bd6)
    bx(g, 2.7, 0.46, 0.9, 0xff4fa3, 0, 1.15, 1.55)
    bx(g, 2.9, 0.12, 1.05, 0x1b1b2b, 0, 1.6, 1.52)
    textPlane(g, 'CINEMA', 2.4, 0.55, '#1b1b2b', '#ffd166', 0, h - 0.35, 1.32)
    bx(g, 3.5, 0.18, 2.7, 0x24203a, 0, h, 0)
  },
  tech(g, f, col) {
    const h = 1.5 + 1.0 * f
    wall(g, 3.0, h, 2.8, 0x2a4a73, f * 2, 3, 0, 0, 0, 0x9ad0ff)
    bx(g, 3.2, 0.2, 3.0, 0x1b2d44, 0, h, 0)
    textPlane(g, 'TECH', 1.9, 0.5, '#0f1b2d', '#7bd0ff', 0, 1.25, 1.42)
    cyl(g, 0.05, 1.3, 0xb8c2cf, -0.8, h + 0.2, -0.7, 6)
    const dish = mk(g, new THREE.SphereGeometry(0.45, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xe5e9f0, 0.7, h + 0.55, 0.3)
    dish.rotation.x = -0.9
  },
  depot(g, f, col) {
    const h = 0.9 + 0.35 * f
    wall(g, 3.8, h, 2.4, 0xe5e7eb, f, 4, 0, 0, -0.4, 0x5b6575)
    bx(g, 3.82, 0.22, 2.42, col, 0, 0.3, -0.4)
    bx(g, 1.1, 0.7, 0.1, 0x2b3340, -0.9, 0, 0.82)
    bx(g, 1.1, 0.7, 0.1, 0x2b3340, 0.9, 0, 0.82)
    bx(g, 3.9, 0.18, 2.5, 0x4b5563, 0, h, -0.4)
    const bus = makeBus(col)
    bus.scale.setScalar(0.5)
    bus.position.set(0, 0, 1.45)
    g.add(bus)
  },
}

function kiosk(g, col) {
  bx(g, 1.3, 0.95, 1.3, shade(col, 0.25), 0, 0, 0)
  const aw = bx(g, 1.7, 0.1, 1.1, col, 0, 0.95, 0.55)
  aw.rotation.x = 0.3
  bx(g, 0.7, 0.25, 0.5, 0xe8d5b5, 0.9, 0, 0.5)
}

function makeCar(color) {
  const g = new THREE.Group()
  bx(g, 1.35, 0.38, 0.68, color, 0, 0.14, 0)
  bx(g, 0.72, 0.32, 0.6, shade(color, 0.28), -0.08, 0.5, 0)
  for (const x of [-0.42, 0.42]) for (const z of [-0.32, 0.32]) bx(g, 0.22, 0.22, 0.12, 0x1a1a1a, x, 0, z)
  return g
}
function makeBus(color = 0x2f6fd0) {
  const g = new THREE.Group()
  bx(g, 3.0, 0.9, 0.95, color, 0, 0.18, 0)
  bx(g, 2.7, 0.3, 0.97, 0xcfe8f5, 0, 0.62, 0)
  bx(g, 3.02, 0.1, 0.96, 0xffffff, 0, 0.5, 0)
  for (const x of [-0.9, 0.9]) for (const z of [-0.42, 0.42]) bx(g, 0.3, 0.3, 0.12, 0x1a1a1a, x, 0, z)
  return g
}

function makeVan(color = 0xf1f5f9) {
  const g = new THREE.Group()
  bx(g, 1.75, 0.62, 0.74, color, 0, 0.16, 0)
  bx(g, 0.5, 0.36, 0.76, 0xcfe8f5, 0.62, 0.52, 0)
  bx(g, 1.77, 0.08, 0.75, 0x2f6fd0, 0, 0.42, 0)
  for (const x of [-0.5, 0.5]) for (const z of [-0.34, 0.34]) bx(g, 0.24, 0.24, 0.12, 0x1a1a1a, x, 0, z)
  return g
}
function makeTruck(color = 0xf08a24) {
  const g = new THREE.Group()
  bx(g, 0.8, 0.6, 0.8, color, 1.05, 0.16, 0)
  bx(g, 0.34, 0.3, 0.82, 0xcfe8f5, 1.28, 0.5, 0)
  bx(g, 1.9, 0.9, 0.86, 0xe5e7eb, -0.4, 0.2, 0)
  for (const x of [-1.0, -0.2, 1.1]) for (const z of [-0.38, 0.38]) bx(g, 0.26, 0.26, 0.12, 0x1a1a1a, x, 0, z)
  return g
}

function makePerson(rng) {
  const g = new THREE.Group()
  const skin = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac][Math.floor(rng() * 5)]
  const legs = [], arms = [], thighs = [], shins = [], sleeves = [], hands = []
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group()
    leg.position.set(sx * 0.085, 0.44, 0)
    thighs.push(bx(leg, 0.13, 0.23, 0.15, 0x3b5bdb, 0, -0.23, 0))
    shins.push(bx(leg, 0.12, 0.23, 0.14, 0x3b5bdb, 0, -0.44, 0))
    bx(leg, 0.13, 0.05, 0.2, 0x2b2b2b, 0, -0.44, 0.03)
    g.add(leg); legs.push(leg)
    const arm = new THREE.Group()
    arm.position.set(sx * 0.23, 0.82, 0)
    sleeves.push(bx(arm, 0.1, 0.26, 0.11, 0xff6b6b, 0, -0.26, 0))
    hands.push(bx(arm, 0.09, 0.1, 0.1, skin, 0, -0.36, 0))
    g.add(arm); arms.push(arm)
  }
  const torso = bx(g, 0.34, 0.4, 0.2, 0xff6b6b, 0, 0.44, 0)
  const head = mk(g, new THREE.SphereGeometry(0.15, 10, 8), skin, 0, 1.0, 0)
  const hat = mk(g, new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xd62828, 0, 1.03, 0)
  g.userData = { torso, head, hat, skin, legs, arms, thighs, shins, sleeves, hands }
  g.scale.setScalar(1.05)
  return g
}

function roundTex() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.6, 'rgba(255,255,255,.9)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.beginPath()
  g.arc(32, 32, 30, 0, Math.PI * 2)
  g.fill()
  return new THREE.CanvasTexture(c)
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MAPS = makeMaps({ THREE, bx, cyl, mk, wall, shade, makeCar, makeBus, makeVan, makeTruck, windowTex })
const M = (c) => (typeof c === 'number' ? L(c) : c)
const MAP_SKY = Object.fromEntries(MAP_LIST.map((m) => [m.id, m.hud === 'light' ? [m.sky[0], m.sky[1], m.sky[1]] : m.sky]))

const LOT_Q = [[1, -1], [1, 1], [-1, 1], [-1, -1]]
const CELLS = [[4.9, 4.9], [11.1, 4.9], [4.9, 11.1]]
const DECOR = [11.1, 11.1]
const TAU = Math.PI * 2

/* ---------- scene ---------- */
export class CityScene {
  constructor(container, { onSelect, onViewChanged } = {}) {
    this.container = container
    this.onSelect = onSelect || (() => {})
    this.onViewChanged = onViewChanged || (() => {})
    this.rng = mulberry(7)
    this.lots = []
    this.walkers = []
    this.cars = []
    this.clock = { last: performance.now(), elapsedTime: 0, getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; this.elapsedTime += d; return d } }
    this.moved = false
    this.selected = null
    this.map = null
    this.world = null
    this.lastList = null
    this.spinners = []
    this.dark = false
    this.tween = null
    this.filter = null
    this.running = false

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.setClearColor(0x000000, 0)
    container.appendChild(this.renderer.domElement)

    this.outline = new OutlineEffect(this.renderer, { defaultThickness: 0.0035, defaultColor: [0.13, 0.1, 0.16], defaultAlpha: 1 })
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(32, 1, 5, 600)

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x9fb0c4, 1.4)
    this.sun = new THREE.DirectionalLight(0xfff1cc, 2.4)
    this.sun.position.set(26, 44, 18)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    const sc = this.sun.shadow.camera
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 5; sc.far = 140
    this.sun.shadow.bias = -0.0006
    this.sun.shadow.normalBias = 0.04
    this.scene.add(this.hemi, this.sun)

    this.buildParticles()
    this.buildRings()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.09
    this.controls.screenSpacePanning = false
    this.controls.rotateSpeed = 0.7
    this.controls.zoomSpeed = 0.9
    this.controls.minPolarAngle = 0.32
    this.controls.maxPolarAngle = 1.28
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    this.controls.addEventListener('change', () => this.checkMoved())
    this.controls.addEventListener('start', () => { this.tween = null })

    this.raycaster = new THREE.Raycaster()
    this.bindPointer()
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.resize(true)
    this.setMap('city')
  }

  /* --- world --- */
  buildWorld() {
    const s = this.world
    const m = this.mats
    const rng = this.rng
    const T = this.T, C = T.c
    // board
    bx(s, 30, 0.9, 30, C.base, 0, -1.4, 0)
    bx(s, 30.2, 0.12, 30.2, C.base2, 0, -1.55, 0)
    const g = mk(s, new THREE.BoxGeometry(30, 0.5, 30), m.grass, 0, -0.25, 0)
    g.castShadow = false
    // roads
    for (const [w, d] of [[30, 3], [3, 30]]) {
      const r = mk(s, new THREE.BoxGeometry(w, 0.06, d), C.road, 0, 0.03, 0, false)
      if (w === 3) r.position.y = 0.035
    }
    if (T.dashes) {
      const dash = M(C.dash), cross = M(C.cross)
      for (let i = -13; i <= 13; i += 2) {
        if (Math.abs(i) < 2.2) continue
        bx(s, 1.0, 0.02, 0.12, dash, i, 0.07, 0)
        bx(s, 0.12, 0.02, 1.0, dash, 0, 0.075, i)
      }
      for (const sgn of [-1, 1]) {
        for (let k = -1; k <= 1; k++) {
          bx(s, 0.5, 0.02, 0.28, cross, sgn * 2.1, 0.08, k * 0.75)
          bx(s, 0.28, 0.02, 0.5, cross, k * 0.75, 0.085, sgn * 2.1)
        }
      }
    }
    if (T.id === 'court') {
      const ring = mk(s, new THREE.RingGeometry(1.0, 1.12, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), 0, 0.1, 0, false)
      ring.rotation.x = -Math.PI / 2
    }
    // slabs
    for (const [sx, sz] of LOT_Q) {
      const p = mk(s, new THREE.BoxGeometry(12.8, 0.1, 12.8), m.pad, sx * 8, 0.05, sz * 8, false)
      p.receiveShadow = true
    }
    if (T.wire) {
      const grid = new THREE.GridHelper(30, 30, C.road, C.pad)
      grid.position.y = 0.02
      s.add(grid)
    }
    if (T.zone) {
      const zone = mk(s, new THREE.RingGeometry(13.2, 13.5, 64), new THREE.MeshBasicMaterial({ color: 0x3aa0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), 0, 0.3, 0, false)
      zone.rotation.x = -Math.PI / 2
      const wallz = mk(s, new THREE.CylinderGeometry(13.35, 13.35, 3, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x3aa0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.12, depthWrite: false }), 0, 1.8, 0, false)
      wallz.renderOrder = 2
    }
    if (T.studs) {
      const pts = []
      for (let x = -14; x <= 14; x++) for (let z = -14; z <= 14; z++) if (Math.abs(x) > 1.7 && Math.abs(z) > 1.7) pts.push([x, z])
      const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 10), L(shade(new THREE.Color(m.pad.color).getHex(), -0.05)), pts.length)
      const mat = new THREE.Matrix4()
      pts.forEach(([x, z], k) => { mat.makeTranslation(x, 0.135, z); im.setMatrixAt(k, mat) })
      im.receiveShadow = true
      s.add(im)
    }
    // lamps
    for (const i of [-12, -6, 6, 12]) {
      for (const sg of [-1, 1]) {
        this.lamp(i, sg * 1.62)
        this.lamp(sg * 1.62, i)
      }
    }
    // decor cells
    const [dx, dz] = DECOR
    const cells = [[-dx, -dz], [dx, -dz], [-dx, dz], [dx, dz]]
    const defaults = [
      (x, z) => { // park with pond
        bx(s, 5.0, 0.14, 5.0, C.park, x, 0.1, z)
        const pond = mk(s, new THREE.CylinderGeometry(1.5, 1.5, 0.12, 24), m.water, x + 0.2, 0.2, z + 0.1, false)
        pond.receiveShadow = true
        bx(s, 0.8, 0.12, 3.2, C.bench, x + 0.2, 0.26, z + 0.1)
        for (const [ox, oz, sc, t] of [[-1.9, -1.8, 1.1, 'r'], [1.9, -1.7, 1, 'p'], [-1.8, 1.8, 1.2, 'p'], [1.8, 1.9, 1, 'r'], [-2.2, 0.1, 0.9, 'r']]) this.tree(x + ox, z + oz, sc, t)
        mk(s, new THREE.DodecahedronGeometry(0.42), C.stone, x - 1.2, 0.5, z + 1.1)
      },
      (x, z) => { this.court(x, z, C.court); this.tree(x + 2.9, z - 2.7, 1, 'p') },
      (x, z) => { // fountain plaza
        bx(s, 4.6, 0.12, 4.6, C.plaza, x, 0.1, z)
        cyl(s, 1.1, 0.35, C.stone, x, 0.15, z, 20)
        mk(s, new THREE.CylinderGeometry(0.9, 0.9, 0.1, 20), m.water, x, 0.52, z, false)
        cyl(s, 0.1, 0.9, C.stone, x, 0.4, z, 8)
        for (const [ox, oz] of [[-2.1, -2.0], [2.2, 2.0]]) this.tree(x + ox, z + oz, 1, 'r')
        bx(s, 1.2, 0.12, 0.4, C.bench, x + 1.9, 0.45, z - 0.6)
      },
      (x, z) => { // grove
        bx(s, 4.6, 0.12, 4.6, C.grove, x, 0.1, z)
        for (const [ox, oz, sc, t] of [[-1.4, -1.3, 1.2, 'p'], [1.2, -1.5, 1, 'r'], [-1.2, 1.4, 1, 'r'], [1.5, 1.3, 1.3, 'p'], [0, 0, 1.1, 'r']]) this.tree(x + ox, z + oz, sc, t)
      },
    ]
    const courtCols = [C.park, C.court, C.plaza, C.grove]
    cells.forEach(([x, z], k) => {
      const lm = T.landmarks[k]
      if (lm === 'court') this.court(x, z, courtCols[k])
      else if (lm) { const r = lm(s, x, z); if (r && r.spin) this.spinners.push(r.spin) }
      else defaults[k](x, z)
    })
    // scattered gap decor
    for (const [sx, sz] of LOT_Q) {
      for (const [cx, cz] of [[8.0, 4.9], [4.9, 8.0], [8.0, 11.1], [11.1, 8.0]]) {
        const x = sx * cx, z = sz * cz
        const r = rng()
        if (r < 0.4) this.tree(x + (rng() - 0.5) * 0.8, z + (rng() - 0.5) * 0.8, 0.8 + rng() * 0.4, rng() > 0.5 ? 'r' : 'p')
        else if (r < 0.7) bx(s, 0.9, 0.12, 0.35, C.bench, x, 0.45, z)
        else bx(s, 0.5, 0.4, 0.5, C.crate[Math.floor(rng() * 3)], x, 0.1, z)
      }
    }
    // border trees
    for (const [x, z] of [[-14, 0], [14, 0], [0, -14], [0, 14], [-14.2, 6], [14.2, -6]]) this.tree(x, z, 0.8, 'p')
    if (T.tree === 'jungle') for (const [x, z] of [[-14, -9], [14, 9], [-9, 14], [9, -14], [-14, 11], [11, -14.2], [14, 3], [-3, 14]]) this.tree(x, z, 1.1, 'r')

    // lots
    this.pickGroup = new THREE.Group()
    s.add(this.pickGroup)
    let i = 0
    for (const [sx, sz] of LOT_Q) {
      for (const [cx, cz] of CELLS) {
        const pos = new THREE.Vector3(sx * cx, 0, sz * cz)
        const holder = new THREE.Group()
        holder.position.copy(pos)
        holder.position.y = 0.1
        s.add(holder)
        const border = bx(s, 4.9, 0.1, 4.9, 0xffffff, pos.x, 0.07, pos.z)
        const pad = mk(s, new THREE.BoxGeometry(4.55, 0.16, 4.55), m.pad, pos.x, 0.12, pos.z, false)
        pad.receiveShadow = true
        const pick = new THREE.Mesh(new THREE.BoxGeometry(4.6, 6, 4.6), new THREE.MeshBasicMaterial({ visible: false }))
        pick.position.set(pos.x, 3, pos.z)
        pick.userData.lot = i
        this.pickGroup.add(pick)
        this.lots.push({
          i, pos, holder, border, pad, pick, county: null, built: null, top: 1.5, pop: 1, target: 0, stepAt: 0, stepEvery: 0.5, crane: null, parts: {}, anims: [], dim: 0, dimTarget: 0, mats: [], bush: null,
        })
        i++
      }
    }
  }

  court(x, z, color) {
    const s = this.world, C = this.T.c
    const line = M(C.courtLine)
    bx(s, 4.6, 0.12, 4.6, color, x, 0.1, z)
    bx(s, 4.0, 0.02, 0.07, line, x, 0.23, z)
    bx(s, 0.07, 0.02, 3.2, line, x, 0.23, z)
    for (const sg of [-1, 1]) {
      cyl(s, 0.05, 1.7, 0xcbd5e1, x + sg * 2.0, 0.1, z, 5)
      bx(s, 0.05, 0.6, 0.8, 0xffffff, x + sg * 1.9, 1.5, z)
    }
  }

  lamp(x, z) {
    const g = new THREE.Group()
    const C = this.T.c
    cyl(g, 0.06, 1.7, C.lampPole, 0, 0, 0, 6)
    mk(g, new THREE.SphereGeometry(0.14, 8, 6), this.T.glowLamps ? new THREE.MeshBasicMaterial({ color: C.lampGlow }) : C.lampGlow, 0, 1.78, 0, false)
    g.position.set(x, 0.08, z)
    this.world.add(g)
  }

  tree(x, z, sc = 1, type = 'r') {
    const g = new THREE.Group()
    const kind = this.T.tree, C = this.T.c, m = this.mats
    if (kind === 'lego') {
      bx(g, 0.3, 0.7 * sc, 0.3, C.trunk, 0, 0, 0)
      const ws = type === 'p' ? [1.3, 1.0, 0.7, 0.4] : [1.1, 1.4, 1.0]
      ws.forEach((w, k) => bx(g, w * sc, 0.42 * sc, w * sc, k % 2 ? m.blossom : m.round, 0, (0.7 + k * 0.42) * sc, 0))
      cyl(g, 0.14 * sc, 0.1, m.round, 0, (0.7 + ws.length * 0.42) * sc, 0, 8)
    } else if (kind === 'jungle') {
      if (type === 'p') {
        cyl(g, 0.1, 2.2 * sc, C.trunk, 0, 0, 0, 6)
        for (let k = 0; k < 6; k++) {
          const leaf = bx(g, 1.5 * sc, 0.05, 0.4 * sc, m.pine, 0, 2.2 * sc, 0)
          leaf.rotation.y = k * Math.PI / 3
          leaf.rotation.z = -0.35
          leaf.position.x = Math.cos(k * Math.PI / 3) * 0.6 * sc
          leaf.position.z = -Math.sin(k * Math.PI / 3) * 0.6 * sc
        }
      } else {
        cyl(g, 0.16, 1.5 * sc, C.trunk, 0, 0, 0, 6)
        mk(g, new THREE.IcosahedronGeometry(1.0 * sc, 0), m.round, 0, 2.0 * sc, 0)
        mk(g, new THREE.IcosahedronGeometry(0.7 * sc, 0), m.blossom, 0.7 * sc, 1.6 * sc, 0.3 * sc)
        mk(g, new THREE.IcosahedronGeometry(0.6 * sc, 0), m.pine, -0.6 * sc, 1.7 * sc, -0.3 * sc)
      }
    } else if (kind === 'neon') {
      cyl(g, 0.05, 1.3 * sc, C.trunk, 0, 0, 0, 5)
      const o = mk(g, new THREE.OctahedronGeometry(0.42 * sc, 0), type === 'p' ? m.pine : m.round, 0, 1.6 * sc, 0, false)
      o.scale.y = 1.5
    } else if (kind === 'coral') {
      if (type === 'p') {
        for (const [ox, oz, hh] of [[0, 0, 1.9], [0.25, 0.1, 1.4], [-0.2, 0.2, 1.6]]) mk(g, new THREE.ConeGeometry(0.1 * sc, hh * sc, 5), m.pine, ox, hh * sc / 2, oz)
      } else {
        const mat = [m.round, m.blossom][Math.floor(this.rng() * 2)]
        cyl(g, 0.13 * sc, 0.9 * sc, mat, 0, 0, 0, 6)
        for (const [rz, ox] of [[0.7, -0.3], [-0.7, 0.3]]) {
          const br = cyl(g, 0.09 * sc, 0.7 * sc, mat, ox * sc, 0.5 * sc, 0, 6)
          br.rotation.z = rz
        }
        mk(g, new THREE.SphereGeometry(0.2 * sc, 8, 6), mat, 0, 0.95 * sc, 0)
      }
    } else if (kind === 'snow') {
      if (type === 'p') {
        cyl(g, 0.12, 0.6 * sc, C.trunk, 0, 0, 0, 6)
        mk(g, new THREE.ConeGeometry(0.75 * sc, 1.3 * sc, 7), m.pine, 0, 1.2 * sc, 0)
        mk(g, new THREE.ConeGeometry(0.5 * sc, 0.75 * sc, 7), m.blossom, 0, 1.75 * sc, 0)
        mk(g, new THREE.ConeGeometry(0.34 * sc, 0.6 * sc, 7), m.blossom, 0, 2.3 * sc, 0)
      } else {
        mk(g, new THREE.ConeGeometry(0.4 * sc, 1.6 * sc, 5), m.water, 0, 0.8 * sc, 0)
        mk(g, new THREE.ConeGeometry(0.25 * sc, 0.9 * sc, 5), m.round, 0.4 * sc, 0.45 * sc, 0.2 * sc)
      }
    } else if (kind === 'cone') {
      if (type === 'p') {
        mk(g, new THREE.ConeGeometry(0.3 * sc, 0.8 * sc, 10), m.pine, 0, 0.4 * sc, 0)
        bx(g, 0.7 * sc, 0.05, 0.7 * sc, m.pine, 0, 0, 0)
      } else {
        mk(g, new THREE.SphereGeometry(0.4 * sc, 12, 10), m.round, 0, 0.4 * sc, 0)
      }
    } else {
      cyl(g, 0.12, 0.6 * sc, C.trunk, 0, 0, 0, 6)
      if (type === 'p') {
        mk(g, new THREE.ConeGeometry(0.75 * sc, 1.3 * sc, 7), m.pine, 0, 0.55 * sc + 0.65 * sc, 0)
        mk(g, new THREE.ConeGeometry(0.55 * sc, 1.0 * sc, 7), m.pine, 0, 1.3 * sc + 0.5 * sc, 0)
      } else {
        mk(g, new THREE.IcosahedronGeometry(0.78 * sc, 0), m.round, 0, 1.2 * sc, 0)
        mk(g, new THREE.IcosahedronGeometry(0.46 * sc, 0), m.blossom, 0.5 * sc, 1.45 * sc, 0.25 * sc)
      }
    }
    g.position.set(x, 0.1, z)
    g.rotation.y = this.rng() * TAU
    this.world.add(g)
  }

  buildWalkers() {
    const rng = this.rng
    const P = this.T.people
    for (let i = 0; i < 8; i++) {
      const p = makePerson(rng)
      const axis = i % 2 ? 'x' : 'z'
      const off = (i % 4 < 2 ? 1 : -1) * (1.85 + (rng() - 0.5) * 0.25)
      const dir = rng() > 0.5 ? 1 : -1
      const w = { p, axis, off, dir, t: (rng() - 0.5) * 26, speed: 0.55 + rng() * 0.5, ph: rng() * 6, ci: Math.floor(rng() * 6), pi: Math.floor(rng() * 3) }
      const u = p.userData
      if (P.skin) { u.skin = P.skin; u.head.material.color.set(P.skin); u.hands.forEach((h) => h.material.color.set(P.skin)) }
      const coat = P.coats[w.ci % P.coats.length]
      const pants = P.pants[w.pi % P.pants.length]
      u.torso.material.color.set(coat)
      u.sleeves.forEach((mm) => mm.material.color.set(coat))
      u.thighs.forEach((mm) => mm.material.color.set(pants))
      u.shins.forEach((mm) => mm.material.color.set(P.shorts ? u.skin : pants))
      u.hat.visible = !!P.hat
      if (P.hat) u.hat.material.color.set(P.hats ? P.hats[w.ci % P.hats.length] : P.hat)
      this.world.add(p)
      this.walkers.push(w)
    }
  }

  buildCars() {
    // pool of vehicles; the spawner sends them across the roads one at a time
    this.cars = this.T.vehicles().map((car) => {
      car.visible = false
      this.world.add(car)
      return { car, active: false, axis: 'x', lane: 0, dir: 1, t: 0, base: 2.6, speed: 2.6, ph: this.rng() * 6 }
    })
    this.spawnIn = 0.4
    for (let i = 0; i < 3; i++) this.spawnVehicle(true)
  }

  spawnVehicle(anywhere = false) {
    const free = this.cars.filter((c) => !c.active)
    if (!free.length) return
    const v = free[Math.floor(this.rng() * free.length)]
    const axis = this.rng() > 0.5 ? 'x' : 'z'
    const lane = this.rng() > 0.5 ? 0.75 : -0.75
    const dir = axis === 'x' ? (lane > 0 ? 1 : -1) : (lane > 0 ? -1 : 1)
    const t = anywhere ? (this.rng() - 0.5) * 24 : -dir * 16
    for (const o of this.cars) if (o.active && o.axis === axis && o.lane === lane && Math.abs(o.t - t) < 6) return
    Object.assign(v, { active: true, axis, lane, dir, t, base: 2.2 + this.rng() * 1.2 })
    v.speed = v.base
    v.car.visible = true
  }

  buildParticles() {
    this.pN = 420
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(this.pN * 3)
    for (let i = 0; i < this.pN; i++) {
      pos[i * 3] = (this.rng() - 0.5) * 38
      pos[i * 3 + 1] = this.rng() * 24
      pos[i * 3 + 2] = (this.rng() - 0.5) * 38
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.pMat = new THREE.PointsMaterial({ size: 0.3, map: roundTex(), transparent: true, depthWrite: false, alphaTest: 0.02 })
    this.points = new THREE.Points(geo, this.pMat)
    this.points.visible = false
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  buildRings() {
    const mkRing = (r0, r1, c) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }))
      m.rotation.x = -Math.PI / 2
      m.position.y = 0.32
      m.visible = false
      this.scene.add(m)
      return m
    }
    this.ringA = mkRing(2.35, 2.55, 0xf4c430)
    this.ringB = mkRing(1.95, 2.05, 0x4cc9f0)
  }

  /* --- public API --- */
  setMap(name) {
    if (!MAPS[name]) name = 'city'
    const key = name === 'wire' && !this.dark ? 'wireLight' : name
    if (this.mapKey === key && this.world) return
    this.map = name
    this.mapKey = key
    const T = (this.T = MAPS[key])
    TOON = !!T.toon
    WIRE = !!T.wire
    if (this.world) {
      this.scene.remove(this.world)
      this.world.traverse((n) => {
        if (n.geometry) n.geometry.dispose()
        if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((mm) => mm.dispose())
      })
    }
    this.world = new THREE.Group()
    this.scene.add(this.world)
    this.lots = []
    this.walkers = []
    this.cars = []
    this.spinners = []
    this.rng = mulberry(7)
    const C = T.c
    this.mats = { grass: M(C.grass), pad: M(C.pad), round: M(C.round), pine: M(C.pine), blossom: M(C.blossom), water: M(C.water) }
    this.buildWorld()
    this.buildWalkers()
    this.buildCars()
    this.sun.color.set(T.sun[0])
    this.sunI = T.sun[1]
    this.hemi.color.set(T.hemi[0])
    this.hemi.groundColor.set(T.hemi[1])
    this.hemiI = T.hemi[2]
    this.scene.fog = T.fog ? new THREE.Fog(T.fog[0], T.fog[1], T.fog[2]) : null
    if (T.particle) {
      this.points.visible = true
      this.pMat.color.set(T.particle.color)
      this.pMat.size = T.particle.size
      this.pCfg = T.particle
    } else {
      this.points.visible = false
      this.pCfg = null
    }
    this.applyTheme()
    if (this.lastList) this.setCounties(this.lastList)
    this.start()
  }

  setDark(dark) {
    this.dark = dark
    if (this.map === 'wire') this.setMap('wire') // wireframe swaps its line colours between light and dark
    this.applyTheme()
  }

  applyTheme() {
    const T = this.T
    if (!T) return
    this.sun.intensity = this.sunI * (this.dark ? 0.62 : 1)
    this.hemi.intensity = this.hemiI * (this.dark ? 0.62 : 1)
    const st = this.container.style
    const sky = MAP_SKY[T.id]
    st.setProperty('--sky-a', this.dark ? '#000000' : sky[0])
    st.setProperty('--sky-b', this.dark ? '#000000' : sky[1])
    if (this.dark) st.setProperty('--sky-c', '#000000')
    else if (sky[2]) st.setProperty('--sky-c', sky[2])
    else st.removeProperty('--sky-c')
    if (this.scene.fog) this.scene.fog.color.set(this.dark ? 0x000000 : T.fog[0])
  }

  setCounties(list) {
    // list: [{id,name,group,style,color,spent,count,level}]
    this.lastList = list
    this.lots.forEach((lot, i) => {
      const c = list[i] || null
      lot.county = c
      lot.pick.userData.countyId = c ? c.id : null
      if (!c) {
        lot.border.material.color.set(this.T.c.empty)
        lot.target = 0
        if (!lot.built || lot.built.key !== 'none') this.rebuildLot(lot, null, 0)
        return
      }
      lot.border.material.color.set(c.color)
      const L = c.spent > 0 ? Math.max(1, c.level || 1) : 0
      const look = c.style + '|' + c.color
      const same = lot.built && lot.built.look === look
      if (same && L > lot.built.L) {
        // an expense was added: construct the new steps one after another
        const from = lot.target > lot.built.L ? lot.target : lot.built.L
        lot.target = L
        const n = L - lot.built.L
        lot.stepEvery = Math.min(6, Math.max(1, 0.5 + (L - from) * 0.5 + (from - lot.built.L) * 0.3)) / n
        if (!(lot.stepAt > performance.now())) lot.stepAt = performance.now() + 250
        this.setCrane(lot, true)
      } else if (!same || L !== lot.built.L) {
        lot.target = L
        this.rebuildLot(lot, c, L)
      }
    })
    this.applyFilter()
    this.start()
  }

  // what stands on the lot at a given level
  plan(L) {
    const p = { found: L >= 1, hut: L === 2, M: L >= 3 ? 1 : 0, extras: L >= 4, A: 0, B: 0, last: 'found' }
    if (L === 2) p.last = 'hut'
    if (L === 3) p.last = 'M'
    if (L === 4) p.last = 'extras'
    const first = ['A', 'M', 'M', 'B'], cyc = ['M', 'A', 'M', 'M', 'B']
    for (let i = 5; i <= L; i++) {
      const k = i <= 8 ? first[i - 5] : cyc[(i - 9) % 5]
      p[k]++
      p.last = k
    }
    return p
  }

  setCrane(lot, on) {
    if (!on) { if (lot.crane) lot.crane.userData.leaving = true; return }
    if (lot.crane) { lot.crane.userData.leaving = false; return }
    const g = new THREE.Group()
    bx(g, 0.5, 0.2, 0.5, 0x6b7280, 0, 0, 0)
    const pole = bx(g, 0.14, 1, 0.14, 0xf4b400, 0, 0, 0)
    pole.geometry.translate(0, 0.5, 0)
    pole.position.y = 0.2
    const arm = new THREE.Group()
    bx(arm, 3.2, 0.12, 0.12, 0xf4b400, 1.1, 0, 0)
    bx(arm, 0.5, 0.3, 0.3, 0x4b5563, -0.5, -0.1, 0)
    bx(arm, 0.03, 1.1, 0.03, 0x2b2b2b, 2.3, -1.1, 0)
    bx(arm, 0.3, 0.2, 0.3, 0xf4b400, 2.3, -1.3, 0)
    g.add(arm)
    g.userData = { arm, pole, h: Math.max(3.2, lot.top + 2.2), grow: 0, leaving: false }
    g.position.set(lot.pos.x + 1.95, 0.2, lot.pos.z - 1.95)
    g.scale.setScalar(0.001)
    this.world.add(g)
    lot.crane = g
  }

  disposePart(g) {
    const shared = new Set(Object.values(this.mats))
    g.traverse((n) => {
      if (n.geometry) n.geometry.dispose()
      if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((mm) => { if (!shared.has(mm)) mm.dispose() })
    })
    g.parent && g.parent.remove(g)
  }

  // Builds only the pieces that changed since the last level; everything else stays untouched.
  rebuildLot(lot, c, L, animate = false) {
    const parts = (lot.parts ||= {})
    const want = {}
    if (c) {
      const colN = new THREE.Color(c.color).getHex()
      const T = this.T
      const P = this.plan(L)
      const main = (f, style) => (g) => {
        if (T.build) T.build(g, f, colN, style)
        else (STYLE_FN[style] || STYLE_FN.shop)(g, f, colN)
      }
      const alt = T.build ? [c.style + '-a', c.style + '-b'] : [c.style === 'house' ? 'shop' : 'house', c.style === 'cafe' ? 'market' : 'cafe']
      const look = c.style + '|' + c.color
      if (L === 0) want.sign = { sig: look, at: [0, 0, 0], sc: [1, 1], make: (g) => { cyl(g, 0.05, 0.9, 0x6b5a3e, 0, 0, 0, 5); bx(g, 0.9, 0.5, 0.06, colN, 0, 0.75, 0) } }
      if (P.found) want.found = { sig: look + (L === 1 ? ':stakes' : ''), at: [-0.55, 0, -0.55], sc: [1, 1], make: (g) => {
        bx(g, 2.3, 0.06, 2.3, 0x9aa0a8, 0, 0, 0)
        if (L === 1) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(g, 0.1, 0.5, 0.1, 0xf4b400, sx * 1.05, 0.06, sz * 1.05)
      } }
      if (P.hut) want.hut = { sig: look, at: [-0.55, 0.07, -0.55], sc: [0.9, 0.9], make: (g) => (T.kiosk || kiosk)(g, colN) }
      if (P.M) want.M = { sig: look + ':' + P.M, at: [-0.55, 0.07, -0.55], sc: [0.62, 0.8], make: main(P.M, c.style) }
      if (P.extras) want.extras = { sig: look, at: [0, 0, 0], sc: [1, 1], make: (g) => {
        for (let k = 0; k < 5; k++) bx(g, 0.08, 0.36, 0.08, colN, -2.0 + k * 0.5, 0, 2.05)
        bx(g, 2.1, 0.06, 0.05, colN, -1.0, 0.24, 2.05)
        cyl(g, 0.04, 1.3, 0x6b7280, 1.9, 0, 2.0, 5)
        bx(g, 0.5, 0.3, 0.03, colN, 1.63, 1.0, 2.0)
        bx(g, 0.5, 0.22, 0.5, new THREE.Color(this.mats.round.color).getHex(), 0.9, 0, -1.7)
      } }
      if (P.A) want.A = { sig: look + ':' + P.A, at: [1.3, 0, 0.85], sc: [0.4, 0.62], make: main(P.A, alt[0]) }
      if (P.B) want.B = { sig: look + ':' + P.B, at: [-1.25, 0, 1.3], sc: [0.34, 0.55], make: main(P.B, alt[1]) }
    } else {
      want.none = { sig: 'none', at: [0, 0, 0], sc: [1, 1], make: (g) => mk(g, new THREE.IcosahedronGeometry(0.5, 0), new THREE.Color(this.mats.round.color).getHex(), 0, 0.5, 0) }
    }
    for (const k of Object.keys(parts)) {
      if (!want[k]) { this.disposePart(parts[k].g); delete parts[k] }
    }
    lot.anims = (lot.anims || []).filter((a) => a.g.parent)
    for (const [k, w] of Object.entries(want)) {
      const old = parts[k]
      if (old && old.sig === w.sig) continue
      const g = new THREE.Group()
      w.make(g)
      g.position.set(w.at[0], w.at[1], w.at[2])
      g.scale.set(w.sc[0], w.sc[1], w.sc[0])
      lot.holder.add(g)
      const hgt = new THREE.Box3().setFromObject(g).max.y
      const mats = []
      g.traverse((n) => {
        if (!n.material) return
        for (const mm of Array.isArray(n.material) ? n.material : [n.material]) {
          if (mm.color && !mm.userData.base) { mm.userData.base = mm.color.clone(); mats.push(mm) }
        }
      })
      if (lot.dim > 0) for (const mm of mats) mm.color.copy(mm.userData.base).lerp(DIM, lot.dim * 0.78)
      if (animate) {
        // grow from the height it already had (a new floor rises out of the old roof), or from the ground if new
        const from = old && old.h > 0 ? Math.min(0.97, (old.h * (old.g.scale.y / old.sy)) / hgt) : 0.02
        lot.anims = lot.anims.filter((a) => a.key !== k)
        lot.anims.push({ key: k, g, sy: w.sc[1], from, t: 0 })
        g.scale.y = w.sc[1] * from
      }
      if (old) this.disposePart(old.g)
      parts[k] = { g, sig: w.sig, h: hgt, sy: w.sc[1], mats }
    }
    lot.mats = Object.values(parts).flatMap((p) => p.mats)
    lot.top = Math.max(1, ...Object.values(parts).map((p) => p.h))
    lot.built = { key: c ? c.style + '|' + c.color + '|' + L : 'none', look: c ? c.style + '|' + c.color : 'none', L }
    if (lot.dim < 0) lot.dim = 0
  }

  setFilter(group, centroid = true) {
    this.filter = group
    this.applyFilter()
    if (group && centroid) {
      const hit = this.lots.filter((l) => l.county && l.county.group === group)
      if (hit.length) {
        const cx = hit.reduce((a, l) => a + l.pos.x, 0) / hit.length
        const cz = hit.reduce((a, l) => a + l.pos.z, 0) / hit.length
        this.flyTo({ x: cx * 0.6, z: cz * 0.6, radius: this.D0 * 0.78 })
      }
    } else if (!group && centroid) this.recenter()
    this.start()
  }

  applyFilter() {
    for (const lot of this.lots) lot.dimTarget = this.filter && lot.county && lot.county.group !== this.filter ? 1 : 0
  }

  select(id, fly = true) {
    this.selected = id
    const lot = this.lots.find((l) => l.county && l.county.id === id)
    if (lot) {
      this.ringA.position.set(lot.pos.x, 0.32, lot.pos.z)
      this.ringB.position.set(lot.pos.x, 0.34, lot.pos.z)
      this.ringA.visible = this.ringB.visible = true
      if (fly) this.flyTo({ x: lot.pos.x, z: lot.pos.z, radius: this.D0 * Math.min(1.6, 0.6 * Math.max(1, lot.top / 5)), phi: 0.95 })
    } else {
      this.ringA.visible = this.ringB.visible = false
    }
    this.start()
  }

  recenter() {
    this.flyTo({ x: 0, z: 0, radius: this.D0, theta: Math.PI / 4, phi: 0.98 })
  }

  pulse(id) {
    const lot = this.lots.find((l) => l.county && l.county.id === id)
    if (lot) this.start() // construction animation runs from setCounties
  }

  project(id) {
    const lot = this.lots.find((l) => l.county && l.county.id === id)
    if (!lot) return null
    const v = new THREE.Vector3(lot.pos.x, lot.top + 0.3, lot.pos.z).project(this.camera)
    const r = this.container.getBoundingClientRect()
    return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height }
  }

  /* --- internals --- */
  flyTo({ x, z, radius, theta, phi }) {
    const off = this.camera.position.clone().sub(this.controls.target)
    const sp = new THREE.Spherical().setFromVector3(off)
    let th = theta ?? sp.theta
    let d = th - sp.theta
    d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI
    this.tween = {
      t: 0, dur: 0.9,
      from: { x: this.controls.target.x, z: this.controls.target.z, r: sp.radius, th: sp.theta, ph: sp.phi },
      to: { x, z, r: radius, th: sp.theta + d, ph: phi ?? sp.phi },
    }
    this.start()
  }

  checkMoved() {
    const off = this.camera.position.clone().sub(this.controls.target)
    const sp = new THREE.Spherical().setFromVector3(off)
    const t = this.controls.target
    const moved = Math.hypot(t.x, t.z) > 1.5 || Math.abs(sp.radius - this.D0) > this.D0 * 0.1
    if (moved !== this.moved) {
      this.moved = moved
      this.onViewChanged(moved)
    }
  }

  resize(first) {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w < 50 || h < 50) return
    this.renderer.setSize(w, h, true)
    this.camera.aspect = w / h
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const horiz = 20 / (tanV * this.camera.aspect)
    const vert = 14 / tanV
    this.D0 = Math.max(horiz, vert) / 2.2 // default view fills the screen
    this.camera.updateProjectionMatrix()
    if (this.controls) {
      this.controls.minDistance = this.D0 * 0.2
      this.controls.maxDistance = this.D0 * 2.75
    }
    if (first) {
      const th = Math.PI / 4, ph = 0.98
      this.camera.position.set(Math.sin(ph) * Math.sin(th) * this.D0, Math.cos(ph) * this.D0, Math.sin(ph) * Math.cos(th) * this.D0)
      this.camera.lookAt(0, 0, 0)
    }
    this.start()
  }

  bindPointer() {
    const el = this.renderer.domElement
    let down = null
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() } })
    el.addEventListener('pointerup', (e) => {
      if (!down) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y)
      const dt = performance.now() - down.t
      down = null
      if (moved > 7 || dt > 450) return
      const r = el.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1
      const ny = -((e.clientY - r.top) / r.height) * 2 + 1
      this.raycaster.setFromCamera({ x: nx, y: ny }, this.camera)
      const hit = this.raycaster.intersectObjects(this.pickGroup.children, false)
      const id = hit.length ? hit[0].object.userData.countyId : null
      this.onSelect(id || null)
    })
  }

  start() {
    this.idleSince = performance.now()
    if (this.running) return
    this.running = true
    this.clock.getDelta()
    this.renderer.setAnimationLoop(() => this.tick())
  }

  stop() {
    this.running = false
    this.renderer.setAnimationLoop(null)
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime

    if (this.tween) {
      const tw = this.tween
      tw.t += dt / tw.dur
      const k = Math.min(tw.t, 1)
      const e = 1 - Math.pow(1 - k, 3)
      const lerp = (a, b) => a + (b - a) * e
      const r = lerp(tw.from.r, tw.to.r), th = lerp(tw.from.th, tw.to.th), ph = lerp(tw.from.ph, tw.to.ph)
      const tx = lerp(tw.from.x, tw.to.x), tz = lerp(tw.from.z, tw.to.z)
      this.controls.target.set(tx, 0, tz)
      this.camera.position.set(tx + r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), tz + r * Math.sin(ph) * Math.cos(th))
      if (k >= 1) this.tween = null
    }
    const tg = this.controls.target
    tg.x = THREE.MathUtils.clamp(tg.x, -13, 13)
    tg.z = THREE.MathUtils.clamp(tg.z, -13, 13)
    this.controls.update()

    // lots: pop / dim / label
    const camDist = this.camera.position.distanceTo(this.controls.target)
    if (this.scene.fog) { this.scene.fog.near = camDist - 14; this.scene.fog.far = camDist + 70 }
    for (const lot of this.lots) {
      // construction: one step at a time until the lot reaches its target level
      if (lot.county && lot.built && lot.target > lot.built.L) {
        const now = performance.now()
        if (now >= lot.stepAt) {
          lot.stepAt = now + lot.stepEvery * 1000
          this.rebuildLot(lot, lot.county, lot.built.L + 1, true)
          if (lot.target <= lot.built.L) this.setCrane(lot, false)
          else if (lot.crane) lot.crane.userData.h = Math.max(lot.crane.userData.h, lot.top + 2.2)
        }
      }
      if (lot.crane) {
        const cu = lot.crane.userData
        cu.grow += ((cu.leaving ? 0 : 1) - cu.grow) * Math.min(1, dt * 5)
        cu.arm.rotation.y += dt * 1.2
        cu.pole.scale.y += (cu.h - cu.pole.scale.y) * Math.min(1, dt * 4)
        cu.arm.position.y = 0.2 + cu.pole.scale.y
        lot.crane.scale.setScalar(Math.max(0.001, cu.grow))
        if (cu.leaving && cu.grow < 0.02) { this.disposePart(lot.crane); lot.crane = null }
      }
      if (lot.anims && lot.anims.length) {
        const dur = Math.max(0.35, Math.min(0.9, lot.stepEvery * 1.6))
        for (const a of lot.anims) {
          a.t = Math.min(1, a.t + dt / dur)
          const e = a.t * a.t * (3 - 2 * a.t) // smooth start and stop, no bounce
          a.g.scale.y = a.sy * (a.from + (1 - a.from) * e)
        }
        lot.anims = lot.anims.filter((a) => a.t < 1)
      }
      if (Math.abs(lot.dim - lot.dimTarget) > 0.002) {
        lot.dim = lot.dim < 0 ? lot.dimTarget : lot.dim + (lot.dimTarget - lot.dim) * Math.min(1, dt * 7)
        for (const mm of lot.mats) {
          mm.color.copy(mm.userData.base).lerp(DIM, lot.dim * 0.78)
        }
      }
    }

    // rings
    if (this.ringA.visible) {
      const pulse = 0.55 + 0.45 * Math.sin(t * 4)
      this.ringA.material.opacity = 0.5 + 0.5 * pulse
      const sc = 1 + 0.04 * Math.sin(t * 4)
      this.ringA.scale.setScalar(sc)
      this.ringB.scale.setScalar(2 - sc)
    }

    // walkers
    for (const w of this.walkers) {
      w.t += w.dir * w.speed * dt
      if (w.t > 13.2) { w.t = 13.2; w.dir = -1 }
      if (w.t < -13.2) { w.t = -13.2; w.dir = 1 }
      w.ph += dt * (4 + w.speed * 6)
      const sw = Math.sin(w.ph)
      const u = w.p.userData
      u.legs[0].rotation.x = sw * 0.75
      u.legs[1].rotation.x = -sw * 0.75
      u.arms[0].rotation.x = -sw * 0.6
      u.arms[1].rotation.x = sw * 0.6
      u.torso.rotation.y = sw * 0.08
      const bob = Math.abs(Math.cos(w.ph)) * 0.045
      if (w.axis === 'x') {
        w.p.position.set(w.t, 0.1 + bob, w.off)
        w.p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2
      } else {
        w.p.position.set(w.off, 0.1 + bob, w.t)
        w.p.rotation.y = w.dir > 0 ? 0 : Math.PI
      }
    }
    // vehicles: spawn at one end, drive across, leave
    this.spawnIn -= dt
    if (this.spawnIn <= 0) { this.spawnIn = 1.8 + this.rng() * 2.6; this.spawnVehicle() }
    for (const c of this.cars) {
      if (!c.active) continue
      let sp = c.base
      for (const o of this.cars) {
        if (o === c || !o.active || o.axis !== c.axis || o.lane !== c.lane) continue
        const gap = (o.t - c.t) * c.dir
        if (gap > 0 && gap < 3.8) sp = Math.min(sp, o.speed * (gap < 2.6 ? 0.8 : 1))
      }
      c.speed += (sp - c.speed) * Math.min(1, dt * 4)
      c.t += c.dir * c.speed * dt
      if (Math.abs(c.t) > 16.5) { c.active = false; c.car.visible = false; continue }
      const ud = c.car.userData
      const vy = (ud.y ?? 0.08) + (ud.bob ? Math.sin(t * 2.2 + c.ph) * ud.bob : 0)
      if (ud.spin) ud.spin.rotation.z -= (c.speed * dt) / ud.r
      if (c.axis === 'x') {
        c.car.position.set(c.t, vy, c.lane)
        c.car.rotation.y = c.dir > 0 ? 0 : Math.PI
      } else {
        c.car.position.set(c.lane, vy, c.t)
        c.car.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2
      }
    }
    for (const sp of this.spinners) sp.rotation.z += dt * 0.25
    // particles
    if (this.pCfg) {
      const a = this.points.geometry.attributes.position
      for (let i = 0; i < this.pN; i++) {
        let y = a.getY(i) - this.pCfg.fall * dt
        let x = a.getX(i) + Math.sin(t * 0.8 + i) * this.pCfg.sway * dt
        if (y < 0) { y = 24; x = (this.rng() - 0.5) * 38 }
        else if (y > 24) { y = 0; x = (this.rng() - 0.5) * 38 }
        a.setXYZ(i, x, y, a.getZ(i))
      }
      a.needsUpdate = true
    }

    if (this.T.toon) this.outline.render(this.scene, this.camera)
    else this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.stop()
    this.ro.disconnect()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

const DIM = new THREE.Color(0x9a9a98)
