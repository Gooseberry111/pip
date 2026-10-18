<script setup>
// The farm in 3D: a raised island of farmland with a hedge and a gate, in a meadow under a
// sky that follows the time of day, the season and the weather. Everything on the farm is a
// little 3D model (src/farm3d). Drag to look around, pinch (or scroll) to zoom, twist two
// fingers (or right drag) to walk all the way round, slide two fingers up or down to tilt.
//   mode 'farm':  tap things to use them. With a tool (planting or watering), tap or swipe
//                 across plots to use it on each one.
//   mode 'build': drag things to move them; tap one to flip it or put it away. A new thing
//                 shows as a preview you drag into place, then tick.
//   mode 'view':  a friend's farm (look, and water their crops).
// It takes the same props and sends the same events as the flat FarmMap, plus 'paint'.
import * as THREE from 'three'
import { computed, ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { sizeOf, fits, growthFraction, treeById, producerById, kindOf } from '@/utils/farmLogic'
import { PLACEABLE } from '@/data/farm'
import { DAY_PHASES } from '@/utils/timeOfDay'
import { buildModel, stateKey } from '@/farm3d/models'
import { bake, dispose, mat, ball, cyl, group, hash, rbox } from '@/farm3d/kit'
import GoodIcon from './GoodIcon.vue'
import Pip from '../Pip.vue'
import Icon from '../Icon.vue'

const props = defineProps({
  objects: { type: Array, required: true },
  rows: { type: Number, required: true },
  cols: { type: Number, default: 8 },
  now: { type: Number, required: true },
  mode: { type: String, default: 'farm' },
  selected: { type: Number, default: null },
  ghost: { type: Object, default: null },
  kitchen: { type: Array, default: () => [] },
  ordersReady: { type: Number, default: 0 },
  pipLook: { type: Object, default: null },
  pipSleeping: { type: Boolean, default: false },
  wishGood: { type: String, default: null },
  helped: { type: Array, default: () => [] },
  highlight: { type: String, default: null },
  phase: { type: String, default: 'day' },
  season: { type: String, default: 'summer' },
  weather: { type: String, default: null },
  tool: { type: Object, default: null }, // { kind: 'plant', crop } | { kind: 'water' }
})
const emit = defineEmits(['tap', 'tapTile', 'move', 'ghost', 'confirm', 'cancel', 'action', 'paint', 'failed'])

const host = ref(null)
const canvas = ref(null)
const overlay = ref(null)
const ready = ref(false)

let renderer = null
let scene = null
let camera = null
let raf = 0
let clockT = 0
let lastFrame = 0
const live = new Map() // uid -> { node, key, top, ticks }
let islandMat = null
let grassTex = null
let skyTex = null
let hemi = null
let sun = null
let gridLines = null
let ghostNode = null
let ghostKey = ''
let ghostTop = 1
let footprint = null
let weatherFx = null
let lampLights = []
let surroundings = null
const ray = new THREE.Raycaster()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const tmpV = new THREE.Vector3()

// ---------------------------------------------------------------- camera
const EL_MIN = 0.32 // nearly side on
const EL_MAX = 1.35 // nearly straight down
const EL_DEFAULT = 0.8
const view = { tx: 0, tz: 0, dist: 20, fit: 20, el: EL_DEFAULT, az: 0, cur: null }
const heading = ref(0) // for the compass
function fitCamera(keepTarget = false) {
  const w = host.value?.clientWidth || 360
  const h = host.value?.clientHeight || 480
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  const fov = THREE.MathUtils.degToRad(camera.fov)
  // the whole width of the farm fits, with a little meadow either side
  view.fit = (props.cols + 1.8) / (2 * Math.tan(fov / 2) * camera.aspect)
  if (!keepTarget) {
    view.tx = props.cols / 2
    view.tz = Math.min(props.rows * 0.45, 4.6)
    view.dist = view.fit * 0.86
  }
  clampView()
  if (!view.cur) view.cur = { tx: view.tx, tz: view.tz, dist: view.dist, el: view.el, az: view.az }
}
function clampView() {
  view.dist = THREE.MathUtils.clamp(view.dist, view.fit * 0.35, view.fit * 1.35)
  view.el = THREE.MathUtils.clamp(view.el, EL_MIN, EL_MAX)
  // keep looking at somewhere on the farm, from any side
  view.tx = THREE.MathUtils.clamp(view.tx, 0.3, props.cols - 0.3)
  view.tz = THREE.MathUtils.clamp(view.tz, 0.3, props.rows - 0.3)
}
function placeCamera(c) {
  const flat = Math.cos(c.el) * c.dist
  camera.position.set(c.tx + Math.sin(c.az) * flat, Math.max(0.6, Math.sin(c.el) * c.dist), c.tz + Math.cos(c.az) * flat)
  camera.lookAt(c.tx, 0, c.tz)
}

// ---- turning round and tilting (buttons, two fingers, right drag)
const VIEWS = [
  { el: 1.2, label: 'From above' },
  { el: EL_DEFAULT, label: 'Angled' },
  { el: 0.38, label: 'Low' },
]
const viewIndex = ref(1)
function turn(by) {
  view.az += by
}
function cycleView() {
  viewIndex.value = (viewIndex.value + 1) % VIEWS.length
  view.el = VIEWS[viewIndex.value].el
  if (viewIndex.value === 2) view.dist = Math.min(view.dist, view.fit * 0.75)
}
function resetView() {
  // come back round to the front, the shortest way
  view.az = Math.round(view.az / (Math.PI * 2)) * Math.PI * 2
  view.el = EL_DEFAULT
  viewIndex.value = 1
  view.tx = props.cols / 2
  view.tz = Math.min(props.rows * 0.45, 4.6)
  view.dist = view.fit * 0.86
}

// ---------------------------------------------------------------- the world
const GRASS = {
  spring: ['#A9D18A', '#9CC67C', '#8DB96E'],
  summer: ['#A2CB82', '#94BF74', '#86B266'],
  autumn: ['#B4C67C', '#A6BA6E', '#98AD61'],
  winter: ['#E1EAE7', '#D3DFDB', '#C5D3CF'],
}
const MEADOW = { spring: '#9CCB7E', summer: '#95C474', autumn: '#AEB86E', winter: '#D8E2DF' }

function makeGrassTexture() {
  const [a, b, c] = GRASS[props.season] ?? GRASS.summer
  const px = 48
  const cv = document.createElement('canvas')
  cv.width = props.cols * px
  cv.height = props.rows * px
  const g = cv.getContext('2d')
  g.fillStyle = a
  g.fillRect(0, 0, cv.width, cv.height)
  for (let y = 0; y < props.rows; y++)
    for (let x = 0; x < props.cols; x++) {
      if ((x + y) % 2 === 0) {
        g.fillStyle = b
        g.globalAlpha = 0.35
        g.fillRect(x * px, y * px, px, px)
        g.globalAlpha = 1
      }
      // tufts, flowers and pebbles, the same every time
      for (let k = 0; k < 3; k++) {
        const r = hash(x, y, k)
        const ox = x * px + 6 + hash(x, y, k + 10) * (px - 12)
        const oy = y * px + 6 + hash(x, y, k + 20) * (px - 12)
        if (r < 0.35) {
          g.strokeStyle = c
          g.lineWidth = 1.6
          g.beginPath()
          g.moveTo(ox - 3, oy + 3)
          g.lineTo(ox - 1, oy - 3)
          g.moveTo(ox, oy + 3)
          g.lineTo(ox, oy - 4)
          g.moveTo(ox + 3, oy + 3)
          g.lineTo(ox + 1, oy - 3)
          g.stroke()
        } else if (r < 0.42 && props.season !== 'winter') {
          g.fillStyle = ['#FFFDF8', '#F6C7CD', '#F8E2A6', '#C9B2E6'][Math.floor(hash(x, y, k + 30) * 4)]
          for (let p = 0; p < 5; p++) {
            g.beginPath()
            g.arc(ox + Math.cos(p * 1.26) * 2.4, oy + Math.sin(p * 1.26) * 2.4, 1.6, 0, Math.PI * 2)
            g.fill()
          }
          g.fillStyle = '#F2B544'
          g.beginPath()
          g.arc(ox, oy, 1.2, 0, Math.PI * 2)
          g.fill()
        } else if (r < 0.46) {
          g.fillStyle = 'rgba(160,150,130,0.7)'
          g.beginPath()
          g.ellipse(ox, oy, 2.6, 1.8, 0, 0, Math.PI * 2)
          g.fill()
        }
      }
    }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function makeSkyTexture() {
  const p = DAY_PHASES[props.phase] ?? DAY_PHASES.day
  const grey = ['cloudy', 'rain', 'storm', 'fog', 'snow'].includes(props.weather) && props.phase !== 'night'
  const top = grey ? '#B4C1CA' : p.skyTop
  const bottom = grey ? '#E4E5E0' : p.skyBottom
  const cv = document.createElement('canvas')
  cv.width = 4
  cv.height = 256
  const g = cv.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, top)
  grad.addColorStop(1, bottom)
  g.fillStyle = grad
  g.fillRect(0, 0, 4, 256)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return { tex, bottom }
}

function buildIsland() {
  const W = props.cols + 0.7
  const D = props.rows + 0.7
  grassTex?.dispose()
  grassTex = makeGrassTexture()
  const top = new THREE.MeshLambertMaterial({ map: grassTex })
  const side = mat('#8E6A4A')
  const geo = new THREE.BoxGeometry(W, 0.6, D).translate(props.cols / 2, -0.3, props.rows / 2)
  // the grass only covers the farm itself; the rim is a grassy lip
  const uv = geo.attributes.uv
  islandMat = [side, side, top, side, side, side]
  const island = new THREE.Mesh(geo, islandMat)
  // stretch the texture so each tile lines up with one tile of the farm
  for (let i = 0; i < uv.count; i++) {
    const x = geo.attributes.position.getX(i)
    const z = geo.attributes.position.getZ(i)
    uv.setXY(i, (x + 0.0) / props.cols, 1 - z / props.rows)
  }
  uv.needsUpdate = true
  grassTex.wrapS = grassTex.wrapT = THREE.ClampToEdgeWrapping
  island.receiveShadow = true
  island.name = 'island'

  // a grassy lip and a darker layer of soil on the sides
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.1, D + 0.02).translate(props.cols / 2, -0.06, props.rows / 2), mat(GRASS[props.season]?.[2] ?? '#86B266'))
  lip.receiveShadow = true

  // the hedge, with a gate at the front
  const hedge = []
  const gateFrom = props.cols / 2 - 0.55
  const gateTo = props.cols / 2 + 0.55
  const bush = (x, z, k) => ball(0.2 + hash(k, 3) * 0.06, k % 3 ? '#6E9E5C' : '#7FAA5C', { x, y: 0.14, z }, 1, { flat: true })
  let k = 0
  for (let x = -0.2; x <= props.cols + 0.2; x += 0.42) {
    hedge.push(bush(x, -0.22, k++))
    if (x < gateFrom || x > gateTo) hedge.push(bush(x, props.rows + 0.22, k++))
  }
  for (let z = 0.2; z <= props.rows; z += 0.42) {
    hedge.push(bush(-0.22, z, k++))
    hedge.push(bush(props.cols + 0.22, z, k++))
  }
  hedge.push(rbox(0.1, 0.5, 0.1, '#8C6A4F', { x: gateFrom - 0.05, z: props.rows + 0.22 }, 0.02))
  hedge.push(rbox(0.1, 0.5, 0.1, '#8C6A4F', { x: gateTo + 0.05, z: props.rows + 0.22 }, 0.02))
  hedge.push(rbox(1.1, 0.06, 0.04, '#B98C63', { x: props.cols / 2, y: 0.3, z: props.rows + 0.22 }, 0.01))
  hedge.push(rbox(1.1, 0.06, 0.04, '#B98C63', { x: props.cols / 2, y: 0.16, z: props.rows + 0.22 }, 0.01))
  const hedgeGroup = bake(group(hedge))
  const g = group(island, lip, hedgeGroup)
  g.name = 'ground'
  return g
}

