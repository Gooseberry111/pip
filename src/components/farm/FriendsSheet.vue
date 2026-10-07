<script setup>
// Friends' farms: share yours with a code, visit theirs, and see who's been helping.
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFarmStore } from '@/stores/farm'
import { exploreFarms, SHARE_ERRORS } from '@/services/farmShare'
import { syncStatus, syncFarmNow } from '@/services/farmSync'
import BottomSheet from '../BottomSheet.vue'
import Icon from '../Icon.vue'
import Leaderboard from './Leaderboard.vue'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const farm = useFarmStore()
const router = useRouter()

const code = ref('')
const copied = ref(false)
const explore = ref(null) // null loading, [] none, or a list
const exploreError = ref('')

const link = computed(() => `${location.origin}${location.pathname}#/visit/${farm.state.code}`)
const cleanCode = computed(() => code.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
const status = computed(() => {
  if (!farm.state.shared) return ''
  const s = syncStatus.value
  if (!s) return 'Getting your farm online…'
  return s.ok ? 'Your farm is online. Friends can visit with your code.' : SHARE_ERRORS[s.reason] ?? SHARE_ERRORS.server
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    explore.value = null
    exploreError.value = ''
    const r = await exploreFarms()
    if (r.ok) explore.value = r.farms.filter((f) => f.code !== farm.state.code)
    else {
      explore.value = []
      exploreError.value = SHARE_ERRORS[r.reason] ?? SHARE_ERRORS.server
    }
  },
)

function toggleShare() {
  farm.setSharing(!farm.state.shared)
  syncFarmNow()
}

function toggleListed() {
  farm.setSharing(true, !farm.state.listed)
  syncFarmNow()
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    // clipboard can be blocked; the code is on screen anyway
  }
}

async function share() {
  const text = `Come and visit my farm in Pip! Code: ${farm.state.code}`
  if (navigator.share) {
    try {
      await navigator.share({ title: farm.name, text, url: link.value })
      return
    } catch {
      // cancelled
    }
  }
  copy(`${text} ${link.value}`)
}

function visit(c) {
  if (!/^[A-Z0-9]{6}$/.test(c)) return
  emit('close')
  router.push(`/visit/${c}`)
}
</script>

<template>
  <BottomSheet :open="open" title="Friends’ farms" eyebrow="Visit and help each other" @close="emit('close')">
    <!-- your farm -->
    <section class="rounded-2xl border border-line bg-cream p-4">
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-semibold text-bark-600">Let friends visit</p>
          <p class="text-xs font-semibold text-bark-400">They can see your farm and water your crops to help them grow.</p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="farm.state.shared"
          class="switch"
          :class="{ 'is-on': farm.state.shared }"
          :data-sound="farm.state.shared ? 'toggleOff' : 'toggleOn'"
          @click="toggleShare"
        >
          <span />
        </button>
      </div>

      <template v-if="farm.state.shared">
        <div class="mt-4 flex items-center gap-2">
          <span class="flex-1 rounded-xl bg-surface px-3 py-2.5 text-center font-display text-2xl font-semibold tracking-[0.3em] text-bark-600 shadow-soft">{{ farm.state.code }}</span>
          <button type="button" class="icon-btn" aria-label="Copy code" @click="copy(farm.state.code)"><Icon :name="copied ? 'check' : 'copy'" :size="18" :stroke="2" /></button>
          <button type="button" class="icon-btn" aria-label="Share" @click="share"><Icon name="share" :size="18" :stroke="2" /></button>
        </div>
        <p class="mt-2 text-xs font-semibold" :class="syncStatus && !syncStatus.ok ? 'text-clay-400' : 'text-bark-400'">{{ status }}</p>
        <label class="mt-3 flex items-center gap-2 text-sm font-semibold text-bark-500">
          <input type="checkbox" class="h-4 w-4 accent-[#86AD72]" :checked="farm.state.listed" @change="toggleListed" />
          Show my farm in Explore so anyone can visit
        </label>
      </template>
    </section>

    <!-- visit by code -->
    <section class="mt-5">
      <h3 class="eyebrow">Visit a friend</h3>
      <form class="mt-2 flex gap-2" @submit.prevent="visit(cleanCode)">
        <input
          v-model="code"
          class="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 font-display text-lg font-semibold uppercase tracking-[0.2em] text-bark-600 outline-none focus:border-leaf-400"
          placeholder="CODE"
          maxlength="8"
          autocapitalize="characters"
          autocomplete="off"
          aria-label="Friend’s farm code"
        />
        <button type="submit" class="btn btn-primary" :disabled="cleanCode.length !== 6">Visit</button>
      </form>
    </section>

    <Leaderboard :open="open" class="mt-5" />

    <section v-if="farm.state.neighbours.length" class="mt-5">
      <h3 class="eyebrow">Neighbours</h3>
      <ul class="mt-2 space-y-1.5">
        <li v-for="n in farm.state.neighbours" :key="n.code" class="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
          <span class="text-2xl">🏡</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-display text-base font-semibold text-bark-600">{{ n.name }}</p>
            <p class="text-xs font-semibold text-bark-400">{{ n.plant }} · {{ n.code }}</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm h-8! px-3!" @click="visit(n.code)">Visit</button>
          <button type="button" class="text-bark-300" aria-label="Forget" @click="farm.forgetNeighbour(n.code)"><Icon name="close" :size="16" /></button>
        </li>
      </ul>
    </section>

    <section class="mt-5">
      <h3 class="eyebrow">Explore</h3>
      <p v-if="explore === null" class="mt-2 text-sm font-semibold text-bark-400">Looking for farms…</p>
      <p v-else-if="exploreError" class="mt-2 rounded-2xl bg-cream p-3 text-sm font-semibold text-bark-400">{{ exploreError }}</p>
      <p v-else-if="!explore.length" class="mt-2 rounded-2xl bg-cream p-3 text-sm font-semibold text-bark-400">No farms to explore yet. Share yours and be the first!</p>
      <ul v-else class="mt-2 space-y-1.5">
        <li v-for="f in explore" :key="f.code" class="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
          <span class="text-2xl">🌻</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-display text-base font-semibold text-bark-600">{{ f.name }}</p>
            <p class="text-xs font-semibold text-bark-400">{{ f.plant }} · level {{ f.level }}</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm h-8! px-3!" @click="visit(f.code)">Visit</button>
        </li>
      </ul>
    </section>
  </BottomSheet>
</template>

<style scoped>
.switch {
  position: relative;
  width: 3.1rem;
  height: 1.8rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--color-sand-200);
  transition: background-color 0.25s ease;
}
.switch span {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: var(--shadow-soft);
  transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1);
}
.switch.is-on {
  background: var(--color-leaf-400);
}
.switch.is-on span {
  transform: translateX(1.3rem);
}
</style>
