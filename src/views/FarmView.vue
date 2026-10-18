<script setup>
// The farm: plant, harvest, cook, fill orders, and arrange everything just how you like it.
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { GOODS, PLACEABLE, LAND, DECOR } from '@/data/farm'
import { cropById, kindOf, sizeOf, fits, firstFree, treeById, producerById } from '@/utils/farmLogic'
import { getDayPhase, SEASONS } from '@/utils/timeOfDay'
import { weather, season, refreshWeather, WEATHER } from '@/services/weather'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import PetalBadge from '@/components/PetalBadge.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import Celebration from '@/components/Celebration.vue'
import FarmMap from '@/components/farm/FarmMap.vue'
import Farm3D from '@/components/farm/Farm3D.vue'
import FarmSky from '@/components/farm/FarmSky.vue'
import FarmArt from '@/components/farm/FarmArt.vue'
import GoodIcon from '@/components/farm/GoodIcon.vue'
import BuildDrawer from '@/components/farm/BuildDrawer.vue'
import PlantSheet from '@/components/farm/PlantSheet.vue'
import ItemSheet from '@/components/farm/ItemSheet.vue'
import BarnSheet from '@/components/farm/BarnSheet.vue'
import KitchenSheet from '@/components/farm/KitchenSheet.vue'
import OrdersSheet from '@/components/farm/OrdersSheet.vue'
import PipSheet from '@/components/farm/PipSheet.vue'
import FriendsSheet from '@/components/farm/FriendsSheet.vue'
import WeatherSheet from '@/components/farm/WeatherSheet.vue'
import FarmTour from '@/components/farm/FarmTour.vue'

const farm = useFarmStore()
const pip = usePipStore()
const route = useRoute()
const router = useRouter()

const mode = ref('farm') // farm | build
const selected = ref(null)
const ghost = ref(null) // { type, x, y } something new waiting to be placed
const sheet = ref(null) // plant | item | barn | kitchen | orders | pip | friends | weather
const plantUid = ref(null)
const itemUid = ref(null)
const burst = ref(0)

const xpFill = computed(() => (farm.state.level >= farm.MAX_FARM_LEVEL ? 1 : farm.state.xp / farm.xpNeeded))
const pipLook = computed(() => ({ growth: pip.growthValue, pot: pip.currentPot, leaf: pip.currentLeaf, flower: pip.currentFlower, accessory: pip.currentAccessory }))
const nextLand = computed(() => LAND[farm.state.land + 1] ?? null)
const wishGood = computed(() => (farm.wish && !farm.wish.done ? farm.wish.good : null))
const phase = computed(() => getDayPhase(new Date(farm.now)))
const sky = computed(() => weather.value?.kind ?? null)
const kitchenReady = computed(() => farm.state.kitchen.some((k) => k && farm.now >= k.readyAt))

// ---- the 3D farm (or the flat one, on phones without 3D graphics) ----
function supports3D() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
const use3d = ref(supports3D())
const farmView = ref(null)

// ---- feedback: rewards float up over the thing that made them; warnings sit quietly above the dock
const note = ref('')
let noteTimer = null
function say(text) {
  note.value = text
  clearTimeout(noteTimer)
  noteTimer = setTimeout(() => (note.value = ''), 2600)
}
function popAt(uid, text, icon = null, bad = false) {
  farmView.value?.pop?.(uid, text, icon, bad)
}

function afterGain(r, uid = null) {
  if (r?.full) {
    if (uid != null) popAt(uid, 'Barn full', null, true)
    say('The barn is full. Sell or cook something first.')
    playSound('miss')
    return
  }
  if (!r?.good) return
  if (uid != null) popAt(uid, `+${r.amount}${r.xp ? ` · ${r.xp} XP` : ''}`, r.good)
  playSound('catch', true, { combo: 3 })
  haptic('light')
}

// ---- tools: plant one crop on the plots you tap or swipe, or water everything ----
const tool = ref(null) // { kind: 'plant', crop }
const thirsty = computed(() => farm.objects.filter((o) => o.crop && !o.crop.watered && farm.now < o.crop.readyAt))