function buildSurroundings() {
  const s = props.season
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(140, 140).rotateX(-Math.PI / 2).translate(props.cols / 2, -0.62, props.rows / 2), mat(MEADOW[s] ?? MEADOW.summer))
  meadow.receiveShadow = true
  const parts = []
  // a dirt lane from the gate towards you
  parts.push(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 30).rotateX(-Math.PI / 2).translate(props.cols / 2, -0.61, props.rows + 15.4), mat('#C9B08A')))
  // trees dotted around
  const leaf = s === 'autumn' ? ['#E39A4A', '#D2773A', '#E8B24C'] : s === 'winter' ? ['#DDE6E8', '#C9D6DA', '#E8EEEF'] : s === 'spring' ? ['#F2C6CD', '#7FAA5C', '#8FB86A'] : ['#6E9E5C', '#7FAA5C', '#5E8E4F']
  for (let i = 0; i < 46; i++) {
    const a = hash(i, 1) * Math.PI * 2
    const r = 3.2 + hash(i, 2) * 9
    const x = props.cols / 2 + Math.cos(a) * (props.cols / 2 + r)
    const z = props.rows / 2 + Math.sin(a) * (props.rows / 2 + r)
    if (z > props.rows + 0.5 && Math.abs(x - props.cols / 2) < 1.4) continue
    const size = 0.6 + hash(i, 3) * 0.7
    const t = group(cyl(0.08 * size, 0.12 * size, 0.7 * size, '#8C6A4F', {}, 6), ball(0.5 * size, leaf[i % 3], { y: 0.95 * size }, 1, { flat: true }), ball(0.36 * size, leaf[(i + 1) % 3], { x: 0.25 * size, y: 0.75 * size }, 1, { flat: true }))
    t.position.set(x, -0.62, z)
    parts.push(t)
  }
  // soft hills all the way round, so every side has a view
  const ringR = Math.max(props.cols, props.rows) / 2 + 13
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + hash(i, 7) * 0.2
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat(i % 2 ? (s === 'winter' ? '#E9F0F1' : s === 'autumn' ? '#C9C07E' : '#A9CF8C') : s === 'winter' ? '#DCE6E8' : s === 'autumn' ? '#BDB46F' : '#9CC47F'))
    h.scale.set(7 + hash(i, 8) * 5, 2 + hash(i, 9) * 2.5, 4 + hash(i, 10) * 2)
    h.position.set(props.cols / 2 + Math.cos(a) * ringR, -1.2, props.rows / 2 + Math.sin(a) * ringR)
    h.rotation.y = -a
    parts.push(h)
  }
  const out = group(meadow, bake(group(parts)))
  out.name = 'surroundings'
  return out
}

