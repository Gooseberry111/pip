<script setup>
// The neighbourhood goal: every farmer's filled orders count towards one weekly goal.
import { computed } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { community, COMMUNITY_REWARD } from '@/services/community'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'

const emit = defineEmits(['claimed'])
const farm = useFarmStore()

const c = computed(() => community.value)
const fill = computed(() => (c.value ? Math.min(1, c.value.total / c.value.goal) : 0))
const reached = computed(() => c.value && c.value.total >= c.value.goal)
const claimed = computed(() => c.value && farm.state.communityClaimed === c.value.week)

function claim() {
  const r = farm.claimCommunity(c.value)
  if (!r) return
  playSound('levelUp')
  haptic('success')
  emit('claimed', r)
}
</script>

<template>
  <div v-if="c" class="community rounded-2xl p-3.5">
    <div class="flex items-center gap-2">
      <span class="text-xl">🏘️</span>
      <div class="min-w-0 flex-1">
        <p class="text-[0.6875rem] font-extrabold uppercase tracking-wider text-leaf-500">Neighbourhood goal</p>
        <p class="font-display text-base font-semibold leading-tight text-bark-600">
          Fill {{ c.goal }} orders together this week
        </p>
      </div>
      <span class="shrink-0 font-display text-lg font-semibold tabular-nums text-bark-600">{{ Math.min(c.total, c.goal) }}<span class="text-sm text-bark-400">/{{ c.goal }}</span></span>
    </div>
    <div class="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/70">
      <div class="h-full rounded-full bg-leaf-400 transition-[width] duration-700" :style="{ width: `${fill * 100}%` }" />
    </div>
    <p class="mt-2 text-xs font-semibold text-bark-400">
      <template v-if="claimed">Reward collected. Thank you for helping out!</template>
      <template v-else-if="reached">The neighbourhood did it! Collect your thank you.</template>
      <template v-else>{{ c.players }} {{ c.players === 1 ? 'farmer is' : 'farmers are' }} helping. Everyone gets {{ COMMUNITY_REWARD }} petals{{ farm.state.goldenCan ? '' : ' and a golden watering can' }} when it’s reached.</template>
    </p>
    <button v-if="reached && !claimed" type="button" class="btn btn-primary btn-sm mt-2.5 w-full" data-sound="none" @click="claim">
      Collect {{ COMMUNITY_REWARD }} petals{{ farm.state.goldenCan ? '' : ' and the golden can' }}
    </button>
  </div>
</template>

<style scoped>
.community {
  background: linear-gradient(135deg, #E9F2DF 0%, #F5EFDF 100%);
  box-shadow: inset 0 0 0 1px rgb(134 173 114 / 0.25);
}
</style>
