<script setup>
// The farm, drawn as a grid of grass tiles with everything placed on top.
// mode 'farm': tap things to plant, harvest and open buildings.
// mode 'build': drag things to move them, tap to select; tap an empty tile to place.
// mode 'view': someone else's farm (read only, but you can water their crops).
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { sizeOf, fits, cropStage, growthFraction, treeById, producerById, recipeById } from '@/utils/farmLogic'
import { PLACEABLE } from '@/data/farm'
import FarmArt from './FarmArt.vue'
import GoodIcon from './GoodIcon.vue'
import Pip from '../Pip.vue'

const props = defineProps({
  objects: { type: Array, required: true },
  rows: { type: Number, required: true },
  cols: { type: Number, default: 8 },
  now: { type: Number, required: true },
  mode: { type: String, default: 'farm' },
  selected: { type: Number, default: null },
  placing: { type: String, default: null },
  kitchen: { type: Array, default: () => [] },
  ordersReady: { type: Number, default: 0 },
  pipLook: { type: Object, default: null }, // { growth, pot, leaf, flower }
  pipSleeping: { type: Boolean, default: false },
  wishGood: { type: String, default: null },
  helped: { type: Array, default: () => [] }, // uids watered this visit
})

const emit = defineEmits(['tap', 'tapTile', 'move'])

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
  if (tree && o.readyAt) {
    if (t >= o.readyAt) return { ready: tree.fruit }
    return null
  }
  const prod = producerById[o.type]
  if (prod) {
    if (o.readyAt && t >= o.readyAt) return { ready: prod.makes }
    if (o.readyAt) return { progress: growthFraction(o.readyAt - prod.minutes * 60000, o.readyAt, t) }
    return { idle: true }
  }
  if (o.type === 'kitchen' && kitchenReady.value) return { ready: kitchenReady.value }
  if (o.type === 'board' && props.ordersReady) return { badge: props.ordersReady }
  if (o.type === 'pip' && props.wishGood) return { wish: props.wishGood }
  return null
}

const drawn = computed(() =>
  [...props.objects]
    .map((o) => ({ o, ...sizeOf(o.type), flat: PLACEABLE[o.type]?.flat || o.type === 'plot' }))
    .sort((a, b) => (a.flat !== b.flat ? (a.flat ? -1 : 1) : a.o.y + a.h - (b.o.y + b.h))),
)

// ---- dragging (build mode) ----
const drag = ref(null) // { uid, type, x, y, ok }
let press = null

function tileAt(e) {
  const r = wrap.value.getBoundingClientRect()
  return { x: Math.floor((e.clientX - r.left) / tile.value), y: Math.floor((e.clientY - r.top) / tile.value) }
}