function onPaint(uid) {
  const t = tool.value
  const o = farm.find(uid)
  if (!t || !o || o.type !== 'plot') return
  if (o.crop && farm.now >= o.crop.readyAt) return afterGain(farm.harvest(uid), uid)
  if (o.crop) return
  const r = farm.plant(uid, t.crop)
  if (r.ok) {
    popAt(uid, cropById[t.crop].seed ? `-${cropById[t.crop].seed}` : 'Planted', t.crop)
    playSound('place', true, { high: true })
    haptic('light')
  } else if (r.reason === 'petals') {
    popAt(uid, 'No petals', null, true)
    say('Not enough petals for more seeds.')
    tool.value = null
  }
}

function waterAll() {
  const list = thirsty.value
  let n = 0
  for (const o of list) if (farm.waterCrop(o.uid)) {
    n++
    popAt(o.uid, '', 'water')
  }
  if (n) {
    playSound('water')
    haptic('soft')
  }
}

// ---- tapping things on the farm ----
function onTap(uid) {
  const o = farm.find(uid)
  if (!o) return
  if (mode.value === 'build') {
    selected.value = selected.value === uid ? null : uid
    playSound('select')
    haptic('light')
    return
  }
  const kind = kindOf(o.type)
  if (o.type === 'barn') return (sheet.value = 'barn')
  if (o.type === 'kitchen') {
    const ready = farm.state.kitchen.findIndex((k) => k && farm.now >= k.readyAt)
    if (ready >= 0) return afterGain(farm.collectDish(ready), uid)
    return (sheet.value = 'kitchen')
  }
  if (o.type === 'board') return (sheet.value = 'orders')
  if (o.type === 'pip') return (sheet.value = 'pip')
  if (kind === 'plot') {
    if (!o.crop) {
      plantUid.value = uid
      sheet.value = 'plant'
      return
    }
    if (farm.now >= o.crop.readyAt) return afterGain(farm.harvest(uid), uid)
    // tapping a growing crop gives it a drink
    if (!o.crop.watered && farm.waterCrop(uid)) {
      popAt(uid, '', 'water')
      playSound('water')
      return
    }
  }
  if ((kind === 'tree' || kind === 'producer') && o.readyAt && farm.now >= o.readyAt) return afterGain(farm.harvest(uid), uid)
  if (kind === 'decor') {
    playSound('boop')
    return
  }
  itemUid.value = uid
  sheet.value = 'item'
}

function onTapTile() {
  if (mode.value === 'build') selected.value = null
}

function onMove({ uid, x, y }) {
  if (farm.move(uid, x, y)) {
    playSound('place')
    haptic('light')
  } else {
    playSound('miss')
  }
}

// ---- planting ----
// choosing a crop plants the plot you tapped, then keeps the seeds in hand:
// tap or swipe over more empty plots to plant those too, then tap Done
function plant(cropId) {
  const r = farm.plant(plantUid.value, cropId)
  sheet.value = null
  if (r.ok) {
    playSound('place')
    haptic('light')
    popAt(plantUid.value, 'Planted', cropId)
    if (use3d.value && farm.objects.some((o) => o.type === 'plot' && !o.crop)) tool.value = { kind: 'plant', crop: cropId }
  } else if (r.reason === 'petals') {
    say('Not enough petals for those seeds.')
  }
}

function plantAll(cropId) {
  const before = new Set(farm.objects.filter((o) => o.crop).map((o) => o.uid))
  const n = farm.plantAll(cropId)
  if (n) {
    for (const o of farm.objects) if (o.crop && !before.has(o.uid)) popAt(o.uid, '', cropId)
    playSound('place')
  }
  sheet.value = null
}

function harvestAll() {
  const t = farm.now
  const ready = farm.objects.filter((o) => (o.crop && t >= o.crop.readyAt) || (!o.crop && o.readyAt && t >= o.readyAt && (treeById[o.type] || producerById[o.type])))
  const goods = new Map(ready.map((o) => [o.uid, o.crop ? o.crop.id : treeById[o.type]?.fruit ?? producerById[o.type]?.makes]))
  const { got, full } = farm.harvestAll()
  if (Object.keys(got).length) {
    for (const o of ready) if (!farm.find(o.uid)?.crop || !full) popAt(o.uid, '+', goods.get(o.uid))
    playSound('catch', true, { combo: 6 })
    haptic('success')
  }
  if (full) say('The barn is full. Sell or cook to make room.')
}

