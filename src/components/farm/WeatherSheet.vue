<script setup>
// Seasons and real weather: what they do on the farm, and the switch for real weather.
import { ref, computed } from 'vue'
import { SEASONS } from '@/utils/timeOfDay'
import { weatherOn, weather, season, setWeatherOn, WEATHER } from '@/services/weather'
import BottomSheet from '../BottomSheet.vue'
import Icon from '../Icon.vue'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'changed'])

const busy = ref(false)
const error = ref('')
const s = computed(() => SEASONS[season.value])

async function toggle() {
  busy.value = true
  error.value = ''
  const r = await setWeatherOn(!weatherOn.value)
  busy.value = false
  if (!r.ok) error.value = 'Pip couldn’t find where you are. Check that location is allowed for Pip, then try again.'
  else emit('changed')
}
</script>

<template>
  <BottomSheet :open="open" eyebrow="Outside" title="Seasons and weather" @close="emit('close')">
    <div class="season mt-1 flex items-center gap-3 rounded-[1.25rem] p-4">
      <span class="text-4xl">{{ s.icon }}</span>
      <div>
        <p class="font-display text-lg font-semibold text-bark-600">It’s {{ s.name.toLowerCase() }}</p>
        <p class="text-sm font-medium text-bark-500">{{ s.line }}</p>
      </div>
    </div>
    <p class="mt-3 text-[0.8125rem] font-medium text-bark-400">
      The farm changes with the seasons: blossom in spring, golden fields in autumn, frost in winter. Some decorations only appear in their season.
    </p>

    <div class="card mt-4 p-4!">
      <div class="flex items-center gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-water-100 text-water-500">
          <Icon :name="weather ? WEATHER[weather.kind].icon : 'cloud'" :size="22" :stroke="2" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-display text-base font-semibold text-bark-600">Real weather</p>
          <p class="text-xs font-semibold text-bark-400">
            <template v-if="weather">{{ WEATHER[weather.kind].name }}, {{ weather.temp }}° where you are</template>
            <template v-else-if="weatherOn">Checking the sky…</template>
            <template v-else>Off</template>
          </p>
        </div>
        <button type="button" class="btn btn-sm" :class="weatherOn ? 'btn-secondary' : 'btn-primary'" :disabled="busy" @click="toggle">
          {{ busy ? 'One moment' : weatherOn ? 'Turn off' : 'Turn on' }}
        </button>
      </div>
      <ul class="mt-3 space-y-1.5 text-[0.8125rem] font-medium text-bark-500">
        <li class="flex gap-2"><span>🌧️</span> When it rains where you are, it rains on your farm too, and every crop gets a free drink.</li>
        <li class="flex gap-2"><span>❄️</span> Snow, mist and storms show up on the farm as well.</li>
        <li class="flex gap-2"><span>📍</span> Pip only keeps a rough location (about 10 km) on this phone, and only uses it to ask Open-Meteo for the weather.</li>
      </ul>
      <p v-if="error" class="mt-3 rounded-xl bg-clay-100 px-3 py-2 text-xs font-semibold text-clay-400">{{ error }}</p>
    </div>
  </BottomSheet>
</template>

<style scoped>
.season {
  background: linear-gradient(135deg, #eef2e6 0%, #f4ece0 100%);
  box-shadow: inset 0 0 0 1px var(--color-line);
}
</style>
