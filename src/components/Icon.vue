<script setup>
// Simple rounded line icons.
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
  stroke: { type: Number, default: 1.8 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9v9.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V9" />
      <path d="M12 20v-5" />
      <path d="M12 15c0-1.8 1-3 2.6-3.2.1 1.7-.9 3-2.6 3.2Z" />
    </template>
    <template v-else-if="name === 'collection'">
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </template>
    <template v-else-if="name === 'garden'">
      <path d="M3 20h18" />
      <path d="M7 20v-4.5a2.5 2.5 0 0 1 5 0V20" />
      <path d="M9.5 13V9" />
      <path d="M9.5 10c-1.8 0-3-1.2-3-3 1.8 0 3 1.2 3 3Z" />
      <path d="M9.5 9c0-1.8 1.2-3 3-3 0 1.8-1.2 3-3 3Z" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <path d="M15 20v-3h5v3" />
    </template>
    <template v-else-if="name === 'drop'">
      <path d="M12 3.5c3 3.6 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3.2 2.5-6.4 5.5-10Z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </template>
    <template v-else-if="name === 'unlock'">
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.8-1.2" />
    </template>
    <template v-else-if="name === 'trophy'">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5v-14Z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3" />
      <path d="M12 8.5c-.8-1.6-3.2-1.2-3 .6.2 1.4 3 3.2 3 3.2s2.8-1.8 3-3.2c.2-1.8-2.2-2.2-3-.6Z" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5l1.5-1.5Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </template>
    <template v-else-if="name === 'smile'">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 14c1.5 1.8 4.5 1.8 6 0" />
      <path d="M9.5 10h.01M14.5 10h.01" stroke-width="2.6" />
    </template>
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m6 12.5 4 4 8-9" />
    </template>
    <template v-else-if="name === 'sound-on'">
      <path d="M4 10v4h3.5L12 18V6L7.5 10H4Z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M18 7a7 7 0 0 1 0 10" />
    </template>
    <template v-else-if="name === 'sound-off'">
      <path d="M4 10v4h3.5L12 18V6L7.5 10H4Z" />
      <path d="m16 10 4 4M20 10l-4 4" />
    </template>
    <template v-else-if="name === 'sparkle'">
      <path d="M12 4c.6 3.7 2.3 5.4 6 6-3.7.6-5.4 2.3-6 6-.6-3.7-2.3-5.4-6-6 3.7-.6 5.4-2.3 6-6Z" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M7 7l10 10M17 7 7 17" />
    </template>
    <template v-else-if="name === 'pencil'">
      <path d="M5 19h3.5L18 9.5 14.5 6 5 15.5V19Z" />
      <path d="m13 7.5 3.5 3.5" />
    </template>
    <template v-else-if="name === 'heart'">
      <path d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6Z" />
    </template>
    <template v-else-if="name === 'wind'">
      <path d="M4 9h10a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M4 13h14a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M4 17h6" />
    </template>
    <template v-else-if="name === 'play'">
      <rect x="3.5" y="7" width="17" height="11" rx="5" />
      <path d="M8 11v3M6.5 12.5h3" />
      <circle cx="15.5" cy="11.5" r="0.6" fill="currentColor" />
      <circle cx="17" cy="13.5" r="0.6" fill="currentColor" />
    </template>
    <template v-else-if="name === 'petal'">
      <path d="M12 20c-4-2.5-6-5.5-6-9a6 6 0 0 1 6-6 6 6 0 0 1 6 6c0 3.5-2 6.5-6 9Z" />
      <path d="M12 20v-9" />
    </template>
    <template v-else-if="name === 'gift'">
      <rect x="4" y="9" width="16" height="4" rx="1.2" />
      <path d="M5.5 13v5.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V13" />
      <path d="M12 9v11" />
      <path d="M12 9C10.5 6 7.5 5.5 7.5 7.3 7.5 9 12 9 12 9Zm0 0c1.5-3 4.5-3.5 4.5-1.7C16.5 9 12 9 12 9Z" />
    </template>
    <template v-else-if="name === 'back'">
      <path d="M14.5 6 8.5 12l6 6" />
    </template>
    <template v-else-if="name === 'timer'">
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9.5V13l2 1.5M10 3.5h4" />
    </template>
    <template v-else-if="name === 'music'">
      <path d="M9 17.5V6l10-2v11.5" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="15.5" r="2.5" />
    </template>
    <template v-else-if="name === 'music-off'">
      <path d="M9 17.5V9M9 6l10-2v9" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <path d="M4 4l16 16" />
    </template>
    <template v-else-if="name === 'settings'">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </template>
    <template v-else-if="name === 'vibrate'">
      <rect x="8" y="4" width="8" height="16" rx="2" />
      <path d="M4.5 9v6M19.5 9v6" />
    </template>
    <template v-else-if="name === 'star'">
      <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
    </template>
    <template v-else-if="name === 'refresh'">
      <path d="M19 12a7 7 0 1 1-2.1-5" />
      <path d="M19 4.5V8h-3.5" />
    </template>
  </svg>
</template>