// ---- item sheet actions ----
function water() {
  if (farm.waterCrop(itemUid.value)) {
    playSound('water')
    popAt(itemUid.value, '', 'water')
  }
}
function fertilise() {
  if (farm.fertilise(itemUid.value)) {
    playSound('grow')
    popAt(itemUid.value, 'Half the wait', null)
  }
}
function feedProducer() {
  const r = farm.startProducer(itemUid.value)
  if (r.ok) {
    playSound('select')
    sheet.value = null
  }
}

// ---- build mode ----
function setMode(m) {
  mode.value = m
  selected.value = null
  ghost.value = null
  tool.value = null
  playSound(m === 'build' ? 'toggleOn' : 'toggleOff')
}

/** Somewhere free for a new thing: next to `near` if there's room, otherwise the first gap. */
function spotFor(type, near = null) {
  const { w, h } = sizeOf(type)
  if (near) {
    const tries = [
      [near.x + w, near.y], [near.x, near.y + h], [near.x - w, near.y], [near.x, near.y - h],
    ]
    for (const [x, y] of tries) if (fits(farm.objects, type, x, y, farm.cols, farm.rows)) return { x, y }
  }
  return firstFree(farm.objects, type, farm.cols, farm.rows)
}

function pick(type) {
  selected.value = null
  const spot = spotFor(type)
  if (!spot) {
    say('No room for that. Put something away or buy more land.')
    playSound('miss')
    return
  }
  ghost.value = { type, ...spot }
  haptic('light')
}

// paths, fences and plots usually come in rows, so the preview stays for the next one
const REPEATS = new Set(['plot', ...DECOR.filter((d) => d.cat === 'path' || d.cat === 'fence').map((d) => d.id)])

function confirmPlace() {
  const g = ghost.value
  if (!g) return
  const owned = farm.state.inventory[g.type] > 0
  if (!owned && farm.priceOf(g.type) > pip.petals) {
    say('Not enough petals yet. Fill orders and play games to earn more.')
    playSound('miss')
    return
  }
  const placed = farm.buyAndPlace(g.type, g.x, g.y)
  if (!placed) {
    say('That doesn’t fit there.')
    playSound('miss')
    return
  }
  playSound('place')
  haptic('soft')
  const again = REPEATS.has(g.type) && (farm.state.inventory[g.type] > 0 || (farm.priceOf(g.type) !== null && farm.priceOf(g.type) <= pip.petals))
  const next = again ? spotFor(g.type, g) : null
  ghost.value = next ? { type: g.type, ...next } : null
}

function onAction({ uid, action }) {
  if (action === 'flip') {
    if (farm.flip(uid)) playSound('swap')
    return
  }
  const r = farm.store(uid)
  if (r.ok) {
    selected.value = null
    playSound('toggleOff')
  } else {
    say(r.reason === 'growing' ? 'Harvest it first.' : r.reason === 'busy' ? 'Wait until it’s finished.' : 'That one stays on the farm.')
  }
}

// ---- the farm tour: each step moves on when you do the thing ----
const tour = computed(() => farm.state.tutorial)
const tourHighlight = computed(() => (tour.value === 1 ? 'plot-empty' : tour.value === 2 ? 'plot-crop' : null))
watch(
  () => [tour.value, farm.objects.some((o) => o.crop), Object.keys(farm.state.almanac).length],
  ([t, planted, picked]) => {
    if (t === 1 && (planted || picked)) farm.tourNext(1)
    else if (t === 2 && picked) farm.tourNext(2)
  },
  { immediate: true },
)
watch(sheet, (s) => {
  if (s === 'orders') farm.tourNext(3)
  if (s === 'kitchen') farm.tourNext(4)
})
watch(mode, (m) => {
  if (m === 'build' && tour.value === 5) {
    farm.tourFinish(true)
    say('Farm tour finished! +10 petals')
    playSound('petals')
  }
})

