<script setup>
// Light, floating tab bar with a soft pill that glides to the active tab.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'

defineProps({
  badges: { type: Object, default: () => ({}) }, // { '/collection': true, ... }
})

const route = useRoute()

const tabs = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/play', label: 'Play', icon: 'play' },
  { to: '/collection', label: 'Collection', icon: 'collection' },
  { to: '/garden', label: 'Garden', icon: 'garden' },
]

const activeIndex = computed(() => Math.max(0, tabs.findIndex((t) => t.to === route.path)))
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    aria-label="Main"
  >
    <div class="relative flex w-full max-w-sm items-center rounded-[1.75rem] border border-line bg-surface/92 p-1.5 shadow-float backdrop-blur-xl">
      <span
        class="pill absolute inset-y-1.5 left-1.5 rounded-[1.35rem] bg-sand-100"
        :style="{ width: `calc((100% - 0.75rem) / ${tabs.length})`, transform: `translateX(${activeIndex * 100}%)` }"
        aria-hidden="true"
      />
      <RouterLink
        v-for="(tab, i) in tabs"
        :key="tab.to"
        v-slot="{ href, navigate }"
        :to="tab.to"
        custom
      >
        <a
          :href="href"
          class="relative flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.35rem] text-[0.6875rem] font-bold tracking-wide transition-colors duration-300"
          :class="i === activeIndex ? 'text-bark-600' : 'text-bark-300 hover:text-bark-500'"
          :aria-current="i === activeIndex ? 'page' : undefined"
          @click="navigate"
        >
          <span class="relative transition-transform duration-300" :class="i === activeIndex ? '-translate-y-px scale-110' : ''">
            <Icon :name="tab.icon" :size="22" :stroke="i === activeIndex ? 2.1 : 1.8" />
            <span
              v-if="badges[tab.to]"
              class="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-clay-300"
            />
          </span>
          <span>{{ tab.label }}</span>
        </a>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.pill {
  transition: transform 0.45s cubic-bezier(0.3, 0.8, 0.3, 1);
}
</style>
