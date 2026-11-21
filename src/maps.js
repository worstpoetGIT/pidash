// map skins: ground, roads, buildings, vehicles, people, trees and sky for each one

const ALL_MAPS = [
  { id: 'city', name: 'Classic City', sky: ['#bfe3ff', '#eaf6ff'], ground: '#74c44a', road: '#48556b', accent: ['#e5383b', '#3a86ff', '#f4a259'] },
  { id: 'lego', name: 'Lego', sky: ['#aee1ff', '#f0faff'], ground: '#3fae49', road: '#6b7280', accent: ['#e3000b', '#ffd500', '#0057b8'] },
  { id: 'japan', name: 'Japan', sky: ['#8fd3ff', '#ffd6ea'], ground: '#8fd16a', road: '#5a6072', accent: ['#e63946', '#ffffff', '#ffb7d5'] },
  { id: 'ice', name: 'Ice Age', sky: ['#cfe6f7', '#f4faff'], ground: '#f4f9fd', road: '#a9d8f5', accent: ['#8b5a2b', '#cfeeff', '#ffffff'] },
  { id: 'wire', name: 'Wireframe', sky: ['#ffffff', '#ffffff'], ground: '#eef3f8', road: '#0a66c2', accent: ['#0a66c2', '#0a8f3c', '#c2187a'] },
  { id: 'war', name: 'Warzone', sky: ['#d9dcc6', '#f1f1e4'], ground: '#7d8a4e', road: '#9a8562', accent: ['#5d6b3a', '#8a8f7a', '#c0392b'] },
  { id: 'ocean', name: 'Under the Ocean', sky: ['#9fe0f5', '#e6f8fd'], ground: '#d9c58f', road: '#bfa873', accent: ['#ff7f6e', '#ffd166', '#4dd0e1'] },
  { id: 'court', name: 'Basketball Court', sky: ['#ffe3c2', '#fff5e8'], ground: '#d9a066', road: '#1d3f8a', accent: ['#e8742a', '#ffffff', '#c0392b'] },
]
// pidash ships four maps
export const MAP_LIST = ALL_MAPS.filter((m) => ['city', 'lego', 'japan', 'wire'].includes(m.id))

