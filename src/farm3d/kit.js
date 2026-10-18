// Small building blocks for the 3D farm: shared materials and geometries, simple shapes that
// stand on the ground (y is the bottom unless it's a ball), and "baking" a model into a few
// merged meshes so a phone draws it quickly.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const mats = new Map()
/** A soft, matte material, shared by colour. */
export function mat(color, { emissive = null, flat = false, opacity = 1 } = {}) {
  const key = `${color}|${emissive}|${flat}|${opacity}`
  if (!mats.has(key)) {
    const m = new THREE.MeshLambertMaterial({ color, flatShading: flat })
    if (emissive) {
      m.emissive = new THREE.Color(emissive)
      m.emissiveIntensity = 1
    }
    if (opacity < 1) {
      m.transparent = true
      m.opacity = opacity
      m.depthWrite = false
    }
    mats.set(key, m)
  }
  return mats.get(key)
}

const geos = new Map()
function geo(key, make) {
  if (!geos.has(key)) geos.set(key, make())
  return geos.get(key)
}

function place(mesh, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null } = {}) {
  mesh.position.set(x, y, z)
  mesh.rotation.set(rx, ry, rz)
  if (s) Array.isArray(s) ? mesh.scale.set(...s) : mesh.scale.setScalar(s)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** A box standing on y. */
export function box(w, h, d, color, at = {}, opts) {
  const g = geo(`box${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0))
  return place(new THREE.Mesh(g, mat(color, opts)), at)
}
/** A box with soft rounded edges, standing on y. */
export function rbox(w, h, d, color, at = {}, r = 0.06, opts) {
  const g = geo(`rbox${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)).translate(0, h / 2, 0))
  return place(new THREE.Mesh(g, mat(color, opts)), at)
}
/** A cylinder (or cone, with rt = 0) standing on y. */
export function cyl(rt, rb, h, color, at = {}, seg = 12, opts) {
  const g = geo(`cyl${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg).translate(0, h / 2, 0))
  return place(new THREE.Mesh(g, mat(color, opts)), at)
}
/** A ball centred on y. */
export function ball(r, color, at = {}, detail = 1, opts) {
  const g = geo(`ball${r},${detail}`, () => (detail >= 3 ? new THREE.SphereGeometry(r, 14, 10) : new THREE.IcosahedronGeometry(r, detail)))
  return place(new THREE.Mesh(g, mat(color, opts)), at)
}
/** A gable roof: a triangular prism along x, w wide, h tall, d deep, standing on y. */
export function roof(w, h, d, color, at = {}, opts) {
  const g = geo(`roof${w},${h},${d}`, () => {
    const s = new THREE.Shape()
    s.moveTo(-d / 2, 0)
    s.lineTo(d / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    const e = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false })
    e.translate(0, 0, -w / 2)
    e.rotateY(Math.PI / 2)
    return e
  })
  return place(new THREE.Mesh(g, mat(color, opts)), at)
}
/** A flat disc lying on the ground. */
export function disc(r, color, at = {}, seg = 24, opts) {
  const g = geo(`disc${r},${seg}`, () => new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2))
  const m = place(new THREE.Mesh(g, mat(color, opts)), at)
  m.castShadow = false
  return m
}
/** A torus lying flat. */
export function ring(r, tube, color, at = {}, opts, arc = Math.PI * 2) {
  const g = geo(`ring${r},${tube},${arc}`, () => new THREE.TorusGeometry(r, tube, 6, 20, arc).rotateX(Math.PI / 2))
  return place(new THREE.Mesh(g, mat(color, opts)), at)
}

export function group(...children) {
  const g = new THREE.Group()
  for (const c of children.flat()) if (c) g.add(c)
  return g
}

/** Mark a part that moves on its own (blades, animals, smoke). It's baked separately. */
export function dynamic(node, tick) {
  node.userData.dynamic = true
  if (tick) node.userData.tick = tick
  return node
}

/**
 * Merge the still parts of a model into one mesh per material. Parts marked dynamic are
 * baked on their own and kept, so they can still move.
 */
export function bake(root) {
  root.updateMatrixWorld(true)
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert()
  const buckets = new Map()
  const keep = []
  root.traverse((node) => {
    if (node === root) return
    // skip anything inside a dynamic part; it's handled when that part is baked
    let p = node.parent
    while (p && p !== root) {
      if (p.userData.dynamic) return
      p = p.parent
    }
    if (node.userData.dynamic) {
      keep.push(node)
      return
    }
    if (!node.isMesh) return
    const g = node.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, node.matrixWorld))
    // merged geometries must share attributes
    const clean = g.index ? g.toNonIndexed() : g
    for (const k of Object.keys(clean.attributes)) if (!['position', 'normal'].includes(k)) clean.deleteAttribute(k)
    if (!buckets.has(node.material)) buckets.set(node.material, [])
    buckets.get(node.material).push(clean)
  })
  const out = new THREE.Group()
  out.userData = { ...root.userData }
  out.position.copy(root.position)
  out.rotation.copy(root.rotation)
  out.scale.copy(root.scale)
  for (const [material, list] of buckets) {
    const merged = mergeGeometries(list, false)
    list.forEach((g) => g.dispose())
    if (!merged) continue
    const m = new THREE.Mesh(merged, material)
    m.castShadow = !material.transparent
    m.receiveShadow = true
    m.userData.baked = true
    out.add(m)
  }
  for (const node of keep) {
    // keep a dynamic part where it was, relative to the model
    const local = new THREE.Matrix4().multiplyMatrices(inv, node.matrixWorld)
    const baked = bake(node)
    local.decompose(baked.position, baked.quaternion, baked.scale)
    baked.userData = { ...node.userData }
    out.add(baked)
  }
  return out
}

/** Free a baked model's own geometries (shared materials stay). */
export function dispose(node) {
  node.traverse((n) => {
    if (n.isMesh && n.userData.baked) n.geometry.dispose()
  })
}

/** A softly varying grass colour, the same for the same spot. */
export function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
