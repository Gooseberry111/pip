<script setup>
// Badges, and the personality Pip is growing into.
import { computed } from 'vue'
import { usePipStore } from '@/stores/pip'
import { useFarmStore } from '@/stores/farm'
import { badgeList, personality } from '@/utils/badges'

const pip = usePipStore()
const farm = useFarmStore()

const list = computed(() => badgeList(pip, farm).sort((a, b) => Number(b.earned) - Number(a.earned) || b.value / b.target - a.value / a.target))
const earned = computed(() => list.value.filter((b) => b.earned).length)
const traits = computed(() => personality(pip))
</script>

<template>
  <div>
    <!-- personality -->
    <div class="persona mt-4 rounded-[var(--radius-card)] p-4">
      <p class="eyebrow text-leaf-500!">{{ pip.plantName }}’s personality</p>
      <template v-if="traits.growing">
        <p class="title-md mt-1">Still finding itself</p>
        <p class="mt-1 text-sm font-medium text-bark-500">{{ pip.plantName }}’s character grows from what you do together. Play, farm, chat and care, and it will start to show.</p>
      </template>
      <template v-else>
        <p class="title-md mt-1">{{ traits.traits.map((t) => t.name).join(' and ') }}</p>
        <ul class="mt-2 space-y-1.5">
          <li v-for="t in traits.traits" :key="t.id" class="flex items-center gap-2.5 text-sm font-semibold text-bark-500">
            <span class="text-xl">{{ t.icon }}</span> {{ pip.plantName }} {{ t.line }}.
          </li>
        </ul>
      </template>
    </div>

    <p class="mt-4 text-[0.8125rem] font-medium text-bark-400">
      Little milestones, each with petals. <b class="text-bark-600">{{ earned }} / {{ list.length }}</b> earned.
    </p>
    <div class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      <div
        v-for="(b, i) in list"
        :key="b.id"
        class="stagger flex flex-col rounded-[1.25rem] p-3"
        :class="b.earned ? 'card' : 'border border-dashed border-sand-300 bg-sand-100/50'"
        :style="{ animationDelay: `${i * 25}ms` }"
      >
        <span class="medal flex h-12 w-12 items-center justify-center rounded-full text-2xl" :class="{ 'is-locked': !b.earned }">{{ b.icon }}</span>
        <p class="mt-2 font-display text-[0.95rem] font-semibold leading-tight" :class="b.earned ? 'text-bark-600' : 'text-bark-400'">{{ b.name }}</p>
        <p class="mt-0.5 text-[0.6875rem] font-semibold leading-snug text-bark-400">{{ b.text }}</p>
        <div v-if="!b.earned" class="mt-2">
          <div class="h-1.5 overflow-hidden rounded-full bg-sand-200">
            <div class="h-full rounded-full bg-honey-400" :style="{ width: `${(b.value / b.target) * 100}%` }" />
          </div>
          <p class="mt-1 text-[0.625rem] font-extrabold tabular-nums text-bark-400">{{ b.value }} / {{ b.target }} · {{ b.petals }} petals{{ b.reward ? ' + a gift' : '' }}</p>
        </div>
        <p v-else class="mt-2 text-[0.625rem] font-extrabold uppercase tracking-wider text-leaf-500">Earned</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.persona {
  background: linear-gradient(135deg, #EEF2E6 0%, #F4ECE0 100%);
  box-shadow: inset 0 0 0 1px var(--color-line);
}
.medal {
  background: radial-gradient(circle at 35% 30%, #FFF6D9 0%, #F8E2A6 60%, #E8B54F 100%);
}
.medal.is-locked {
  background: var(--color-sand-200);
  filter: grayscale(1);
  opacity: 0.55;
}
.stagger {
  animation: rise 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
</style>