// ---- level ups ----
watch(
  () => farm.levelUp,
  (l) => {
    if (l) {
      burst.value += 1
      playSound('levelUp')
      haptic('success')
    }
  },
)

// ---- rain outside waters the crops ----
function checkRain() {
  if (!['rain', 'storm'].includes(sky.value)) return
  const n = farm.rainWater()
  if (n) for (const o of farm.objects) if (o.crop?.watered) popAt(o.uid, '', 'water')
}
watch(sky, checkRain)

// ---- treats ----
function onFed(r) {
  pip.queueCelebration?.(r)
  const pipObj = farm.objects.find((o) => o.type === 'pip')
  if (pipObj) popAt(pipObj.uid, `+${r.points} growth`, r.id)
  playSound('boop')
}

function goShop(tab) {
  sheet.value = null
  router.push({ path: '/shop', query: { tab } })
}

// dock buttons draw a small piece of the farm
const DOCK_ART = { barn: '0 -12 80 96', kitchen: '0 -12 80 96', board: '-2 -2 44 44' }

onMounted(() => {
  farm.ensureWish()
  refreshWeather().then(checkRain)
  const q = route.query
  if (q.place && farm.state.inventory[q.place]) {
    mode.value = 'build'
    pick(q.place)
  } else if (q.build) {
    mode.value = 'build'
  }
  if (['barn', 'kitchen', 'orders', 'friends'].includes(q.open)) sheet.value = q.open
  if (q.place || q.open || q.build) router.replace({ query: {} })
})
</script>

