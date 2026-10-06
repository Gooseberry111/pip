<script setup>
// The petal: Pip's gentle currency.
import { useId } from 'vue'

defineProps({
  size: { type: [Number, String], default: 18 },
})

const id = `${useId()}-petal`
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <linearGradient :id="id" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stop-color="#F9CBD0" />
        <stop offset="1" stop-color="#E592A0" />
      </linearGradient>
    </defs>
    <path d="M12 21.5C7 18.6 4.5 15 4.5 10.8A7.5 7.5 0 0 1 12 3.2a7.5 7.5 0 0 1 7.5 7.6c0 4.2-2.5 7.8-7.5 10.7Z" :fill="`url(#${id})`" transform="rotate(-18 12 12)" />
    <path d="M12 19c-.3-3.4-.9-6.8-2.8-9.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.55" transform="rotate(-18 12 12)" />
  </svg>
</template>
