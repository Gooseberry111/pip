<script setup>
// The farm: textured grass inside a hedge, with everything placed on top.
// mode 'farm': tap things to plant, harvest and open buildings.
// mode 'build': drag things to move them, tap one for its tools (flip, put away).
//   While placing something new, a preview ("ghost") shows where it will go: drag it,
//   or tap a spot, then confirm with the tick.
// mode 'view': someone else's farm (read only, but you can water their crops).
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { sizeOf, fits, growthFraction, treeById, producerById, kindOf } from '@/utils/farmLogic'
import { PLACEABLE } from '@/data/farm'
import FarmArt from './FarmArt.vue'
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
  ghost: { type: Object, default: null }, // { type, x, y } something new being placed
  kitchen: { type: Array, default: () => [] },
  ordersReady: { type: Number, default: 0 },
  pipLook: { type: Object, default: null },
  pipSleeping: { type: Boolean, default: false },
  wishGood: { type: String, default: null },
  helped: { type: Array, default: () => [] },
  highlight: { type: String, default: null },
  phase: { type: String, default: 'day' }, // dawn | day | dusk | night
  season: { type: String, default: 'summer' },
  weather: { type: String, default: null }, // clear | cloudy | rain | storm | snow | fog
})
const wet = computed(() => props.weather === 'rain' || props.weather === 'storm')

const emit = defineEmits(['tap', 'tapTile', 'move', 'ghost', 'confirm', 'cancel', 'action'])