<template>
  <section class="page farm-page flex flex-col">
    <!-- top bar: level, name, weather, petals -->
    <header class="flex items-center gap-3">
      <button type="button" class="relative h-14 w-14 shrink-0" :aria-label="`Farm level ${farm.state.level}`" @click="say(farm.state.level >= farm.MAX_FARM_LEVEL ? 'Top farm level. Amazing!' : `${farm.xpNeeded - farm.state.xp} XP to level ${farm.state.level + 1}`)">
        <svg viewBox="0 0 56 56" class="absolute inset-0 -rotate-90">
          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-sand-200)" stroke-width="5" />
          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-honey-400)" stroke-width="5" stroke-linecap="round" :stroke-dasharray="150.8" :stroke-dashoffset="150.8 * (1 - xpFill)" class="transition-[stroke-dashoffset] duration-700" />
        </svg>
        <span class="absolute inset-[7px] flex flex-col items-center justify-center rounded-full bg-surface shadow-soft">
          <span class="text-[0.5rem] font-extrabold uppercase leading-none tracking-wider text-bark-400">Level</span>
          <span class="font-display text-lg font-semibold leading-none text-bark-600">{{ farm.state.level }}</span>
        </span>
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="title-md truncate">{{ farm.name }}</h1>
        <button type="button" class="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-bark-400" @click="sheet = 'weather'">
          <span>{{ SEASONS[season].icon }}</span> {{ SEASONS[season].name }}
          <template v-if="weather">
            <span class="opacity-50">·</span>
            <Icon :name="WEATHER[weather.kind].icon" :size="13" :stroke="2.2" /> {{ weather.temp }}°
          </template>
          <Icon name="back" :size="11" :stroke="2.6" class="rotate-180 opacity-60" />
        </button>
      </div>
      <PetalBadge :count="pip.petals" size="sm" />
    </header>

    <!-- the farm -->
    <div class="scene relative mt-3 shrink-0" :class="{ 'is-flat': !use3d }">
      <Farm3D
        v-if="use3d"
        ref="farmView"
        :objects="farm.objects"
        :rows="farm.rows"
        :cols="farm.cols"
        :now="farm.now"
        :mode="mode"
        :selected="selected"
        :ghost="ghost"
        :kitchen="farm.state.kitchen"
        :orders-ready="farm.ordersReady"
        :pip-look="pipLook"
        :pip-sleeping="pip.asleep"
        :wish-good="wishGood"
        :highlight="tourHighlight"
        :phase="phase"
        :season="season"
        :weather="sky"
        :tool="tool"
        @tap="onTap"
        @tap-tile="onTapTile"
        @move="onMove"
        @ghost="(p) => (ghost = { ...ghost, ...p })"
        @confirm="confirmPlace"
        @cancel="ghost = null"
        @action="onAction"
        @paint="onPaint"
        @failed="use3d = false"
      />
      <div v-else class="no-scrollbar h-full overflow-y-auto rounded-[1.75rem]">
        <FarmSky :phase="phase" :season="season" :weather="sky" />
        <div class="relative -mt-12">
          <FarmMap
            :objects="farm.objects"
            :rows="farm.rows"
            :cols="farm.cols"
            :now="farm.now"
            :mode="mode"
            :selected="selected"
            :ghost="ghost"
            :kitchen="farm.state.kitchen"
            :orders-ready="farm.ordersReady"
            :pip-look="pipLook"
            :pip-sleeping="pip.asleep"
            :wish-good="wishGood"
            :highlight="tourHighlight"
            :phase="phase"
            :season="season"
            :weather="sky"
            @tap="onTap"
            @tap-tile="onTapTile"
            @move="onMove"
            @ghost="(p) => (ghost = { ...ghost, ...p })"
            @confirm="confirmPlace"
            @cancel="ghost = null"
            @action="onAction"
          />
        </div>
      </div>
      <Celebration :trigger="burst" :y="30" :count="30" :spread="180" />
      <p v-if="mode === 'build' && !ghost" class="build-tip pointer-events-none absolute inset-x-0 top-3 mx-auto w-max rounded-full bg-surface/90 px-3 py-1 text-[0.6875rem] font-bold text-bark-500 shadow-soft">
        Drag to move things. Tap one to turn it or put it away.
      </p>
    </div>

    <!-- quick actions above the dock: harvest everything, water everything, or the planting tool -->
    <div v-if="mode === 'farm'" class="actions fixed inset-x-0 z-30 mx-auto flex max-w-lg justify-center gap-2 px-3">
      <template v-if="tool">
        <div class="tool-bar flex items-center gap-3 rounded-full bg-bark-600 py-1.5 pl-2 pr-1.5 text-[#FFFAF2] shadow-float">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><GoodIcon :id="tool.crop" :size="22" /></span>
          <span class="text-xs font-bold leading-tight">Planting {{ cropById[tool.crop].name.toLowerCase() }}<br /><span class="opacity-70">Tap or swipe empty plots</span></span>
          <button type="button" class="rounded-full bg-leaf-400 px-3.5 py-1.5 text-xs font-extrabold" data-sound="toggleOff" @click="tool = null">Done</button>
        </div>
      </template>
      <template v-else>
        <Transition name="pop">
          <button v-if="farm.readyCount > 1" type="button" class="action bg-leaf-500" data-sound="none" @click="harvestAll">
            <span class="text-base">🧺</span> Harvest all · {{ farm.readyCount }}
          </button>
        </Transition>
        <Transition name="pop">
          <button v-if="thirsty.length > 1" type="button" class="action bg-water-500" data-sound="none" @click="waterAll">
            <Icon name="drop" :size="16" :stroke="2.4" /> Water all · {{ thirsty.length }}
          </button>
        </Transition>
      </template>
    </div>

    <!-- the dock (farm) or the drawer (build) -->
    <div class="bottom fixed inset-x-0 z-30 mx-auto max-w-lg px-3">
      <Transition name="swap" mode="out-in">
        <BuildDrawer v-if="mode === 'build'" key="build" :ghost="ghost" :season="season" @pick="pick" @done="setMode('farm')" />
        <nav v-else key="dock" class="dock grid grid-cols-6 gap-1 rounded-[1.75rem] border border-line bg-surface/95 p-2 shadow-float backdrop-blur-xl" aria-label="Farm tools">
          <button type="button" class="dock-btn" @click="sheet = 'barn'">
            <span class="tile bg-clay-100"><svg :viewBox="DOCK_ART.barn" class="h-9 w-9"><FarmArt type="barn" /></svg></span>
            <span class="label">Barn</span>
            <span class="meter"><span :style="{ width: `${Math.min(100, (farm.barnUsed / farm.barnCapacity) * 100)}%` }" :class="{ full: farm.barnFull }" /></span>
          </button>
          <button type="button" class="dock-btn" :class="{ 'is-hint': tour === 4 }" @click="sheet = 'kitchen'">
            <span class="tile bg-honey-100"><svg :viewBox="DOCK_ART.kitchen" class="h-9 w-9"><FarmArt type="kitchen" /></svg></span>
            <span class="label">Kitchen</span>
            <span v-if="kitchenReady" class="dot" />
          </button>
          <button type="button" class="dock-btn" :class="{ 'is-hint': tour === 3 }" @click="sheet = 'orders'">
            <span class="tile bg-leaf-200/70"><svg :viewBox="DOCK_ART.board" class="h-8 w-8"><FarmArt type="board" /></svg></span>
            <span class="label">Orders</span>
            <span v-if="farm.ordersReady" class="badge">{{ farm.ordersReady }}</span>
          </button>
          <button type="button" class="dock-btn" :class="{ 'is-hint': tour === 5 }" @click="setMode('build')">
            <span class="tile bg-water-100 text-water-500"><Icon name="move" :size="22" :stroke="2.2" /></span>
            <span class="label">Build</span>
          </button>
          <button type="button" class="dock-btn" @click="goShop('farm')">
            <span class="tile bg-petal-100 text-petal-500"><Icon name="shop" :size="22" :stroke="2.2" /></span>
            <span class="label">Shop</span>
          </button>
          <button type="button" class="dock-btn" @click="sheet = 'friends'">
            <span class="tile bg-sand-100 text-bark-500"><Icon name="friends" :size="22" :stroke="2.2" /></span>
            <span class="label">Friends</span>
          </button>
        </nav>
      </Transition>
    </div>

    <!-- a quiet note when something can't be done -->
    <Transition name="note">
      <p v-if="note" class="note pointer-events-none fixed inset-x-0 z-40 mx-auto w-max max-w-[90vw] rounded-full bg-bark-600/90 px-4 py-2 text-center text-xs font-bold text-[#FFFAF2] shadow-float" role="status">{{ note }}</p>
    </Transition>

    <FarmTour v-if="mode === 'farm'" @skip="farm.tourFinish(false)" />

    <PlantSheet :open="sheet === 'plant'" @close="sheet = null" @plant="plant" @plant-all="plantAll" />
    <ItemSheet :uid="sheet === 'item' ? itemUid : null" @close="sheet = null" @water="water" @fertilise="fertilise" @feed="feedProducer" />
    <BarnSheet
      :open="sheet === 'barn'"
      @close="sheet = null"
      @sold="() => playSound('petals')"
      @fed="onFed"
      @upgrade="goShop('farm')"
    />
    <KitchenSheet
      :open="sheet === 'kitchen'"
      @close="sheet = null"
      @cooked="() => playSound('swap')"
      @collected="(r) => afterGain(r, farm.objects.find((o) => o.type === 'kitchen')?.uid)"
      @upgrade="goShop('farm')"
    />
    <OrdersSheet
      :open="sheet === 'orders'"
      @close="sheet = null"
      @delivered="() => (playSound('win'), haptic('success'))"
      @community="(r) => (burst++, say(r.can ? `+${r.petals} petals and a golden watering can!` : `+${r.petals} petals. Thank you, neighbour!`))"
    />
    <PipSheet :open="sheet === 'pip'" @close="sheet = null" @fed="onFed" @barn="sheet = 'barn'" />
    <FriendsSheet :open="sheet === 'friends'" @close="sheet = null" />
    <WeatherSheet :open="sheet === 'weather'" @close="sheet = null" @changed="checkRain" />

    <Modal :open="Boolean(farm.levelUp)" label="Farm level up" @close="farm.clearLevelUp()">
      <template v-if="farm.levelUp">
        <p class="eyebrow text-leaf-500!">Your farm grew</p>
        <h2 class="title-xl mt-1">Farm level {{ farm.levelUp.level }}!</h2>
        <ul v-if="farm.levelUp.unlocks.length" class="mt-4 max-h-[40dvh] space-y-1.5 overflow-y-auto text-left">
          <li v-for="u in farm.levelUp.unlocks" :key="u.kind + u.id" class="flex items-center gap-2.5 rounded-xl bg-cream px-3 py-2 text-sm font-semibold text-bark-600">
            <GoodIcon v-if="GOODS[u.id]" :id="u.id" :size="22" />
            <svg v-else-if="PLACEABLE[u.id]" viewBox="0 -40 40 80" class="h-7 w-[22px] overflow-visible"><FarmArt :type="u.id" /></svg>
            <span v-else class="text-lg">✨</span>
            <span class="flex-1">{{ u.name }}</span>
            <span class="text-[0.625rem] font-extrabold uppercase tracking-wider text-bark-400">{{ u.kind }}</span>
          </li>
        </ul>
        <button type="button" class="btn btn-primary mt-5 w-full" @click="farm.clearLevelUp()">Lovely</button>
      </template>
    </Modal>
  </section>
