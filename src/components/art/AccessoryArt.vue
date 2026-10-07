<script setup>
// Little things Pip can wear, drawn in Pip's own space (200 x 250): the face is centred
// at (100, 207), the pot rim runs from y 166 to 184 and the pot body from x 62 to 138.
defineProps({
  accessory: { type: String, default: null },
})
</script>

<template>
  <g v-if="accessory" class="accessory" aria-hidden="true">
    <!-- round glasses -->
    <g v-if="accessory === 'glasses'" transform="translate(100 207)" fill="none" stroke="#47352A" stroke-width="1.8">
      <circle cx="-14" cy="-1" r="8.4" fill="#fff" fill-opacity="0.18" />
      <circle cx="14" cy="-1" r="8.4" fill="#fff" fill-opacity="0.18" />
      <path d="M-5.6 -2 Q0 -5 5.6 -2" />
      <path d="M-22.4 -2 L-27 -4 M22.4 -2 L27 -4" />
      <path d="M-18 -5 L-15 -7" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.8" />
    </g>

    <!-- heart sunglasses -->
    <g v-else-if="accessory === 'heartglasses'" transform="translate(100 206)">
      <path v-for="x in [-14, 14]" :key="x" :transform="`translate(${x} 0)`" d="M0 7 C-9 1 -10 -6 -5 -8 C-2.4 -9 -0.6 -7.4 0 -5.6 C0.6 -7.4 2.4 -9 5 -8 C10 -6 9 1 0 7Z" fill="#E86A8A" fill-opacity="0.85" stroke="#B83A5A" stroke-width="1.2" />
      <path d="M-5 -2 Q0 -5 5 -2" stroke="#B83A5A" stroke-width="1.6" fill="none" />
      <path d="M-18 -4 L-16 -6 M10 -4 L12 -6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity="0.8" />
    </g>

    <!-- bow tie -->
    <g v-else-if="accessory === 'bowtie'" transform="translate(100 225)">
      <path d="M0 0 L-10 -6 Q-12 0 -10 6Z M0 0 L10 -6 Q12 0 10 6Z" fill="#5B74C9" stroke="#3F55A0" stroke-width="1" stroke-linejoin="round" />
      <rect x="-2.6" y="-3" width="5.2" height="6" rx="1.6" fill="#3F55A0" />
      <circle cx="-6" cy="-1" r="0.9" fill="#fff" opacity="0.7" /><circle cx="6" cy="1.5" r="0.9" fill="#fff" opacity="0.7" />
    </g>

    <!-- cosy scarf around the rim -->
    <g v-else-if="accessory === 'scarf'">
      <path d="M60 178 Q100 192 140 178 L140 188 Q100 202 60 188Z" fill="#E35D4B" />
      <path d="M68 181 V191 M80 184 V194 M92 186 V196 M104 186 V196 M116 185 V195 M128 182 V192" stroke="#F6EFE2" stroke-width="2" opacity="0.7" />
      <path d="M124 186 L132 210 L122 212 L116 190Z" fill="#D04C3B" />
      <path d="M123 208 L124 214 M127 207 L129 213" stroke="#E35D4B" stroke-width="1.6" stroke-linecap="round" />
    </g>

    <!-- ribbon bow on the rim -->
    <g v-else-if="accessory === 'bow'" transform="translate(72 175) rotate(-12)">
      <path d="M0 0 C-10 -10 -16 -2 -12 4 C-8 9 -3 5 0 0Z M0 0 C10 -10 16 -2 12 4 C8 9 3 5 0 0Z" fill="#F3A6B6" stroke="#D97A90" stroke-width="1" />
      <path d="M-1 2 L-5 13 M1 2 L5 13" stroke="#F3A6B6" stroke-width="3" stroke-linecap="round" />
      <circle r="3" fill="#E48C9C" />
    </g>

    <!-- beret, tilted on the rim -->
    <g v-else-if="accessory === 'beret'" transform="translate(84 168) rotate(-14)">
      <ellipse cx="0" cy="0" rx="20" ry="8" fill="#B5506A" />
      <ellipse cx="2" cy="-3" rx="16" ry="6" fill="#C9627C" />
      <rect x="-1.2" y="-12" width="2.4" height="5" rx="1.2" fill="#8E3C52" />
      <path d="M-14 3 Q0 8 16 2" stroke="#8E3C52" stroke-width="1.2" fill="none" opacity="0.6" />
    </g>

    <!-- a little crown of flowers along the rim -->
    <g v-else-if="accessory === 'flowercrown'">
      <path d="M64 177 Q100 186 136 177" stroke="#79A066" stroke-width="2.4" fill="none" />
      <g v-for="(f, i) in [[70, 178, '#F6C7CD'], [84, 181, '#F8E2A6'], [100, 182, '#C9B2E6'], [116, 181, '#F6C7CD'], [130, 178, '#F8E2A6']]" :key="i" :transform="`translate(${f[0]} ${f[1]})`">
        <circle v-for="a in [0, 72, 144, 216, 288]" :key="a" cx="0" cy="-3" r="2.6" :fill="f[2]" :transform="`rotate(${a})`" />
        <circle r="1.6" fill="#F2B544" />
      </g>
    </g>

    <!-- freckles -->
    <g v-else-if="accessory === 'freckles'" transform="translate(100 207)" fill="#B9785F" opacity="0.75">
      <circle cx="-25" cy="4" r="1" /><circle cx="-21" cy="6" r="1.1" /><circle cx="-24" cy="8.5" r="0.9" />
      <circle cx="25" cy="4" r="1" /><circle cx="21" cy="6" r="1.1" /><circle cx="24" cy="8.5" r="0.9" />
    </g>
  </g>
</template>