function buildGrid() {
  const pts = []
  for (let x = 0; x <= props.cols; x++) pts.push(x, 0.012, 0, x, 0.012, props.rows)
  for (let z = 0; z <= props.rows; z++) pts.push(0, 0.012, z, props.cols, 0.012, z)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.55 }))
}

function applyLight() {
  const night = props.phase === 'night'
  const dusk = props.phase === 'dusk'
  const dawn = props.phase === 'dawn'
  const grey = ['cloudy', 'rain', 'storm', 'fog', 'snow'].includes(props.weather)
  hemi.color.set(night ? '#8A9BD0' : '#FFFFFF')
  hemi.groundColor.set(night ? '#2E3550' : '#9DB38A')
  hemi.intensity = night ? 1.75 : grey ? 2.3 : 1.9
  sun.color.set(night ? '#AFC0F0' : dusk ? '#FFB98A' : dawn ? '#FFD2B0' : '#FFF4E0')
  sun.intensity = night ? 1.0 : grey ? 1.0 : dusk || dawn ? 1.9 : 2.9
  const sky = makeSkyTexture()
  skyTex?.dispose()
  skyTex = sky.tex
  scene.background = skyTex
  scene.fog = new THREE.Fog(sky.bottom, view.fit * (props.weather === 'fog' ? 0.6 : 1.05), view.fit * (props.weather === 'fog' ? 1.8 : 2.3))
}

function placeSun() {
  const c = view.cur
  const a = props.phase === 'dawn' ? -0.9 : props.phase === 'dusk' ? 0.9 : props.phase === 'night' ? -0.4 : 0.35
  sun.position.set(c.tx + Math.sin(a) * 10, 14, c.tz - 6)
  sun.target.position.set(c.tx, 0, c.tz)
  sun.target.updateMatrixWorld()
}

// ---------------------------------------------------------------- weather
function buildWeather() {
  if (weatherFx) {
    scene.remove(weatherFx)
    weatherFx.geometry.dispose()
    weatherFx.material.dispose()
    weatherFx = null
  }
  const wet = props.weather === 'rain' || props.weather === 'storm'
  const snow = props.weather === 'snow'
  if (!wet && !snow) return
  const n = wet ? 900 : 600
  const pos = new Float32Array(n * (wet ? 6 : 3))
  for (let i = 0; i < n; i++) {
    const x = -2 + Math.random() * (props.cols + 4)
    const y = Math.random() * 7
    const z = -2 + Math.random() * (props.rows + 4)
    if (wet) pos.set([x, y, z, x - 0.03, y - 0.25, z], i * 6)
    else pos.set([x, y, z], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  weatherFx = wet
    ? new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#DCEAF2', transparent: true, opacity: 0.55 }))
    : new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.07, transparent: true, opacity: 0.9 }))
  weatherFx.userData = { wet, speed: props.weather === 'storm' ? 11 : wet ? 8 : 0.9 }
  scene.add(weatherFx)
}
function tickWeather(dt) {
  if (!weatherFx) return
  const p = weatherFx.geometry.attributes.position
  const { wet, speed } = weatherFx.userData
  const step = speed * dt
  const stride = wet ? 2 : 1
  for (let i = 0; i < p.count; i += stride) {
    let y = p.getY(i) - step
    if (y < -0.1) y += 7
    p.setY(i, y)
    if (wet) p.setY(i + 1, y - 0.25)
    else p.setX(i, p.getX(i) + Math.sin(clockT + i) * dt * 0.15)
  }
  p.needsUpdate = true
}