export function makeMaps(h) {
  const { THREE, bx, cyl, mk, wall, shade, makeCar, makeBus, makeVan, makeTruck, windowTex } = h
  const N = (c) => new THREE.MeshBasicMaterial({ color: c })
  const G = () => new THREE.Group()
  const variant = (style) => Math.abs([...String(style)].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % 3

  // buildings
  const build = {
    lego(g, f, col, style) {
      const v = variant(style)
      const w = [3.2, 2.8, 3.4][v], d = [2.8, 2.8, 2.4][v], fh = 0.62
      for (let i = 0; i < f; i++) {
        bx(g, w, fh - 0.04, d, i % 2 ? shade(col, 0.14) : col, 0, i * fh, 0)
        bx(g, w * 0.55, 0.3, 0.06, 0x9ad0ff, 0, i * fh + 0.16, d / 2 + 0.01)
      }
      const top = f * fh
      bx(g, w, 0.12, d, shade(col, -0.08), 0, top, 0)
      for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 3; iz++) cyl(g, 0.17, 0.1, col, (ix - 1.5) * (w / 4.2), top + 0.12, (iz - 1) * (d / 3.3), 10)
    },
    japan(g, f, col, style) {
      const v = variant(style)
      const wallC = [0xfdf6e9, 0xf3e3c8, 0xffffff][v]
      let y = 0
      bx(g, 3.5, 0.2, 3.5, 0x8a8f99, 0, 0, 0)
      y = 0.2
      for (let i = 0; i < f; i++) {
        const k = Math.max(0.62, 1 - i * 0.035)
        const w = 2.7 * k
        bx(g, w, 0.62, w, wallC, 0, y, 0)
        bx(g, w + 0.04, 0.1, w + 0.04, 0x7a3b2e, 0, y + 0.26, 0)
        for (const sx of [-1, 1]) bx(g, 0.12, 0.62, 0.12, 0xc0392b, sx * (w / 2), y, w / 2)
        const roof = mk(g, new THREE.CylinderGeometry(w * 0.52, w * 0.98, 0.34, 4), i === f - 1 ? shade(col, -0.06) : col, 0, y + 0.62 + 0.17, 0)
        roof.rotation.y = Math.PI / 4
        y += 0.96
      }
      const cap = mk(g, new THREE.ConeGeometry(0.75, 0.7, 4), shade(col, -0.06), 0, y + 0.3, 0)
      cap.rotation.y = Math.PI / 4
      cyl(g, 0.04, 0.7, 0xf4c430, 0, y + 0.6, 0, 5)
      bx(g, 0.55, 0.8, 0.08, 0x3b2a20, 0, 0.2, 1.36)
    },
    ice(g, f, col) {
      for (let i = 0; i < f; i++) {
        const k = Math.max(0.6, 1 - i * 0.03)
        bx(g, 3.0 * k, 0.66, 2.7 * k, i % 2 ? 0xa9d8f5 : 0xcfeeff, 0, i * 0.7, 0)
        bx(g, 3.0 * k + 0.06, 0.1, 2.7 * k + 0.06, col, 0, i * 0.7 + 0.5, 0)
      }
      const top = f * 0.7, k = Math.max(0.6, 1 - (f - 1) * 0.03)
      const cap = mk(g, new THREE.SphereGeometry(1.75 * k, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, 0, top - 0.05, 0)
      cap.scale.y = 0.45
      bx(g, 0.7, 0.8, 0.1, 0x3b2a20, 0, 0, 1.36)
      for (const sx of [-1, 1]) mk(g, new THREE.ConeGeometry(0.22, 0.9, 5), 0xbfe6fa, sx * 1.7, 0.45, 1.2)
    },
    war(g, f, col, style) {
      const v = variant(style)
      const con = [0x9a9c8c, 0x8a8f7a, 0xa39e88][v]
      if (v === 2) {
        // watchtower
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.09, 0.9 + f * 0.75, 0x5a4a32, sx * 0.9, 0, sz * 0.9, 6)
        for (let i = 1; i <= f; i++) bx(g, 2.0, 0.08, 2.0, 0x6b5a3e, 0, i * 0.75, 0)
        const top = 0.9 + f * 0.75
        bx(g, 2.4, 0.12, 2.4, 0x5a4a32, 0, top, 0)
        bx(g, 2.4, 0.5, 0.1, 0x5d6b3a, 0, top + 0.12, 1.15)
        bx(g, 2.4, 0.5, 0.1, 0x5d6b3a, 0, top + 0.12, -1.15)
        bx(g, 0.1, 0.5, 2.4, 0x5d6b3a, 1.15, top + 0.12, 0)
        bx(g, 0.1, 0.5, 2.4, 0x5d6b3a, -1.15, top + 0.12, 0)
        bx(g, 2.7, 0.1, 2.7, col, 0, top + 1.3, 0)
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.05, 1.2, 0x5a4a32, sx * 1.1, top + 0.12, sz * 1.1, 5)
        return
      }
      const w = v ? 3.3 : 2.9, d = v ? 2.5 : 2.9
      for (let i = 0; i < f; i++) {
        bx(g, w, 0.72, d, i % 2 ? shade(con, -0.05) : con, 0, i * 0.75, 0)
        bx(g, w + 0.08, 0.06, d + 0.08, 0x6f7163, 0, i * 0.75 + 0.69, 0)
        bx(g, 0.5, 0.34, 0.05, 0x1c1f1a, -0.75, i * 0.75 + 0.2, d / 2 + 0.01)
        bx(g, 0.5, 0.34, 0.05, 0x1c1f1a, 0.75, i * 0.75 + 0.2, d / 2 + 0.01)
      }
      const top = f * 0.75
      bx(g, w + 0.1, 0.3, 0.14, con, 0, top, d / 2)
      bx(g, w + 0.1, 0.3, 0.14, con, 0, top, -d / 2)
      cyl(g, 0.04, 1.5, 0x3a3a3a, w / 2 - 0.3, top, 0, 5)
      bx(g, 0.8, 0.45, 0.04, col, w / 2 - 0.72, top + 1.0, 0)
      bx(g, 0.6, 0.85, 0.08, 0x3b2a20, 0, 0, d / 2 + 0.02)
      for (const sx of [-1.2, -0.6]) bx(g, 0.55, 0.3, 0.3, 0xb5a67a, sx, 0, d / 2 + 0.5)
    },
    ocean(g, f, col) {
      const r = 1.5
      for (let i = 0; i < f; i++) {
        cyl(g, r - (i % 2 ? 0.12 : 0), 0.7, i % 2 ? shade(col, 0.16) : col, 0, i * 0.72, 0, 18)
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2 + (i % 2 ? Math.PI / 4 : 0)
          mk(g, new THREE.SphereGeometry(0.16, 8, 6), N(0xfff3b0), Math.cos(a) * (r - 0.08), i * 0.72 + 0.36, Math.sin(a) * (r - 0.08), false)
        }
      }
      const glass = new THREE.MeshLambertMaterial({ color: 0xa8e9ff, transparent: true, opacity: 0.62 })
      mk(g, new THREE.SphereGeometry(r - 0.05, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, f * 0.72, 0, false)
      for (const [x, z, c] of [[1.7, 1.2, 0xff7f6e], [-1.7, 1.0, 0xc77dff]]) {
        cyl(g, 0.09, 0.7, c, x, 0, z, 6)
        cyl(g, 0.07, 0.5, c, x + 0.2, 0.2, z, 6).rotation.z = -0.7
      }
    },
    court(g, f, col) {
      const fh = 0.64
      for (let i = 0; i < f; i++) bx(g, 3.2, fh - 0.03, 2.6, i % 2 ? 0xffffff : col, 0, i * fh, 0)
      const top = f * fh
      bx(g, 3.3, 0.12, 2.7, 0x2b2b2b, 0, top, 0)
      cyl(g, 0.06, 1.2, 0x9aa5b1, 0, top + 0.1, 0.6, 6)
      bx(g, 1.3, 0.85, 0.08, 0xffffff, 0, top + 0.9, 0.7)
      bx(g, 0.5, 0.36, 0.09, 0xe8742a, 0, top + 1.0, 0.72)
      const rim = mk(g, new THREE.TorusGeometry(0.27, 0.04, 6, 14), 0xe85d04, 0, top + 1.0, 1.05)
      rim.rotation.x = Math.PI / 2
      mk(g, new THREE.SphereGeometry(0.42, 14, 10), 0xe8742a, -0.95, top + 0.54, -0.5)
    },
  }

  const kiosks = {
    lego(g, col) {
      bx(g, 1.4, 0.6, 1.4, col, 0, 0, 0)
      for (const x of [-0.35, 0.35]) for (const z of [-0.35, 0.35]) cyl(g, 0.17, 0.1, col, x, 0.6, z, 10)
    },
    japan(g, col) {
      for (const sx of [-1, 1]) cyl(g, 0.09, 1.5, 0xd62828, sx * 0.7, 0, 0, 8)
      bx(g, 2.0, 0.14, 0.22, 0xd62828, 0, 1.5, 0)
      bx(g, 1.6, 0.1, 0.16, 0xd62828, 0, 1.2, 0)
      bx(g, 2.2, 0.08, 0.3, col, 0, 1.64, 0)
    },
    ice(g, col) {
      mk(g, new THREE.SphereGeometry(1.0, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, 0, 0, 0)
      bx(g, 0.5, 0.5, 0.5, 0x3b2a20, 0, 0, 0.8)
      bx(g, 0.56, 0.08, 0.56, col, 0, 0.5, 0.8)
    },
    war(g, col) {
      bx(g, 1.1, 0.7, 0.8, 0x5d6b3a, 0, 0, 0)
      bx(g, 1.16, 0.14, 0.86, col, 0, 0.7, 0)
      bx(g, 0.2, 0.2, 0.05, 0xf4c430, 0, 0.3, 0.42)
    },
    ocean(g, col) {
      mk(g, new THREE.SphereGeometry(0.85, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), col, 0, 0, 0)
      mk(g, new THREE.SphereGeometry(0.22, 10, 8), N(0xffffff), 0, 0.95, 0, false)
    },
    court(g, col) {
      bx(g, 1.2, 0.3, 1.2, col, 0, 0, 0)
      mk(g, new THREE.SphereGeometry(0.42, 14, 10), 0xe8742a, 0, 0.72, 0)
    },
  }

  // vehicles
  const stud = (g, c, x, y, z) => cyl(g, 0.13, 0.08, c, x, y, z, 8)
  const legoCar = (c) => { const g = makeCar(c); stud(g, shade(c, 0.28), -0.25, 0.82, 0); stud(g, shade(c, 0.28), 0.1, 0.82, 0); return g }
  const sub = (c) => {
    const g = G()
    const b = mk(g, new THREE.CapsuleGeometry(0.42, 1.2, 4, 10), c, 0, 0, 0)
    b.rotation.z = Math.PI / 2
    bx(g, 0.5, 0.4, 0.4, shade(c, -0.1), 0.1, 0.35, 0)
    cyl(g, 0.04, 0.4, 0x555555, 0.2, 0.75, 0, 5)
    for (const x of [-0.3, 0.3]) mk(g, new THREE.SphereGeometry(0.13, 8, 6), N(0xcfe8f5), x, 0.05, 0.4, false)
    bx(g, 0.08, 0.5, 0.5, 0x555555, -1.05, -0.25, 0)
    g.userData = { y: 1.3, bob: 0.16 }
    return g
  }
  const fish = (c, s = 1) => {
    const g = G()
    const b = mk(g, new THREE.SphereGeometry(0.42, 12, 8), c, 0, 0, 0)
    b.scale.set(1.5, 0.9, 0.5)
    const tail = mk(g, new THREE.ConeGeometry(0.34, 0.5, 4), shade(c, -0.1), -0.8, 0, 0)
    tail.rotation.z = -Math.PI / 2
    tail.scale.z = 0.3
    mk(g, new THREE.SphereGeometry(0.06, 6, 5), 0x111111, 0.42, 0.1, 0.17, false)
    mk(g, new THREE.SphereGeometry(0.06, 6, 5), 0x111111, 0.42, 0.1, -0.17, false)
    g.scale.setScalar(s)
    g.userData = { y: 0.9 + s * 0.5, bob: 0.2 }
    return g
  }
  const ball = () => {
    const g = G()
    const m = mk(g, new THREE.SphereGeometry(0.45, 16, 12), 0xe8742a, 0, 0, 0)
    const band = mk(g, new THREE.TorusGeometry(0.455, 0.02, 4, 20), 0x1a1a1a, 0, 0, 0, false)
    m.add(band)
    band.position.set(0, 0, 0)
    g.userData = { y: 0.5, spin: m, r: 0.45 }
    return g
  }

  const train = () => {
    const g = G()
    bx(g, 3.4, 0.7, 0.9, 0xffffff, 0, 0.14, 0)
    bx(g, 3.42, 0.14, 0.92, 0x1d5fd0, 0, 0.36, 0)
    bx(g, 3.0, 0.2, 0.92, 0x2b3a55, -0.1, 0.56, 0)
    const nose = mk(g, new THREE.ConeGeometry(0.46, 0.9, 4), 0xffffff, 2.1, 0.44, 0)
    nose.rotation.z = -Math.PI / 2
    nose.rotation.x = Math.PI / 4
    nose.scale.set(0.8, 1, 1)
    for (const x of [-1.1, 0, 1.1]) for (const z of [-0.4, 0.4]) bx(g, 0.26, 0.2, 0.1, 0x1a1a1a, x, 0, z)
    return g
  }
  const kei = (c) => {
    const g = G()
    bx(g, 1.15, 0.5, 0.66, c, 0, 0.14, 0)
    bx(g, 0.95, 0.34, 0.62, 0xcfe8f5, -0.04, 0.6, 0)
    bx(g, 1.0, 0.06, 0.66, c, -0.04, 0.94, 0)
    for (const x of [-0.36, 0.36]) for (const z of [-0.31, 0.31]) bx(g, 0.2, 0.2, 0.12, 0x1a1a1a, x, 0, z)
    return g
  }
  const ramen = () => {
    const g = makeVan(0xfff3d6)
    bx(g, 0.9, 0.3, 0.8, 0xd62828, -0.3, 0.8, 0)
    mk(g, new THREE.SphereGeometry(0.16, 8, 6), N(0xffb347), -0.3, 1.25, 0, false)
    return g
  }

  const mammoth = (c = 0x7a5230, sc = 1) => {
    const g = G()
    bx(g, 1.6, 0.95, 0.9, c, 0, 0.55, 0)
    bx(g, 0.7, 0.8, 0.8, shade(c, 0.05), 0.95, 0.85, 0)
    bx(g, 0.2, 0.9, 0.22, shade(c, -0.05), 1.35, 0.1, 0)
    for (const z of [-0.3, 0.3]) { const t = mk(g, new THREE.ConeGeometry(0.07, 0.8, 6), 0xfdf6e3, 1.5, 0.75, z); t.rotation.z = -1.9 }
    for (const x of [-0.55, 0.55]) for (const z of [-0.3, 0.3]) bx(g, 0.3, 0.6, 0.3, shade(c, -0.08), x, 0, z)
    bx(g, 1.3, 0.12, 0.7, 0xffffff, -0.1, 1.5, 0)
    g.scale.setScalar(sc)
    g.userData = { y: 0.08, bob: 0.035 }
    return g
  }
  const saber = () => {
    const g = G()
    bx(g, 1.1, 0.42, 0.42, 0xd98a3a, 0, 0.3, 0)
    bx(g, 0.4, 0.4, 0.4, 0xd98a3a, 0.7, 0.45, 0)
    for (const z of [-0.1, 0.1]) bx(g, 0.05, 0.22, 0.05, 0xffffff, 0.85, 0.24, z)
    for (const x of [-0.4, 0.4]) for (const z of [-0.15, 0.15]) bx(g, 0.12, 0.3, 0.12, 0xb8702a, x, 0, z)
    bx(g, 0.5, 0.08, 0.08, 0xd98a3a, -0.8, 0.55, 0)
    g.userData = { y: 0.08, bob: 0.05 }
    return g
  }
  const sled = () => {
    const g = G()
    bx(g, 1.5, 0.08, 0.7, 0x8b5a2b, 0, 0.14, 0)
    for (const z of [-0.3, 0.3]) bx(g, 1.7, 0.06, 0.06, 0x5c3b1c, 0.05, 0, z)
    bx(g, 0.6, 0.4, 0.5, 0xc9a24b, -0.3, 0.22, 0)
    bx(g, 0.5, 0.3, 0.3, 0xe8e1cf, 1.2, 0.05, 0)
    return g
  }

  const buggy = (c) => {
    const g = G()
    bx(g, 1.4, 0.2, 0.7, c, 0, 0.22, 0)
    bx(g, 0.5, 0.3, 0.6, 0x2b2b2b, -0.1, 0.42, 0)
    for (const x of [-0.25, 0.35]) for (const z of [-0.3, 0.3]) cyl(g, 0.03, 0.5, 0x3a3a3a, x, 0.42, z, 4)
    bx(g, 0.7, 0.04, 0.66, 0x3a3a3a, 0.05, 0.92, 0)
    for (const x of [-0.5, 0.5]) for (const z of [-0.38, 0.38]) bx(g, 0.34, 0.34, 0.16, 0x1a1a1a, x, 0, z)
    return g
  }
  const uaz = (c) => { const g = makeCar(c); bx(g, 0.2, 0.36, 0.5, 0x1a1a1a, -0.78, 0.2, 0); return g }
  const armored = () => {
    const g = G()
    bx(g, 2.3, 0.75, 1.0, 0x5d6b3a, 0, 0.2, 0)
    bx(g, 1.0, 0.35, 0.8, 0x4a5630, -0.2, 0.95, 0)
    cyl(g, 0.05, 0.9, 0x2b2b2b, 0.5, 1.05, 0, 6).rotation.z = -Math.PI / 2
    for (const x of [-0.8, 0, 0.8]) for (const z of [-0.46, 0.46]) bx(g, 0.34, 0.34, 0.14, 0x1a1a1a, x, 0, z)
    return g
  }
  const bike = () => {
    const g = G()
    bx(g, 0.9, 0.2, 0.16, 0x2b2b2b, 0, 0.26, 0)
    for (const x of [-0.4, 0.4]) bx(g, 0.3, 0.3, 0.1, 0x1a1a1a, x, 0, 0)
    bx(g, 0.26, 0.4, 0.3, 0x5d6b3a, -0.05, 0.44, 0)
    mk(g, new THREE.SphereGeometry(0.13, 8, 6), 0x3f4a2a, -0.05, 0.98, 0)
    return g
  }

  const vehicles = {
    city: () => [makeCar(0xf4c430), makeCar(0xe63946), makeCar(0x2a9d8f), makeCar(0xffffff), makeCar(0x8e5bd9), makeCar(0x3b82f6), makeVan(), makeVan(0xfde68a), makeBus(), makeTruck(), makeBus(0xd9534f)],
    lego: () => [legoCar(0xe3000b), legoCar(0xffd500), legoCar(0x0057b8), legoCar(0x00852b), legoCar(0xffffff), legoCar(0xff7a00), makeBus(0xe3000b), makeTruck(0xffd500), makeVan(0x0057b8)],
    japan: () => [train(), kei(0xffb7d5), kei(0xa8e6cf), kei(0xfff3b0), kei(0xffffff), makeCar(0x2e8b57), makeCar(0xf4c430), ramen(), kei(0x9ad0ff), train()],
    ice: () => [mammoth(), mammoth(0x8d6e4a, 0.8), mammoth(0x6b4a2b, 1.1), saber(), saber(), sled(), sled(), mammoth(0x9a7b55, 0.6)],
    wire: () => vehicles.city(),
    war: () => [buggy(0xc9a24b), buggy(0x8a8f7a), uaz(0x5d6b3a), uaz(0x7a6a4a), armored(), bike(), bike(), makeTruck(0x5d6b3a), uaz(0x3f4a2a)],
    ocean: () => [sub(0xf4c430), sub(0xff6b6b), fish(0xff8c42), fish(0x4dd0e1, 0.8), fish(0xf72585, 0.7), fish(0xffd166, 0.9), fish(0x7b8794, 1.5), fish(0x9b5de5, 0.8)],
    court: () => [ball(), ball(), ball(), makeBus(0xc0392b), makeBus(0x1d3f8a), makeCar(0xffffff), ball()],
  }

  // landmarks (replace a decor cell)
  const land = {
    fuji(s, x, z) {
      bx(s, 4.8, 0.12, 4.8, 0x7fc96a, x, 0.1, z)
      mk(s, new THREE.ConeGeometry(2.3, 3.6, 24), 0x5b7fd6, x, 2.0, z)
      mk(s, new THREE.ConeGeometry(0.93, 1.45, 24), 0xffffff, x, 3.1, z)
      for (const [ox, oz] of [[-1.9, 1.9], [1.9, 1.8], [2.0, -1.9]]) {
        cyl(s, 0.1, 0.5, 0x6b3f2a, x + ox, 0.2, z + oz, 6)
        mk(s, new THREE.IcosahedronGeometry(0.55, 1), 0xffb7d5, x + ox, 1.05, z + oz)
      }
    },
    shrine(s, x, z) {
      bx(s, 4.6, 0.12, 4.6, 0xe9e2d0, x, 0.1, z)
      const red = 0xd62828
      for (const sx of [-1, 1]) cyl(s, 0.16, 3.0, red, x + sx * 1.3, 0.2, z + 1.3, 10)
      bx(s, 3.8, 0.24, 0.4, red, x, 3.2, z + 1.3)
      bx(s, 4.2, 0.14, 0.5, 0x2b2b2b, x, 3.44, z + 1.3)
      bx(s, 3.0, 0.18, 0.3, red, x, 2.6, z + 1.3)
      bx(s, 2.2, 1.0, 1.6, 0xfdf6e9, x, 0.22, z - 0.9)
      const r = mk(s, new THREE.CylinderGeometry(0.9, 1.9, 0.6, 4), 0x3d5a80, x, 1.52, z - 0.9)
      r.rotation.y = Math.PI / 4
      for (const sx of [-1, 1]) {
        cyl(s, 0.05, 0.9, 0x555555, x + sx * 0.7, 0.2, z + 0.3, 6)
        mk(s, new THREE.SphereGeometry(0.16, 8, 6), N(0xffb347), x + sx * 0.7, 1.2, z + 0.3, false)
      }
    },
    glacier(s, x, z) {
      bx(s, 4.8, 0.12, 4.8, 0xe6f4fb, x, 0.1, z)
      for (const [ox, oz, r, hh, c] of [[0, 0, 1.3, 3.4, 0xbfe6fa], [1.2, 0.8, 0.9, 2.2, 0xa9d8f5], [-1.2, 0.6, 0.8, 1.8, 0xd7f1ff], [0.3, -1.3, 0.7, 1.5, 0xa9d8f5], [-1.0, -1.1, 0.5, 1.1, 0xbfe6fa]]) {
        mk(s, new THREE.ConeGeometry(r, hh, 5), c, x + ox, 0.2 + hh / 2, z + oz)
      }
    },
    cave(s, x, z) {
      bx(s, 4.6, 0.12, 4.6, 0xe6f4fb, x, 0.1, z)
      const rock = mk(s, new THREE.SphereGeometry(1.8, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), 0x8a8f99, x, 0.2, z - 0.6)
      rock.scale.y = 0.85
      mk(s, new THREE.SphereGeometry(0.85, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), 0x1c1c22, x, 0.2, z + 0.75)
      const snow = mk(s, new THREE.SphereGeometry(1.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, x, 1.0, z - 0.6)
      snow.scale.y = 0.45
      cyl(s, 0.3, 0.1, 0x5c3b1c, x + 1.5, 0.22, z + 1.5, 8)
      mk(s, new THREE.ConeGeometry(0.22, 0.6, 6), N(0xff9f1c), x + 1.5, 0.6, z + 1.5, false)
      for (const [ox, oz] of [[-1.7, 1.6], [-1.3, 1.9]]) bx(s, 0.08, 1.4, 0.08, 0xfdf6e3, x + ox, 0.2, z + oz).rotation.z = 0.5
    },
    airdrop(s, x, z) {
      bx(s, 4.6, 0.12, 4.6, 0x8a9558, x, 0.1, z)
      bx(s, 1.1, 0.8, 0.9, 0x5d6b3a, x, 0.22, z)
      bx(s, 1.16, 0.16, 0.96, 0xc0392b, x, 1.02, z)
      const chute = mk(s, new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc0392b, x, 3.0, z)
      chute.scale.y = 0.7
      for (const [ox, oz] of [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) {
        const r = cyl(s, 0.015, 2.1, 0xf1f5f9, x + ox / 2, 1.1, z + oz / 2, 4)
        r.rotation.z = ox ? (ox > 0 ? -0.55 : 0.55) : 0
        r.rotation.x = oz ? (oz > 0 ? 0.55 : -0.55) : 0
      }
      for (let i = 0; i < 4; i++) mk(s, new THREE.SphereGeometry(0.3 + i * 0.1, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe5484d, transparent: true, opacity: 0.55 }), x + 1.5, 0.5 + i * 0.6, z + 1.4, false)
    },
    base(s, x, z) {
      bx(s, 4.6, 0.12, 4.6, 0x8a9558, x, 0.1, z)
      for (const [ox, c] of [[-1.2, 0x5d6b3a], [1.0, 0x6b7a44]]) {
        const t = cyl(s, 0.9, 2.0, c, x + ox, 0.2, z - 0.8, 3)
        t.rotation.x = Math.PI / 2
        t.rotation.z = Math.PI / 2
        t.position.y = 0.65
      }
      for (let i = 0; i < 5; i++) bx(s, 0.6, 0.3, 0.35, 0xb5a67a, x - 1.5 + i * 0.65, 0.22, z + 1.6)
      for (let i = 0; i < 4; i++) bx(s, 0.6, 0.3, 0.35, 0xa8996e, x - 1.2 + i * 0.65, 0.52, z + 1.6)
      cyl(s, 0.06, 2.4, 0x3a3a3a, x + 1.8, 0.2, z + 0.6, 5)
      const dish = mk(s, new THREE.SphereGeometry(0.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), 0xcfd3c4, x + 1.8, 2.7, z + 0.6)
      dish.rotation.x = 2.2
    },
    wreck(s, x, z) {
      bx(s, 4.6, 0.1, 4.6, 0xcbb682, x, 0.1, z)
      const hull = bx(s, 3.4, 0.9, 1.3, 0x6e4623, x, 0.2, z)
      hull.rotation.z = 0.16
      hull.rotation.y = 0.5
      const mast = cyl(s, 0.07, 3.0, 0x5c3b1c, x - 0.2, 0.8, z, 6)
      mast.rotation.z = 0.3
      const sail = bx(s, 0.04, 1.2, 1.3, 0xe8e1cf, x - 0.5, 2.0, z)
      sail.rotation.z = 0.3
      bx(s, 0.7, 0.45, 0.5, 0x8b5a2b, x + 1.5, 0.2, z + 1.4)
      bx(s, 0.72, 0.12, 0.52, 0xf4c430, x + 1.5, 0.6, z + 1.4)
    },
    reef(s, x, z) {
      bx(s, 4.6, 0.1, 4.6, 0xcbb682, x, 0.1, z)
      const cols = [0xff7f6e, 0xc77dff, 0xffd166, 0xff5d8f, 0x4dd0e1]
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, r = 0.5 + (i % 3) * 0.6
        const c = cols[i % 5]
        const hh = 0.6 + (i % 4) * 0.35
        cyl(s, 0.12, hh, c, x + Math.cos(a) * r, 0.18, z + Math.sin(a) * r, 6)
        mk(s, new THREE.SphereGeometry(0.24, 8, 6), c, x + Math.cos(a) * r, 0.2 + hh, z + Math.sin(a) * r)
      }
      mk(s, new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xf3d9c4, x + 1.4, 0.18, z - 1.3)
    },
    scoreboard(s, x, z) {
      bx(s, 4.6, 0.12, 4.6, 0xb97a45, x, 0.1, z)
      for (const sg of [-1, 1]) cyl(s, 0.09, 2.6, 0x4b5563, x + sg * 1.4, 0.2, z, 6)
      bx(s, 3.6, 1.7, 0.3, 0x15151f, x, 2.4, z)
      bx(s, 1.2, 0.8, 0.05, N(0xff3b30), x - 0.95, 2.85, z + 0.17)
      bx(s, 1.2, 0.8, 0.05, N(0xfcee0a), x + 0.95, 2.85, z + 0.17)
      bx(s, 0.5, 0.35, 0.05, N(0x39ff14), x, 3.3, z + 0.17)
      for (let i = 0; i < 3; i++) bx(s, 4.0, 0.3, 0.6, i % 2 ? 0xc0392b : 0x1d3f8a, x, 0.2 + i * 0.3, z - 1.5 - i * 0.3)
    },
  }

  // the traffic light in the middle of the crossroad. same parts on every map, dressed up differently:
  // shaft (round / bricks / log), colours, shape of the lamps, a base, a cap on top, a roof over each head, a rim around it
  const signals = {
    city: { shaft: 'round', pole: 0x2a2f38, head: 0x1d1f24, lamp: 'ball', base: 0x6b7280 },
    lego: { shaft: 'bricks', bricks: [0xe3000b, 0xffd500, 0x0057b8, 0x00852b], head: 0xffd500, lamp: 'disc', rim: 0x111111 },
    japan: { shaft: 'round', pole: 0xc0392b, head: 0xf5f0e6, lamp: 'ball', base: 0x2b2b2b, cap: 0x2b2b2b, roof: 0x2b2b2b },
    ice: { shaft: 'log', pole: 0x7a5a3a, head: 0xbfe3f5, lamp: 'ball', base: 0xffffff, cap: 0xffffff },
    wire: { shaft: 'round', pole: 0x0a66c2, head: 0xc2187a, lamp: 'ball', base: 0x0a8f3c },
    war: { shaft: 'round', pole: 0x4b5320, head: 0x2b2b22, lamp: 'box', base: 0x8a7a55, cap: 0x4b5320, rim: 0x3f4a2a },
    ocean: { shaft: 'round', pole: 0xff7f6e, head: 0xfff1e6, lamp: 'ball', base: 0xff9f8f, cap: 0x9fe0f5 },
    court: { shaft: 'round', pole: 0xe8742a, head: 0xffffff, lamp: 'ball', base: 0x1d3f8a, cap: 0xe8742a, rim: 0x1d3f8a },
  }

  const base = {
    c: {
      base: 0xc9a569, base2: 0xa8844f, grass: 0x74c44a, pad: 0xe8e2d4, road: 0x48556b, dash: 0xe5e7eb, cross: 0xf1f5f9,
      lampPole: 0x2d3748, lampGlow: 0xfff3b0, water: 0x4fb8ee, round: 0x3f9f3c, pine: 0x2f7d3a, blossom: 0x3f9f3c, trunk: 0x7a5230,
      park: 0x5fae45, court: 0xd97a3a, courtLine: 0xfff7ed, plaza: 0xdcd6c8, stone: 0xb8c0cc, grove: 0x74b650, bench: 0x8b5a3c,
      crate: [0xe63946, 0x2a9d8f, 0xf4a261], empty: 0xd9d6cc,
    },
    sun: [0xfff1cc, 2.5], hemi: [0xffffff, 0x9fb0c4, 1.45], fog: null, glowLamps: false,
    people: { coats: [0xff6b6b, 0xffd93d, 0x4dd0e1, 0xffffff, 0xff9f1c, 0x80ed99], pants: [0x3b5bdb, 0x4a5568, 0xf4a261], hat: 0xe9c46a, shorts: true },
    particle: null, tree: 'std', dashes: true, studs: false, landmarks: {}, build: null, kiosk: null,
  }
  const T = (id, o) => ({ ...base, ...o, id, c: { ...base.c, ...(o.c || {}) }, vehicles: vehicles[id], build: build[id] || null, kiosk: kiosks[id] || null, signal: signals[id] })

  return {
    city: T('city', {}),
    lego: T('lego', {
      c: { base: 0x2f8f3a, base2: 0x237a2e, grass: 0x3fae49, pad: 0xc9ccd1, road: 0x6b7280, park: 0x00852b, court: 0xff7a00, plaza: 0xffd500, stone: 0xffffff, grove: 0x00852b, bench: 0xe3000b, crate: [0xe3000b, 0xffd500, 0x0057b8], round: 0x00852b, pine: 0x00852b, blossom: 0x4cc35a, trunk: 0x6b3f1d, water: 0x1e90ff },
      people: { coats: [0xe3000b, 0x0057b8, 0x00852b, 0xff7a00, 0xffffff, 0x8e44ad], pants: [0x0057b8, 0x2b2b2b, 0xe3000b], hat: null, shorts: false, skin: 0xffd500 },
      tree: 'lego', studs: true,
    }),
    japan: T('japan', {
      c: { base: 0xb98b5e, base2: 0x8f6a45, grass: 0x8fd16a, pad: 0xf3ead8, road: 0x5a6072, lampPole: 0x7a3b2e, lampGlow: 0xff8c5a, water: 0x58c4f0, round: 0xffb7d5, pine: 0x3f9f5a, blossom: 0xff8fc0, trunk: 0x6b3f2a, park: 0x7fc96a, court: 0xe9e2d0, plaza: 0xe9e2d0, stone: 0xb9bec8, grove: 0x7fc96a, bench: 0x8a4b32, crate: [0xd62828, 0xffb7d5, 0x3d5a80] },
      sun: [0xfff2e0, 2.7], hemi: [0xffffff, 0xffc9de, 1.6], glowLamps: true, toon: true,
      people: { coats: [0x1d3557, 0xffffff, 0xd62828, 0xffb7d5, 0x2b2d42, 0x9ad0ff], pants: [0x1d3557, 0x2b2d42, 0x6b7280], hat: 0x1c1c1c, hats: [0x1c1c1c, 0x5c3b1c, 0xff8fc0, 0x3a86ff, 0xf4c430, 0x8e5bd9], shorts: false },
      landmarks: { 1: land.fuji, 2: land.shrine },
    }),
    ice: T('ice', {
      c: { base: 0xb7d9ee, base2: 0x8fc0de, grass: 0xf4f9fd, pad: 0xe3f1fa, road: 0xa9d8f5, lampPole: 0x5c3b1c, lampGlow: 0xff9f1c, water: 0x9fdcf7, round: 0xeaf6fd, pine: 0x4a8a6a, blossom: 0xffffff, trunk: 0x5c3b1c, park: 0xe6f4fb, court: 0xd7ecf8, courtLine: 0xffffff, plaza: 0xe6f4fb, stone: 0x9aa5b1, grove: 0xe6f4fb, bench: 0x6e4623, crate: [0x9aa5b1, 0xbfe6fa, 0x8b5a2b], empty: 0xc9dfee },
      sun: [0xf2f8ff, 2.2], hemi: [0xffffff, 0xb7d9ee, 1.6], glowLamps: true,
      people: { coats: [0x8b5a2b, 0xb08968, 0x6e4623, 0xd9c7a0, 0x5c4d3c, 0xa67c52], pants: [0x4a403a, 0x5c4d3c, 0x3b2a20], hat: 0xf3ead8, shorts: false },
      tree: 'snow', dashes: false, landmarks: { 1: land.glacier, 2: land.cave },
    }),
    wire: T('wire', {
      c: { base: 0x0b1830, base2: 0x00e5ff, grass: 0x0b1830, pad: 0x12305a, road: 0x00e5ff, dash: 0x39ff14, cross: 0x39ff14, lampPole: 0x00e5ff, lampGlow: 0xffffff, water: 0x00e5ff, round: 0x39ff14, pine: 0x39ff14, blossom: 0x00ffa8, trunk: 0x00e5ff, park: 0x39ff14, court: 0xff2bd6, courtLine: 0xffffff, plaza: 0xfcee0a, stone: 0x9ad0ff, grove: 0x39ff14, bench: 0xfcee0a, crate: [0xff2bd6, 0x00e5ff, 0xfcee0a], empty: 0x2a4a7a },
      wire: true, glowLamps: true,
      people: { coats: [0xff2bd6, 0x00e5ff, 0x39ff14, 0xfcee0a, 0xffffff, 0xff6b00], pants: [0x00e5ff, 0x39ff14, 0xffffff], hat: null, shorts: false, skin: 0xffffff },
    }),
    wireLight: T('wire', {
      c: { base: 0x9fb4c8, base2: 0x0a66c2, grass: 0xb9c7d6, pad: 0x8aa2bb, road: 0x0a66c2, dash: 0x0a8f3c, cross: 0x0a8f3c, lampPole: 0x0a66c2, lampGlow: 0x111111, water: 0x0a66c2, round: 0x0a8f3c, pine: 0x0a8f3c, blossom: 0x0b7a5a, trunk: 0x0a66c2, park: 0x0a8f3c, court: 0xc2187a, courtLine: 0x111111, plaza: 0xb8860b, stone: 0x4a6a8a, grove: 0x0a8f3c, bench: 0xb8860b, crate: [0xc2187a, 0x0a66c2, 0xb8860b], empty: 0x6a7f95 },
      wire: true, glowLamps: true,
      people: { coats: [0xc2187a, 0x0a66c2, 0x0a8f3c, 0xb8860b, 0x111111, 0xd9480f], pants: [0x0a66c2, 0x0a8f3c, 0x111111], hat: null, shorts: false, skin: 0x111111 },
    }),
    war: T('war', {
      c: { base: 0x6b5a3e, base2: 0x54462f, grass: 0x7d8a4e, pad: 0xa39a72, road: 0x9a8562, lampPole: 0x3a3a3a, lampGlow: 0xffe9a8, water: 0x5fa3b8, round: 0x55703a, pine: 0x3f5a2e, blossom: 0x6b8a45, trunk: 0x5a4a32, park: 0x6f7d45, court: 0x8a8f7a, courtLine: 0xf1f1e4, plaza: 0x8a9558, stone: 0x8a8f7a, grove: 0x6f7d45, bench: 0xb5a67a, crate: [0x5d6b3a, 0xb5a67a, 0x8a8f7a], empty: 0x8a8562 },
      sun: [0xfff2d6, 2.3], hemi: [0xf4f4e4, 0x6b6a4a, 1.4],
      people: { coats: [0x5d6b3a, 0x7a6a4a, 0x3f4a2a, 0x8a8f7a, 0x4a5630, 0xb5a67a], pants: [0x3f4a2a, 0x4a403a, 0x5a5a4a], hat: 0x3f4a2a, hats: [0x3f4a2a, 0x2b2b2b, 0x5d6b3a, 0x6b6b5a, 0x3f4a2a, 0x8a7a55], shorts: false },
      dashes: false, zone: true, landmarks: { 1: land.base, 2: land.airdrop },
    }),
    ocean: T('ocean', {
      c: { base: 0x8a7a52, base2: 0x6e6040, grass: 0xd9c58f, pad: 0xe6d6a8, road: 0xbfa873, lampPole: 0x4a6b7a, lampGlow: 0x7ff6ff, water: 0x2fb3c9, round: 0xff7f6e, pine: 0x3fbf7f, blossom: 0xc77dff, trunk: 0xff9e80, park: 0xcbb682, court: 0xcbb682, courtLine: 0xe6d6a8, plaza: 0xcbb682, stone: 0x9aa5b1, grove: 0xcbb682, bench: 0x8b5a2b, crate: [0xff7f6e, 0xffd166, 0x4dd0e1], empty: 0xbfa873 },
      sun: [0xbfe9ff, 1.9], hemi: [0x9fe3ff, 0x1f5c7a, 1.7], fog: [0x9fe0f5, 40, 115], glowLamps: true,
      people: { coats: [0xff6b00, 0xf4d35e, 0x111111, 0xff2d55, 0x00b4d8, 0x2b2d42], pants: [0x111111, 0x1d3557, 0x2b2d42], hat: 0xf4d35e, shorts: false },
      particle: { color: 0xffffff, size: 0.22, fall: -1.6, sway: 0.5 },
      tree: 'coral', dashes: false, landmarks: { 0: land.reef, 1: land.wreck, 2: land.reef },
    }),
    court: T('court', {
      c: { base: 0x8a5a2b, base2: 0x6e4623, grass: 0xd9a066, pad: 0xe7b97f, road: 0x1d3f8a, dash: 0xffffff, cross: 0xffffff, lampPole: 0x4b5563, lampGlow: 0xffffff, park: 0x1d3f8a, court: 0xc0392b, plaza: 0x2a9d8f, grove: 0xb97a45, round: 0xe8742a, pine: 0xff6b00, blossom: 0xe8742a, trunk: 0x4b5563, bench: 0x4b5563, crate: [0xe8742a, 0xc0392b, 0x1d3f8a], empty: 0xc98f55 },
      sun: [0xfff3dd, 2.4], hemi: [0xffffff, 0xb08a5a, 1.5],
      people: { coats: [0xc0392b, 0x1d3f8a, 0xfcee0a, 0xffffff, 0x2a9d8f, 0x6a4c93], pants: [0xc0392b, 0x1d3f8a, 0x111111], hat: null, shorts: true },
      tree: 'cone', landmarks: { 0: 'court', 2: 'court', 3: land.scoreboard },
    }),
  }
}
