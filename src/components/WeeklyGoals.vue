<script setup>
// This week's three little goals, and the bloom box for finishing them all.
import { computed, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { daysLeftInWeek, GOAL_REWARD, BLOOM_BOX_PETALS } from '@/data/weekly'
import { playSound } from '@/utils/sound'
import { haptic } from '@/utils/haptics'
import PetalIcon from './PetalIcon.vue'
import Icon from './Icon.vue'
import Celebration from './Celebration.vue'

const emit = defineEmits(['treasure'])
const pip = usePipStore()

const burst = ref(0)
const burstAt = ref(50)
const opening = ref(false)

const goals = computed(() => pip.weeklyGoals)
const collected = computed(() => goals.value.filter((g) => g.claimed).length)
const boxReady = computed(() => collected.value === goals.value.length && !pip.weekly.boxClaimed)
const daysLeft = daysLeftInWeek()

function claim(goal, i) {
  const petals = pip.claimGoal(goal.id)
  if (!petals) return
  burstAt.value = 20 + i * 22
  burst.value += 1
  playSound('petals')
  haptic('success')
}

function openBox() {
  if (!boxReady.value) return
  opening.value = true
  playSound('tear')
  haptic('soft')
  setTimeout(() => {
    const result = pip.claimBloomBox()
    opening.value = false
    burstAt.value = 85
    burst.value += 1
    playSound('levelUp')
    haptic('success')
    if (result?.item) setTimeout(() => emit('treasure', result.item), 700)
  }, 650)
}
</script>

<template>
  <div class="card relative overflow-hidden">
    <Celebration :trigger="burst" :y="burstAt" :count="18" :spread="110" />

    <div class="flex items-center justify-between px-5 pb-2 pt-4">
      <div>
        <h2 class="title-md">This week</h2>
        <p class="mt-0.5 text-xs font-semibold text-bark-400">New goals in {{ daysLeft }} {{ daysLeft === 1 ? 'day' : 'days' }}</p>
      </div>
      <span class="chip bg-honey-100! border-honey-400/30!">
        <Icon name="target" :size="13" :stroke="2.2" class="text-clay-400" />
        {{ collected }}/{{ goals.length }}
      </span>
    </div>

    <ul class="divide-y divide-line">
      <li v-for="(goal, i) in goals" :key="goal.id" class="flex min-h-[4.25rem] items-center gap-3.5 px-5 py-2.5">
        <div class="min-w-0 flex-1">
          <p class="truncate text-[0.9375rem] font-semibold" :class="goal.claimed ? 'text-bark-300 line-through decoration-sand-300' : 'text-bark-600'">
            {{ goal.label(goal.target, pip.plantName) }}
          </p>
          <div class="mt-1.5 flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100">
              <div
                class="h-full rounded-full transition-[width] duration-700"
                :class="goal.done ? 'bg-leaf-400' : 'bg-honey-400'"
                :style="{ width: `${(goal.progress / goal.target) * 100}%` }"
              />
            </div>
            <span class="text-[0.6875rem] font-extrabold tabular-nums text-bark-400">{{ goal.progress }}/{{ goal.target }}</span>
          </div>
        </div>
        <button
          v-if="goal.done && !goal.claimed"
          type="button"
          class="btn btn-primary btn-sm claim h-9! px-3.5! text-sm!"
          data-sound="none"
          @click="claim(goal, i)"
        >
          Collect <PetalIcon :size="14" /> {{ GOAL_REWARD }}
        </button>
        <span v-else-if="goal.claimed" class="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-400 text-white">
          <Icon name="check" :size="15" :stroke="2.6" />
        </span>
        <span v-else class="inline-flex items-center gap-1 text-xs font-extrabold text-petal-500"><PetalIcon :size="13" />+{{ GOAL_REWARD }}</span>
      </li>
    </ul>

    <!-- bloom box -->
    <div class="flex items-center gap-4 border-t border-line bg-cream/60 px-5 py-4">
      <svg viewBox="0 0 60 56" class="box h-14 w-14 shrink-0" :class="{ 'is-ready': boxReady, 'is-opening': opening }" aria-hidden="true">
        <ellipse cx="30" cy="53" rx="20" ry="2.6" fill="#4A3426" opacity="0.1" />
        <rect x="9" y="24" width="42" height="28" rx="5" :fill="pip.weekly.boxClaimed ? '#E7DDCF' : '#C9DDB8'" />
        <rect x="26.5" y="24" width="7" height="28" :fill="pip.weekly.boxClaimed ? '#D8C9B5' : '#86AD72'" />
        <g class="lid">
          <rect x="6" y="17" width="48" height="10" rx="4" :fill="pip.weekly.boxClaimed ? '#EFE6D9' : '#DBE8CF'" />
          <rect x="26" y="17" width="8" height="10" :fill="pip.weekly.boxClaimed ? '#D8C9B5' : '#86AD72'" />
          <path d="M30 17 C24 6 15 8 18 14 C20 17 30 17 30 17Z M30 17 C36 6 45 8 42 14 C40 17 30 17 30 17Z" :fill="pip.weekly.boxClaimed ? '#D8C9B5' : '#E48C9C'" />
        </g>
      </svg>
      <div class="min-w-0 flex-1">
        <p class="eyebrow text-leaf-500!">Weekly bloom box</p>
        <p class="text-sm font-semibold text-bark-500">
          <template v-if="pip.weekly.boxClaimed">Opened. See you next week!</template>
          <template v-else>{{ BLOOM_BOX_PETALS }} petals and a rare treasure</template>
        </p>
      </div>
      <button v-if="boxReady" type="button" class="btn btn-primary btn-sm" data-sound="none" @click="openBox">Open</button>
      <span v-else-if="!pip.weekly.boxClaimed" class="text-xs font-extrabold text-bark-300">{{ collected }}/3</span>
    </div>
  </div>
</template>

<style scoped>
.claim {
  animation: claim-pop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.box.is-ready {
  animation: box-wiggle 2.2s ease-in-out infinite;
}
.box .lid {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.box.is-opening {
  animation: box-shake 0.6s ease-in-out;
}
.box.is-opening .lid {
  transition: transform 0.6s cubic-bezier(0.3, 0.6, 0.4, 1);
  transform: translate(10px, -18px) rotate(25deg);
}
@keyframes claim-pop {
  0% { transform: scale(0.7); }
  100% { transform: scale(1); }
}
@keyframes box-wiggle {
  0%, 70%, 100% { transform: rotate(0); }
  78% { transform: rotate(-7deg); }
  86% { transform: rotate(6deg); }
  94% { transform: rotate(-3deg); }
}
@keyframes box-shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-8deg) scale(1.05); }
  50% { transform: rotate(8deg) scale(1.05); }
  75% { transform: rotate(-4deg); }
}
</style>