// ---------------------------------------------------------------- objects
const kitchenBusy = computed(() => props.kitchen.some((k) => k && props.now < k.readyAt))
const lit = computed(() => props.phase === 'night' || props.phase === 'dusk')

function centre(o, at = null) {
  const { w, h } = sizeOf(o.type)
  const x = at ? at.x : o.x
  const y = at ? at.y : o.y
  return new THREE.Vector3(x + w / 2, 0, y + h / 2)
}

function collectTicks(node) {
  const ticks = []
  node.traverse((n) => n.userData.tick && ticks.push(n))
  return ticks
}

function syncObjects() {
  if (!scene) return
  const ctx = { now: props.now, lit: lit.value, season: props.season, kitchenBusy: kitchenBusy.value }
  const seen = new Set()
  for (const o of props.objects) {
    seen.add(o.uid)
    const key = stateKey(o, ctx)
    let rec = live.get(o.uid)
    if (!rec || rec.key !== key || rec.type !== o.type) {
      if (rec) {
        scene.remove(rec.node)
        dispose(rec.node)
      }
      const node = bake(buildModel(o, ctx))
      node.traverse((n) => (n.userData.uid = o.uid))
      const bb = new THREE.Box3().setFromObject(node)
      rec = { node, key, type: o.type, top: Math.max(0.35, bb.max.y), ticks: collectTicks(node) }
      live.set(o.uid, rec)
      scene.add(node)
    }
    if (drag.value?.uid !== o.uid) rec.node.position.copy(centre(o))
    rec.node.rotation.y = o.flip ? Math.PI : 0
  }
  for (const [uid, rec] of live) {
    if (seen.has(uid)) continue
    scene.remove(rec.node)
    dispose(rec.node)
    live.delete(uid)
  }
  updateLamps()
}

function updateLamps() {
  for (const l of lampLights) scene.remove(l)
  lampLights = []
  if (!lit.value) return
  const glowing = props.objects.filter((o) => ['lamp', 'lanterns', 'firepit', 'tent'].includes(o.type)).slice(0, 6)
  for (const o of glowing) {
    const l = new THREE.PointLight(o.type === 'firepit' ? '#FFB35C' : '#FFD27A', props.phase === 'night' ? 6 : 3, 3.2, 1.6)
    const c = centre(o)
    l.position.set(c.x, o.type === 'lamp' ? 1.0 : 0.6, c.z)
    scene.add(l)
    lampLights.push(l)
  }
}

// ---------------------------------------------------------------- previews and highlights
function translucent(node, opacity = 0.6) {
  node.traverse((n) => {
    if (!n.isMesh) return
    n.material = n.material.clone()
    n.material.transparent = true
    n.material.opacity = opacity
    n.material.depthWrite = false
    n.castShadow = false
  })
  return node
}

function makeFootprint() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.45, depthWrite: false }))
  m.position.y = 0.015
  m.visible = false
  m.renderOrder = 2
  return m
}

function showFootprint(type, x, y, color) {
  const { w, h } = sizeOf(type)
  footprint.visible = true
  footprint.scale.set(w - 0.06, 1, h - 0.06)
  footprint.position.set(x + w / 2, 0.015, y + h / 2)
  footprint.material.color.set(color)
}

function syncGhost() {
  if (!scene) return
  const g = props.ghost
  if (!g) {
    if (ghostNode) {
      scene.remove(ghostNode)
      ghostNode = null
      ghostKey = ''
    }
    return
  }
  if (ghostKey !== g.type) {
    if (ghostNode) scene.remove(ghostNode)
    ghostNode = translucent(bake(buildModel({ type: g.type, uid: 0, x: g.x, y: g.y }, { now: props.now, lit: false, season: props.season, kitchenBusy: false })), 0.7)
    ghostNode.traverse((n) => (n.userData.ghost = true))
    ghostKey = g.type
    ghostTop = new THREE.Box3().setFromObject(ghostNode).max.y + 0.15
    scene.add(ghostNode)
  }
  ghostNode.position.copy(centre({ type: g.type, x: g.x, y: g.y }))
}

function syncHighlights() {
  if (!footprint) return
  footprint.visible = false
  if (props.ghost) {
    const ok = fits(props.objects, props.ghost.type, props.ghost.x, props.ghost.y, props.cols, props.rows)
    showFootprint(props.ghost.type, props.ghost.x, props.ghost.y, ok ? '#FFFFFF' : '#E06A55')
  } else if (drag.value) {
    showFootprint(drag.value.type, drag.value.x, drag.value.y, drag.value.ok ? '#FFFFFF' : '#E06A55')
  } else if (props.mode === 'build' && props.selected != null) {
    const o = props.objects.find((x) => x.uid === props.selected)
    if (o) showFootprint(o.type, o.x, o.y, '#F2C66B')
  }
  if (gridLines) gridLines.visible = props.mode === 'build'
}