const wrap = ref(null)
const tile = ref(44)
let ro = null
onMounted(() => {
  ro = new ResizeObserver(() => (tile.value = (wrap.value?.clientWidth ?? 352) / props.cols))
  ro.observe(wrap.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})

// ---- the ground: grass with little tufts, flowers and pebbles, the same every time ----
const SEASON_GRASS = {
  spring: ['#B9D99A', '#A9CD88', '#9CC27A'],
  summer: ['#B3D492', '#A4C882', '#97BD74'],
  autumn: ['#C8CF8E', '#B8C27D', '#A9B46E'],
  winter: ['#DCE7E4', '#CFDDD9', '#C2D2CE'],
}
const grass = computed(() => SEASON_GRASS[props.season] ?? SEASON_GRASS.summer)
function hash(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
const groundBits = computed(() => {
  const bits = []
  for (let y = 0; y < props.rows; y++)
    for (let x = 0; x < props.cols; x++) {
      const r = hash(x, y)
      const ox = x * 40 + 8 + hash(x, y, 1) * 24
      const oy = y * 40 + 10 + hash(x, y, 2) * 22
      if (r < 0.2) bits.push({ k: 'tuft', x: ox, y: oy })
      else if (r < 0.27) bits.push({ k: 'flower', x: ox, y: oy, c: ['#FFFDF8', '#F6C7CD', '#F8E2A6', '#C9B2E6'][Math.floor(hash(x, y, 3) * 4)] })
      else if (r < 0.31) bits.push({ k: 'pebble', x: ox, y: oy })
      else if (r < 0.34 && props.season === 'autumn') bits.push({ k: 'leaf', x: ox, y: oy })
    }
  return bits
})

const kitchenBusy = computed(() => props.kitchen.some((k) => k && props.now < k.readyAt))
const kitchenReady = computed(() => props.kitchen.find((k) => k && props.now >= k.readyAt)?.recipe ?? null)

/** What to show above each thing: a ready bubble, or a little progress bar. */
function statusOf(o) {
  const t = props.now
  if (o.crop) {
    if (t >= o.crop.readyAt) return { ready: o.crop.id }
    return { progress: growthFraction(o.crop.plantedAt, o.crop.readyAt, t) }
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

// a little life: hens scratch about in front of the coop, a cow grazes by the shed, a duck paddles
const wanderers = computed(() => {
  if (props.mode === 'build') return []
  const out = []
  for (const o of props.objects) {
    const { w, h } = sizeOf(o.type)
    const base = { x: o.x, y: o.y, w, h, uid: o.uid }
    if (o.type === 'coop') out.push({ ...base, kind: 'hen', k: 0 }, { ...base, kind: 'hen', k: 1 })
    else if (o.type === 'cowshed') out.push({ ...base, kind: 'calf', k: 0 })
    else if (o.type === 'pond') out.push({ ...base, kind: 'duck', k: 0, swim: true })
  }
  return out.slice(0, 8)
})
function wanderStyle(a) {
  const size = tile.value * (a.kind === 'calf' ? 0.62 : 0.4)
  const range = Math.max(0, a.w * tile.value - size - tile.value * 0.1)
  const top = a.swim ? (a.y + a.h * 0.45) * tile.value : (a.y + a.h) * tile.value - size * 0.85
  return {
    left: `${a.x * tile.value + tile.value * 0.05}px`,
    top: `${top}px`,
    width: `${size}px`,
    height: `${size}px`,
    '--range': `${range}px`,
    animationDuration: `${(a.kind === 'calf' ? 16 : a.swim ? 12 : 7) + a.k * 2.5}s`,
    animationDelay: `${-((a.uid * 3 + a.k * 5) % 9)}s`,
  }
}

const drawn = computed(() =>
  [...props.objects]
    .map((o) => ({ o, ...sizeOf(o.type), flat: PLACEABLE[o.type]?.flat || o.type === 'plot' }))
    .sort((a, b) => (a.flat !== b.flat ? (a.flat ? -1 : 1) : a.o.y + a.h - (b.o.y + b.h))),
)

// ---- dragging things (build mode) and the placing preview ----
const drag = ref(null) // { uid, type, x, y, ok }
let press = null

function tileAt(e) {
  const r = wrap.value.getBoundingClientRect()
  return { x: Math.floor((e.clientX - r.left) / tile.value), y: Math.floor((e.clientY - r.top) / tile.value) }
}

function startPress(e, target) {
  const at = tileAt(e)
  press = { ...target, dx: at.x - target.x, dy: at.y - target.y, sx: e.clientX, sy: e.clientY, moved: false }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

function onObjDown(e, o) {
  if (props.mode !== 'build' || props.ghost) return
  startPress(e, { uid: o.uid, type: o.type, x: o.x, y: o.y })
}

function onGhostDown(e) {
  e.stopPropagation()
  startPress(e, { ghost: true, type: props.ghost.type, x: props.ghost.x, y: props.ghost.y })
}

function onMove(e) {
  if (!press) return
  if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < 8) return
  press.moved = true
  const at = tileAt(e)
  const x = at.x - press.dx
  const y = at.y - press.dy
  if (press.ghost) {
    const { w, h } = sizeOf(press.type)
    emit('ghost', { x: Math.max(0, Math.min(props.cols - w, x)), y: Math.max(0, Math.min(props.rows - h, y)) })
    return
  }
  drag.value = { uid: press.uid, type: press.type, x, y, ok: fits(props.objects, press.type, x, y, props.cols, props.rows, press.uid) }
}

function onUp() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  if (!press) return
  const p = press
  press = null
  if (p.ghost) return
  if (p.moved && drag.value) {
    if (drag.value.ok) emit('move', { uid: p.uid, x: drag.value.x, y: drag.value.y })
    drag.value = null
    return
  }
  drag.value = null
  emit('tap', p.uid)
}

function onObjClick(o) {
  if (props.mode === 'build') return // handled by pointer up
  emit('tap', o.uid)
}

function onGroundClick(e) {
  if (!e.target.closest('.ground-hit')) return
  const at = tileAt(e)
  if (props.ghost) {
    const { w, h } = sizeOf(props.ghost.type)
    emit('ghost', { x: Math.max(0, Math.min(props.cols - w, at.x)), y: Math.max(0, Math.min(props.rows - h, at.y)) })
    return
  }
  emit('tapTile', at)
}

// bring a new preview into view
watch(
  () => props.ghost && `${props.ghost.type}:${props.ghost.x}:${props.ghost.y}`,
  async (k, old) => {
    if (!k || (old && k.split(':')[0] === old.split(':')[0] && press)) return
    await nextTick()
    const el = wrap.value?.querySelector('.ghost.new')
    const r = el?.getBoundingClientRect()
    if (r && (r.top < 80 || r.bottom > window.innerHeight - 220)) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  },
)

const ghostOk = computed(() => props.ghost && fits(props.objects, props.ghost.type, props.ghost.x, props.ghost.y, props.cols, props.rows))
const selectedObj = computed(() => (props.mode === 'build' && props.selected != null && !drag.value ? props.objects.find((o) => o.uid === props.selected) : null))
const canFlip = (o) => o && ['decor', 'tree', 'producer'].includes(kindOf(o.type))

function box(x, y, type) {
  const { w, h } = sizeOf(type)
  return { left: `${x * tile.value}px`, top: `${(y - 1) * tile.value}px`, width: `${w * tile.value}px`, height: `${(h + 1) * tile.value}px` }
}
const viewBox = (type) => {
  const { w, h } = sizeOf(type)
  return `0 -40 ${w * 40} ${(h + 1) * 40}`
}
const flipT = (o) => (o.flip ? `translate(${sizeOf(o.type).w * 40} 0) scale(-1 1)` : undefined)

// a floating bar of buttons just above a spot on the map
// (kept inside the farm: near an edge it lines up with that edge instead of centring)
function barStyle(x, y, type) {
  const { w } = sizeOf(type)
  const mid = x + w / 2
  const shift = mid < 2 ? '0%' : mid > props.cols - 2 ? '-100%' : '-50%'
  const left = mid < 2 ? x : mid > props.cols - 2 ? x + w : mid
  return { left: `${left * tile.value}px`, top: `${(y - 1) * tile.value}px`, '--shift': shift }
}
</script>

<template>
  <div class="hedge" :class="`is-${phase}`">
    <div
      ref="wrap"
      class="farm relative w-full select-none"
      :class="{ 'is-build': mode === 'build' }"
      :style="{ height: `${rows * tile}px`, '--tile': `${tile}px` }"
      @click="onGroundClick"
    >
      <!-- grass -->
      <svg class="ground-hit absolute inset-0 h-full w-full" :viewBox="`0 0 ${cols * 40} ${rows * 40}`" preserveAspectRatio="none" aria-hidden="true">
        <rect :width="cols * 40" :height="rows * 40" :fill="grass[0]" />
        <template v-for="y in rows" :key="`r${y}`">
          <rect v-for="x in cols" :key="`t${x}`" v-show="(x + y) % 2 === 0" :x="(x - 1) * 40" :y="(y - 1) * 40" width="40" height="40" :fill="grass[1]" opacity="0.45" />
        </template>
        <g v-for="(b, i) in groundBits" :key="i">
          <path v-if="b.k === 'tuft'" :d="`M${b.x - 3} ${b.y + 4} l1.5 -6 M${b.x} ${b.y + 4} l0 -7 M${b.x + 3} ${b.y + 4} l-1.5 -6`" :stroke="grass[2]" stroke-width="1.6" stroke-linecap="round" />
          <g v-else-if="b.k === 'flower'">
            <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" :cx="b.x" :cy="b.y - 2" r="1.6" :fill="b.c" :transform="`rotate(${a} ${b.x} ${b.y})`" />
            <circle :cx="b.x" :cy="b.y" r="1" fill="#F2B544" />
          </g>
          <ellipse v-else-if="b.k === 'pebble'" :cx="b.x" :cy="b.y" rx="2.6" ry="1.8" fill="#C9C0AE" opacity="0.8" />
          <path v-else-if="b.k === 'leaf'" :d="`M${b.x} ${b.y} q4 -4 7 0 q-4 4 -7 0z`" fill="#D9853B" opacity="0.85" />
        </g>
        <!-- build grid -->
        <g v-if="mode === 'build'" stroke="#fff" stroke-opacity="0.45" stroke-width="0.8">
          <line v-for="x in cols - 1" :key="`gx${x}`" :x1="x * 40" :x2="x * 40" y1="0" :y2="rows * 40" />
          <line v-for="y in rows - 1" :key="`gy${y}`" x1="0" :x2="cols * 40" :y1="y * 40" :y2="y * 40" />
        </g>
      </svg>

      <!-- things -->
      <div
        v-for="{ o, h } in drawn"
        :key="o.uid"
        class="obj absolute"
        :class="{
          'is-selected': selected === o.uid && mode === 'build',
          'is-dragging': drag?.uid === o.uid,
          'is-helped': helped.includes(o.uid),
          'is-hint': (highlight === 'plot-empty' && o.type === 'plot' && !o.crop) || (highlight === 'plot-crop' && o.crop),
          'is-dim': ghost,
        }"
        :style="box(o.x, o.y, o.type)"
      >
        <div class="hit absolute inset-x-0 bottom-0" :style="{ height: `${h * tile}px` }" @pointerdown="(e) => onObjDown(e, o)" @click.stop="onObjClick(o)" />
        <svg v-if="o.type !== 'pip'" :viewBox="viewBox(o.type)" class="art pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <g :transform="flipT(o)">
            <FarmArt :type="o.type" :obj="o" :now="now" :busy="o.type === 'kitchen' && kitchenBusy" :phase="phase" />
          </g>
        </svg>
        <div v-else class="pointer-events-none absolute inset-x-0 bottom-0" :style="{ height: `${tile * 1.6}px` }">
          <Pip
            v-if="pipLook"
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
        </div>

        <!-- status -->
        <template v-if="mode !== 'build'">
          <template v-for="st in [statusOf(o)]" :key="'s'">
            <span v-if="st?.ready" class="bubble pointer-events-none absolute left-1/2 -translate-x-1/2" :style="{ top: `${tile * (o.type === 'plot' ? 0.45 : 0.1)}px` }">
              <GoodIcon :id="st.ready" :size="Math.round(tile * 0.5)" />
            </span>
            <span v-else-if="st?.wish" class="bubble wish pointer-events-none absolute left-1/2 -translate-x-1/2" :style="{ top: `${-tile * 0.25}px` }">
              <GoodIcon :id="st.wish" :size="Math.round(tile * 0.42)" />
            </span>
            <span v-else-if="st?.badge" class="pointer-events-none absolute right-0 top-[18%] flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-300 px-1 text-[0.6875rem] font-extrabold text-white shadow-soft">
              {{ st.badge }}
            </span>
            <span v-else-if="st?.idle" class="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-surface/90 px-1.5 text-[0.625rem] font-extrabold text-bark-500 shadow-soft">Feed</span>
            <span v-else-if="st?.progress !== undefined" class="pointer-events-none absolute bottom-[3%] left-[12%] right-[12%] h-[5px] overflow-hidden rounded-full bg-black/15">
              <span class="block h-full rounded-full bg-white/90" :style="{ width: `${Math.max(6, st.progress * 100)}%` }" />
            </span>
          </template>
        </template>
        <span v-if="helped.includes(o.uid)" class="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 text-base">💧</span>
      </div>

      <!-- animals about the place -->
      <div v-for="(a, i) in wanderers" :key="`w${i}`" class="wander pointer-events-none absolute" :style="wanderStyle(a)" aria-hidden="true">
        <svg viewBox="-10 -10 20 20" class="h-full w-full overflow-visible" :class="{ peck: a.kind === 'hen' }">
          <template v-if="a.kind === 'hen'">
            <ellipse cx="0" cy="9" rx="6" ry="1.4" fill="#000" opacity="0.12" />
            <path d="M-6 2 Q-8 -3 -4 -4 L-7 -7 L-2 -5 Q3 -6 5 -2 Q7 3 2 6 L-3 6 Q-6 5 -6 2Z" fill="#FFFDF8" />
            <circle cx="4" cy="-4" r="3" fill="#FFFDF8" />
            <path d="M3 -7.5 Q4 -9.5 5 -7.5 Q6 -9.5 6.6 -7" fill="#E35D4B" />
            <path d="M7 -4 L9 -3.4 L7 -2.6Z" fill="#F2B544" />
            <circle cx="4.8" cy="-4.6" r="0.6" fill="#3E2F25" />
            <path d="M-1 6 V9 M2 6 V9" stroke="#F2B544" stroke-width="0.9" />
          </template>
          <template v-else-if="a.kind === 'calf'">
            <ellipse cx="0" cy="9" rx="9" ry="1.6" fill="#000" opacity="0.12" />
            <rect x="-8" y="-3" width="13" height="8" rx="4" fill="#fff" />
            <ellipse cx="-3" cy="0" rx="2.5" ry="2" fill="#3E2F25" />
            <path d="M-6 5 V9 M-3 5 V9 M1 5 V9 M3.5 5 V9" stroke="#fff" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="6" cy="-3" r="3.4" fill="#fff" />
            <ellipse cx="7.5" cy="-1.6" rx="2" ry="1.4" fill="#F3B9B5" />
            <circle cx="6" cy="-4" r="0.6" fill="#3E2F25" />
            <path d="M4 -6 L3 -8 M7 -6 L8 -8" stroke="#E8D3B5" stroke-width="1" stroke-linecap="round" />
          </template>
          <template v-else>
            <ellipse cx="0" cy="3" rx="8" ry="2" fill="#fff" opacity="0.35" />
            <path d="M-6 1 Q-7 -3 -3 -2 L3 -2 Q6 -2 6 1 Q4 3 -4 3Z" fill="#F6D266" />
            <circle cx="3.5" cy="-4" r="2.6" fill="#F6D266" />
            <path d="M5.6 -4 L8 -3.5 L5.6 -3Z" fill="#EE9447" />
            <circle cx="4" cy="-4.6" r="0.5" fill="#3E2F25" />
          </template>
        </svg>
      </div>

      <!-- moving something already on the farm -->
      <div v-if="drag" class="ghost pointer-events-none absolute" :class="drag.ok ? 'is-ok' : 'is-bad'" :style="box(drag.x, drag.y, drag.type)">
        <svg :viewBox="viewBox(drag.type)" class="absolute inset-0 h-full w-full overflow-visible">
          <FarmArt :type="drag.type" :obj="objects.find((x) => x.uid === drag.uid) ?? {}" :now="now" />
        </svg>
      </div>

      <!-- tools for the selected thing -->
      <div v-if="selectedObj" class="toolbar absolute z-20 flex items-center gap-1 rounded-full bg-bark-600 p-1 shadow-float" :style="barStyle(selectedObj.x, selectedObj.y, selectedObj.type)">
        <span class="px-2 text-xs font-bold text-[#FFFAF2]">{{ PLACEABLE[selectedObj.type]?.name }}</span>
        <button v-if="canFlip(selectedObj)" type="button" class="tool-btn" aria-label="Flip" @click.stop="emit('action', { uid: selectedObj.uid, action: 'flip' })">
          <Icon name="flip" :size="16" :stroke="2.2" />
        </button>
        <button type="button" class="tool-btn" aria-label="Put away" @click.stop="emit('action', { uid: selectedObj.uid, action: 'store' })">
          <Icon name="box" :size="16" :stroke="2.2" />
        </button>
      </div>

      <!-- something new, waiting to be placed -->
      <template v-if="ghost">
        <div class="ghost new absolute" :class="ghostOk ? 'is-ok' : 'is-bad'" :style="box(ghost.x, ghost.y, ghost.type)">
          <div class="hit absolute inset-x-0 bottom-0 cursor-grab" :style="{ height: `${sizeOf(ghost.type).h * tile}px` }" @pointerdown="onGhostDown" />
          <svg :viewBox="viewBox(ghost.type)" class="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <FarmArt :type="ghost.type" :now="now" />
          </svg>
        </div>
        <div class="confirm absolute z-20 flex gap-2" :style="barStyle(ghost.x, ghost.y, ghost.type)">
          <button type="button" class="round is-no" aria-label="Cancel" data-sound="toggleOff" @click.stop="emit('cancel')"><Icon name="close" :size="18" :stroke="2.6" /></button>
          <button type="button" class="round is-yes" :disabled="!ghostOk" aria-label="Place it here" data-sound="none" @click.stop="emit('confirm')"><Icon name="check" :size="20" :stroke="2.8" /></button>
        </div>
      </template>

      <!-- a little life: butterflies drift across now and then -->
      <template v-if="mode === 'farm' && phase !== 'night' && season !== 'winter' && !wet && weather !== 'snow'">
        <svg v-for="n in 2" :key="`b${n}`" class="butterfly pointer-events-none absolute" :class="`b${n}`" viewBox="-10 -10 20 20" width="18" height="18" aria-hidden="true">
          <path d="M0 0 C-6 -9 -10 -4 -7 1 C-5 4 -2 2 0 0Z M0 0 C6 -9 10 -4 7 1 C5 4 2 2 0 0Z" :fill="n === 1 ? '#F6C7CD' : '#F8E2A6'" />
          <ellipse rx="0.9" ry="3.6" fill="#5B4636" />
        </svg>
      </template>
      <!-- the real weather -->
      <div v-if="weather === 'snow'" class="snow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div v-if="wet" class="rain pointer-events-none absolute inset-0" :class="{ 'is-storm': weather === 'storm' }" aria-hidden="true" />
      <div v-if="weather === 'fog'" class="fog pointer-events-none absolute inset-0" aria-hidden="true" />
      <!-- the light changes through the day -->
      <div class="tint pointer-events-none absolute inset-0" :class="`is-${phase}`" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.hedge {
  position: relative;
  padding: 9px;
  border-radius: 1.6rem;
  background:
    radial-gradient(circle at 12px 12px, #7FAA62 9px, transparent 10px) 0 0 / 22px 22px,
    #8DB572;
  box-shadow: inset 0 -4px 0 rgb(60 90 40 / 0.25), 0 18px 34px -22px rgb(58 45 35 / 0.75);
}
.hedge.is-night {
  background:
    radial-gradient(circle at 12px 12px, #5F7F52 9px, transparent 10px) 0 0 / 22px 22px,
    #6B8B5C;
}
.farm {
  border-radius: 1.05rem;
  overflow: visible;
  touch-action: pan-y;
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.2);
}
.farm > svg:first-child {
  border-radius: 1.05rem;
}
.farm.is-build {
  touch-action: none;
}
.obj {
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.art {
  filter: drop-shadow(0 1.5px 0 rgb(58 45 35 / 0.14));
}
.wander {
  z-index: 3;
  animation: wander linear infinite;
}
@keyframes wander {
  0% { transform: translateX(0) scaleX(1); }
  48% { transform: translateX(var(--range)) scaleX(1); }
  50% { transform: translateX(var(--range)) scaleX(-1); }
  98% { transform: translateX(0) scaleX(-1); }
  100% { transform: translateX(0) scaleX(1); }
}
.peck {
  animation: peck 1.1s ease-in-out infinite;
  transform-origin: 50% 90%;
}
@keyframes peck {
  0%, 60%, 100% { transform: rotate(0); }
  75% { transform: rotate(18deg) translateY(1px); }
}
.obj.is-dim {
  opacity: 0.75;
}
.hit {
  pointer-events: auto;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.is-build .hit {
  cursor: grab;
}
.obj.is-selected::after,
.obj.is-hint::after,
.ghost::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100% - var(--tile));
  border-radius: 0.6rem;
  pointer-events: none;
}
.obj.is-selected::after {
  box-shadow: 0 0 0 3px #F2C66B, 0 0 0 7px rgb(242 198 107 / 0.25);
  background: rgb(255 255 255 / 0.15);
}
.obj.is-hint::after {
  animation: hint 1.3s ease-in-out infinite;
}
@keyframes hint {
  0%, 100% { box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9), 0 0 0 2px rgb(255 255 255 / 0.6); }
  50% { box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9), 0 0 0 8px rgb(255 255 255 / 0); }
}
.obj.is-dragging {
  opacity: 0.3;
}
.obj:has(.hit:active):not(.is-dragging) .art {
  transform: scale(0.97);
}
.ghost svg {
  opacity: 0.9;
}
.ghost.new {
  z-index: 15;
  animation: ghost-in 0.35s cubic-bezier(0.3, 1.5, 0.5, 1);
}
@keyframes ghost-in {
  from { transform: scale(0.6); opacity: 0; }
}
.ghost.is-ok::after {
  background: rgb(255 255 255 / 0.35);
  box-shadow: 0 0 0 2.5px #fff, 0 0 18px rgb(255 255 255 / 0.7);
}
.ghost.is-bad::after {
  background: rgb(217 83 63 / 0.3);
  box-shadow: 0 0 0 2.5px #D9533F;
}
.confirm,
.toolbar {
  margin-top: -6px;
  transform: translate(var(--shift, -50%), -100%);
  white-space: nowrap;
  animation: bar-in 0.3s cubic-bezier(0.3, 1.5, 0.5, 1);
}
@keyframes bar-in {
  from { opacity: 0; transform: translate(var(--shift, -50%), -80%) scale(0.8); }
}
.round {
  display: flex;
  height: 2.6rem;
  width: 2.6rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  box-shadow: 0 6px 14px -6px rgb(58 45 35 / 0.6);
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.round:active {
  transform: scale(0.92);
}
.round.is-yes {
  background: #6FA35B;
  color: #fff;
}
.round.is-yes:disabled {
  opacity: 0.45;
}
.round.is-no {
  background: #fff;
  color: var(--color-bark-500);
}
.tool-btn {
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.14);
  color: #FFFAF2;
}
.tool-btn:active {
  background: rgb(255 255 255 / 0.28);
}
.bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.95);
  box-shadow: 0 4px 10px -4px rgb(58 45 35 / 0.5);
  animation: float 1.6s ease-in-out infinite;
  z-index: 2;
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
  50% { transform: translateY(-4px); }
}
.obj.is-helped .art {
  animation: helped 0.6s ease-out;
}
@keyframes helped {
  40% { transform: scale(1.06); filter: brightness(1.1); }
}
.butterfly {
  top: 20%;
  left: -20px;
  z-index: 12;
  animation: flutter 22s linear infinite;
}
.butterfly.b2 {
  top: 60%;
  animation-duration: 28s;
  animation-delay: -12s;
}
@keyframes flutter {
  0% { transform: translate(0, 0) rotate(8deg); }
  25% { transform: translate(25vw, -30px) rotate(-6deg); }
  50% { transform: translate(50vw, 10px) rotate(10deg); }
  75% { transform: translate(75vw, -20px) rotate(-8deg); }
  100% { transform: translate(110vw, 0) rotate(6deg); }
}
.butterfly path {
  transform-origin: center;
  animation: wings 0.35s ease-in-out infinite alternate;
}
@keyframes wings {
  to { transform: scaleX(0.35); }
}
.snow {
  border-radius: 1.05rem;
  background-image:
    radial-gradient(2px 2px at 20px 30px, #fff 50%, transparent 51%),
    radial-gradient(2px 2px at 70px 90px, #fff 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 130px 50px, #fff 50%, transparent 51%),
    radial-gradient(2px 2px at 160px 140px, #fff 50%, transparent 51%);
  background-size: 180px 180px;
  animation: snow 9s linear infinite;
  opacity: 0.85;
  z-index: 13;
}
@keyframes snow {
  to { background-position: 30px 180px, -20px 180px, 10px 180px, -30px 180px; }
}
.rain {
  border-radius: 1.05rem;
  background-image:
    linear-gradient(105deg, transparent 48%, rgb(255 255 255 / 0.55) 49%, rgb(255 255 255 / 0.55) 51%, transparent 52%),
    linear-gradient(105deg, transparent 48%, rgb(255 255 255 / 0.35) 49%, rgb(255 255 255 / 0.35) 51%, transparent 52%);
  background-size: 23px 46px, 37px 70px;
  background-position: 0 0, 11px 20px;
  animation: rain 0.55s linear infinite;
  z-index: 13;
  opacity: 0.7;
}
.rain.is-storm {
  animation-duration: 0.35s;
  background-color: rgb(40 50 80 / 0.12);
}
@keyframes rain {
  to { background-position: -12px 46px, -8px 90px; }
}
.fog {
  border-radius: 1.05rem;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0.15) 60%, rgb(255 255 255 / 0.35));
  z-index: 13;
}
.tint {
  border-radius: 1.05rem;
  z-index: 14;
  transition: background-color 2s ease;
}
.tint.is-dawn {
  background: rgb(255 190 150 / 0.1);
}
.tint.is-dusk {
  background: rgb(255 150 110 / 0.14);
}
.tint.is-night {
  background: rgb(40 50 100 / 0.32);
}
</style>
