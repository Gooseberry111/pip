<script setup>
// The shop: spend petals on the farm (land, plots, a bigger barn, trees, animals, decorations)
// and on new looks for Pip. A different deal every day.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { LAND, BARN_LEVELS, KITCHEN_SLOTS, FERTILISER, TREES, PRODUCERS, DECOR, CROPS, PLACEABLE } from '@/data/farm'
import { shopItems, CATEGORIES } from '@/data/items'
import { sizeOf, formatMinutes } from '@/utils/farmLogic'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import PageHeader from '@/components/PageHeader.vue'
import PetalBadge from '@/components/PetalBadge.vue'
import PetalIcon from '@/components/PetalIcon.vue'
import Icon from '@/components/Icon.vue'
import ItemPreview from '@/components/ItemPreview.vue'
import FarmArt from '@/components/farm/FarmArt.vue'
import GoodIcon from '@/components/farm/GoodIcon.vue'

const farm = useFarmStore()
const pip = usePipStore()
const route = useRoute()
const router = useRouter()

const TABS = [
  { id: 'farm', label: 'Farm' },
  { id: 'nature', label: 'Trees & animals' },
  { id: 'decor', label: 'Decorations' },
  { id: 'pip', label: `For Pip` },
  { id: 'seeds', label: 'Seeds' },
]
const tab = ref(TABS.some((t) => t.id === route.query.tab) ? route.query.tab : 'farm')
const bought = ref(null) // { type, name } just bought, offering to place it
const toast = ref('')

const level = computed(() => farm.state.level)
const nextLand = computed(() => LAND[farm.state.land + 1] ?? null)
const nextBarn = computed(() => BARN_LEVELS[farm.state.barnLevel + 1] ?? null)
const nextStove = computed(() => KITCHEN_SLOTS[farm.state.kitchenLevel + 1] ?? null)
const plotPrice = computed(() => farm.priceOf('plot'))
const deal = computed(() => farm.deal)

const pipGoods = computed(() =>
  shopItems().map((i) => ({ ...i, owned: pip.isUnlocked(i.category, i.id), label: CATEGORIES.find((c) => c.id === i.category)?.single ?? '' })),
)

function say(text) {
  toast.value = text
  clearTimeout(say.t)
  say.t = setTimeout(() => (toast.value = ''), 2600)
}

function celebrate() {
  playSound('petals')
  haptic('success')
}

function buyFarm(type) {
  if (!farm.buy(type)) return say('Not enough petals yet. Play games and fill orders to earn more.')
  celebrate()
  bought.value = { type, name: PLACEABLE[type]?.name ?? type }
}

function buyUpgrade(fn, text) {
  if (!fn()) return say('Not enough petals yet.')
  celebrate()
  say(text)
}

function buyPip(item) {
  if (!pip.buyItem(item.category, item.id)) return say('Not enough petals yet.')
  celebrate()
  pip.wear(item.category, item.id)
  say(`${item.name} is ${pip.plantName}’s now. Wearing it!`)
}

function placeNow() {
  const type = bought.value.type
  bought.value = null
  router.push({ path: '/farm', query: { place: type } })
}

const viewBox = (type) => {
  const { w, h } = sizeOf(type)
  return `-4 -44 ${w * 40 + 8} ${(h + 1) * 40 + 8}`
}
</script>

