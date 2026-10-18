<script setup>
// Every cooked dish has its own little drawing, so no two look alike in orders or the kitchen
// (three different pies used to share one picture). Drawn in a 40 x 40 box on a plate.
defineProps({ id: { type: String, required: true } })
</script>

<template>
  <svg viewBox="0 0 40 40" class="h-full w-full" aria-hidden="true">
    <!-- plate (drinks stand on a coaster instead) -->
    <template v-if="!['smoothie', 'orangejuice', 'lavendertea', 'slush', 'lemonade'].includes(id)">
      <ellipse cx="20" cy="31" rx="18" ry="6" fill="#E9E1D3" />
      <ellipse cx="20" cy="30" rx="18" ry="6" fill="#FFFFFF" />
      <ellipse cx="20" cy="30" rx="12" ry="3.8" fill="#F4EFE6" />
    </template>
    <template v-else>
      <ellipse cx="20" cy="35" rx="11" ry="3" fill="#C9B08A" opacity="0.6" />
    </template>

    <!-- soups in a bowl -->
    <g v-if="id === 'carrotsoup' || id === 'tomatosoup'">
      <path d="M6 22 Q20 40 34 22Z" :fill="id === 'carrotsoup' ? '#F2F0EA' : '#DCE7EE'" />
      <ellipse cx="20" cy="22" rx="14" ry="4.5" :fill="id === 'carrotsoup' ? '#EE9447' : '#D9533F'" />
      <ellipse cx="17" cy="21.4" rx="5" ry="1.4" fill="#fff" opacity="0.35" />
      <path v-if="id === 'carrotsoup'" d="M22 20 l3 -1 M24 22 l2 1" stroke="#7FB063" stroke-width="1.4" stroke-linecap="round" />
      <circle v-else cx="23" cy="21.5" r="1.4" fill="#7FB063" />
      <path d="M13 14 q2 -3 0 -6 M20 13 q2 -3 0 -6 M27 14 q2 -3 0 -6" stroke="#E2D6C6" stroke-width="1.2" fill="none" stroke-linecap="round" />
    </g>

    <!-- mash -->
    <g v-else-if="id === 'mash' || id === 'trufflemash'">
      <path d="M8 27 Q9 17 14 16 Q16 11 21 13 Q27 11 29 16 Q33 18 32 27Z" fill="#F6E6B5" />
      <path d="M13 22 Q20 18 27 22" stroke="#E8CF8A" stroke-width="1.2" fill="none" />
      <rect x="17" y="13.5" width="6" height="3.5" rx="1" fill="#F8D96B" />
      <g v-if="id === 'trufflemash'" fill="#5B4636">
        <ellipse cx="13" cy="20" rx="2" ry="1.4" /><ellipse cx="25" cy="18" rx="2.2" ry="1.4" /><ellipse cx="20" cy="23" rx="1.8" ry="1.2" />
      </g>
    </g>

    <!-- apple crumble: a dish with a crumbly golden top and apple peeking through -->
    <g v-else-if="id === 'applecrumble'">
      <path d="M7 24 L9 31 L31 31 L33 24Z" fill="#C9584A" />
      <ellipse cx="20" cy="24" rx="13" ry="4" fill="#E9B866" />
      <g fill="#D99A4A"><circle cx="13" cy="23" r="1.6" /><circle cx="18" cy="22.4" r="1.4" /><circle cx="24" cy="23.4" r="1.7" /><circle cx="28" cy="22.8" r="1.2" /><circle cx="20" cy="25" r="1.2" /></g>
      <path d="M15 25 q2 -2 4 0 M23 25.4 q2 -2 4 0" fill="#F2DE9C" stroke="#E35D4B" stroke-width="0.7" />
    </g>

    <!-- cherry tart: lattice with red cherries -->
    <g v-else-if="id === 'cherrytart'">
      <path d="M6 25 Q6 30 20 31 Q34 30 34 25Z" fill="#D9A55A" />
      <ellipse cx="20" cy="24" rx="14" ry="5" fill="#B42E3E" />
      <g stroke="#EDC27A" stroke-width="1.8" stroke-linecap="round">
        <path d="M10 22 L18 28 M16 20 L26 28 M23 20 L31 26 M30 21 L22 28 M24 20 L14 28 M17 20 L9 26" />
      </g>
      <circle cx="20" cy="16" r="2.6" fill="#D9473A" /><circle cx="24" cy="17" r="2.4" fill="#C2303F" />
      <path d="M20 14 Q22 9 26 9 M24 15 Q25 11 26 9" stroke="#6E9E5C" stroke-width="1" fill="none" />
    </g>

    <!-- pumpkin pie: a slice with a swirl of cream -->
    <g v-else-if="id === 'pumpkinpie'">
      <path d="M8 26 L32 22 L32 27 L8 31Z" fill="#D9A55A" />
      <path d="M8 26 L32 22 L22 13Z" fill="#EB8C35" />
      <path d="M8 26 L22 13 L22.6 14.4 L9 27Z" fill="#E8B866" />
      <path d="M21 16 q3 -4 5 -1 q2 3 -2 3 q-3 0 -3 -2Z" fill="#FFFDF8" />
      <circle cx="16" cy="23" r="0.7" fill="#C96E22" /><circle cx="25" cy="21" r="0.7" fill="#C96E22" />
    </g>

    <!-- peach cobbler: golden biscuits over peach slices -->
    <g v-else-if="id === 'cobbler'">
      <rect x="8" y="20" width="24" height="10" rx="3" fill="#F2F0EA" />
      <rect x="9" y="19" width="22" height="5" rx="2" fill="#F5AE8C" />
      <g fill="#E8B866"><circle cx="13" cy="19" r="3.2" /><circle cx="20" cy="18.4" r="3.4" /><circle cx="27" cy="19" r="3.1" /></g>
      <g fill="#FBE3A0"><circle cx="12" cy="18" r="0.9" /><circle cx="19.5" cy="17.4" r="1" /><circle cx="26.5" cy="18" r="0.9" /></g>
    </g>

    <!-- omelette -->
    <g v-else-if="id === 'omelette'">
      <path d="M8 25 Q20 12 32 25 Q20 30 8 25Z" fill="#F6CF55" />
      <path d="M10 24 Q20 15 30 24" stroke="#E8B53A" stroke-width="1" fill="none" />
      <circle cx="17" cy="22" r="1.6" fill="#D9533F" /><circle cx="23" cy="21" r="1.5" fill="#D9533F" />
      <path d="M20 19 l1 -2 M26 22 l2 -1" stroke="#7FB063" stroke-width="1.2" stroke-linecap="round" />
    </g>

    <!-- popcorn in a striped box -->
    <g v-else-if="id === 'popcorn'">
      <path d="M12 16 L28 16 L26 30 L14 30Z" fill="#FFFDF8" />
      <path d="M14 16 L15.4 30 M19 16 L19.4 30 M24 16 L23.6 30" stroke="#E35D4B" stroke-width="2.6" />
      <g fill="#FFF6D9" stroke="#F2D58A" stroke-width="0.5"><circle cx="14" cy="14" r="3" /><circle cx="19" cy="12" r="3.4" /><circle cx="24" cy="13" r="3.1" /><circle cx="27" cy="15" r="2.4" /><circle cx="17" cy="9" r="2.4" /><circle cx="22" cy="8.6" r="2.6" /></g>
    </g>

    <!-- honey toast -->
    <g v-else-if="id === 'honeytoast'">
      <path d="M10 28 L10 15 Q10 10 15 10 Q16 7 20 7 Q24 7 25 10 Q30 10 30 15 L30 28Z" fill="#D99A4A" />
      <path d="M12 27 L12 16 Q12 12 16 12 Q17 9.4 20 9.4 Q23 9.4 24 12 Q28 12 28 16 L28 27Z" fill="#F6DEA4" />
      <path d="M13 16 Q20 14 27 16 Q26 21 23 19 Q21 24 19 20 Q16 22 14 19Z" fill="#EDAA2E" opacity="0.85" />
    </g>

    <!-- pancakes stack with butter and syrup -->
    <g v-else-if="id === 'pancakes'">
      <ellipse cx="20" cy="27" rx="12" ry="3.4" fill="#D99A4A" />
      <ellipse cx="20" cy="24" rx="12" ry="3.4" fill="#E8B866" />
      <ellipse cx="20" cy="21" rx="12" ry="3.4" fill="#D99A4A" />
      <ellipse cx="20" cy="18" rx="12" ry="3.4" fill="#F2C97A" />
      <path d="M10 18 Q12 23 14 19 Q17 24 20 20 Q24 25 26 19 Q29 22 30 18" fill="#B8651F" opacity="0.8" />
      <rect x="17" y="14" width="6" height="3.6" rx="1" fill="#FBE7A0" />
    </g>

    <!-- breads -->
    <g v-else-if="id === 'sunbread'">
      <ellipse cx="20" cy="22" rx="14" ry="8" fill="#D99A4A" />
      <path d="M11 18 Q14 22 13 26 M18 15 Q21 20 19 28 M25 15 Q28 20 27 27" stroke="#B8763A" stroke-width="1.6" fill="none" stroke-linecap="round" />
      <g fill="#5B4636"><circle cx="15" cy="17" r="0.8" /><circle cx="23" cy="16" r="0.8" /><circle cx="29" cy="21" r="0.8" /><circle cx="11" cy="23" r="0.8" /></g>
      <circle cx="20" cy="12" r="3" fill="#F4C443" /><circle cx="20" cy="12" r="1.4" fill="#8B6142" />
    </g>
    <g v-else-if="id === 'cheesetoast'">
      <path d="M10 28 L10 15 Q10 10 15 10 Q16 7 20 7 Q24 7 25 10 Q30 10 30 15 L30 28Z" fill="#D99A4A" />
      <path d="M11 17 Q11 12 16 12 L24 12 Q29 12 29 17 L29 21 Q26 24 24 21 Q21 26 19 21 Q15 25 13 21 Q11 22 11 20Z" fill="#F6CF55" />
      <circle cx="16" cy="16" r="1.1" fill="#E8B53A" /><circle cx="23" cy="15" r="1" fill="#E8B53A" />
    </g>

    <!-- muffins -->
    <g v-else-if="id === 'muffins'">
      <g v-for="(m, k) in [[13, 0], [27, 0]]" :key="k" :transform="`translate(${m[0]} 0)`">
        <path d="M-6 18 L6 18 L4.6 29 L-4.6 29Z" fill="#E8A1A6" />
        <path d="M-4 18 V29 M0 18 V29 M4 18 V29" stroke="#D9878D" stroke-width="0.8" />
        <ellipse cx="0" cy="16" rx="7.4" ry="5.6" fill="#C98A52" />
        <circle cx="-2.6" cy="15" r="1.3" fill="#4E5FA8" /><circle cx="2" cy="13.4" r="1.2" fill="#4E5FA8" /><circle cx="3" cy="17" r="1.1" fill="#4E5FA8" />
      </g>
    </g>

    <!-- rose cake -->
    <g v-else-if="id === 'rosecake'">
      <rect x="9" y="17" width="22" height="12" rx="3" fill="#FCE9EC" />
      <path d="M9 21 Q12 24 15 21 Q18 24 21 21 Q24 24 27 21 Q30 24 31 21 L31 17 L9 17Z" fill="#F2A3B5" />
      <ellipse cx="20" cy="17" rx="11" ry="3" fill="#F8C7D2" />
      <circle cx="20" cy="13" r="3.4" fill="#E05A7A" />
      <path d="M18.4 12.4 Q20 10.8 21.6 12.4 Q21 14.6 18.4 13.4" stroke="#B83A5A" stroke-width="0.8" fill="none" />
      <path d="M22 15 q3 -1 4 1" stroke="#6E9E5C" stroke-width="1.2" fill="none" />
    </g>

    <!-- garden feast: a little spread of veg -->
    <g v-else-if="id === 'feast'">
      <ellipse cx="13" cy="23" rx="5.6" ry="4.6" fill="#EB8C35" />
      <path d="M13 19 v-2" stroke="#6F8E4A" stroke-width="1.4" />
      <circle cx="22" cy="24" r="3.4" fill="#D9533F" />
      <ellipse cx="28" cy="22" rx="2.4" ry="5" fill="#F2CB4C" transform="rotate(25 28 22)" />
      <ellipse cx="18" cy="27" rx="3" ry="2" fill="#C9A06D" />
      <path d="M24 20 l1 -2.4" stroke="#6E9E5C" stroke-width="1" />
    </g>

    <!-- drinks -->
    <g v-else-if="id === 'smoothie'">
      <path d="M12 10 L28 10 L25 34 L15 34Z" fill="#F7CFD8" opacity="0.6" />
      <path d="M12.6 14 L27.4 14 L25 34 L15 34Z" fill="#E5485E" />
      <path d="M12.6 14 Q20 17 27.4 14" fill="#F08A9A" />
      <path d="M22 14 L26 4" stroke="#7CB3D6" stroke-width="1.8" stroke-linecap="round" />
      <path d="M14 12 q2 -3 4 0" fill="#E5485E" /><path d="M16 9.5 l1 -1.6" stroke="#6E9E5C" stroke-width="1" />
    </g>
    <g v-else-if="id === 'orangejuice'">
      <path d="M12 10 L28 10 L26 34 L14 34Z" fill="#FFE7C2" opacity="0.6" />
      <path d="M12.5 15 L27.5 15 L26 34 L14 34Z" fill="#F29A38" />
      <circle cx="27" cy="11" r="4.4" fill="#F7B54D" /><circle cx="27" cy="11" r="3.2" fill="#FBD38A" />
      <path d="M27 11 L27 7.8 M27 11 L29.8 12.6 M27 11 L24.2 12.6" stroke="#F29A38" stroke-width="0.6" />
    </g>
    <g v-else-if="id === 'lemonade'">
      <path d="M11 9 L29 9 L27 34 L13 34Z" fill="#FFF6C9" opacity="0.7" />
      <path d="M11.6 14 L28.4 14 L27 34 L13 34Z" fill="#F6E58D" />
      <rect x="15" y="18" width="4" height="4" rx="1" fill="#fff" opacity="0.7" transform="rotate(15 17 20)" />
      <rect x="21" y="24" width="4" height="4" rx="1" fill="#fff" opacity="0.7" transform="rotate(-10 23 26)" />
      <path d="M11 11 a5 5 0 0 1 9 -1Z" fill="#F2D04B" />
      <path d="M24 14 L27 3" stroke="#E35D4B" stroke-width="1.6" stroke-linecap="round" />
    </g>
    <g v-else-if="id === 'slush'">
      <path d="M12 14 L28 14 L25 34 L15 34Z" fill="#F28B95" />
      <path d="M11 14 Q14 8 20 9 Q26 8 29 14Z" fill="#F7B6BE" />
      <path d="M12.4 16 L27.6 16" stroke="#7FB063" stroke-width="2" />
      <g fill="#3E2F25"><ellipse cx="17" cy="22" rx="0.7" ry="1.1" /><ellipse cx="22" cy="26" rx="0.7" ry="1.1" /><ellipse cx="20" cy="20" rx="0.7" ry="1.1" /></g>
      <path d="M23 9 L26 2" stroke="#7CB3D6" stroke-width="1.6" stroke-linecap="round" />
    </g>
    <g v-else-if="id === 'lavendertea'">
      <path d="M9 18 L29 18 Q29 32 19 32 Q9 32 9 18Z" fill="#FFFDF8" stroke="#D9CFC0" stroke-width="0.8" />
      <path d="M29 21 q5 0 5 4 q0 4 -5 4" stroke="#D9CFC0" stroke-width="2" fill="none" />
      <ellipse cx="19" cy="18.6" rx="9.6" ry="2.4" fill="#C9A8D9" />
      <path d="M15 14 q2 -3 0 -6 M22 14 q2 -3 0 -6" stroke="#E2D6C6" stroke-width="1.2" fill="none" stroke-linecap="round" />
      <g fill="#A386D8"><ellipse cx="9" cy="33" rx="1.2" ry="0.8" /><ellipse cx="11" cy="34" rx="1" ry="0.7" /></g>
    </g>

    <!-- not a dish: farm products with their own drawings -->
    <g v-else-if="id === 'wool'">
      <circle cx="20" cy="22" r="11" fill="#F4EFE6" />
      <path d="M11 17 Q20 12 29 19 M10 23 Q20 16 30 25 M12 28 Q20 21 28 30" stroke="#D9CFC0" stroke-width="1.4" fill="none" />
      <path d="M28 28 Q34 30 33 35" stroke="#F4EFE6" stroke-width="2" fill="none" stroke-linecap="round" />
    </g>
    <g v-else-if="id === 'truffle'">
      <path d="M8 26 Q8 14 20 14 Q32 14 32 26 Q32 32 20 32 Q8 32 8 26Z" fill="#5B4636" />
      <g fill="#7A604B"><circle cx="14" cy="20" r="1.6" /><circle cx="22" cy="18" r="1.4" /><circle cx="27" cy="24" r="1.8" /><circle cx="17" cy="27" r="1.5" /><circle cx="24" cy="29" r="1.2" /></g>
      <path d="M13 17 Q16 15 19 16" stroke="#8C7560" stroke-width="1" fill="none" stroke-linecap="round" />
    </g>
  </svg>
</template>