// ---------------------------------------------------------------- overlays (bubbles, bars, tools)
const kitchenReady = computed(() => props.kitchen.find((k) => k && props.now >= k.readyAt)?.recipe ?? null)
function statusOf(o) {
  const t = props.now
  if (o.crop) {
    if (t >= o.crop.readyAt) return { ready: o.crop.id }
    return { progress: growthFraction(o.crop.plantedAt, o.crop.readyAt, t), water: !o.crop.watered }
  }
  const tree = treeById[o.type]
  if (tree && o.readyAt) return t >= o.readyAt ? { ready: tree.fruit } : null
  const prod = producerById[o.type]
  if (prod) {
    if (o.readyAt && t >= o.readyAt) return { ready: prod.makes }
    if (o.readyAt) return { progress: growthFraction(o.readyAt - prod.minutes * 60000, o.readyAt, t) }
    return Object.keys(prod.feed).length && props.mode !== 'view' ? { idle: true } : null
  }
  if (o.type === 'kitchen' && kitchenReady.value) return { ready: kitchenReady.value }
  if (o.type === 'board' && props.ordersReady) return { badge: props.ordersReady }
  if (o.type === 'pip' && props.wishGood) return { wish: props.wishGood }
  return null
}
const marks = computed(() => {
  if (props.mode === 'build') return []
  return props.objects
    .map((o) => ({ o, st: statusOf(o), hint: (props.highlight === 'plot-empty' && o.type === 'plot' && !o.crop) || (props.highlight === 'plot-crop' && o.crop) }))
    .filter((m) => m.st || m.hint || props.helped.includes(m.o.uid))
})
const pipObj = computed(() => props.objects.find((o) => o.type === 'pip'))
const selectedObj = computed(() => (props.mode === 'build' && props.selected != null && !drag.value ? props.objects.find((o) => o.uid === props.selected) : null))
const canFlip = (o) => o && ['decor', 'tree', 'producer'].includes(kindOf(o.type))
const ghostOk = computed(() => props.ghost && fits(props.objects, props.ghost.type, props.ghost.x, props.ghost.y, props.cols, props.rows))

// floating "+3 wheat" and friends, over the thing that made them
const pops = ref([])
let popId = 0
function pop(uid, text, icon = null, bad = false) {
  const id = ++popId
  pops.value = [...pops.value.slice(-6), { id, uid, text, icon, bad }]
  setTimeout(() => (pops.value = pops.value.filter((p) => p.id !== id)), 1500)
}

/** World point an overlay hangs from. */
function anchorFor(key) {
  if (key === 'ghost' && props.ghost) {
    const c = centre({ type: props.ghost.type, x: props.ghost.x, y: props.ghost.y })
    return c.setY(ghostTop)
  }
  const uid = Number(key)
  const o = props.objects.find((x) => x.uid === uid)
  if (!o) return null
  const rec = live.get(uid)
  const c = drag.value?.uid === uid ? centre(o, drag.value) : centre(o)
  return c.setY((rec?.top ?? 0.6) + 0.12)
}

function updateOverlay() {
  const el = overlay.value
  if (!el || !camera) return
  const w = el.clientWidth
  const h = el.clientHeight
  for (const child of el.children) {
    const key = child.dataset.anchor
    if (!key) continue
    const p = anchorFor(key)
    if (!p) {
      child.style.visibility = 'hidden'
      continue
    }
    if (child.dataset.ground) p.y = 0.05
    if (child.dataset.lift) p.y += Number(child.dataset.lift)
    tmpV.copy(p).project(camera)
    const x = (tmpV.x * 0.5 + 0.5) * w
    const y = (-tmpV.y * 0.5 + 0.5) * h
    const off = tmpV.z > 1 || x < -60 || x > w + 60 || y < -80 || y > h + 80
    child.style.visibility = off ? 'hidden' : 'visible'
    child.style.transform = `translate(${x}px, ${y}px)`
    if (child.dataset.scale) {
      // Pip is drawn in HTML: size it to one tile at this distance
      const a = tmpV.clone()
      tmpV.copy(p).setX(p.x + 1).project(camera)
      const unit = Math.abs((tmpV.x - a.x) * 0.5 * w)
      child.style.setProperty('--unit', `${unit}px`)
    }
  }
}

// ---------------------------------------------------------------- input
const drag = shallowRef(null) // { uid, type, x, y, ok }
const pointers = new Map()
let press = null
let pinch = null

function ndc(e) {
  const r = canvas.value.getBoundingClientRect()
  return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
}
function groundAt(e) {
  ray.setFromCamera(ndc(e), camera)
  const p = new THREE.Vector3()
  return ray.ray.intersectPlane(groundPlane, p) ? p : null
}
function pickAt(e) {
  ray.setFromCamera(ndc(e), camera)
  const targets = []
  for (const rec of live.values()) targets.push(rec.node)
  if (ghostNode) targets.push(ghostNode)
  const hits = ray.intersectObjects(targets, true)
  for (const h of hits) {
    if (h.object.userData.ghost) return { ghost: true }
    if (h.object.userData.uid != null) return { uid: h.object.userData.uid }
  }
  return null
}
const tileOf = (p) => ({ x: Math.floor(p.x), y: Math.floor(p.z) })

function onDown(e) {
  canvas.value.setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    // two fingers: pinch to zoom and move the view
    const [a, b] = [...pointers.values()]
    pinch = {
      d: Math.hypot(a.x - b.x, a.y - b.y),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
      dist: view.dist,
      az: view.az,
      el: view.el,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
    press = null
    return
  }
  const hit = pickAt(e)
  const g = groundAt(e)
  press = { sx: e.clientX, sy: e.clientY, moved: false, hit, g0: g, kind: 'pan', painted: new Set() }
  if (e.button === 2 || e.shiftKey) {
    press.kind = 'orbit'
    press.az = view.az
    press.el = view.el
    return
  }
  if (props.tool && props.mode === 'farm') {
    press.kind = 'paint'
    paintAt(e)
  } else if (props.mode === 'build' && hit?.ghost) {
    press.kind = 'ghost'
    const t = tileOf(g)
    press.off = { x: t.x - props.ghost.x, y: t.y - props.ghost.y }
  } else if (props.mode === 'build' && !props.ghost && hit?.uid != null) {
    const o = props.objects.find((x) => x.uid === hit.uid)
    if (o) {
      press.kind = 'object'
      const t = tileOf(g)
      press.obj = o
      press.off = { x: t.x - o.x, y: t.y - o.y }
    }
  }
}