<template>
  <section class="page flex flex-col">
    <PageHeader eyebrow="Spend your petals" title="Shop">
      <PetalBadge :count="pip.petals" size="sm" />
    </PageHeader>

    <!-- today's deal -->
    <div v-if="deal" class="deal mt-4 flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] p-4">
      <span class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/70">
        <svg :viewBox="viewBox(deal.type)" class="h-16 w-16 overflow-visible"><FarmArt :type="deal.type" /></svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="eyebrow text-clay-400!">Deal of the day</p>
        <p class="title-md mt-0.5 truncate">{{ PLACEABLE[deal.type].name }}</p>
        <p class="mt-0.5 text-xs font-semibold text-bark-400">
          <s class="mr-1">{{ deal.was }}</s> 30% off today only
        </p>
      </div>
      <button type="button" class="btn btn-primary btn-sm shrink-0 gap-1!" :disabled="deal.bought || pip.petals < deal.price" data-sound="none" @click="buyFarm(deal.type)">
        <template v-if="deal.bought">Bought</template>
        <template v-else><PetalIcon :size="15" />{{ deal.price }}</template>
      </button>
    </div>

    <div class="no-scrollbar -mx-5 mt-5 overflow-x-auto px-5">
      <div class="segmented w-max" role="tablist">
        <button v-for="t in TABS" :key="t.id" type="button" role="tab" :aria-selected="tab === t.id" @click="tab = t.id">
          {{ t.id === 'pip' ? `For ${pip.plantName}` : t.label }}
        </button>
      </div>
    </div>

    <!-- farm upgrades -->
    <div v-if="tab === 'farm'" class="mt-4 grid gap-3">
      <div class="row card">
        <span class="thumb"><svg viewBox="-4 -44 48 88" class="h-12 w-12 overflow-visible"><FarmArt type="plot" /></svg></span>
        <div class="info">
          <p class="name">Soil plot</p>
          <p class="sub">{{ farm.plotCount }} plots so far. More plots, more harvest.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm price" :disabled="plotPrice === null || pip.petals < plotPrice" data-sound="none" @click="buyFarm('plot')">
          <template v-if="plotPrice === null">Max</template>
          <template v-else><PetalIcon :size="15" />{{ plotPrice }}</template>
        </button>
      </div>

      <div class="row card">
        <span class="thumb text-3xl">🗺️</span>
        <div class="info">
          <p class="name">More land</p>
          <p class="sub">
            <template v-if="!nextLand">Your farm is as big as it gets.</template>
            <template v-else-if="nextLand.level > level">Opens at farm level {{ nextLand.level }}.</template>
            <template v-else>Two more rows of space ({{ LAND[farm.state.land].rows }} to {{ nextLand.rows }}).</template>
          </p>
        </div>
        <button
          v-if="nextLand"
          type="button"
          class="btn btn-primary btn-sm price"
          :disabled="nextLand.level > level || pip.petals < nextLand.price"
          data-sound="none"
          @click="buyUpgrade(farm.buyLand, 'More land! Your farm just got bigger.')"
        >
          <Icon v-if="nextLand.level > level" name="lock" :size="14" />
          <template v-else><PetalIcon :size="15" />{{ nextLand.price }}</template>
        </button>
      </div>

      <div class="row card">
        <span class="thumb"><svg viewBox="-4 -44 88 128" class="h-14 w-14 overflow-visible"><FarmArt type="barn" /></svg></span>
        <div class="info">
          <p class="name">Bigger barn</p>
          <p class="sub">
            Holds {{ farm.barnCapacity }} now.<template v-if="nextBarn"> Upgrade to {{ nextBarn.capacity }}.</template><template v-else> The biggest barn around.</template>
          </p>
        </div>
        <button v-if="nextBarn" type="button" class="btn btn-primary btn-sm price" :disabled="pip.petals < nextBarn.price" data-sound="none" @click="buyUpgrade(farm.upgradeBarn, 'The barn is bigger now.')">
          <PetalIcon :size="15" />{{ nextBarn.price }}
        </button>
      </div>

      <div class="row card">
        <span class="thumb"><svg viewBox="-4 -44 88 128" class="h-14 w-14 overflow-visible"><FarmArt type="kitchen" /></svg></span>
        <div class="info">
          <p class="name">Another stove</p>
          <p class="sub">
            {{ farm.state.kitchen.length }} {{ farm.state.kitchen.length === 1 ? 'stove' : 'stoves' }} now.<template v-if="nextStove"> Cook {{ nextStove.slots }} dishes at once.</template>
          </p>
        </div>
        <button v-if="nextStove" type="button" class="btn btn-primary btn-sm price" :disabled="pip.petals < nextStove.price" data-sound="none" @click="buyUpgrade(farm.upgradeKitchen, 'A new stove for the kitchen!')">
          <PetalIcon :size="15" />{{ nextStove.price }}
        </button>
      </div>

      <div class="row card">
        <span class="thumb text-3xl">🧪</span>
        <div class="info">
          <p class="name">Fertiliser</p>
          <p class="sub">Halves the time left on a crop, tree or building. You have {{ farm.state.fertiliser }}.</p>
        </div>
        <div class="flex shrink-0 flex-col gap-1">
          <button type="button" class="btn btn-primary btn-sm price" :disabled="pip.petals < FERTILISER.price" data-sound="none" @click="buyUpgrade(() => farm.buyFertiliser(false), '+1 fertiliser')">
            ×1 <PetalIcon :size="14" />{{ FERTILISER.price }}
          </button>
          <button type="button" class="btn btn-secondary btn-sm price" :disabled="pip.petals < FERTILISER.bundlePrice" data-sound="none" @click="buyUpgrade(() => farm.buyFertiliser(true), `+${FERTILISER.bundle} fertiliser`)">
            ×{{ FERTILISER.bundle }} <PetalIcon :size="14" />{{ FERTILISER.bundlePrice }}
          </button>
        </div>
      </div>
    </div>

    <!-- trees and animals -->
    <div v-else-if="tab === 'nature'" class="mt-4 grid grid-cols-2 gap-3">
      <div v-for="t in [...TREES, ...PRODUCERS]" :key="t.id" class="tile card" :class="{ 'is-locked': t.level > level }">
        <div class="art">
          <svg :viewBox="viewBox(t.id)" class="h-full w-full overflow-visible"><FarmArt :type="t.id" :obj="t.fruit ? { readyAt: 1 } : {}" :now="2" /></svg>
        </div>
        <p class="name mt-2">{{ t.name }}</p>
        <p class="sub min-h-[2.4em]">
          <template v-if="t.fruit">Fruit every {{ formatMinutes(t.every) }}</template>
          <template v-else>{{ t.blurb }}</template>
        </p>
        <button type="button" class="btn btn-primary btn-sm mt-2 w-full gap-1!" :disabled="t.level > level || pip.petals < t.price" data-sound="none" @click="buyFarm(t.id)">
          <template v-if="t.level > level"><Icon name="lock" :size="13" /> Level {{ t.level }}</template>
          <template v-else><PetalIcon :size="15" />{{ t.price }}</template>
        </button>
      </div>
    </div>

    <!-- decorations -->
    <div v-else-if="tab === 'decor'" class="mt-4 grid grid-cols-3 gap-2.5">
      <div v-for="d in DECOR" :key="d.id" class="tile card p-2.5!" :class="{ 'is-locked': d.level > level }">
        <div class="art aspect-square!">
          <svg :viewBox="viewBox(d.id)" class="h-full w-full overflow-visible"><FarmArt :type="d.id" /></svg>
        </div>
        <p class="name mt-1.5 text-sm!">{{ d.name }}</p>
        <button type="button" class="btn btn-primary btn-sm mt-1.5 h-8! w-full gap-1! px-2!" :disabled="d.level > level || pip.petals < d.price" data-sound="none" @click="buyFarm(d.id)">
          <template v-if="d.level > level"><Icon name="lock" :size="12" /> Lv {{ d.level }}</template>
          <template v-else><PetalIcon :size="14" />{{ d.price }}</template>
        </button>
      </div>
    </div>

    <!-- for Pip -->
    <div v-else-if="tab === 'pip'" class="mt-4 grid grid-cols-3 gap-2.5">
      <div v-for="item in pipGoods" :key="item.category + item.id" class="tile card p-2.5!">
        <div class="art aspect-square! bg-cream p-2">
          <ItemPreview :category="item.category" :id="item.id" />
        </div>
        <p class="name mt-1.5 text-sm!">{{ item.name }}</p>
        <p class="text-[0.625rem] font-extrabold uppercase tracking-wider text-bark-300">{{ item.label }}</p>
        <button type="button" class="btn btn-sm mt-1.5 h-8! w-full gap-1! px-2!" :class="item.owned ? 'btn-secondary' : 'btn-primary'" :disabled="item.owned || pip.petals < item.shop" data-sound="none" @click="buyPip(item)">
          <template v-if="item.owned">Owned</template>
          <template v-else><PetalIcon :size="14" />{{ item.shop }}</template>
        </button>
      </div>
    </div>

    <!-- seeds -->
    <div v-else class="mt-4">
      <p class="rounded-2xl bg-cream px-4 py-3 text-xs font-semibold text-bark-400">Seeds are planted straight from an empty plot on your farm. New ones unlock as the farm levels up.</p>
      <ul class="mt-3 space-y-2">
        <li v-for="c in CROPS" :key="c.id" class="row card" :class="{ 'opacity-60': c.level > level }">
          <span class="thumb"><GoodIcon :id="c.id" :size="32" /></span>
          <div class="info">
            <p class="name">{{ c.name }}</p>
            <p class="sub">{{ formatMinutes(c.minutes) }} to grow · picks {{ c.yield }} · sells {{ c.sell }} each</p>
          </div>
          <span class="shrink-0 text-xs font-extrabold" :class="c.level > level ? 'text-bark-300' : 'text-leaf-500'">
            <template v-if="c.level > level"><Icon name="lock" :size="12" class="-mt-0.5 inline" /> Lv {{ c.level }}</template>
            <template v-else>{{ c.seed ? `${c.seed} petal${c.seed > 1 ? 's' : ''}` : 'Free' }}</template>
          </span>
        </li>
      </ul>
    </div>

    <!-- just bought something for the farm -->
    <Transition name="pop">
      <div v-if="bought" class="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg px-4">
        <div class="flex items-center gap-3 rounded-[1.5rem] border border-line bg-surface p-3 shadow-float">
          <span class="text-2xl">🎉</span>
          <p class="min-w-0 flex-1 text-sm font-bold text-bark-600">{{ bought.name }} is yours!</p>
          <button type="button" class="btn btn-primary btn-sm" @click="placeNow">Place it</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="bought = null">Later</button>
        </div>
      </div>
    </Transition>

    <Transition name="pop">
      <div v-if="toast" class="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex justify-center px-4">
        <p class="rounded-full bg-bark-600 px-4 py-2 text-sm font-bold text-[#FFFAF2] shadow-float">{{ toast }}</p>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.deal {
  background: linear-gradient(135deg, #FBE6D8 0%, #F9EFD9 100%);
  box-shadow: inset 0 0 0 1px rgb(201 120 88 / 0.15);
}
.row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
}
.thumb {
  display: flex;
  height: 3.5rem;
  width: 3.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: var(--color-cream);
}
.info {
  min-width: 0;
  flex: 1;
}
.name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-bark-600);
}
.sub {
  margin-top: 0.15rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-bark-400);
}
.price {
  flex-shrink: 0;
  gap: 0.25rem !important;
}
.tile {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
}
.tile .art {
  display: flex;
  aspect-ratio: 4 / 3;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1rem;
  background: #DCE8C8;
  padding: 0.35rem;
}
.tile.is-locked .art {
  filter: grayscale(0.7);
  opacity: 0.6;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
