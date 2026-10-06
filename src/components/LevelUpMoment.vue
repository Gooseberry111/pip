<script setup>
// The moment Pip reaches a new level: a burst, a fanfare, everything that just unlocked
// (ready to try on), and a peek at what the next level brings.
import { computed, ref, watch } from 'vue'
import { usePipStore } from '@/stores/pip'
import { itemsUnlockedAtLevel, CATEGORIES } from '@/data/items'
import { MAX_LEVEL } from '@/data/growthStages'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Modal from './Modal.vue'
import Pip from './Pip.vue'
import Rays from './Rays.vue'
import ItemPreview from './ItemPreview.vue'
import Celebration from './Celebration.vue'
import Icon from './Icon.vue'

const props = defineProps({
  moment: { type: Object, default: null }, // { level, newStage, unlocks }
})

const emit = defineEmits(['close'])
const pip = usePipStore()

const burst = ref(0)
const shown = ref(0) // unlocked tiles revealed so far
const worn = ref([])
let timers = []

const title = computed(() => {
  if (!props.moment) return ''
  const stage = props.moment.newStage
  const name = pip.plantName
  if (stage) {
    return {
      sprout: `${name} sprouted!`,
      small: `${name} is getting bigger`,
      growing: `${name} is growing up`,
      mature: `${name} is all grown up`,
      flowering: `${name} is in bloom!`,
    }[stage.id] ?? `${name} reached level ${props.moment.level}`
  }
  return `${name} reached level ${props.moment.level}`
})

const subtitle = computed(() => {
  if (!props.moment) return ''
  if (props.moment.newStage) return props.moment.newStage.line
  return props.moment.unlocks?.length ? 'Growth takes time, and look what it brought.' : 'A little taller, a little stronger.'
})

const next = computed(() => {
  if (!props.moment) return null
  for (let l = props.moment.level + 1; l <= MAX_LEVEL; l++) {
    const items = itemsUnlockedAtLevel(l)
    if (items.length) return { level: l, items }
  }
  return null
})

const kindOf = (category) => CATEGORIES.find((c) => c.id === category)?.single ?? ''

watch(
  () => props.moment,
  (m) => {
    timers.forEach(clearTimeout)
    timers = []
    shown.value = 0
    worn.value = []
    if (!m) return
    timers.push(
      setTimeout(() => {
        burst.value += 1
        playSound('levelUp')
        haptic('success')
      }, 350),
    )
    ;(m.unlocks ?? []).forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          shown.value = i + 1
          playSound('unlockPop')
        }, 1100 + i * 380),
      )
    })
  },
)

function tryOn(item) {
  pip.wear(item.category, item.id)
  worn.value = [...worn.value, `${item.category}:${item.id}`]
  playSound('select')
  haptic('light')
}

function close() {
  timers.forEach(clearTimeout)
  emit('close')
}
</script>

<template>
  <Modal :open="!!moment" label="Level up" @close="close">
    <template v-if="moment">
      <Celebration :trigger="burst" :y="28" :count="30" :spread="190" />

      <p class="eyebrow text-leaf-500!">{{ moment.newStage ? `New stage · ${moment.newStage.name}` : 'Level up' }}</p>

      <div class="relative mx-auto my-1 aspect-square w-48">
        <Rays color="#EAF0DC" />
        <div class="absolute inset-x-7 bottom-3 top-3">
          <Pip
            :growth="pip.growthValue"
            :droop="0"
            health="healthy"
            :pot="pip.currentPot"
            :leaf="pip.currentLeaf"
            :flower="pip.currentFlower"
            :interactive="false"
            :idle="false"
            class="pip-pop h-full w-full"
          />
        </div>
        <span class="level-badge absolute bottom-2 right-3 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-bark-600 text-[#FFFAF2] shadow-float ring-4 ring-surface">
          <span class="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] opacity-70">Level</span>
          <span class="-mt-0.5 font-display text-2xl font-semibold leading-none">{{ moment.level }}</span>
        </span>
      </div>

      <h2 class="font-display text-[1.6rem] font-semibold leading-tight text-bark-600">{{ title }}</h2>
      <p class="mx-auto mt-1 max-w-[17rem] text-sm font-medium text-bark-400">{{ subtitle }}</p>

      <!-- what just unlocked -->
      <div v-if="moment.unlocks?.length" class="mt-5 text-left">
        <p class="eyebrow">Unlocked</p>
        <div class="mt-2 space-y-2">
          <div
            v-for="(item, i) in moment.unlocks"
            v-show="i < shown"
            :key="`${item.category}:${item.id}`"
            class="unlock-row flex items-center gap-3 rounded-2xl border border-line bg-cream p-2 pr-2.5"
          >
            <span class="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface" :class="item.category === 'backgrounds' ? '' : 'p-1.5'">
              <ItemPreview :category="item.category" :id="item.id" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-[0.6875rem] font-bold capitalize text-bark-400">New {{ kindOf(item.category) }}</span>
              <span class="block truncate text-[0.9375rem] font-bold text-bark-600">{{ item.name }}</span>
            </span>
            <button
              v-if="!worn.includes(`${item.category}:${item.id}`) && !pip.isEquipped(item.category, item.id)"
              type="button"
              class="btn btn-secondary btn-sm h-9! px-3.5! text-sm!"
              data-sound="none"
              @click="tryOn(item)"
            >
              {{ ['decorations', 'backgrounds'].includes(item.category) ? 'Use' : 'Try on' }}
            </button>
            <span v-else class="inline-flex h-9 items-center gap-1 px-2 text-sm font-bold text-leaf-500">
              <Icon name="check" :size="15" :stroke="2.4" /> On
            </span>
          </div>
        </div>
      </div>

      <!-- a peek at what's next -->
      <div v-if="next" class="mt-4 flex items-center gap-3 rounded-2xl bg-sand-100/70 px-3 py-2.5 text-left">
        <div class="flex -space-x-2">
          <span v-for="item in next.items.filter((i) => i.category !== 'backgrounds').slice(0, 3)" :key="item.id" class="silhouette h-9 w-9 overflow-hidden rounded-full border-2 border-sand-100 bg-surface p-1">
            <ItemPreview :category="item.category" :id="item.id" />
          </span>
        </div>
        <p class="text-xs font-semibold leading-snug text-bark-500">
          <span class="font-extrabold text-bark-600">Level {{ next.level }}</span> brings
          {{ next.items.length === 1 ? 'a new surprise' : `${next.items.length} new surprises` }}
        </p>
      </div>
      <p v-else-if="moment.level >= MAX_LEVEL" class="mt-4 text-xs font-bold text-clay-400">The highest level. {{ pip.plantName }} is fully grown!</p>

      <button type="button" class="btn btn-primary mt-6 w-full" @click="close">Lovely!</button>
    </template>
  </Modal>
</template>

<style scoped>
.pip-pop {
  animation: pop-in 1s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
  transform-origin: 50% 90%;
}
.level-badge {
  animation: badge-in 0.8s cubic-bezier(0.3, 1.7, 0.5, 1) 0.35s both;
}
.unlock-row {
  animation: row-in 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
}
.silhouette :deep(svg) {
  filter: brightness(0) opacity(0.25);
}
@keyframes pop-in {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes badge-in {
  0% { transform: scale(0) rotate(-30deg); }
  100% { transform: scale(1) rotate(0); }
}
@keyframes row-in {
  0% { opacity: 0; transform: translateY(8px) scale(0.95); }
  100% { opacity: 1; transform: none; }
}
</style>