function paintAt(e) {
  const hit = pickAt(e)
  if (hit?.uid == null || press.painted.has(hit.uid)) return
  const o = props.objects.find((x) => x.uid === hit.uid)
  if (o?.type !== 'plot') return
  press.painted.add(hit.uid)
  emit('paint', hit.uid)
}

function onMove(e) {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    view.dist = pinch.dist * (pinch.d / Math.max(20, d))
    // twisting turns you round the farm
    let twist = Math.atan2(b.y - a.y, b.x - a.x) - pinch.angle
    twist = Math.atan2(Math.sin(twist), Math.cos(twist))
    view.az = pinch.az - twist
    // sliding both fingers up or down tilts
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    view.el = pinch.el + (mid.y - pinch.mid.y) * 0.006
    clampView()
    return
  }
  if (!press) return
  if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < 7) return
  press.moved = true
  if (press.kind === 'paint') return paintAt(e)
  if (press.kind === 'orbit') {
    view.az = press.az - (e.clientX - press.sx) * 0.008
    view.el = press.el + (e.clientY - press.sy) * 0.006
    clampView()
    return
  }
  const g = groundAt(e)
  if (!g) return
  if (press.kind === 'pan') {
    if (!press.g0) return
    view.tx += press.g0.x - g.x
    view.tz += press.g0.z - g.z
    clampView()
    // keep the same spot under the finger
    view.cur.tx = view.tx
    view.cur.tz = view.tz
    placeCamera(view.cur)
    return
  }
  const t = tileOf(g)
  if (press.kind === 'ghost') {
    const { w, h } = sizeOf(props.ghost.type)
    emit('ghost', { x: THREE.MathUtils.clamp(t.x - press.off.x, 0, props.cols - w), y: THREE.MathUtils.clamp(t.y - press.off.y, 0, props.rows - h) })
  } else if (press.kind === 'object') {
    const o = press.obj
    const x = t.x - press.off.x
    const y = t.y - press.off.y
    drag.value = { uid: o.uid, type: o.type, x, y, ok: fits(props.objects, o.type, x, y, props.cols, props.rows, o.uid) }
    const rec = live.get(o.uid)
    if (rec) rec.node.position.copy(centre(o, { x, y })).setY(0.12)
    syncHighlights()
  }
}

function onUp(e) {
  pointers.delete(e.pointerId)
  if (pinch) {
    if (pointers.size < 2) pinch = null
    return
  }
  const p = press
  press = null
  if (!p) return
  if (p.kind === 'paint' || p.kind === 'orbit') return
  if (p.kind === 'object' && p.moved) {
    const d = drag.value
    drag.value = null
    if (d?.ok) emit('move', { uid: d.uid, x: d.x, y: d.y })
    syncObjects()
    syncHighlights()
    return
  }
  if (p.moved) return
  // a tap
  if (p.hit?.ghost) return
  if (p.hit?.uid != null) {
    emit('tap', p.hit.uid)
    return
  }
  const g = groundAt(e)
  if (!g) return
  const t = tileOf(g)
  if (props.ghost) {
    const { w, h } = sizeOf(props.ghost.type)
    emit('ghost', { x: THREE.MathUtils.clamp(t.x, 0, props.cols - w), y: THREE.MathUtils.clamp(t.y, 0, props.rows - h) })
  } else if (t.x >= 0 && t.y >= 0 && t.x < props.cols && t.y < props.rows) emit('tapTile', t)
}

function onWheel(e) {
  e.preventDefault()
  view.dist *= e.deltaY > 0 ? 1.1 : 0.9
  clampView()
}

/** Look at something (used when a new preview appears off screen). */
function focusOn(x, y) {
  view.tx = x
  view.tz = y
  clampView()
}

// ---------------------------------------------------------------- loop
function frame(ts) {
  raf = requestAnimationFrame(frame)
  if (document.hidden) return
  const dt = Math.min(0.05, lastFrame ? (ts - lastFrame) / 1000 : 0.016)
  lastFrame = ts
  clockT += dt
  // ease the camera towards where it's going
  const c = view.cur
  const k = Math.min(1, dt * 9)
  c.tx += (view.tx - c.tx) * k
  c.tz += (view.tz - c.tz) * k
  c.dist += (view.dist - c.dist) * k
  c.el += (view.el - c.el) * k
  c.az += (view.az - c.az) * k
  heading.value = c.az
  placeCamera(c)
  placeSun()
  for (const rec of live.values()) for (const n of rec.ticks) n.userData.tick(n, clockT, dt)
  if (ghostNode) ghostNode.position.y = 0.06 + Math.sin(clockT * 4) * 0.04
  tickWeather(dt)
  renderer.render(scene, camera)
  updateOverlay()
}

function rebuildWorld() {
  if (!scene) return
  for (const name of ['ground', 'surroundings']) {
    const old = scene.getObjectByName(name)
    if (old) {
      scene.remove(old)
      dispose(old)
    }
  }
  scene.add(buildIsland())
  surroundings = buildSurroundings()
  scene.add(surroundings)
  if (gridLines) {
    scene.remove(gridLines)
    gridLines.geometry.dispose()
  }
  gridLines = buildGrid()
  scene.add(gridLines)
  applyLight()
}

let ro = null
onMounted(() => {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true, powerPreference: 'high-performance' })
  } catch {
    emit('failed')
    return
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200)
  hemi = new THREE.HemisphereLight('#FFFFFF', '#9DB38A', 1.6)
  sun = new THREE.DirectionalLight('#FFF4E0', 2.4)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const s = Math.max(props.cols, props.rows) * 0.8 + 4
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 50 })
  sun.shadow.bias = -0.0008
  sun.shadow.normalBias = 0.02
  scene.add(hemi, sun, sun.target)
  footprint = makeFootprint()
  scene.add(footprint)
  fitCamera()
  rebuildWorld()
  syncObjects()
  syncGhost()
  syncHighlights()
  buildWeather()
  ro = new ResizeObserver(() => {
    const w = host.value.clientWidth
    const h = host.value.clientHeight
    renderer.setSize(w, h, false)
    fitCamera(true)
  })
  ro.observe(host.value)
  renderer.setSize(host.value.clientWidth, host.value.clientHeight, false)
  canvas.value.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    emit('failed')
  })
  raf = requestAnimationFrame(frame)
  ready.value = true
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  for (const rec of live.values()) dispose(rec.node)
  live.clear()
  grassTex?.dispose()
  skyTex?.dispose()
  renderer?.dispose()
})

