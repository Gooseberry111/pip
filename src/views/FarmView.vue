<script setup>
// The farm: plant, harvest, cook, fill orders, and arrange everything just how you like it.
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { GOODS, PLACEABLE, LAND } from '@/data/farm'
import { cropById, kindOf, sizeOf } from '@/utils/farmLogic'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import PageHeader from '@/components/PageHeader.vue'
import PetalBadge from '@/components/PetalBadge.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import Celebration from '@/components/Celebration.vue'
import FarmMap from '@/components/farm/FarmMap.vue'
import FarmArt from '@/components/farm/FarmArt.vue'
import GoodIcon from '@/components/farm/GoodIcon.vue'
import PlantSheet from '@/components/farm/PlantSheet.vue'
import ItemSheet from '@/components/farm/ItemSheet.vue'
import BarnSheet from '@/components/farm/BarnSheet.vue'
import KitchenSheet from '@/components/farm/KitchenSheet.vue'
import OrdersSheet from '@/components/farm/OrdersSheet.vue'
import PipSheet from '@/components/farm/PipSheet.vue'
import FriendsSheet from '@/components/farm/FriendsSheet.vue'
import FarmTour from '@/components/farm/FarmTour.vue'

const farm = useFarmStore()
const pip = usePipStore()
const route = useRoute()
const router = useRouter()

const mode = ref('farm') // farm | build
const selected = ref(null)
const placing = ref(null)
const sheet = ref(null) // plant | item | barn | kitchen | orders | pip | friends
const plantUid = ref(null)
const itemUid = ref(null)
const burst = ref(0)

const xpFill = computed(() => (farm.state.level >= farm.MAX_FARM_LEVEL ? 1 : farm.state.xp / farm.xpNeeded))
const inventory = computed(() => Object.entries(farm.state.inventory).filter(([, n]) => n > 0).map(([type, n]) => ({ type, n, name: PLACEABLE[type]?.name ?? type })))
const pipLook = computed(() => ({ growth: pip.growthValue, pot: pip.currentPot, leaf: pip.currentLeaf, flower: pip.currentFlower, accessory: pip.currentAccessory }))
const selectedObj = computed(() => (selected.value == null ? null : farm.find(selected.value)))
const nextLand = computed(() => LAND[farm.state.land + 1] ?? null)
const wishGood = computed(() => (farm.wish && !farm.wish.done ? farm.wish.good : null))

function trayBox(type) {
  const { w, h } = sizeOf(type)
  const size = Math.max(w, h + 1) * 40
  return `${(w * 40 - size) / 2} ${-40 + ((h + 1) * 40 - size) / 2} ${size} ${size}`
}

// ---- little messages ----
const toasts = ref([])
let toastId = 0
function toast(text, icon = null) {
  const id = ++toastId
  toasts.value = [...toasts.value.slice(-2), { id, text, icon }]
  setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), 2400)
}

function afterGain(r) {
  if (r?.full) {
    toast('The barn is full. Sell or cook something first.')
    playSound('miss')
    return
  }
  if (!r?.good) return
  toast(`+${r.amount} ${GOODS[r.good].name}${r.xp ? ` · +${r.xp} XP` : ''}`, r.good)
  playSound('catch', true, { combo: 3 })
  haptic('light')
}

// ---- tapping things on the farm ----
function onTap(uid) {
  const o = farm.find(uid)
  if (!o) return
  if (mode.value === 'build') {
    selected.value = selected.value === uid ? null : uid
    playSound('select')
    return
  }
  const kind = kindOf(o.type)
  if (o.type === 'barn') return (sheet.value = 'barn')
  if (o.type === 'kitchen') {
    const ready = farm.state.kitchen.findIndex((k) => k && farm.now >= k.readyAt)
    if (ready >= 0) return afterGain(farm.collectDish(ready))
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
    if (farm.now >= o.crop.readyAt) return afterGain(farm.harvest(uid))
  }
  if ((kind === 'tree' || kind === 'producer') && o.readyAt && farm.now >= o.readyAt) return afterGain(farm.harvest(uid))
  if (kind === 'decor') {
    playSound('boop')
    return
  }
  itemUid.value = uid
  sheet.value = 'item'
}