</template>

<style scoped>
.farm-page {
  padding-bottom: 0;
}
.scene {
  border-radius: 1.75rem;
  /* fills the screen between the top bar and the dock */
  height: max(22rem, calc(100dvh - 17rem - env(safe-area-inset-bottom) - max(1rem, env(safe-area-inset-top))));
}
.actions {
  bottom: calc(11.25rem + env(safe-area-inset-bottom));
  pointer-events: none;
}
.actions > * {
  pointer-events: auto;
}
.action {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 800;
  box-shadow: var(--shadow-float);
}
.action:active {
  transform: scale(0.96);
}
.note {
  bottom: calc(14.5rem + env(safe-area-inset-bottom));
}
.note-enter-active,
.note-leave-active {
  transition: opacity 0.25s ease, transform 0.3s ease;
}
.note-enter-from,
.note-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.land {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 1rem;
  border: 1.5px dashed var(--color-sand-300);
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-bark-400);
}
.bottom {
  bottom: calc(5.75rem + env(safe-area-inset-bottom));
}
.harvest {
  bottom: calc(11.25rem + env(safe-area-inset-bottom));
}
.dock-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0;
  border-radius: 1rem;
  -webkit-tap-highlight-color: transparent;
}
.dock-btn:active .tile {
  transform: scale(0.92);
}
.tile {
  display: flex;
  height: 2.9rem;
  width: 2.9rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1rem;
  transition: transform 0.15s ease;
}
.label {
  font-size: 0.625rem;
  font-weight: 800;
  color: var(--color-bark-500);
}
.meter {
  position: absolute;
  bottom: 1.25rem;
  left: 22%;
  right: 22%;
  height: 4px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.85);
  overflow: hidden;
}
.meter > span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--color-leaf-400);
}
.meter > span.full {
  background: var(--color-clay-400);
}
.badge {
  position: absolute;
  top: -0.2rem;
  right: 0.1rem;
  display: flex;
  height: 1.15rem;
  min-width: 1.15rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: var(--color-clay-400);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 800;
  box-shadow: 0 0 0 2px var(--color-surface);
}
.dot {
  position: absolute;
  top: 0;
  right: 0.45rem;
  height: 0.7rem;
  width: 0.7rem;
  border-radius: 999px;
  background: var(--color-leaf-400);
  box-shadow: 0 0 0 2px var(--color-surface);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  50% { transform: scale(1.25); }
}
.dock-btn.is-hint .tile {
  animation: hint-ring 1.4s ease-in-out infinite;
}
@keyframes hint-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgb(134 173 114 / 0.7); }
  50% { box-shadow: 0 0 0 6px rgb(134 173 114 / 0); }
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.swap-enter-from,
.swap-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
.pop-enter-active {
  transition: opacity 0.25s ease, transform 0.4s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.pop-leave-active {
  transition: opacity 0.2s ease;
}
.pop-enter-from {
  opacity: 0;
  transform: translate(-50%, 12px) scale(0.85);
}
.pop-leave-to {
  opacity: 0;
}
.toast-enter-active {
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.3, 1.5, 0.5, 1);
}
.toast-leave-active {
  transition: opacity 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
}
</style>