function onObjDown(e, o) {
  if (props.mode !== 'build') return
  const at = tileAt(e)
  press = { uid: o.uid, type: o.type, dx: at.x - o.x, dy: at.y - o.y, sx: e.clientX, sy: e.clientY, moved: false }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

function onMove(e) {
  if (!press) return
  if (!press.moved && Math.hypot(e.clientX - press.sx, e.clientY - press.sy) < 8) return
  press.moved = true
  const at = tileAt(e)
  const x = at.x - press.dx
  const y = at.y - press.dy
  drag.value = { uid: press.uid, type: press.type, x, y, ok: fits(props.objects, press.type, x, y, props.cols, props.rows, press.uid) }
}

function onUp() {
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  if (!press) return
  const p = press
  press = null
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
  if (e.target !== e.currentTarget) return
  emit('tapTile', tileAt(e))
}

// where the item being placed would go, following the pointer
const hover = ref(null)
function onHover(e) {
  if (!props.placing) return
  const at = tileAt(e)
  hover.value = { ...at, ok: fits(props.objects, props.placing, at.x, at.y, props.cols, props.rows) }
}

function box(x, y, type) {
  const { w, h } = sizeOf(type)
  return { left: `${x * tile.value}px`, top: `${(y - 1) * tile.value}px`, width: `${w * tile.value}px`, height: `${(h + 1) * tile.value}px` }
}
const viewBox = (type) => {
  const { w, h } = sizeOf(type)
  return `0 -40 ${w * 40} ${(h + 1) * 40}`
}
</script>

<template>
  <div
    ref="wrap"
    class="farm relative w-full select-none"
    :class="{ 'is-build': mode === 'build' }"
    :style="{ height: `${rows * tile}px`, '--tile': `${tile}px` }"
    @pointermove="onHover"
    @pointerleave="hover = null"
    @click="onGroundClick"
  >
    <!-- things -->
    <div
      v-for="{ o, w, h } in drawn"
      :key="o.uid"
      class="obj absolute"
      :class="{
        'is-selected': selected === o.uid,
        'is-dragging': drag?.uid === o.uid,
        'is-helped': helped.includes(o.uid),
      }"
      :style="box(o.x, o.y, o.type)"
      @pointerdown="(e) => onObjDown(e, o)"
      @click.stop="onObjClick(o)"
    >
      <svg v-if="o.type !== 'pip'" :viewBox="viewBox(o.type)" class="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <FarmArt :type="o.type" :obj="o" :now="now" :busy="o.type === 'kitchen' && kitchenBusy" />
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
          <span v-else-if="st?.idle" class="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 rounded-full bg-surface/90 px-1.5 text-[0.625rem] font-extrabold text-bark-500 shadow-soft">
            Feed
          </span>
          <span v-else-if="st?.progress !== undefined" class="pointer-events-none absolute bottom-[3%] left-[12%] right-[12%] h-[5px] overflow-hidden rounded-full bg-black/15">
            <span class="block h-full rounded-full bg-white/90" :style="{ width: `${Math.max(6, st.progress * 100)}%` }" />
          </span>
        </template>
      </template>
      <span v-if="helped.includes(o.uid)" class="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 text-base">💧</span>
    </div>

    <!-- the thing being dragged -->
    <div v-if="drag" class="ghost pointer-events-none absolute" :class="drag.ok ? 'is-ok' : 'is-bad'" :style="box(drag.x, drag.y, drag.type)">
      <svg v-if="drag.type !== 'pip'" :viewBox="viewBox(drag.type)" class="absolute inset-0 h-full w-full overflow-visible">
        <FarmArt :type="drag.type" :obj="objects.find((x) => x.uid === drag.uid) ?? {}" :now="now" />
      </svg>
    </div>

    <!-- the thing being placed -->
    <div v-if="placing && hover" class="ghost pointer-events-none absolute" :class="hover.ok ? 'is-ok' : 'is-bad'" :style="box(hover.x, hover.y, placing)">
      <svg :viewBox="viewBox(placing)" class="absolute inset-0 h-full w-full overflow-visible">
        <FarmArt :type="placing" :now="now" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.farm {
  border-radius: 1.25rem;
  background-color: #A9CB8A;
  background-image:
    radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.08) 0 12%, transparent 13%),
    linear-gradient(45deg, rgb(0 0 0 / 0.025) 25%, transparent 25%, transparent 75%, rgb(0 0 0 / 0.025) 75%),
    linear-gradient(45deg, rgb(0 0 0 / 0.025) 25%, transparent 25%, transparent 75%, rgb(0 0 0 / 0.025) 75%);
  background-size: var(--tile) var(--tile), calc(var(--tile) * 2) calc(var(--tile) * 2), calc(var(--tile) * 2) calc(var(--tile) * 2);
  background-position: 0 0, 0 0, var(--tile) var(--tile);
  box-shadow: inset 0 0 0 3px rgb(255 255 255 / 0.25), 0 16px 30px -22px rgb(58 45 35 / 0.7);
  touch-action: pan-y;
}
.farm.is-build {
  touch-action: none;
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.35) 1px, transparent 1px);
  background-size: var(--tile) var(--tile);
}
.obj {
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.is-build .obj {
  cursor: grab;
}
.obj.is-selected::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100% - var(--tile));
  border-radius: 0.6rem;
  box-shadow: 0 0 0 3px #F2C66B;
  pointer-events: none;
}
.obj.is-dragging {
  opacity: 0.35;
}
.obj:active:not(.is-dragging) svg {
  transform: scale(0.97);
}
.ghost svg {
  opacity: 0.85;
}
.ghost::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100% - var(--tile));
  border-radius: 0.6rem;
}
.ghost.is-ok::after {
  background: rgb(255 255 255 / 0.35);
  box-shadow: 0 0 0 2px #fff;
}
.ghost.is-bad::after {
  background: rgb(217 83 63 / 0.3);
  box-shadow: 0 0 0 2px #D9533F;
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
.obj.is-helped svg {
  animation: helped 0.6s ease-out;
}
@keyframes helped {
  40% { transform: scale(1.06); filter: brightness(1.1); }
}
</style>
