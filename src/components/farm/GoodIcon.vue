<script setup>
// A little picture of anything from the farm: crops, fruit, eggs and honey, cooked dishes.
// Most are emoji; lavender and flour have their own drawings.
defineProps({
  id: { type: String, required: true },
  size: { type: Number, default: 28 },
})

const EMOJI = {
  wheat: '🌾', carrot: '🥕', potato: '🥔', tomato: '🍅', strawberry: '🍓', corn: '🌽', sunflower: '🌻', pumpkin: '🎃',
  blueberry: '🫐', watermelon: '🍉', rose: '🌹', apple: '🍎', cherry: '🍒', orange: '🍊', peach: '🍑', lemon: '🍋',
  egg: '🥚', honey: '🍯', milk: '🥛',
  carrotsoup: '🥣', mash: '🍲', tomatosoup: '🍅', applecrumble: '🥧', smoothie: '🥤', omelette: '🍳', popcorn: '🍿',
  honeytoast: '🍞', cherrytart: '🥧', pancakes: '🥞', pumpkinpie: '🥧', orangejuice: '🧃', sunbread: '🥖', muffins: '🧁',
  cobbler: '🍮', lavendertea: '🍵', slush: '🍧', lemonade: '🥤', rosecake: '🎂', feast: '🍱',
}
// dishes get a little plate under them so they read as cooked food
const DISHES = new Set(['carrotsoup', 'mash', 'tomatosoup', 'applecrumble', 'smoothie', 'omelette', 'popcorn', 'honeytoast', 'cherrytart', 'pancakes', 'pumpkinpie', 'orangejuice', 'sunbread', 'muffins', 'cobbler', 'lavendertea', 'slush', 'lemonade', 'rosecake', 'feast'])
</script>

<template>
  <span class="relative inline-flex shrink-0 items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <svg v-if="id === 'lavender'" viewBox="0 0 40 40" class="h-full w-full">
      <path d="M14 38 L18 14 M20 38 V10 M26 38 L22 14" stroke="#79A066" stroke-width="2" stroke-linecap="round" />
      <g v-for="(x, i) in [17, 20, 23]" :key="i">
        <ellipse v-for="k in 5" :key="k" :cx="x + (i - 1) * 2" :cy="4 + k * 3.4 + (i === 1 ? -3 : 0)" :rx="2.8 - k * 0.25" ry="1.9" fill="#A68BD6" />
      </g>
    </svg>
    <svg v-else-if="id === 'flour'" viewBox="0 0 40 40" class="h-full w-full">
      <path d="M8 36 L9 14 Q20 6 31 14 L32 36Z" fill="#F6EBD8" stroke="#C9B08A" stroke-width="1.6" />
      <path d="M12 12 Q20 4 28 12" stroke="#B98C63" stroke-width="2.4" fill="none" stroke-linecap="round" />
      <path d="M16 24 Q20 20 24 24 Q20 30 16 24Z" fill="#E8C268" />
    </svg>
    <template v-else>
      <span v-if="DISHES.has(id)" class="absolute bottom-0 left-1/2 h-[30%] w-[92%] -translate-x-1/2 rounded-[50%] bg-white shadow-[0_1px_2px_rgb(58_45_35/0.25)]" />
      <span class="relative leading-none" :style="{ fontSize: `${size * (DISHES.has(id) ? 0.74 : 0.84)}px`, marginBottom: DISHES.has(id) ? `${size * 0.12}px` : 0 }">{{ EMOJI[id] ?? '🌱' }}</span>
    </template>
  </span>
</template>
