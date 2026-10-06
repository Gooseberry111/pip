<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePipStore } from '@/stores/pip'
import { CATEGORIES, ITEMS, MAX_DECORATIONS } from '@/data/items'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import Pip from '@/components/Pip.vue'
import CollectionItem from '@/components/CollectionItem.vue'
import PetalBadge from '@/components/PetalBadge.vue'
import PageHeader from '@/components/PageHeader.vue'

const pip = usePipStore()
const route = useRoute()
const router = useRouter()

const validTab = (tab) => CATEGORIES.some((c) => c.id === tab)
const tab = ref(validTab(route.query.tab) ? route.query.tab : 'pots')
const pipRef = ref(null)
const toast = ref('')
let toastTimer = null

const total = computed(() => Object.values(ITEMS).reduce((sum, list) => sum + list.length, 0))
const collected = computed(() =>
  Object.keys(ITEMS).reduce((sum, category) => sum + ITEMS[category].filter((i) => pip.isUnlocked(category, i.id)).length, 0),
)
const ringOffset = computed(() => 2 * Math.PI * 22 * (1 - collected.value / total.value))
const tabIndex = computed(() => CATEGORIES.findIndex((c) => c.id === tab.value))

// Grown items first (by level), then the rare ones from seed packets.
const items = computed(() => [...ITEMS[tab.value]].sort((a, b) => (a.packet ? 99 : a.level) - (b.packet ? 99 : b.level)))
const hasUnseen = (category) => pip.unseenItems.some((key) => key.startsWith(`${category}:`))
const isNew = (category, id) => pip.unseenItems.includes(`${category}:${id}`)

// Some looks can be chosen before Pip is big enough to show them.
const notYetVisible = computed(() => {
  if (tab.value === 'leaves' && pip.stageIndex < 1)
    return `${pip.plantName} is still a seed. Your leaves will appear when it sprouts at level 2.`
  if (tab.value === 'flowers' && pip.growthLevel < 5) return `Flowers bloom once ${pip.plantName} reaches level 5.`
  return ''
})
const showsAt = computed(() => (tab.value === 'leaves' && pip.stageIndex < 1 ? 'Shows at level 2' : ''))

const hint = computed(
  () =>
    ({
      flowers: 'Flowers bloom once Pip is growing. Tap again to take one off.',
      decorations: `Decorations live on the shelf and in the garden. Up to ${MAX_DECORATIONS} at a time.`,
      backgrounds: 'Scenes are Pip’s little home in the garden.',
    })[tab.value] ?? 'Tap something to try it on.',
)

function selectTab(next) {
  if (next === tab.value) return
  pip.markCategorySeen(tab.value)
  tab.value = next
  router.replace({ query: { tab: next } })
}

function select(item) {
  pip.equip(tab.value, item.id)
  playSound('select')
  haptic('light')
  pipRef.value?.react('happy')
}

function showLocked(item) {
  haptic('light')
  toast.value = item.packet
    ? 'This one hides in mystery seed packets. Earn petals in Play.'
    : `Keep caring for ${pip.plantName}. This grows at level ${item.level}.`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 3200)
}

watch(
  () => route.query.tab,
  (next) => {
    if (validTab(next)) tab.value = next
  },
)

onBeforeUnmount(() => {
  pip.markCategorySeen(tab.value)
  clearTimeout(toastTimer)
})
</script>

