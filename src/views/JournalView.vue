<script setup>
// Pip's journal: a little scrapbook of moments, saved automatically as you go.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePipStore } from '@/stores/pip'
import { ITEMS } from '@/data/items'
import { findMood } from '@/data/moods'
import { FACTS, findFact } from '@/data/facts'
import { daysTogether } from '@/utils/timeOfDay'
import Pip from '@/components/Pip.vue'
import MoodFace from '@/components/MoodFace.vue'
import ItemPreview from '@/components/ItemPreview.vue'
import Icon from '@/components/Icon.vue'

const router = useRouter()
const pip = usePipStore()

const days = computed(() => daysTogether(pip.startedAt))
const collected = computed(() =>
  Object.keys(ITEMS).reduce((n, c) => n + ITEMS[c].filter((i) => pip.isUnlocked(c, i.id)).length, 0),
)
const stars = computed(() => ['rain', 'memory', 'firefly', 'glide', 'puzzle', 'burst', 'race', 'rhythm', 'hotel', 'pop', 'words', 'search'].reduce((n, g) => n + pip.totalStars(g), 0))
const factBook = computed(() => [...pip.factsSeen].reverse().map(findFact).filter(Boolean))
const showAllFacts = ref(false)

const moods = computed(() => pip.journal.filter((e) => e.type === 'mood').slice(0, 14).reverse())

const groups = computed(() => {
  const out = []
  for (const entry of pip.journal) {
    const d = new Date(entry.at)
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    if (!out.length || out[out.length - 1].label !== label) out.push({ label, entries: [] })
    out[out.length - 1].entries.push(entry)
  }
  return out
})

const TINTS = {
  planted: '#EEF3E6', level: '#F4EEE3', stage: '#E6EFDD', treasure: '#F9E8EA', week: '#FBEFD2',
  days: '#F8E3D8', game: '#E3EEF2', mood: '#F4F0EA',
}

function when(at) {
  const d = new Date(at)
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <section class="page flex flex-col">
    <header class="flex items-center gap-3 pt-3">
      <button type="button" class="icon-btn" aria-label="Back" @click="back"><Icon name="back" :size="19" :stroke="2.2" /></button>
      <div>
        <p class="eyebrow">Little moments</p>
        <h1 class="title-xl">{{ pip.plantName }}’s journal</h1>
      </div>
    </header>

    <!-- together so far -->
    <div class="card mt-5 grid grid-cols-4 divide-x divide-line py-4 text-center">
      <div><p class="font-display text-2xl font-semibold text-bark-600">{{ days }}</p><p class="eyebrow mt-0.5 text-[0.625rem]!">Days</p></div>
      <div><p class="font-display text-2xl font-semibold text-bark-600">{{ pip.growthLevel }}</p><p class="eyebrow mt-0.5 text-[0.625rem]!">Level</p></div>
      <div><p class="font-display text-2xl font-semibold text-bark-600">{{ collected }}</p><p class="eyebrow mt-0.5 text-[0.625rem]!">Treasures</p></div>
      <div><p class="font-display text-2xl font-semibold text-bark-600">{{ stars }}</p><p class="eyebrow mt-0.5 text-[0.625rem]!">Stars</p></div>
    </div>

    <!-- recent moods -->
    <div v-if="moods.length" class="card mt-3 px-4 py-3.5">
      <p class="eyebrow">Recent check-ins</p>
      <div class="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        <div v-for="m in moods" :key="m.id" class="flex shrink-0 flex-col items-center gap-1">
          <MoodFace :mood="m.mood" :size="32" />
          <span class="text-[0.625rem] font-bold text-bark-400">{{ new Date(m.at).toLocaleDateString(undefined, { weekday: 'short' }) }}</span>
        </div>
      </div>
    </div>

    <!-- fact book -->
    <div v-if="factBook.length" class="card mt-3 px-4 py-3.5">
      <div class="flex items-baseline justify-between">
        <p class="eyebrow">Fact book</p>
        <span class="text-xs font-bold text-bark-400">{{ factBook.length }} of {{ FACTS.length }}</span>
      </div>
      <ul class="mt-2 divide-y divide-line">
        <li v-for="f in showAllFacts ? factBook : factBook.slice(0, 3)" :key="f.id" class="py-2.5">
          <p class="text-[0.6875rem] font-bold uppercase tracking-wider text-clay-400">{{ f.topic }}</p>
          <p class="mt-0.5 text-sm font-medium text-bark-600">{{ f.text }}</p>
        </li>
      </ul>
      <button v-if="factBook.length > 3" type="button" class="btn btn-ghost btn-sm mt-1 w-full" @click="showAllFacts = !showAllFacts">
        {{ showAllFacts ? 'Show fewer' : `Show all ${factBook.length}` }}
      </button>
    </div>

    <!-- the scrapbook -->
    <div v-if="groups.length" class="mt-6 space-y-7">
      <div v-for="group in groups" :key="group.label">
        <p class="eyebrow px-1">{{ group.label }}</p>
        <ol class="relative mt-3 space-y-3 before:absolute before:bottom-4 before:left-[1.85rem] before:top-4 before:w-px before:bg-sand-300">
          <li v-for="(entry, i) in group.entries" :key="entry.id" class="entry relative flex gap-3" :style="{ animationDelay: `${Math.min(i, 8) * 40}ms` }">
            <div
              class="relative z-10 flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line shadow-soft"
              :style="{ background: TINTS[entry.type] ?? '#F4EEE3', transform: `rotate(${i % 2 ? 2 : -2}deg)` }"
            >
              <MoodFace v-if="entry.type === 'mood'" :mood="entry.mood" :size="40" />
              <span v-else-if="entry.itemId" class="h-full w-full" :class="entry.category === 'backgrounds' ? '' : 'p-2'">
                <ItemPreview :category="entry.category" :id="entry.itemId" />
              </span>
              <Pip
                v-else
                :growth="entry.snapshot?.growth ?? 0"
                :droop="0"
                health="healthy"
                :pot="entry.snapshot?.pot"
                :leaf="entry.snapshot?.leaf"
                :flower="entry.snapshot?.flower"
                :accessory="entry.snapshot?.accessory"
                still
                :interactive="false"
                :idle="false"
                class="h-[3.4rem] w-[2.75rem]"
              />
            </div>
            <div class="card min-w-0 flex-1 px-4 py-3">
              <div class="flex items-baseline justify-between gap-2">
                <p class="truncate text-[0.9375rem] font-bold text-bark-600">{{ entry.title }}</p>
                <span class="shrink-0 text-[0.6875rem] font-semibold text-bark-300">{{ when(entry.at) }}</span>
              </div>
              <p v-if="entry.type === 'mood' && entry.note" class="mt-1 text-sm font-medium italic text-bark-500">“{{ entry.note }}”</p>
              <p v-else-if="entry.type === 'mood'" class="mt-0.5 text-sm font-medium text-bark-400">{{ findMood(entry.mood)?.replies[0] }}</p>
              <p v-else-if="entry.text" class="mt-0.5 text-sm font-medium text-bark-400">{{ entry.text }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>

    <div v-else class="card mt-6 px-6 py-10 text-center">
      <Icon name="book" :size="28" class="mx-auto text-bark-300" />
      <p class="title-md mt-3">Nothing here yet</p>
      <p class="mt-1 text-sm font-medium text-bark-400">Moments with {{ pip.plantName }} will gather here as you go.</p>
    </div>
  </section>
</template>

<style scoped>
.entry {
  animation: rise 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
</style>