function onTapTile({ x, y }) {
  if (mode.value !== 'build') return
  if (placing.value) {
    const placed = farm.place(placing.value, x, y)
    if (placed) {
      playSound('place')
      haptic('light')
      if (!farm.state.inventory[placing.value]) placing.value = null
    } else {
      playSound('miss')
    }
    return
  }
  selected.value = null
}

function onMove({ uid, x, y }) {
  if (farm.move(uid, x, y)) {
    playSound('place')
    haptic('light')
  }
}

// ---- planting ----
function plant(cropId) {
  const r = farm.plant(plantUid.value, cropId)
  if (r.ok) {
    playSound('place')
    haptic('light')
    sheet.value = null
  } else if (r.reason === 'petals') {
    toast('Not enough petals for those seeds.')
  }
}

function plantAll(cropId) {
  const n = farm.plantAll(cropId)
  if (n) {
    toast(`Planted ${n} ${cropById[cropId].name.toLowerCase()}`, cropId)
    playSound('place')
  }
  sheet.value = null
}

function harvestAll() {
  const { got, full } = farm.harvestAll()
  const kinds = Object.keys(got)
  if (kinds.length) {
    toast(kinds.map((id) => `+${got[id]} ${GOODS[id].name}`).join(', '), kinds[0])
    playSound('catch', true, { combo: 6 })
    haptic('success')
  }
  if (full) setTimeout(() => toast('The barn is full. Sell or cook to make room.'), 400)
}

