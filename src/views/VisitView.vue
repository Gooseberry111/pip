<script setup>
// Visiting a friend's farm: look around, and water up to five of their growing crops a day.
// Each drop helps their crop grow quicker, and you get a petal for helping.
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { fetchFarm, helpFarm, SHARE_ERRORS } from '@/services/farmShare'
import { cropById } from '@/utils/farmLogic'
import { FARM_COLS } from '@/data/farm'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import FarmMap from '@/components/farm/FarmMap.vue'
import Icon from '@/components/Icon.vue'

const HELPS_PER_FARM = 5

const route = useRoute()
const router = useRouter()
const farm = useFarmStore()
const pip = usePipStore()

const code = computed(() => String(route.params.code || '').toUpperCase())
const data = ref(null)
const error = ref('')
const helped = ref([])
const message = ref('')
const now = ref(Date.now())
let clock = null

const isMine = computed(() => code.value === farm.state.code)
const left = computed(() => Math.max(0, HELPS_PER_FARM - farm.helpedToday(code.value)))

async function load() {
  error.value = ''
  const r = await fetchFarm(code.value)
  if (!r.ok) {
    error.value = SHARE_ERRORS[r.reason] ?? SHARE_ERRORS.server
    return
  }
  data.value = r.farm
  if (!isMine.value) farm.rememberNeighbour({ code: code.value, name: r.farm.name, plant: r.farm.plant })
}

function say(text) {
  message.value = text
  clearTimeout(say.t)
  say.t = setTimeout(() => (message.value = ''), 2600)
}

async function onTap(uid) {
  const o = data.value?.objects.find((x) => x.uid === uid)
  if (!o) return
  if (o.type === 'pip') {
    say(`${data.value.plant} waves hello!`)
    playSound('boop')
    return
  }
  if (!o.crop) {
    playSound('tap')
    return
  }
  if (isMine.value) return say('This is your own farm!')
  if (now.value >= o.crop.readyAt) return say(`${data.value.plant}’s ${cropById[o.crop.id]?.name.toLowerCase() ?? 'crop'} is ready to pick. They’ll be pleased!`)
  if (helped.value.includes(uid)) return say('Already watered. Thank you!')
  if (!left.value) return say('You’ve helped this farm lots today. Come back tomorrow!')
  helped.value = [...helped.value, uid]
  playSound('water')
  haptic('light')
  const r = await helpFarm({ code: code.value, uid, from: pip.plantName })
  if (!r.ok) {
    helped.value = helped.value.filter((x) => x !== uid)
    return say(SHARE_ERRORS[r.reason] ?? SHARE_ERRORS.server)
  }
  farm.noteHelp(code.value)
  pip.earn(1)
  say(`You watered the ${cropById[o.crop.id]?.name.toLowerCase() ?? 'crop'}. +1 petal`)
}

onMounted(() => {
  load()
  clock = setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => clearInterval(clock))
</script>

<template>
  <section class="page flex flex-col">
    <header class="flex items-center gap-3 pt-3">
      <button type="button" class="icon-btn" aria-label="Back to my farm" @click="router.push('/farm')">
        <Icon name="back" :size="19" :stroke="2.2" />
      </button>
      <div class="min-w-0 flex-1">
        <p class="eyebrow">{{ data ? `Visiting · farm level ${data.level}` : 'Visiting' }}</p>
        <h1 class="title-xl mt-0.5 truncate">{{ data?.name ?? code }}</h1>
      </div>
    </header>

    <p v-if="error" class="mt-6 rounded-2xl bg-cream p-5 text-center text-sm font-semibold text-bark-500">
      {{ error }}
      <button type="button" class="btn btn-secondary btn-sm mt-3 w-full" @click="load">Try again</button>
    </p>
    <p v-else-if="!data" class="mt-10 text-center text-sm font-semibold text-bark-400">Walking over to {{ code }}…</p>

    <template v-else>
      <p class="mt-3 rounded-2xl bg-water-100 px-4 py-2.5 text-center text-xs font-bold text-water-500">
        <template v-if="isMine">This is how friends see your farm.</template>
        <template v-else>Tap a growing crop to water it ({{ left }} {{ left === 1 ? 'drop' : 'drops' }} left today). It helps {{ data.plant }}’s crops grow quicker.</template>
      </p>
      <div class="mt-4">
        <FarmMap
          :objects="data.objects"
          :rows="data.rows"
          :cols="FARM_COLS"
          :now="now"
          mode="view"
          :pip-look="data.pip"
          :helped="helped"
          @tap="onTap"
        />
      </div>
    </template>

    <Transition name="toast">
      <div v-if="message" class="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex justify-center px-4">
        <p class="rounded-full bg-bark-600 px-4 py-2 text-sm font-bold text-[#FFFAF2] shadow-float">{{ message }}</p>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