watch(() => [props.objects, props.now, props.phase, props.season], syncObjects, { deep: false })
watch(() => props.objects.map((o) => `${o.uid}:${o.x},${o.y},${o.flip ? 1 : 0},${o.crop?.id ?? ''},${o.crop?.watered ? 1 : 0},${o.readyAt ?? ''}`).join('|'), syncObjects)
watch(() => props.ghost && `${props.ghost.type}:${props.ghost.x}:${props.ghost.y}`, () => {
  syncGhost()
  syncHighlights()
  // bring a new preview into view
  if (props.ghost) focusOn(props.ghost.x + 0.5, props.ghost.y + 0.5)
})
watch(() => [props.mode, props.selected, props.objects.length], syncHighlights)
watch(() => [props.phase, props.weather], () => scene && applyLight())
watch(() => [props.season, props.rows, props.cols], () => {
  if (!scene) return
  rebuildWorld()
  fitCamera(true)
})
watch(() => props.weather, () => scene && buildWeather())

function screenOf(uid) {
  const p = uid === 'ghost' ? anchorFor('ghost') : anchorFor(String(uid))
  if (!p) return null
  const r = canvas.value.getBoundingClientRect()
  p.y = uid === 'ghost' ? 0.05 : 0.15
  tmpV.copy(p).project(camera)
  return { x: r.left + (tmpV.x * 0.5 + 0.5) * r.width, y: r.top + (-tmpV.y * 0.5 + 0.5) * r.height }
}
function screenOfTile(x, y) {
  const r = canvas.value.getBoundingClientRect()
  tmpV.set(x + 0.5, 0, y + 0.5).project(camera)
  return { x: r.left + (tmpV.x * 0.5 + 0.5) * r.width, y: r.top + (-tmpV.y * 0.5 + 0.5) * r.height }
}
if (import.meta.env.DEV) window.__farm3d = { screenOf, screenOfTile, pick: (x, y) => pickAt({ clientX: x, clientY: y }) }

defineExpose({ pop, focusOn })
</script>

<template>
  <div ref="host" class="farm3d relative h-full w-full touch-none select-none overflow-hidden" :class="{ 'is-tool': tool }">
    <canvas ref="canvas" class="block h-full w-full" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @wheel="onWheel" @contextmenu.prevent />

    <div ref="overlay" class="pointer-events-none absolute inset-0">
      <!-- Pip lives in the farm as their own drawing -->
      <div v-if="pipObj && pipLook" :data-anchor="String(pipObj.uid)" data-ground="1" data-scale="1" class="pip-pin">
        <button type="button" class="pip-box pointer-events-auto" :aria-label="'Pip'" data-sound="none" @click="emit('tap', pipObj.uid)">
          <Pip
            :growth="pipLook.growth"
            :droop="0"
            health="healthy"
            :pot="pipLook.pot"
            :leaf="pipLook.leaf"
            :flower="pipLook.flower"
            :accessory="pipLook.accessory"
            :sleeping="pipSleeping"
            :interactive="false"
            :idle="mode !== 'build'"
            class="h-full w-full"
          />
        </button>
      </div>

      <!-- ready bubbles, progress, badges -->
      <div v-for="m in marks" :key="`m${m.o.uid}`" :data-anchor="String(m.o.uid)" class="pin">
        <span v-if="m.hint" class="hint" />
        <template v-if="m.st">
          <span v-if="m.st.ready" class="bubble"><GoodIcon :id="m.st.ready" :size="26" /></span>
          <span v-else-if="m.st.wish" class="bubble wish"><GoodIcon :id="m.st.wish" :size="22" /></span>
          <span v-else-if="m.st.badge" class="count">{{ m.st.badge }}</span>
          <span v-else-if="m.st.idle" class="tag">Feed</span>
          <span v-else-if="m.st.progress !== undefined" class="bar"><span :style="{ width: `${Math.max(6, m.st.progress * 100)}%` }" /></span>
        </template>
        <span v-if="helped.includes(m.o.uid)" class="drop">💧</span>
      </div>

      <!-- tools for the selected thing -->
      <div v-if="selectedObj" :data-anchor="String(selectedObj.uid)" data-lift="0.2" class="pin">
        <div class="toolbar pointer-events-auto">
          <span class="px-2 text-xs font-bold text-[#FFFAF2]">{{ PLACEABLE[selectedObj.type]?.name }}</span>
          <button v-if="canFlip(selectedObj)" type="button" class="tool-btn" aria-label="Turn round" @click.stop="emit('action', { uid: selectedObj.uid, action: 'flip' })">
            <Icon name="flip" :size="16" :stroke="2.2" />
          </button>
          <button type="button" class="tool-btn" aria-label="Put away" @click.stop="emit('action', { uid: selectedObj.uid, action: 'store' })">
            <Icon name="box" :size="16" :stroke="2.2" />
          </button>
        </div>
      </div>

      <!-- confirm a new thing -->
      <div v-if="ghost" data-anchor="ghost" data-lift="0.15" class="pin">
        <div class="confirm pointer-events-auto">
          <button type="button" class="round is-no" aria-label="Cancel" data-sound="toggleOff" @click.stop="emit('cancel')"><Icon name="close" :size="18" :stroke="2.6" /></button>
          <button type="button" class="round is-yes" :disabled="!ghostOk" aria-label="Place it here" data-sound="none" @click.stop="emit('confirm')"><Icon name="check" :size="20" :stroke="2.8" /></button>
        </div>
      </div>

      <!-- little rewards that float up -->
      <div v-for="p in pops" :key="`p${p.id}`" :data-anchor="String(p.uid)" class="pin">
        <span class="pop" :class="{ bad: p.bad }"><GoodIcon v-if="p.icon" :id="p.icon" :size="18" />{{ p.text }}</span>
      </div>
    </div>

    <!-- turn round, tilt, and back to the front -->
    <div v-if="ready" class="view-ctl absolute right-2.5 top-2.5 flex flex-col items-center gap-1.5">
      <button type="button" class="ctl" aria-label="Back to the front view" title="Back to the front" @click="resetView">
        <svg viewBox="-12 -12 24 24" class="h-6 w-6" :style="{ transform: `rotate(${heading}rad)` }">
          <circle r="11" fill="#FFFDF8" stroke="#E2D6C6" stroke-width="1.2" />
          <path d="M0 -8 L3 0 L-3 0Z" fill="#D9533F" />
          <path d="M0 8 L3 0 L-3 0Z" fill="#B4A890" />
          <text y="-3.4" x="5.4" font-size="5" font-weight="800" fill="#7D6B5B">N</text>
        </svg>
      </button>
      <button type="button" class="ctl" aria-label="Turn left" title="Turn left" @click="turn(-Math.PI / 4)">
        <Icon name="undo" :size="17" :stroke="2.4" />
      </button>
      <button type="button" class="ctl" aria-label="Turn right" title="Turn right" @click="turn(Math.PI / 4)">
        <Icon name="undo" :size="17" :stroke="2.4" class="-scale-x-100" />
      </button>
      <button type="button" class="ctl text-[0.5625rem] font-extrabold leading-tight" :aria-label="`View: ${VIEWS[viewIndex].label}. Change`" title="Change the view" @click="cycleView">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="viewIndex === 0" d="M4 9 12 5l8 4-8 4Z" />
          <path v-else-if="viewIndex === 1" d="M3 14 12 8l9 6-9 4Z" />
          <path v-else d="M2 17 12 14l10 3M12 14V6" />
        </svg>
      </button>
    </div>

    <div v-if="!ready" class="absolute inset-0 flex items-center justify-center text-sm font-bold text-bark-400">Growing your farm…</div>
  </div>