// ---- item sheet actions ----
function water() {
  if (farm.waterCrop(itemUid.value)) {
    playSound('water')
    toast('Watered. Growing quicker!')
  }
}
function fertilise() {
  if (farm.fertilise(itemUid.value)) {
    playSound('grow')
    toast('Fertilised. Half the time left!')
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
function toggleBuild() {
  mode.value = mode.value === 'build' ? 'farm' : 'build'
  selected.value = null
  placing.value = null
  playSound(mode.value === 'build' ? 'toggleOn' : 'toggleOff')
}

function putAway() {
  const r = farm.store(selected.value)
  if (r.ok) {
    selected.value = null
    playSound('toggleOff')
  } else {
    toast(r.reason === 'growing' ? 'Harvest it first.' : r.reason === 'busy' ? 'Wait until it’s finished.' : 'That one stays on the farm.')
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
    toast('Farm tour finished! +10 petals')
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

// ---- treats ----
function onFed(r) {
  pip.queueCelebration?.(r)
  toast(`${pip.plantName} loved the ${GOODS[r.id].name.toLowerCase()}! +${r.points} growth`, r.id)
  playSound('boop')
}

function goShop(tab) {
  sheet.value = null
  router.push({ path: '/shop', query: { tab } })
}

onMounted(() => {
  farm.ensureWish()
  const q = route.query
  if (q.place && farm.state.inventory[q.place]) {
    mode.value = 'build'
    placing.value = q.place
  }
  if (['barn', 'kitchen', 'orders', 'friends'].includes(q.open)) sheet.value = q.open
  if (q.place || q.open) router.replace({ query: {} })
})
</script>

<template>
  <section class="page flex flex-col">
    <PageHeader :eyebrow="`Farm level ${farm.state.level}`" :title="farm.name">
      <button type="button" class="icon-btn" aria-label="Friends’ farms" @click="sheet = 'friends'">
        <Icon name="friends" :size="19" :stroke="2" />
      </button>
      <PetalBadge :count="pip.petals" size="sm" />
    </PageHeader>

    <!-- XP -->
    <div class="mt-3 flex items-center gap-2.5">
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-sand-100">
        <div class="h-full rounded-full bg-honey-400 transition-[width] duration-700" :style="{ width: `${xpFill * 100}%` }" />
      </div>
      <span class="text-xs font-extrabold tabular-nums text-bark-400">
        {{ farm.state.level >= farm.MAX_FARM_LEVEL ? 'Max level' : `${farm.state.xp} / ${farm.xpNeeded} XP` }}
      </span>
    </div>

    <!-- tools -->
    <div class="no-scrollbar -mx-5 mt-3 overflow-x-auto px-5">
      <div class="flex w-max gap-2 pb-1">
        <button type="button" class="tool" @click="sheet = 'barn'">
          <span class="text-base">🌾</span> Barn <span class="tabular-nums text-bark-400">{{ farm.barnUsed }}/{{ farm.barnCapacity }}</span>
        </button>
        <button type="button" class="tool" :class="{ 'is-hint': tour === 4 }" @click="sheet = 'kitchen'">
          <span class="text-base">🍳</span> Kitchen
        </button>
        <button type="button" class="tool relative" :class="{ 'is-hint': tour === 3 }" @click="sheet = 'orders'">
          <span class="text-base">📋</span> Orders
          <span v-if="farm.ordersReady" class="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-300 px-1 text-[0.6875rem] font-extrabold text-white">{{ farm.ordersReady }}</span>
        </button>
        <button type="button" class="tool" :class="{ 'is-on': mode === 'build', 'is-hint': tour === 5 }" @click="toggleBuild">
          <Icon name="move" :size="16" :stroke="2.2" /> {{ mode === 'build' ? 'Done' : 'Arrange' }}
        </button>
        <button type="button" class="tool" @click="goShop('farm')">
          <Icon name="shop" :size="16" :stroke="2.2" /> Shop
        </button>
      </div>
    </div>

    <!-- harvest everything -->
    <Transition name="drop">
      <button v-if="mode === 'farm' && farm.readyCount > 1" type="button" class="btn btn-primary mt-3 w-full gap-2!" data-sound="none" @click="harvestAll">
        <span class="text-lg">🧺</span> Harvest everything ({{ farm.readyCount }})
      </button>
    </Transition>

    <p v-if="mode === 'build'" class="mt-3 rounded-2xl bg-honey-100 px-4 py-2.5 text-center text-xs font-bold text-bark-500">
      {{ placing ? `Tap a spot to place the ${PLACEABLE[placing].name.toLowerCase()}.` : 'Drag things to move them. Tap one to select it.' }}
    </p>

    <!-- the farm (with room above for the first row's roofs and treetops) -->
    <div class="relative mt-4 pt-10">
      <FarmMap
        :objects="farm.objects"
        :rows="farm.rows"
        :cols="farm.cols"
        :now="farm.now"
        :mode="mode"
        :selected="selected"
        :placing="placing"
        :kitchen="farm.state.kitchen"
        :orders-ready="farm.ordersReady"
        :pip-look="pipLook"
        :pip-sleeping="pip.asleep"
        :wish-good="wishGood"
        :highlight="tourHighlight"
        @tap="onTap"
        @tap-tile="onTapTile"
        @move="onMove"
      />
      <Celebration :trigger="burst" :y="30" :count="30" :spread="180" />
    </div>

    <button v-if="nextLand" type="button" class="mt-3 w-full rounded-2xl border border-dashed border-sand-300 py-3 text-xs font-bold text-bark-400" @click="goShop('farm')">
      {{ nextLand.level > farm.state.level ? `More land opens at farm level ${nextLand.level}` : 'Buy more land in the shop' }}
    </button>

    <!-- room to scroll the bottom rows above the build tray -->
    <div v-if="mode === 'build'" class="h-36 shrink-0" aria-hidden="true" />

    <!-- build tray -->
    <Transition name="tray">
      <div v-if="mode === 'build'" class="tray fixed inset-x-0 z-30 mx-auto max-w-lg px-4">
        <div class="rounded-[1.5rem] border border-line bg-surface/95 p-3 shadow-float backdrop-blur-xl">
          <div v-if="selectedObj" class="flex items-center gap-3">
            <p class="min-w-0 flex-1 truncate font-display text-base font-semibold text-bark-600">{{ PLACEABLE[selectedObj.type]?.name }}</p>
            <button type="button" class="btn btn-secondary btn-sm" @click="putAway">Put away</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="selected = null">Done</button>
          </div>
          <template v-else>
            <p class="eyebrow mb-2">{{ inventory.length ? 'Ready to place' : 'Nothing waiting to be placed' }}</p>
            <div v-if="inventory.length" class="no-scrollbar flex gap-2 overflow-x-auto">
              <button
                v-for="it in inventory"
                :key="it.type"
                type="button"
                class="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-cream"
                :class="placing === it.type ? 'border-leaf-400 ring-2 ring-leaf-300/60' : 'border-line'"
                :aria-label="it.name"
                @click="placing = placing === it.type ? null : it.type"
              >
                <svg :viewBox="trayBox(it.type)" class="h-12 w-12 overflow-visible">
                  <FarmArt :type="it.type" />
                </svg>
                <span class="absolute bottom-0.5 right-1 text-[0.6875rem] font-extrabold text-bark-500">×{{ it.n }}</span>
              </button>
            </div>
            <button v-else type="button" class="btn btn-secondary btn-sm w-full" @click="goShop('decor')">Find decorations in the shop</button>
          </template>
        </div>
      </div>
    </Transition>

    <!-- messages -->
    <div class="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex flex-col items-center gap-1.5 px-4">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="flex items-center gap-2 rounded-full bg-bark-600 px-4 py-2 text-sm font-bold text-[#FFFAF2] shadow-float">
          <GoodIcon v-if="t.icon" :id="t.icon" :size="20" />
          {{ t.text }}
        </div>
      </TransitionGroup>
    </div>

    <FarmTour v-if="mode === 'farm'" @skip="farm.tourFinish(false)" />

    <PlantSheet :open="sheet === 'plant'" @close="sheet = null" @plant="plant" @plant-all="plantAll" />
    <ItemSheet :uid="sheet === 'item' ? itemUid : null" @close="sheet = null" @water="water" @fertilise="fertilise" @feed="feedProducer" />
    <BarnSheet
      :open="sheet === 'barn'"
      @close="sheet = null"
      @sold="(r) => toast(`Sold for ${r.petals} petals`, r.id)"
      @fed="onFed"
      @upgrade="goShop('farm')"
    />
    <KitchenSheet
      :open="sheet === 'kitchen'"
      @close="sheet = null"
      @cooked="(id) => (toast(`Cooking ${GOODS[id].name.toLowerCase()}…`, id), playSound('swap'))"
      @collected="afterGain"
      @upgrade="goShop('farm')"
    />
    <OrdersSheet
      :open="sheet === 'orders'"
      @close="sheet = null"
      @delivered="(r) => (toast(`Delivered! +${r.petals} petals · +${r.xp} XP`), playSound('win'), haptic('success'))"
      @community="(r) => (burst++, toast(r.can ? `+${r.petals} petals and a golden watering can!` : `+${r.petals} petals. Thank you, neighbour!`))"
    />
    <PipSheet :open="sheet === 'pip'" @close="sheet = null" @fed="onFed" @barn="sheet = 'barn'" />
    <FriendsSheet :open="sheet === 'friends'" @close="sheet = null" />

    <Modal :open="Boolean(farm.levelUp)" label="Farm level up" @close="farm.clearLevelUp()">
      <template v-if="farm.levelUp">
        <p class="eyebrow text-leaf-500!">Your farm grew</p>
        <h2 class="title-xl mt-1">Farm level {{ farm.levelUp.level }}!</h2>
        <ul v-if="farm.levelUp.unlocks.length" class="mt-4 space-y-1.5 text-left">
          <li v-for="u in farm.levelUp.unlocks" :key="u.kind + u.id" class="flex items-center gap-2.5 rounded-xl bg-cream px-3 py-2 text-sm font-semibold text-bark-600">
            <GoodIcon v-if="GOODS[u.id]" :id="u.id" :size="22" />
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
.tool {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.5rem;
  padding: 0 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-bark-600);
  box-shadow: var(--shadow-soft);
  white-space: nowrap;
  transition: transform 0.15s ease, background-color 0.2s ease;
}
.tool:active {
  transform: scale(0.96);
}
.tool.is-hint {
  border-color: var(--color-leaf-400);
  animation: hint-ring 1.4s ease-in-out infinite;
}
@keyframes hint-ring {
  0%, 100% { box-shadow: var(--shadow-soft), 0 0 0 0 rgb(134 173 114 / 0.55); }
  50% { box-shadow: var(--shadow-soft), 0 0 0 6px rgb(134 173 114 / 0); }
}
.tool.is-on {
  background: var(--color-honey-100);
  border-color: var(--color-honey-400);
}
.tray {
  bottom: calc(5.75rem + env(safe-area-inset-bottom));
}
.tray-enter-active,
.tray-leave-active {
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.tray-enter-from,
.tray-leave-to {
  opacity: 0;
  transform: translateY(20px);
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
.drop-enter-active {
  transition: opacity 0.25s ease, transform 0.35s ease;
}
.drop-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