<template>
  <section class="page flex flex-col">
    <PageHeader eyebrow="Little treasures" title="Collection">
      <PetalBadge :count="pip.petals" />
    </PageHeader>

    <!-- fitting room -->
    <div class="fitting relative mt-5 flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] border border-line p-4">
      <div class="relative aspect-[200/250] h-32 shrink-0">
        <span class="absolute inset-x-0 bottom-1 mx-auto h-4 w-3/4 rounded-full bg-[#E6D3BC]" />
        <Pip
          ref="pipRef"
          :growth="pip.growthValue"
          :droop="pip.droop"
          :health="pip.health"
          :pot="pip.currentPot"
          :leaf="pip.currentLeaf"
          :flower="pip.currentFlower"
          :idle="false"
          class="relative h-full w-full"
        />
      </div>
      <div class="min-w-0 flex-1">
        <p class="eyebrow text-leaf-500!">Level {{ pip.growthLevel }} · {{ pip.stage.name }}</p>
        <p class="title-md mt-0.5">{{ pip.plantName }}’s wardrobe</p>
        <p class="mt-0.5 text-sm font-medium text-bark-500">Tap anything you’ve found to try it on.</p>
        <div class="mt-3 flex items-center gap-2.5">
          <svg width="52" height="52" viewBox="0 0 52 52" class="-rotate-90" aria-hidden="true">
            <circle cx="26" cy="26" r="22" fill="none" stroke="#fff" stroke-width="5" opacity="0.8" />
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="#A9C79A"
              stroke-width="5"
              stroke-linecap="round"
              :stroke-dasharray="2 * Math.PI * 22"
              :stroke-dashoffset="ringOffset"
              class="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div>
            <p class="font-display text-xl font-semibold leading-none text-bark-600">{{ collected }}<span class="text-sm text-bark-400"> / {{ total }}</span></p>
            <p class="text-xs font-bold text-bark-400">collected</p>
          </div>
        </div>
      </div>
    </div>

    <!-- category tabs -->
    <div class="no-scrollbar -mx-5 mt-5 overflow-x-auto px-5" role="tablist" aria-label="Collection sections">
      <div class="segmented w-max">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.id"
          type="button"
          role="tab"
          :aria-selected="tab === cat.id"
          @click="selectTab(cat.id)"
        >
          {{ cat.label }}
          <span v-if="hasUnseen(cat.id)" class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-clay-300" aria-label="new" />
        </button>
      </div>
    </div>

    <Transition name="fade" mode="out-in">
      <div
        v-if="notYetVisible"
        :key="notYetVisible"
        class="mt-4 flex items-start gap-3 rounded-2xl border border-honey-400/30 bg-honey-100 px-4 py-3"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" class="mt-0.5 shrink-0 text-clay-400" aria-hidden="true">
          <ellipse cx="10" cy="13" rx="5.5" ry="4" fill="currentColor" opacity="0.8" transform="rotate(-18 10 13)" />
          <path d="M10 9 Q10 5 12 3" stroke="#86AD72" stroke-width="2" fill="none" stroke-linecap="round" />
        </svg>
        <p class="text-[0.8125rem] font-semibold leading-snug text-bark-500">{{ notYetVisible }}</p>
      </div>
      <p v-else :key="hint" class="mt-4 text-[0.8125rem] font-medium text-bark-400">{{ hint }}</p>
    </Transition>

    <Transition name="grid" mode="out-in">
      <div :key="tab" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" :data-index="tabIndex">
        <CollectionItem
          v-for="(item, i) in items"
          :key="item.id"
          :category="tab"
          :item="item"
          :unlocked="pip.isUnlocked(tab, item.id)"
          :equipped="pip.isEquipped(tab, item.id)"
          :is-new="isNew(tab, item.id)"
          :current-level="pip.growthLevel"
          :level-percent="pip.levelPercent"
          :shows-at="showsAt"
          class="stagger"
          :style="{ animationDelay: `${i * 35}ms` }"
          @select="select"
          @locked="showLocked"
        />
      </div>
    </Transition>

    <Transition name="toast">
      <p
        v-if="toast"
        class="fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-fit max-w-[90%] rounded-2xl bg-bark-600 px-4 py-2.5 text-center text-sm font-bold text-cream shadow-float"
        role="status"
      >
        {{ toast }}
      </p>
    </Transition>
  </section>
</template>

<style scoped>
.fitting {
  background: linear-gradient(135deg, #f4ece0 0%, #eef2e6 100%);
}
.stagger {
  animation: rise 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.grid-enter-active,
.grid-leave-active {
  transition: opacity 0.2s ease;
}
.grid-enter-from,
.grid-leave-to {
  opacity: 0;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