</template>

<style scoped>
.farm3d {
  border-radius: 1.75rem;
  background: #dfeaf0;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.4), 0 18px 34px -22px rgb(58 45 35 / 0.6);
}
.ctl {
  display: flex;
  height: 2.4rem;
  width: 2.4rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(255 253 248 / 0.92);
  color: var(--color-bark-500);
  box-shadow: 0 4px 12px -6px rgb(58 45 35 / 0.5);
  backdrop-filter: blur(6px);
  -webkit-tap-highlight-color: transparent;
}
.ctl:active {
  transform: scale(0.92);
}
.farm3d.is-tool canvas {
  cursor: crosshair;
}
.pin,
.pip-pin {
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}
.pin > * {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -100%);
}
.pip-box {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(var(--unit, 40px) * 1.35);
  height: calc(var(--unit, 40px) * 1.7);
  transform: translate(-50%, -94%);
  -webkit-tap-highlight-color: transparent;
}
.bubble {
  display: flex;
  padding: 4px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.96);
  box-shadow: 0 6px 14px -6px rgb(58 45 35 / 0.55);
  animation: float 1.6s ease-in-out infinite;
}
.bubble.wish::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 8px;
  height: 8px;
  background: inherit;
  transform: translateX(-50%) rotate(45deg);
}
@keyframes float {
  50% { margin-top: -5px; }
}
.count {
  display: flex;
  height: 1.3rem;
  min-width: 1.3rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--color-clay-400);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  box-shadow: 0 0 0 2px #fff;
}
.tag {
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.92);
  color: var(--color-bark-500);
  font-size: 0.625rem;
  font-weight: 800;
  box-shadow: 0 3px 8px -4px rgb(58 45 35 / 0.5);
}
.bar {
  width: 2.4rem;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.22);
  box-shadow: 0 0 0 1.5px rgb(255 255 255 / 0.75);
}
.bar > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #fff;
}
.hint {
  width: 3rem;
  height: 3rem;
  margin-top: 1.4rem;
  border-radius: 999px;
  border: 3px solid #fff;
  animation: hint 1.3s ease-in-out infinite;
}
@keyframes hint {
  0%, 100% { opacity: 1; scale: 0.9; }
  50% { opacity: 0.3; scale: 1.15; }
}
.drop {
  margin-top: -1.2rem;
  font-size: 1rem;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: var(--color-bark-600);
  box-shadow: var(--shadow-float);
  white-space: nowrap;
}
.tool-btn {
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  color: #fffaf2;
}
.confirm {
  display: flex;
  gap: 0.5rem;
}
.round {
  display: flex;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  box-shadow: 0 6px 14px -6px rgb(58 45 35 / 0.6);
}
.round.is-yes {
  background: #6fa35b;
  color: #fff;
}
.round.is-yes:disabled {
  opacity: 0.45;
}
.round.is-no {
  background: #fff;
  color: var(--color-bark-500);
}
.pop {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  padding: 0.15rem 0.55rem 0.15rem 0.3rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.95);
  color: var(--color-leaf-500);
  font-size: 0.8125rem;
  font-weight: 800;
  box-shadow: 0 6px 14px -6px rgb(58 45 35 / 0.5);
  animation: rise 1.5s ease-out forwards;
}
.pop.bad {
  color: var(--color-clay-400);
}
@keyframes rise {
  0% { opacity: 0; margin-top: 8px; scale: 0.7; }
  15% { opacity: 1; margin-top: 0; scale: 1; }
  75% { opacity: 1; }
  100% { opacity: 0; margin-top: -46px; }
}
</style>
