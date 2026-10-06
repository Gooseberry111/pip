<script setup>
// The same header on every tab: a small label, a big title, and room for actions.
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
})
</script>

<template>
  <header class="flex items-end justify-between gap-4 pt-3">
    <div class="min-w-0">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1 class="title-xl mt-1 truncate">
        <slot name="title">{{ title }}</slot>
      </h1>
    </div>
    <div class="flex shrink-0 items-center gap-2 pb-0.5">
      <slot />
    </div>
  </header>
</template>
